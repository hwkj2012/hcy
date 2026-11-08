/**
 * 本地集成测试：用真实的 SQLite（Node 内置 node:sqlite）模拟 D1，
 * 直接驱动 Worker 的 fetch 处理器，验证注册/登录/鉴权/限流/CORS 全链路。
 *
 * 用法: node auth-worker/test/local-test.mjs
 */
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const schema = fs.readFileSync(path.join(ROOT, "schema.sql"), "utf8");

// ---------- 用 node:sqlite 模拟 D1 ----------
function makeD1Shim() {
  const db = new DatabaseSync(":memory:");
  db.exec(schema);

  const makeStmt = (sql, args = []) => {
    const stmt = db.prepare(sql);
    return {
      bind: (...next) => makeStmt(sql, next),
      first: async (...extra) => {
        const row = stmt.get(...(extra.length ? extra : args));
        return row === undefined ? null : row;
      },
      run: async (...extra) => {
        stmt.run(...(extra.length ? extra : args));
        return { success: true, meta: {} };
      },
      all: async (...extra) => ({ results: stmt.all(...(extra.length ? extra : args)) }),
    };
  };

  return { prepare: (sql) => makeStmt(sql) };
}

const { default: worker } = await import(pathToFileURL(path.join(ROOT, "src/index.mjs")).href);

// 与服务端约定一致：密码派生在「客户端」完成
const PBKDF2_ITERATIONS = 210000;
async function deriveAuthKey(username, password) {
  const enc = new TextEncoder();
  const salt = enc.encode("hcy:v1:" + String(username).toLowerCase());
  const km = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    km,
    256
  );
  return [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const env = {
  DB: makeD1Shim(),
  JWT_SECRET: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  ALLOWED_ORIGINS: "https://hcymc.pages.dev",
};

let pass = 0;
let fail = 0;

async function call(method, p, { body, token, origin = "https://hcymc.pages.dev", ip = "1.2.3.4" } = {}) {
  // 若传了 password，则模拟浏览器把它派生成 authKey 再发出去
  let payload = body;
  if (body && typeof body.password === "string") {
    payload = { ...body, authKey: await deriveAuthKey(body.username, body.password) };
    delete payload.password;
  }

  const headers = { Origin: origin, "CF-Connecting-IP": ip };
  if (payload !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await worker.fetch(
    new Request("https://auth.example.com" + p, {
      method,
      headers,
      body: payload === undefined ? undefined : JSON.stringify(payload),
    }),
    env
  );
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {}
  return { res, json, text };
}

function check(name, cond, extra = "") {
  if (cond) {
    pass++;
    console.log(`  ✔ ${name}${extra ? "  — " + extra : ""}`);
  } else {
    fail++;
    console.log(`  ✖ ${name}${extra ? "  — " + extra : ""}`);
  }
}

console.log("=== 健康检查 ===");
{
  const { res, json } = await call("GET", "/api/auth/health");
  check("health 返回 200 且数据库 ok", res.status === 200 && json.database === "ok", JSON.stringify(json));
}

console.log("\n=== 注册 ===");
let token;
{
  const { res, json } = await call("POST", "/api/auth/register", { body: { username: "HaoYu_01", password: "Abcdefg1" } });
  check("注册成功返回 201", res.status === 201, `HTTP ${res.status}`);
  check("返回了 token", typeof json?.token === "string" && json.token.split(".").length === 3);
  check("用户名保留原始大小写", json?.data?.username === "HaoYu_01", json?.data?.username);
  token = json?.token;
}
{
  const { res, json } = await call("POST", "/api/auth/register", { body: { username: "haoyu_01", password: "Abcdefg1" } });
  check("大小写不同视为重复注册 → 409", res.status === 409, `HTTP ${res.status} ${json?.error || ""}`);
}
{
  const { res } = await call("POST", "/api/auth/register", { body: { username: "ab", password: "Abcdefg1" } });
  check("用户名过短 → 400", res.status === 400);
}
{
  const { res } = await call("POST", "/api/auth/register", { body: { username: "bad name!", password: "Abcdefg1" } });
  check("用户名含非法字符 → 400", res.status === 400);
}
{
  const { res, json } = await call("POST", "/api/auth/register", { body: { username: "badkey", authKey: "not-a-valid-key" } });
  check("authKey 格式非法 → 400", res.status === 400, json?.error);
}

console.log("\n=== 登录 ===");
{
  const { res, json } = await call("POST", "/api/auth/login", { body: { username: "haoyu_01", password: "Abcdefg1" }, ip: "5.6.7.8" });
  check("正确密码可登录（大小写不敏感）", res.status === 200 && json.success === true);
  check("登录计数 +1", json?.data?.loginCount === 2, String(json?.data?.loginCount));
  check("lastLoginAt 已更新", Boolean(json?.data?.lastLoginAt));
  check("返回注册天数", typeof json?.data?.registeredDays === "number");
}
{
  const { res } = await call("POST", "/api/auth/login", { body: { username: "HaoYu_01", password: "wrongpass" }, ip: "5.6.7.8" });
  check("错误密码 → 401", res.status === 401);
}
{
  const { res } = await call("POST", "/api/auth/login", { body: { username: "nobody_here", password: "whatever1" }, ip: "5.6.7.8" });
  check("不存在的用户 → 401（与密码错误同样文案）", res.status === 401);
}
{
  const { json } = await call("POST", "/api/auth/login", { body: { username: "nobody_here", password: "whatever1" }, ip: "5.6.7.8" });
  check("不泄露账号是否存在", json?.error === "用户名或密码错误", json?.error);
}

console.log("\n=== 令牌鉴权 ===");
{
  const { res, json } = await call("GET", "/api/auth/me", { token });
  check("有效令牌可取当前用户", res.status === 200 && json?.data?.username === "HaoYu_01");
}
{
  const { res } = await call("GET", "/api/auth/me", { token: "aaa.bbb.ccc" });
  check("伪造令牌 → 401", res.status === 401);
}
{
  const { res } = await call("GET", "/api/auth/me");
  check("无令牌 → 401", res.status === 401);
}
{
  // 篡改载荷（把用户名改掉）但保留签名
  const parts = token.split(".");
  const tampered = parts[0] + "." + parts[1].slice(0, -2) + "xx." + parts[2];
  const { res } = await call("GET", "/api/auth/me", { token: tampered });
  check("篡改载荷 → 401", res.status === 401);
}

console.log("\n=== 防爆破限流 ===");
{
  let last;
  for (let i = 0; i < 12; i++) {
    last = await call("POST", "/api/auth/login", { body: { username: "HaoYu_01", password: "wrong!" + i }, ip: "9.9.9.9" });
  }
  check("连续失败后被限流 → 429", last.res.status === 429, `最后状态 HTTP ${last.res.status}`);
}
{
  const { res } = await call("POST", "/api/auth/login", { body: { username: "HaoYu_01", password: "Abcdefg1" }, ip: "9.9.9.9" });
  check("限流期间正确密码也被拒（防爆破生效）", res.status === 429);
}
{
  const { res } = await call("POST", "/api/auth/login", { body: { username: "HaoYu_01", password: "Abcdefg1" }, ip: "8.8.8.8" });
  check("其他 IP 不受影响", res.status === 200);
}

console.log("\n=== CORS ===");
{
  const { res } = await call("GET", "/api/auth/health");
  check("允许来源包含 hcymc.pages.dev", res.headers.get("access-control-allow-origin") === "https://hcymc.pages.dev");
}
{
  const { res } = await call("GET", "/api/auth/health", { origin: "https://evil.example.com" });
  check("非法来源不放行", res.headers.get("access-control-allow-origin") === null);
}
{
  const { res } = await call("OPTIONS", "/api/auth/login", { origin: "https://hcymc.pages.dev" });
  check("预检返回 204", res.status === 204);
}

console.log("\n=== 密码存储安全 ===");
{
  const row = env.DB.prepare("SELECT password_hash FROM users WHERE username_lower = ?").bind("haoyu_01");
  const r = await row.first();
  const h = r.password_hash;
  check("不是明文", !h.includes("Abcdefg1"));
  check("使用加盐 SHA-256 存储", h.startsWith("sha256$"), h.slice(0, 24) + "…");
  check("格式为 sha256$<32位盐>$<64位哈希>", /^sha256\$[0-9a-f]{32}\$[0-9a-f]{64}$/.test(h));
}
{
  // 同样密码的两个用户，哈希必须不同（盐随机）
  await call("POST", "/api/auth/register", { body: { username: "second_user", password: "Abcdefg1" }, ip: "7.7.7.7" });
  const a = await env.DB.prepare("SELECT password_hash FROM users WHERE username_lower = ?").bind("haoyu_01").first();
  const b = await env.DB.prepare("SELECT password_hash FROM users WHERE username_lower = ?").bind("second_user").first();
  check("相同密码产生不同哈希（加盐生效）", a.password_hash !== b.password_hash);
}

console.log(`\n通过 ${pass} 项，失败 ${fail} 项`);
process.exit(fail ? 1 : 0);
