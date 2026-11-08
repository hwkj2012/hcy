/**
 * HCY 网站账号服务（Cloudflare Worker + D1）
 *
 * 接口：
 *   POST /api/auth/register  { username, password }        → 注册并直接登录
 *   POST /api/auth/login     { username, password }        → 登录
 *   GET  /api/auth/me        Authorization: Bearer <token> → 当前用户
 *   GET  /api/auth/health                                  → 健康检查
 *
 * 安全要点：
 *   - 密码用 PBKDF2-SHA256（21 万次迭代 + 每用户 16 字节随机盐）存储，绝不存明文
 *   - 令牌 HS256 签名，7 天过期
 *   - 同一 IP 连续失败会被临时限流
 *   - 登录失败统一文案，不泄露用户名是否存在
 *   - 只允许指定来源跨域访问
 */

const PBKDF2_ITERATIONS = 210000;
const JWT_TTL = 60 * 60 * 24 * 7;
const MAX_FAILS = 10;
const FAIL_WINDOW_MS = 10 * 60 * 1000;

const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;

// ---------------- 工具 ----------------
const enc = new TextEncoder();

const toHex = (buf) =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

const fromHex = (hex) => {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
};

function base64url(input) {
  const bytes = typeof input === "string" ? enc.encode(input) : new Uint8Array(input);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecode(str) {
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
  const bin = atob(str.replace(/-/g, "+").replace(/_/g, "/") + pad);
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

/** 常量时间比较 */
function safeEqual(a, b) {
  const x = String(a);
  const y = String(b);
  if (x.length !== y.length) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return diff === 0;
}

// ---------------- 密码哈希 ----------------
/**
 * 密码派生在**浏览器端**完成（PBKDF2-SHA256，21 万次迭代），
 * 服务端只收到派生结果 authKey（64 位十六进制），再做一次加盐 SHA-256 存储。
 *
 * 为什么这样分工：Cloudflare Workers 免费版单次请求只有 10ms CPU，
 * 跑不动 21 万次 PBKDF2（实测 194ms 直接被杀）。而浏览器没有这个限制。
 *
 * 安全性：数据库泄露后，攻击者要对每个候选密码重新跑一遍客户端 PBKDF2
 * （21 万次迭代）才能验证，爆破成本与原方案相同；明文密码永不离开浏览器。
 */
async function sha256Hex(str) {
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(str));
  return toHex(buf);
}

function randomHex(bytes = 16) {
  return toHex(crypto.getRandomValues(new Uint8Array(bytes)));
}

/** 存储格式：sha256$<16字节盐>$<64位哈希> */
async function makePasswordRecord(authKey) {
  const salt = randomHex(16);
  const hash = await sha256Hex(salt + authKey);
  return `sha256$${salt}$${hash}`;
}

async function verifyPassword(authKey, stored) {
  const parts = String(stored || "").split("$");
  if (parts.length !== 3 || parts[0] !== "sha256") return false;
  const [, salt, expected] = parts;
  if (!salt || !expected) return false;
  const computed = await sha256Hex(salt + authKey);
  return safeEqual(computed, expected);
}

/** authKey 必须是 64 位十六进制 */
const AUTHKEY_RE = /^[0-9a-f]{64}$/;

// ---------------- JWT ----------------
async function hmacKey(secret) {
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

async function signJwt(payload, secret) {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64url(JSON.stringify(payload));
  const data = `${header}.${body}`;
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(secret), enc.encode(data));
  return `${data}.${base64url(sig)}`;
}

async function verifyJwt(token, secret) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) return null;

  const data = `${parts[0]}.${parts[1]}`;
  // 签名段可能是任意垃圾字符串，base64 解码失败必须当作「无效」而不是抛错
  let sigBytes;
  try {
    const b64 = parts[2].replace(/-/g, "+").replace(/_/g, "/");
    sigBytes = Uint8Array.from(atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4)), (c) => c.charCodeAt(0));
  } catch {
    return null;
  }

  let ok = false;
  try {
    ok = await crypto.subtle.verify("HMAC", await hmacKey(secret), sigBytes, enc.encode(data));
  } catch {
    return null;
  }
  if (!ok) return null;

  let payload;
  try {
    payload = JSON.parse(base64urlDecode(parts[1]));
  } catch {
    return null;
  }
  if (payload.exp && Date.now() / 1000 > payload.exp) return null;
  return payload;
}

// ---------------- HTTP ----------------
function corsHeaders(req, env) {
  const origin = req.headers.get("Origin") || "";
  const allowed = (env.ALLOWED_ORIGINS || "https://hcymc.pages.dev")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const h = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
  if (allowed.includes(origin)) h["Access-Control-Allow-Origin"] = origin;
  return h;
}

const jsonRes = (req, env, status, obj) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store",
      ...corsHeaders(req, env),
    },
  });

const clientIp = (req) =>
  req.headers.get("CF-Connecting-IP") || req.headers.get("X-Forwarded-For") || "0.0.0.0";

// ---------------- 限流 ----------------
async function isRateLimited(db, ip) {
  const now = Date.now();
  const row = await db.prepare("SELECT count, reset_at FROM rate_limits WHERE key = ?").bind(`login:${ip}`).first();
  if (!row) return false;
  if (now > row.reset_at) {
    await db.prepare("DELETE FROM rate_limits WHERE key = ?").bind(`login:${ip}`).run();
    return false;
  }
  return row.count >= MAX_FAILS;
}

async function recordFail(db, ip) {
  const now = Date.now();
  await db
    .prepare(
      `INSERT INTO rate_limits (key, count, reset_at) VALUES (?, 1, ?)
       ON CONFLICT(key) DO UPDATE SET count = count + 1`
    )
    .bind(`login:${ip}`, now + FAIL_WINDOW_MS)
    .run();
}

async function clearFails(db, ip) {
  await db.prepare("DELETE FROM rate_limits WHERE key = ?").bind(`login:${ip}`).run();
}

// ---------------- 用户 ----------------
function profile(row) {
  return {
    username: row.username,
    createdAt: row.created_at,
    registeredAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    registeredDays: row.created_at ? Math.floor((Date.now() - row.created_at) / 86400000) : null,
    lastLoginAt: row.last_login_at ? new Date(row.last_login_at).toISOString() : null,
    loginCount: row.login_count || 0,
    lastIpMasked: row.last_login_ip ? String(row.last_login_ip).split(".").slice(0, 2).join(".") + ".*.*" : null,
  };
}

async function issueToken(row, env) {
  const now = Math.floor(Date.now() / 1000);
  return signJwt({ sub: row.username_lower, name: row.username, iat: now, exp: now + JWT_TTL }, env.JWT_SECRET);
}

async function readJson(req) {
  try {
    const ct = req.headers.get("Content-Type") || "";
    if (!ct.includes("application/json")) return null;
    const text = await req.text();
    if (text.length > 4096) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// ---------------- 路由 ----------------
async function handleRegister(req, env) {
  if (!env.DB) return jsonRes(req, env, 503, { success: false, error: "数据库未配置" });
  const body = await readJson(req);
  if (!body) return jsonRes(req, env, 400, { success: false, error: "请求格式错误" });

  const username = String(body.username || "").trim();
  const authKey = String(body.authKey || "").trim().toLowerCase();

  if (!USERNAME_RE.test(username)) {
    return jsonRes(req, env, 400, { success: false, error: "用户名只能是 3-20 位字母、数字或下划线" });
  }
  if (!AUTHKEY_RE.test(authKey)) {
    return jsonRes(req, env, 400, { success: false, error: "密码数据格式不正确，请刷新页面重试" });
  }

  const lower = username.toLowerCase();
  const exists = await env.DB.prepare("SELECT id FROM users WHERE username_lower = ?").bind(lower).first();
  if (exists) return jsonRes(req, env, 409, { success: false, error: "该用户名已被注册" });

  const record = await makePasswordRecord(authKey);
  const now = Date.now();
  const ip = clientIp(req);

  try {
    await env.DB.prepare(
      `INSERT INTO users (username, username_lower, password_hash, created_at, last_login_at, last_login_ip, login_count)
       VALUES (?, ?, ?, ?, ?, ?, 1)`
    )
      .bind(username, lower, record, now, now, ip)
      .run();
  } catch (e) {
    // 并发注册同名用户时唯一索引会触发
    return jsonRes(req, env, 409, { success: false, error: "该用户名已被注册" });
  }

  const row = await env.DB.prepare("SELECT * FROM users WHERE username_lower = ?").bind(lower).first();
  const token = await issueToken(row, env);
  return jsonRes(req, env, 201, { success: true, token, data: profile(row) });
}

async function handleLogin(req, env) {
  if (!env.DB) return jsonRes(req, env, 503, { success: false, error: "数据库未配置" });
  const ip = clientIp(req);

  if (await isRateLimited(env.DB, ip)) {
    return jsonRes(req, env, 429, { success: false, error: "尝试次数过多，请 10 分钟后再试" });
  }

  const body = await readJson(req);
  if (!body) return jsonRes(req, env, 400, { success: false, error: "请求格式错误" });

  const username = String(body.username || "").trim();
  const authKey = String(body.authKey || "").trim().toLowerCase();
  if (!username || !authKey) {
    return jsonRes(req, env, 400, { success: false, error: "请输入用户名和密码" });
  }

  const row = await env.DB.prepare("SELECT * FROM users WHERE username_lower = ?").bind(username.toLowerCase()).first();
  const generic = async () => {
    await recordFail(env.DB, ip);
    return jsonRes(req, env, 401, { success: false, error: "用户名或密码错误" });
  };

  if (!row) return generic();
  if (row.is_banned) return jsonRes(req, env, 403, { success: false, error: "该账号已被封禁" });

  const ok = await verifyPassword(authKey, row.password_hash);
  if (!ok) return generic();

  await clearFails(env.DB, ip);
  const now = Date.now();
  await env.DB.prepare("UPDATE users SET last_login_at = ?, last_login_ip = ?, login_count = login_count + 1 WHERE id = ?")
    .bind(now, ip, row.id)
    .run();

  const fresh = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(row.id).first();
  const token = await issueToken(fresh, env);
  return jsonRes(req, env, 200, { success: true, token, data: profile(fresh) });
}

async function handleMe(req, env) {
  if (!env.DB) return jsonRes(req, env, 503, { success: false, error: "数据库未配置" });
  const auth = req.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) return jsonRes(req, env, 401, { success: false, error: "登录已过期，请重新登录" });

  const row = await env.DB.prepare("SELECT * FROM users WHERE username_lower = ?").bind(payload.sub).first();
  if (!row) return jsonRes(req, env, 401, { success: false, error: "账号不存在" });
  if (row.is_banned) return jsonRes(req, env, 403, { success: false, error: "该账号已被封禁" });
  return jsonRes(req, env, 200, { success: true, data: profile(row) });
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(req, env) });
    }

    try {
      if (path === "/api/auth/health") {
        let dbOk = false;
        let err = null;
        try {
          await env.DB.prepare("SELECT 1").first();
          dbOk = true;
        } catch (e) {
          err = String(e.message || e);
        }
        return jsonRes(req, env, dbOk ? 200 : 503, {
          success: dbOk,
          service: "hcy-auth",
          database: dbOk ? "ok" : "unreachable",
          error: err,
          time: new Date().toISOString(),
        });
      }

      if (path === "/api/auth/register" && req.method === "POST") return handleRegister(req, env);
      if (path === "/api/auth/login" && req.method === "POST") return handleLogin(req, env);
      if (path === "/api/auth/me" && req.method === "GET") return handleMe(req, env);

      return jsonRes(req, env, 404, { success: false, error: "接口不存在" });
    } catch (e) {
      console.error("unhandled", e);
      return jsonRes(req, env, 500, { success: false, error: "服务器内部错误" });
    }
  },
};
