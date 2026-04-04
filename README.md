# Legado 书源生成器

> ⚠️ **风险提示**：本项目完全由 AI 辅助生成（vibe coding），代码可能存在缺陷、安全漏洞或有害内容。作者不对使用本项目产生的任何后果负责。使用者在安装或使用前，请务必自行审查代码，确保安全。

一个 Chrome 扩展，通过可视化点选页面元素来生成[阅读](https://github.com/gedoor/legado) APP 的书源规则。

## 演示视频

[![阅读书源生成插件演示](https://socialify.git.ci/z1131392774/legado-source-generator/image?description=1&font=Inter&language=1&name=1&owner=1&theme=Auto)](https://www.bilibili.com/video/BV1jQDKBzEBK/)

> 👆 点击观看完整演示视频

## 功能特性

- **可视化元素选择**：点击选择页面上任意元素
- **智能选择器生成**：自动生成稳定的 CSS 选择器
- **分步工作流**：按步骤选择列表容器、书名、作者、封面、简介、最新章节等
- **列表交集算法**：选择两个同列表元素，自动提取公共 class 生成可复用选择器
- **错误检测**：自动检测 Shadow DOM、iframe、动态 class 等潜在问题
- **键盘导航**：支持 ↑↓←→ 键在 DOM 树中精确导航
- **导出 JSON**：一键生成可直接导入阅读 APP 的书源规则

## 安装

### Chrome / Edge

1. 打开浏览器，访问 `chrome://extensions/`
2. 开启右上角的"开发者模式"
3. 点击"加载已解压的扩展程序"，选择 `src` 目录
4. 建议固定扩展图标方便使用

### Firefox

> ⚠️ **注意**：本扩展主要基于 Chrome (MV3) 开发和测试，Firefox 版本（MV2）为适配移植版本，可能存在未知 bug。如遇问题，请优先使用 Chrome / Edge 版本。

1. 打开浏览器，访问 `about:debugging#/runtime/this-firefox`
2. 点击"临时载入附加组件"
3. 选择 `src-firefox/manifest.json` 文件
4. 点击工具栏扩展图标即可打开侧边栏

## 使用方法

### 规则页（搜索页 / 详情页 / 目录页 / 正文页）

1. 点击扩展图标打开侧边栏
2. 填写书源名称和基础 URL
3. 选择规则类型（搜索页 / 详情页 / 目录页 / 正文页）
4. 点击"选择元素"开始点选：
   - **列表字段**（书籍列表/章节列表）：选择两个同列表元素，自动取交集
   - **普通字段**：直接点击目标元素
5. 使用键盘快捷键精确调整：
   - `↑` 移动到父元素
   - `↓` 移动到第一个子元素
   - `←` 移动到上一个兄弟元素
   - `→` 移动到下一个兄弟元素
   - `Enter` 确认选择
   - `Esc` 取消选择
6. 完成后点击"导出 JSON"获取书源规则
7. 导入到阅读 APP

### 发现页 URL

发现页 URL 用于配置阅读 APP 首页的分类导航入口，支持可视化编辑和页面收集两种模式。

#### 可视化编辑

1. 切换到"发现页"标签页
2. 点击"手动添加"逐条输入分类名称和 URL
3. 点击"插入分隔"添加分隔符
4. 卡片支持拖拽排序和拖拽调整宽度
5. 右侧属性面板可调整 Flexbox 布局属性（flexGrow、flexShrink、alignSelf、flexBasisPercent、wrapBefore）
6. 底部预览区实时显示生成的 JSON，支持"样式一"（每行 `title::url`）和"样式二"（JSON 数组）两种格式切换

#### 从页面收集

1. 在浏览器中打开目标网站（如小说网站的首页）
2. 在侧边栏发现页标签下点击"从页面收集元素"
3. 鼠标悬停在页面的分类/排行链接上，侧边栏预览区下方实时显示元素信息
4. 点击链接即可收集，已收集项会显示蓝色闪烁提示
5. 收集完成后按 `Enter` 完成收集，所有条目自动添加到列表

## 键盘快捷键

### 规则页元素选择

| 按键 | 操作 |
|------|------|
| Esc | 退出选择模式 |
| Enter | 确认选择（列表字段需选两次） |
| ↑ | 移动到父元素 |
| ↓ | 移动到第一个子元素 |
| ← | 移动到上一个兄弟元素 |
| → | 移动到下一个兄弟元素 |

### 发现页收集

| 按键 | 操作 |
|------|------|
| Enter | 完成收集 |

## 错误提示

选择器会自动检测潜在问题：
- **Shadow DOM**：元素在 Shadow DOM 内，选择器可能不生效
- **Iframe**：跨域限制可能影响选择
- **动态 Class**：自动生成的 class 名称可能不稳定
- **空选择器**：未选择有效元素
- **无匹配**：选择器返回零个元素

## 项目结构

```
src/                    # Chrome / Edge 版本 (MV3)
├── manifest.json          # 扩展配置
├── background.js          # Service Worker（点击图标打开侧边栏）
├── content/
│   ├── picker.js          # 元素选择器逻辑
│   └── picker.css         # 选择器样式
├── popup/
│   ├── index.html         # 侧边栏界面
│   ├── popup.js           # 侧边栏逻辑
│   └── popup.css          # 侧边栏样式
└── lib/
    └── selector-generator.js  # CSS 选择器生成算法

src-firefox/            # Firefox 版本 (MV2)
├── manifest.json          # 扩展配置
├── background.js          # 后台脚本
├── content/
│   ├── picker.js
│   └── picker.css
├── popup/
│   ├── index.html
│   ├── popup.js
│   └── popup.css
└── lib/
    └── selector-generator.js
```
