# Fancy 公网部署

当前公网方案使用 Render Static Site，仅发布 React 页面和公开素材，不启动后端，也不配置任何 API 密钥。本机报告和数据库不随源码公开。

静态构建命令：`npm --prefix frontend ci && VITE_PUBLIC_READ_ONLY=true npm --prefix frontend run build`。发布目录：`frontend/dist`。配置 `/*` 到 `/index.html` 的 Rewrite，以支持报告和专家页等前端路由。

以下容器方案保留给未来需要服务端的部署，当前静态站点不使用它。

## 容器服务器

在支持 Docker Compose 的服务器上运行：

```sh
docker compose up -d --build
```

服务监听 8080。域名的 HTTPS 反向代理指向这个端口；代理需关闭 SSE 缓冲，并允许至少 20 分钟的任务连接。

## 配置与数据

- 当前公网版本仅供浏览。云端不填写模型或搜索密钥，Compose 不读取本机 `backend/.env`。
- `FANCY_PUBLIC_READ_ONLY=true` 在服务端阻止所有 API 写操作、任务流、搜索和模型验证请求。Docker 构建使用 `VITE_PUBLIC_READ_ONLY=true` 关闭前端调研入口。本地 Vite 与 `app.main` 仍可供所有者调研。
- `VERDA_DB_PATH=/data/fancy.db` 指向持久卷。必须保留 `/data`，否则重建容器后报告会丢失。
- Docker 构建排除了 `.env`、本地数据库和日志；镜像不包含本机密钥或已有调研。
- 使用单个进程和单个实例运行当前版本。当前任务流依赖进程内状态，尚未改为独立任务队列。

## 发布前需要确定

在独立仓库发布当前代码并连接托管平台。公网副本不继承本机 API 密钥或已有报告；需要展示的报告另行选定发布。

## 已选的首次上线方案：Render 免费试运行

`render.yaml` 配置了静态站点。所有访客都能浏览公开内容，不能发起调研。不向 Render 上传或配置 `ZHIPU_API_KEY`、`BOCHA_API_KEY`。

静态站点不连接数据库，展示页从静态素材读取专家信息。报告列表初始为空，已有本机报告没有自动发布。

部署顺序：注册 Render、将当前 Fancy 版本放入独立 Git 仓库、创建 Static Site、填写构建命令和发布目录、部署并添加前端路由 Rewrite。服务上线后 Render 提供 HTTPS 公网地址。
