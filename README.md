# juejin-cli — 在终端里浏览掘金文章

> 一个轻量级的掘金文章列表浏览 CLI，支持交互式翻页、文章详情查看，以及通过 lightpanda 直接获取文章正文。

## 为什么做这个项目

掘金是国内开发者常逛的技术社区，但有时候我们并不想打开浏览器——只是想快速扫一眼有哪些热门文章，或者 terminal 环境下顺手浏览。于是有了这个小工具。

## 功能特性

- 🗞️ **浏览文章列表** — 支持热门/最新两种排序，表格展示标题、作者、热度、时间
- 📄 **交互式翻页** — `n` 下一页、`p` 上一页，在 terminal 里流畅浏览
- 🔍 **查看详情** — 输入文章序号即可查看摘要、标签、阅读量等详情
- 🐼 **lightpanda 集成** — 如果系统安装了 [lightpanda](https://lightpanda.io)，输入 `o` 即可获取并渲染文章完整正文（Markdown）
- ⚡ **轻量快速** — 无浏览器依赖，纯 CLI 交互

## 安装与使用

```bash
# Clone 仓库
git clone git@github.com:BoltDoggy/juejin-cli.git
cd juejin-cli

# 安装依赖
npm install

# 构建
npm run build

# 启动交互模式
node dist/index.js list

# 查看最新文章（非交互）
node dist/index.js new --limit 10

# 查看热门文章
node dist/index.js hot --limit 5

# 全局安装
npm link
juejin list
```

## 交互操作说明

```
> 1        # 查看第 1 篇文章详情
> n        # 下一页
> p        # 上一页
> o        # 用 lightpanda 查看当前文章的完整正文（需安装 lightpanda）
> q        # 退出
> h        # 显示帮助
```

## 效果演示

### 列表浏览

```
┌────┬─────────────────────────────────────┬────────────┬────────┬──────────┐
│ #  │ 标题                                │ 作者       │ 热度   │ 时间     │
├────┼─────────────────────────────────────┼────────────┼────────┼──────────┤
│ 1  │ 全面封禁 Cursor！又一家大厂出手了   │ 程序员鱼皮 │ 19.6w  │ 12-16    │
├────┼─────────────────────────────────────┼────────────┼────────┼──────────┤
│ 2  │ 我用AI做了个微信小游戏-上线了       │ 前端阿彬   │ 1.5w   │ 23天前   │
└────┴─────────────────────────────────────┴────────────┴────────┴──────────┘
```

### lightpanda 获取正文

当系统安装了 `lightpanda` 时，查看文章详情后会提示：

```
[1] 全面封禁 Cursor！又一家大厂出手了
──────────────────────────────────────────────────────────────────────
作者: 程序员鱼皮 @ codefather.cn (编程导航)
链接: https://juejin.cn/post/7584110439933100078
...
  提示: 输入 o 用 lightpanda 查看完整正文
──────────────────────────────────────────────────────────────────────

> o
正在用 lightpanda 获取文章...

# 全面封禁 Cursor！又一家大厂出手了

最近，有网友爆料称：快手的研发线发布通知...
（完整 Markdown 正文）
```

## 技术实现

### 接口

直接调用掘金公开 API：

```
POST https://api.juejin.cn/recommend_api/v1/article/recommend_all_feed
```

参数：

```json
{
  "id_type": 2,
  "client_type": 2608,
  "sort_type": 200,
  "cursor": "0",
  "limit": 20
}
```

### 核心依赖

| 包名 | 作用 |
|------|------|
| `commander` | CLI 命令解析 |
| `axios` | HTTP 请求 |
| `chalk` | 终端颜色 |
| `cli-table3` | 表格展示 |

### 项目结构

```
juejin-cli/
├── src/
│   ├── index.ts        # CLI 入口 & 交互模式
│   ├── api.ts          # 掘金 API 封装
│   ├── display.ts      # 终端输出格式化
│   ├── types.ts        # TypeScript 类型
│   └── lightpanda.ts   # lightpanda 检测与调用
├── dist/               # 编译输出
├── package.json
└── tsconfig.json
```

### 交互模式设计

`runInteractive` 函数内维护以下状态：

- `articles` — 当前页文章列表
- `page` — 当前页码
- `pageCursors` — 每页起始 cursor（用于上一页回退）
- `nextCursors` — 每页返回的下一页 cursor
- `selectedIndex` — 当前选中的文章序号（供 lightpanda 使用）

翻页逻辑通过 cursor 游标实现，API 返回的 `cursor` 字段即为下一页的起始位置。

### lightpanda 集成

`lightpanda.ts` 提供两个函数：

- `isAvailable()` — 通过 `spawn('lightpanda', ['--help'])` 检测是否已安装
- `fetchArticle(url)` — 调用 `lightpanda fetch --dump markdown --strip-mode ui <url>` 获取正文

如果检测到 lightpanda，交互帮助和文章详情会自动显示 `o` 操作提示。

## 写在最后

这是一个很小的工具，但解决了一个真实场景的需求：在 terminal 环境下快速浏览技术文章。如果你也经常在命令行里工作，欢迎试用。

如果有想法或改进建议，欢迎提 Issue 或 PR。
