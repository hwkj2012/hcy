# HCY 无规则生存服务器 · 官方网站

Minecraft 服务器 HCY 的官方网站，纯静态站点，部署在 **Cloudflare Pages**，源码托管于 **GitHub**。

- 线上地址：<https://hcy.pages.dev>
- 仓库地址：<https://github.com/>

---

## 页面

| 路径 | 说明 |
| --- | --- |
| `/` | 首页：服务器介绍、玩法特色、IP 地址、规则、社交入口、实时在线状态 |
| `/docs.html` | 服务器文档：公告、常见问题、服务条款、插件指令 |
| `/404.html` | 自定义错误页（由 Cloudflare Pages 自动接管） |
| `/docs` | 短链，301 跳转到 `/docs.html` |

## 目录结构

```
├── index.html              首页
├── docs.html               文档页
├── 404.html                自定义 404
├── img/                    站点图标
├── static/
│   ├── css/                样式（模块化拆分）
│   ├── js/                 脚本（i18n、主题、鉴权、状态、播放器等）
│   ├── font/               Font Awesome 与中文网络字体
│   └── picture/            图片素材
├── _headers                Cloudflare Pages 响应头（安全 + 缓存）
├── _redirects              Cloudflare Pages 重定向规则
└── .github/workflows/      推送 main 分支后自动部署
```

## 特性

- **十语种界面**：中 / 英 / 日 / 韩 / 俄 / 西 / 法 / 德 / 葡 / 泰，`static/js/i18n.js`
- **深色 / 浅色主题**：`static/css/dark-theme.css`
- **实时在线人数**：通过 [mcsrvstat.us](https://api.mcsrvstat.us) 公共 API 拉取，无需自建后端
- **玻璃拟态视觉**：`static/css/hcy-glass.css`

## 本地预览

任选一种方式（无需构建步骤）：

```bash
# Python
python -m http.server 8080

# Node
npx serve .
```

然后打开 <http://localhost:8080>。**请勿直接双击 HTML 文件**，`file://` 协议下字体与脚本的跨域加载会被浏览器拦截。

## 部署

### 自动部署（推荐）

推送到 `main` 分支即自动上线，流水线见 `.github/workflows/deploy.yml`。

需要在仓库 **Settings → Secrets and variables → Actions** 中配置：

| 名称 | 值 |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token（权限：`Cloudflare Pages: Edit`） |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 账户 ID |

### 手动部署

```bash
npx wrangler pages deploy . --project-name=hcy --branch=main
```

## 已知事项

- `static/js/auth.js` 中的 `API_BASE` 指向 `http://workstation.monikasuki.work:3001`。在 HTTPS 站点下浏览器会按**混合内容**策略拦截该请求，登录功能需要该后端提供 HTTPS 地址后才能使用。
- 首页图表依赖 `cdn.jsdelivr.net` 上的 Chart.js；该 CDN 在部分网络环境下较慢，不影响页面主体渲染。

## 许可

页面内容与素材版权归 HCY 服务器团队所有。
