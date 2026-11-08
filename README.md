# HCY 无规则生存服务器 · 官方网站

Minecraft 服务器 HCY 的官方网站，纯静态站点 + 同域登录接口，部署在 **Cloudflare Pages**，源码托管于 **GitHub**。

- 线上地址：<https://hcymc.pages.dev>
- 仓库地址：<https://github.com/hwkj2012/hcy>

---

## 页面

| 路径 | 说明 |
| --- | --- |
| `/` | 首页：服务器介绍、玩法特色、IP 地址、规则、社交入口、实时在线状态 |
| `/docs` | 服务器文档（`/docs.html` 会 308 跳到这里） |
| `/404.html` | 自定义错误页 |

## 账号系统

网站有**独立的账号体系**，与游戏内 AuthMe 账号互不关联。

| 接口 | 说明 |
| --- | --- |
| `POST /api/auth/register` | 注册并直接登录 |
| `POST /api/auth/login` | 登录 |
| `GET /api/auth/me` | 用令牌获取当前用户资料 |
| `GET /api/auth/health` | 健康检查（含数据库连通性） |

- 接口与网站**同域**（Cloudflare Pages Functions），因此没有跨域问题，国内可正常访问。
  不用 `*.workers.dev` 独立域名的原因：该域名在国内被 DNS 污染 + 连接阻断。
- 用户数据存放在 **Cloudflare D1**（SQLite），表结构见 `auth-worker/schema.sql`。
- 登录后导航栏显示：用户名、注册天数、最后登录时间、登录次数。

### 密码是怎么存的

```
浏览器：authKey = PBKDF2-SHA256(密码, salt="hcy:v1:"+用户名小写, 210000 次)  → 64 位十六进制
网络  ：只传输 authKey，明文密码不出本机
服务端：存储 sha256$<16字节随机盐>$<sha256(盐 + authKey)>
```

**为什么耗时的派生放在浏览器**：Cloudflare Workers 免费版单次请求只有 10ms CPU，
21 万次 PBKDF2 实测需要 194ms，会直接被杀（表现为注册接口 500）。浏览器没有这个限制。

安全性不打折：数据库泄露后，攻击者仍需对每个候选密码重跑 21 万次 PBKDF2 才能验证。

### 安全措施

- 防爆破：同一 IP 10 分钟内失败 10 次即临时封禁
- 登录失败统一提示，不泄露用户名是否存在
- 令牌 HS256 签名，7 天过期；签名段非法时返回 401 而非 500
- 接口响应 `Cache-Control: no-store`、`X-Content-Type-Options: nosniff`
- 用户名插入 DOM 前转义，防止本地存储被篡改后注入 HTML

## 目录结构

```
├── index.html              首页
├── docs.html               文档页
├── 404.html                自定义 404
├── img/                    站点图标
├── static/
│   ├── css/                样式（模块化拆分）
│   ├── js/                 脚本（i18n、主题、鉴权 auth.js、在线状态、播放器等）
│   ├── font/               Font Awesome 与中文网络字体
│   └── picture/            图片素材
├── auth-worker/            登录接口源码
│   ├── src/index.mjs       Worker / Pages Function 主体
│   ├── schema.sql          D1 建表语句
│   ├── wrangler.toml       本地开发配置
│   └── test/local-test.mjs 29 项自动化测试（用真实 SQLite 跑完整链路）
├── _headers                Cloudflare Pages 响应头
├── _redirects              Cloudflare Pages 重定向规则
└── .github/workflows/      推 main 后自动部署（需配置 Secrets）
```

## 本地预览

```bash
# 1) 起静态站点
python -m http.server 8080

# 2) 起本地认证服务（模拟 D1，用真实 SQLite 文件）
node .deploy/dev-api.mjs
```

打开 <http://localhost:8080>。`auth.js` 会自动把本地环境指向 `http://127.0.0.1:3102`。
**请勿直接双击 HTML 文件**，`file://` 协议下字体与脚本加载会被浏览器拦截。

## 部署

### 网站

```bash
node .deploy/deploy.mjs --all        # 同时发布到 GitHub 与 Cloudflare Pages
```

### 登录接口（改动 auth-worker 后需要）

```bash
node .deploy/deploy-pages-functions.mjs
```

该脚本会：配置 D1 绑定与环境变量 → 生成 `_worker.js` → 先发预览分支验证 → 通过后再发生产。

> 密钥保存在 `.deploy/auth-secret.txt`，重部署会复用，不会踢掉已登录用户。

## 注意事项

- **不要**在 `_redirects` 里写 `/docs → /docs.html` 这类规则：Pages 默认开启「美化 URL」，
  会把 `/docs.html` 自动 308 跳到 `/docs`，两边对跳会形成死循环。
- 首页图表依赖 `cdn.jsdelivr.net` 上的 Chart.js；该 CDN 在部分网络环境下较慢，不影响页面主体渲染。
- 玩家若忘记密码，目前需管理员在 D1 中处理（暂无自助找回，因未接入邮件服务）。

## 许可

页面内容与素材版权归 HCY 服务器团队所有。
