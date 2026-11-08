-- HCY 网站账号系统 — D1 数据库结构
-- 在 Cloudflare D1 控制台或 API 执行一次即可

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT    NOT NULL,              -- 显示用用户名（保留原始大小写）
  username_lower TEXT   NOT NULL UNIQUE,       -- 小写，用于唯一性与查询
  password_hash TEXT    NOT NULL,              -- pbkdf2$sha256$<迭代>$<盐>$<哈希>
  created_at    INTEGER NOT NULL,              -- 毫秒时间戳
  last_login_at INTEGER,
  last_login_ip TEXT,
  login_count   INTEGER NOT NULL DEFAULT 0,
  is_banned     INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_users_username_lower ON users(username_lower);

-- 登录失败计数（防爆破）
CREATE TABLE IF NOT EXISTS rate_limits (
  key      TEXT    PRIMARY KEY,
  count    INTEGER NOT NULL,
  reset_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_reset ON rate_limits(reset_at);
