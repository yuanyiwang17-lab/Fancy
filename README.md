# Fancy

Fancy AI research workspace

## 工作分工

Fancy 使用四个固定工作角色：任务规划、资料采集、分析写作、质量检查。联网资料和舆情统一由采集负责，分析与报告由分析写作负责，质量检查保留引用核验与返工流程。选择工作角色不额外调用模型。页面中的工作方法说明实际流程，角色介绍不再展示虚构履历。

## 公网模式

访客打开网站，在 API 设置中填写自己的模型与博查搜索密钥，即可发起调研。浏览器直接调用访客配置的服务，费用由访客账户承担。网站不提供所有者密钥作为兜底。

报告保存在当前浏览器，可直接阅读、编辑、批注和按批注深化章节。此版本使用搜索摘要，尚无跨设备同步、公共报告分享和多人实时协作。生成时需要保持页面打开。

此仓库不包含 API 密钥、本机报告数据库或运行日志。默认密钥仅保留在访客的标签页会话中，可选择在自己的设备记住或随时清除。

## GitHub Pages 免费部署

公开站点：[Fancy](https://yuanyiwang17-lab.github.io/Fancy/)。静态文件发布在 `gh-pages` 分支，不启动 Python 后端，也没有 API 密钥。

构建命令：`VITE_BROWSER_RESEARCH=true npm --prefix frontend run build -- --base=/Fancy/`。公网版使用 HashRouter，确保导航与刷新均适用于静态托管。

`main` 分支保留源代码，`gh-pages` 分支只存构建结果。已有私有报告不会自动发布。

## 可选的 Render 静态部署

在 Render 创建 Static Site 并选择本仓库。构建命令为 `npm --prefix frontend ci && VITE_BROWSER_RESEARCH=true npm --prefix frontend run build`，发布目录为 `frontend/dist`。`render.yaml` 也提供相应静态站点配置。

公网部署不连接所有者的本机 API 或报告数据库。详细配置与使用说明见 [PUBLIC_DEPLOYMENT.md](docs/PUBLIC_DEPLOYMENT.md)。

## 容器运行

```sh
docker compose up -d --build
```

网页与 API 统一监听 8080，健康检查路径为 `/health`。
