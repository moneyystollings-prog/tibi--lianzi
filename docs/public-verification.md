# 提笔--练字 · 公开版验收

日期：2026-10-28。

- Node 自动测试 20 项通过，0 失败；完成版构建、真实图片格式、站内资源与双语标记检查通过。
- 浏览器实际验证了 IndexedDB 保存、刷新恢复、清空和跨标签页旧版本覆盖阻止。手记不会调用服务端写入 API，正常预览服务也默认关闭旧写作 API。
- 导出以当前输入生成 UTF-8 文本并交给浏览器下载，无须先保存到服务器。纯函数测试验证六个单字、未保存随笔、旧题记录及长度校验。
- 五张桌面 WebP 合计 1,549,172 字节，原 PNG 合计约 16.4 MB；另外提供 768px 手机版本。三张原创电影主题封面合计约 3.5 KB，非官方海报。旧素材和原图仅保留在本机 private/，不上传。
- 构建输出只包含公开页面和素材；用户手记、导出、原图、研究资料、凭据、测试截图和运行日志均排除在 Git 仓库之外。
- 构建同时核验永久去重档案，清理旧输出。配置正式站点地址后生成 canonical、Open Graph 与 sitemap。
- GitHub 项目：https://github.com/moneyystollings-prog/tibi--lianzi 。中文标题为“提笔--练字”。EdgeOne 使用官方 CLI 登录后直接上传静态文件，不授予 GitHub App 仓库写入权限；Chrome 扩展的文件网址权限没有修改。

用户暂时没有域名。EdgeOne 免费版项目 tibi--lianzi 已创建，项目 ID 为 makers-lnxtiscwuzfx，部署在全球可用区（不含中国大陆）。首个部署已成功，默认域名为 https://tibi--lianzi.edgeone.dev 。

当前大陆网络访问不带校验参数的默认域名实测 HTTP 401；控制台生成的三小时预览链接已能打开首页及当日内容。这是平台访问规则，不能将限时预览作为稳定的大陆公网入口。按官方错误码说明，当前海外可用区绑定自定义域名无需 ICP 备案；使用中国大陆节点则需要已备案域名。下一阶段先选择并绑定自己的域名，无须购买独立服务器。

线上首轮验收发现 EdgeOne 将 .mjs 按 application/octet-stream 发送，导致浏览器模块不加载；公开脚本改用 .js 扩展名，并完成重新构建、20 项测试和资源核验。正式自定义域名尚未确定，因此 siteUrl 保留为空，待绑定时生成 canonical 和 sitemap。

最终部署 ID：dpogyqb3l68v。状态 success。预览首页及 JavaScript 模块均为 HTTP 200，模块 Content-Type 为 application/javascript，CSP 响应头生效。真实浏览器确认线上炼字输入、保存以及刷新恢复，之后清空并保存了代理生成的验收文字。

导出按钮已执行并显示下载提示，导出内容通过自动测试；浏览器自动化未捕获到实际下载事件，因此本轮不宣称已验证文件落盘。最终截图保存在本机 docs/screenshots/edgeone-live-home.png，不上传测试截图和限时校验链接。

平台规则来源：https://pages.edgeone.ai/document/error-codes 。代码上传 GitHub 与 EdgeOne 直接上传相互独立，后续 GitHub push 不会自动触发部署；更新内容后需重新构建并部署到同一项目。
