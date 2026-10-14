# Fancy 公网部署

站点：[Fancy](https://yuanyiwang17-lab.github.io/Fancy/)。使用 GitHub Pages 托管前端，访客在 API 设置页配置自己的密钥，浏览器直接调用模型和博查搜索接口。不启动公网 Python 后端，不配置网站所有者的 API 密钥。

## 构建和发布

```sh
npm --prefix frontend ci
VITE_BROWSER_RESEARCH=true npm --prefix frontend run build -- --base=/Fancy/
```

将 `frontend/dist` 发布到 `gh-pages` 分支根目录，GitHub Pages 使用该分支。路由使用 HashRouter，资源带 `/Fancy/` 前缀。

Render 等静态托管平台也可部署，构建环境设置 `VITE_BROWSER_RESEARCH=true`，发布目录为 `frontend/dist`。根域名部署不需要 `--base=/Fancy/`。`render.yaml` 已提供静态站点配置。

## 访客使用

1. 打开网站的 API 设置。
2. 填写自己的模型 Key、OpenAI 兼容 API 地址、模型名称，以及博查搜索 Key。
3. 验证连接（会产生少量模型和搜索调用），保存配置。
4. 返回工作台输入主题、选择调研模式、提交。
5. 生成期间保持标签页打开；报告保存在当前浏览器，可在“我的调研”重新打开、编辑和批注。

默认模型接口为智谱，搜索接口为博查。自定义模型服务需要允许来自网站的浏览器跨域 POST 请求及 Authorization 请求头。接口地址只能使用 HTTPS（本机调试地址除外），密钥不会通过 URL、重定向、Fancy 服务器或 GitHub Actions 转发。

## 密钥和报告

- 默认密钥保存在当前标签页 sessionStorage；选择“记住”后保存在浏览器 localStorage，可在设置页清除。
- 模型密钥仅发往配置的模型服务，搜索密钥仅发往配置的搜索服务。不提供任何网站所有者密钥作为兜底。
- 报告与任务保存在 IndexedDB，编辑和批注保存在该浏览器。清除网站数据会删除这些记录。
- 报告地址能重新打开本浏览器保存的报告；其他设备或访客没有该报告数据。这一版尚无跨设备同步、公共报告分享、后台订阅或多人协作。
- 资料来自搜索接口返回的摘要，不抓取网页全文。图表的来源分布基于实际采集数量；“多来源”仅表示不同域名引用，不能当作事实已经核实。

本机 Python 后端仍使用 `backend/.env`，适用于所有者的本机完整调研流程。现有 Docker 容器默认只读配置不用于公网浏览器版。

## 检查

```sh
npm --prefix frontend run test:browser
```

测试使用模拟模型和搜索响应，检查缺少密钥、引用有效性、不同模型分工、密钥传递范围以及失败时不会签发报告。真实服务是否可用仍取决于访客账户额度、模型权限、网络和跨域政策。
