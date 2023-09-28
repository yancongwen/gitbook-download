# gitbook-download

- 爬取 gitbook 网页内容，保存为 markdown 文件；
- 页面内容使用 html 转 markdown 工具 `turndown` 转换；
- 从页面中的下一页的按钮获取下一页的链接，从而递归获取整个网站的内容；

## 失败的尝试

- 使用 `puppeteer` 抓取 gitbook 目录，二级菜单需要点击一级菜单之后才能获取到；个别二级菜单无法获取，原因未知；
