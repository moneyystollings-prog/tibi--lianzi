# GitHub Pages 发布方案与执行记录

日期：2026-10-29。用户已明确授权开通 Pages 并适配项目子目录，无需重复确认。

目标：发布 https://moneyystollings-prog.github.io/tibi--lianzi/ ，首页、每日页、归档、图片、模块脚本和下载文本均能从项目子目录访问；保持设备本地保存。

当前 GitHub 登录具备 repo 权限，没有 workflow 权限。采用 GitHub 官方支持的 gh-pages 分支根目录发布，不新增访问权限；该分支仅含构建成品和 .nojekyll。主分支保存源代码，原 EdgeOne 构建默认仍使用根路径。

- [x] 增加可配置 BASE_PATH，统一重写模板的本地 href、src 和 srcset；canonical、分享图和 sitemap 使用相同前缀。
- [x] 增加子目录回归检查；分别验证根路径构建和 /tibi--lianzi 构建，23 项测试、资源检查全部通过。
- [x] 检查变更，提交源代码；将经过验证的成品发布至 gh-pages，配置 Pages 从分支根目录发布，HTTPS 已启用。
- [x] GitHub Pages 状态 built，平台运行 40815789834 的构建和部署均 success。源代码提交 b74034d，发布分支提交 b1b6920。
- [x] 28 项公开页面及资源请求全部 HTTP 200，JavaScript 返回 application/javascript；浏览器实际打开首页并检查子目录导航，保存上线截图。

本轮浏览器控制多次超时，未完成 GitHub Pages 上的填词保存和刷新恢复复测；没有把控制超时解释成网站故障，也未改动设备保存逻辑。该逻辑此前通过 EdgeOne 的真实浏览器验证和本轮自动测试。HTTP 检查结果与截图分别保存在本机 docs/validation-data/github-pages-http.json 和 docs/screenshots/github-pages-live.png，不上传验收文件。

后续每日更新仍先核验和提交内容，再构建并更新 gh-pages。不会把原始素材、用户手记、凭据或研究资料提交到发布分支。

## 2026-10-30 浏览器保存复测

- 在线填入第一组单字“照／迎”和测试随笔后，页面显示“已保存在此设备的浏览器中”。
- 刷新页面后，状态显示“已恢复此设备的手记”；两处填字和随笔完整恢复，实时合句为“晨光照书页，晚照迎归人。”。
- 截图：本机 docs/screenshots/github-pages-writing-restored.png。
- 导出落盘测试等待用户确认默认下载目录的临时存储例外，确认前不触发浏览器下载。应用代码未改动。
- 已通过页面按钮清空并保存本轮生成的测试文字，DOM 复核所有输入为空；未修改先前的用户手记（验收开始时此浏览器本期记录为空）。
