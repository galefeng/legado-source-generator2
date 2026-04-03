# Legado 书源生成器 Chrome 扩展

## TL;DR

> **Quick Summary**: 构建一个 Chrome 扩展，通过引导式点击页面元素，自动生成 Legado（阅读）发现页书源规则。用户依次点击列表容器→书名→作者→封面等字段，扩展自动生成 JSOUP 选择器并导出为 Legado JSON 格式。
> 
> **Deliverables**: 
> - Chrome Extension v3 (manifest.json + content script + popup)
> - 引导式元素拾取 UI（高亮覆盖层 + 侧边栏/弹窗表单）
> - CSS 选择器生成器（支持 root 相对选择器）
> - Legado JSON 导出（含必填字段校验）
> 
> **Estimated Effort**: Medium
> **Parallel Execution**: YES - 4 waves
> **Critical Path**: Manifest → Picker Overlay → Selector Generator → Field Workflow → Export

---

## Context

### Original Request
用户希望写一个 Chrome 插件，用户点击网页上的位置就能生成 Legado 书源。在 JSOUP 选择器插件的基础上做比较轻松。

### Interview Summary
**Key Discussions**:
- **交互方式**: 引导式分步标记，每次只获取一个规则（如列表规则），用户确认后点击下一个，可跳过可手动填写
- **技术栈**: 纯原生 JS，零依赖，Chrome Extension v3 兼容
- **功能范围**: 先跑通发现页规则，其他（搜索/详情/目录/正文）后续迭代
- **不做现有插件二次开发**: SelectorsHub 闭源，SelectorGadget 代码太老

**Research Findings**:
- **css-selector-generator** (npm, MIT, 591 stars): 支持 `root` 选项生成相对选择器，blacklist/whitelist 过滤自动生成的 class 名
- **Legado 发现页规则格式**: `ruleExplore` 包含 bookList, name, author, kind, wordCount, lastChapter, intro, coverUrl, bookUrl
- **必填字段**: bookList, name, bookUrl
- **选择器语法**: `@css:selector@content` 或 JSOUP Default `class.xxx@tag.yyy@text`

### Metis Review
**Identified Gaps** (addressed):
- **bookUrl 是链接选择器**: 需要提取 href 属性，不是 URL 本身 → 已在字段映射中标注
- **chrome.storage vs localStorage**: 必须用 chrome.storage 持久化状态 → 已采用
- **动态 class 名问题**: 网站可能使用随机生成的 class 名 → 通过 blacklist 过滤
- **Shadow DOM 支持**: 需要检测并提示 → 已加入错误处理
- **导出格式校验**: 必填字段缺失时阻止导出 → 已加入验证

---

## Work Objectives

### Core Objective
构建一个 Chrome 扩展，让用户在发现页上通过点击元素，引导式生成 Legado 书源的发现页规则（ruleExplore），导出为标准 JSON 格式。

### Concrete Deliverables
- `manifest.json` — Chrome Extension v3 配置
- `popup.html` / `popup.js` / `popup.css` — 扩展弹窗 UI
- `content.js` — 内容脚本（元素拾取、高亮、选择器生成）
- `picker.css` — 拾取模式覆盖层样式
- `selector-generator.js` — 轻量 CSS 选择器生成器
- `export.js` — Legado JSON 组装与导出

### Definition of Done
- [ ] 扩展安装后可在任意网页启动拾取模式
- [ ] 引导流程：bookList → name → author → ... → bookUrl，每步可跳过/手动填写
- [ ] 生成的选择器相对于 bookList 容器
- [ ] 导出的 JSON 可直接导入 Legado
- [ ] 必填字段校验通过

### Must Have
- 引导式分步标记流程
- 元素高亮 + 选择器实时预览
- 相对选择器生成（基于 bookList 容器）
- 必填字段校验（bookList, name, bookUrl）
- JSON 导出（复制到剪贴板 + 下载文件）
- 跳过/手动填写支持

### Must NOT Have (Guardrails)
- 不做搜索页/详情页/目录页/正文页规则
- 不做正则替换规则
- 不做 `<js></js>` 自定义脚本
- 不打包完整 css-selector-generator 库（实现轻量版）
- 不做自动分页检测
- 不做登录/认证处理
- 不做 Firefox/Edge 兼容

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed.

### Test Decision
- **Infrastructure exists**: NO
- **Automated tests**: None (Chrome 扩展 UI 交互测试成本高，用 Agent-Executed QA 替代)
- **Agent-Executed QA**: 每个任务包含具体 QA 场景

### QA Policy
- **Extension UI**: Chrome DevTools — 加载扩展、打开 popup、验证 DOM 结构
- **Content Script**: Playwright — 注入脚本、模拟点击、验证选择器生成
- **JSON Export**: Bash — 验证 JSON 格式、必填字段

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — foundation + scaffolding):
├── Task 1: 扩展骨架 + manifest.json [quick]
├── Task 2: Popup UI 布局 + 状态管理 [quick]
├── Task 3: 轻量选择器生成器 [quick]
└── Task 4: 拾取模式覆盖层 + 高亮 [quick]

Wave 2 (After Wave 1 — core logic):
├── Task 5: 元素拾取 + 选择器生成集成 [deep]
├── Task 6: 引导式字段工作流 [unspecified-high]
└── Task 7: 字段映射 + JSOUP 格式转换 [quick]

Wave 3 (After Wave 2 — export + polish):
├── Task 8: JSON 导出 + 校验 [quick]
├── Task 9: 错误处理 + 边界情况 [quick]
└── Task 10: UI 精修 + 键盘快捷键 [quick]

Wave FINAL (After ALL tasks — 4 parallel reviews):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high)
└── Task F4: Scope fidelity check (deep)

Critical Path: Task 1 → Task 2 → Task 6 → Task 7 → Task 8 → F1-F4
Parallel Speedup: ~60% faster than sequential
Max Concurrent: 4 (Wave 1)
```

### Dependency Matrix

| Task | Blocked By | Blocks |
|------|-----------|--------|
| T1 | — | T2, T4, T5 |
| T2 | T1 | T6, T8 |
| T3 | — | T5 |
| T4 | T1 | T5 |
| T5 | T1, T3, T4 | T6, T7 |
| T6 | T2, T5 | T7, T8 |
| T7 | T5, T6 | T8 |
| T8 | T2, T6, T7 | F1-F4 |
| T9 | T5, T6 | F1-F4 |
| T10 | T6, T8 | F1-F4 |

### Agent Dispatch Summary

- **Wave 1**: **4** — T1→`quick`, T2→`quick`, T3→`quick`, T4→`quick`
- **Wave 2**: **3** — T5→`deep`, T6→`unspecified-high`, T7→`quick`
- **Wave 3**: **3** — T8→`quick`, T9→`quick`, T10→`quick`
- **FINAL**: **4** — F1→`oracle`, F2→`unspecified-high`, F3→`unspecified-high`, F4→`deep`

---

## TODOs

- [x] 1. 扩展骨架 + manifest.json

  **What to do**:
  - 创建项目目录结构: `src/manifest.json`, `src/popup/`, `src/content/`, `src/lib/`
  - 编写 `manifest.json` (MV3): 声明 permissions (activeTab, scripting, storage), content_scripts (matches: ["<all_urls>"], js: ["content/picker.js"], css: ["content/picker.css"]), action (default_popup: "popup/index.html")
  - 创建 `popup/index.html` 基础骨架 (含 script 和 css 引用)
  - 创建 `content/picker.js` 空内容脚本入口
  - 创建 `content/picker.css` 空样式文件
  - 编写 `popup/popup.js` 空入口

  **Must NOT do**:
  - 不实现任何业务逻辑
  - 不添加 UI 组件

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 纯脚手架工作，文件创建 + 基础配置
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `chrome-devtools`: 不需要调试，只需创建文件

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3, 4)
  - **Blocks**: T2, T4, T5
  - **Blocked By**: None (can start immediately)

  **References**:
  - Chrome MV3 官方文档: `https://developer.chrome.com/docs/extensions/develop/concepts/manifest-3` — manifest.json 结构
  - `src/content/picker.js` — 内容脚本入口，后续所有拾取逻辑的基础
  - `popup/index.html` — 弹窗入口，后续 UI 的基础

  **Acceptance Criteria**:
  - [ ] `src/manifest.json` 存在且包含: manifest_version: 3, permissions: ["activeTab", "scripting", "storage"], content_scripts 配置, action 配置
  - [ ] `src/popup/index.html` 存在且引用 popup.js 和 popup.css
  - [ ] `src/content/picker.js` 存在（可为空）
  - [ ] `src/content/picker.css` 存在（可为空）
  - [ ] `src/popup/popup.js` 存在（可为空）

  **QA Scenarios**:

  ```
  Scenario: Manifest 格式校验
    Tool: Bash (node)
    Steps:
      1. node -e "const m = require('./src/manifest.json'); console.log(JSON.stringify(m, null, 2))"
      2. 验证输出包含 "manifest_version": 3
      3. 验证 permissions 包含 "activeTab", "scripting", "storage"
    Expected Result: JSON 解析成功，manifest_version 为 3，包含所需 permissions
    Evidence: .sisyphus/evidence/task-1-manifest-validation.txt
  ```

  **Commit**: YES (groups with 2, 3, 4)
  - Message: `feat(extension): initialize Chrome extension v3 scaffolding`
  - Files: `src/manifest.json`, `src/popup/index.html`, `src/content/picker.js`, `src/content/picker.css`, `src/popup/popup.js`

---

- [x] 2. Popup UI 布局 + 状态管理

  **What to do**:
  - 设计 Popup UI 布局: 标题栏 + 步骤指示器 + 当前步骤表单 + 操作按钮
  - 实现步骤状态管理: 使用 JS 对象维护 `{ currentStep, fields: {}, exploreUrl: '', bookSourceName: '', bookSourceGroup: '' }`
  - 步骤定义: `['bookList', 'name', 'author', 'kind', 'wordCount', 'lastChapter', 'intro', 'coverUrl', 'bookUrl']`
  - 每个步骤显示: 字段标签、当前选择器预览、[选择元素] 按钮、[跳过] 按钮、[手动输入] 文本框
  - 底部按钮: [上一步]、[下一步]、[导出 JSON]
  - 使用 `chrome.storage.local` 持久化当前状态（防止 popup 关闭丢失）
  - 步骤指示器显示进度（如 "3/9: 作者"）

  **Must NOT do**:
  - 不实现与 content script 的通信逻辑（Task 5 做）
  - 不实现选择器生成逻辑（Task 3 做）

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 纯 UI 布局 + 简单状态管理，无复杂逻辑
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3, 4)
  - **Blocks**: T6, T8
  - **Blocked By**: T1

  **References**:
  - Chrome Extension Popup 文档: `https://developer.chrome.com/docs/extensions/develop/ui/popup` — popup 设计规范
  - `src/popup/index.html` (T1) — 基础 HTML 骨架
  - `src/popup/popup.js` (T1) — JS 入口
  - `chrome.storage.local` API: `https://developer.chrome.com/docs/extensions/reference/api/storage` — 状态持久化

  **Acceptance Criteria**:
  - [ ] Popup 打开后显示步骤指示器（如 "0/9"）
  - [ ] 显示当前步骤字段名和 [选择元素]、[跳过] 按钮
  - [ ] 点击 [跳过] 前进到下一步，状态更新
  - [ ] 点击 [手动输入] 展开文本框，输入后保存
  - [ ] 关闭再打开 popup，状态从 chrome.storage 恢复
  - [ ] [上一步]/[下一步] 按钮正常工作，步骤指示器更新

  **QA Scenarios**:

  ```
  Scenario: Popup 初始渲染 + 状态持久化
    Tool: Chrome DevTools (evaluate_script)
    Preconditions: 扩展已加载到 Chrome
    Steps:
      1. 打开扩展 popup
      2. evaluate_script: document.querySelector('.step-indicator').textContent
      3. 验证显示 "0/9" 或 "1/9"
      4. 点击 [跳过] 按钮
      5. evaluate_script: document.querySelector('.step-indicator').textContent
      6. 验证步骤前进
      7. 关闭 popup，重新打开
      8. evaluate_script: document.querySelector('.step-indicator').textContent
      9. 验证状态已恢复
    Expected Result: 步骤指示器正确显示，状态持久化生效
    Evidence: .sisyphus/evidence/task-2-popup-state.txt

  Scenario: 手动输入字段
    Tool: Chrome DevTools (evaluate_script)
    Steps:
      1. 打开 popup
      2. 点击 [手动输入] 按钮
      3. evaluate_script: document.querySelector('.manual-input').style.display
      4. 验证文本框可见
      5. evaluate_script: const input = document.querySelector('.manual-input input'); input.value = '.test-class'; input.dispatchEvent(new Event('input'))
      6. 验证值已保存
    Expected Result: 手动输入框显示，输入值被保存
    Evidence: .sisyphus/evidence/task-2-manual-input.txt
  ```

  **Commit**: YES (groups with 1, 3, 4)
  - Message: `feat(extension): initialize Chrome extension v3 scaffolding`

---

- [x] 3. 轻量 CSS 选择器生成器

  **What to do**:
  - 实现轻量 `selector-generator.js`（~100-200 行），不依赖外部库
  - 核心函数: `getCssSelector(element, options)`
    - 支持 `options.root` — 从 root 元素开始向上查找，生成相对选择器
    - 支持 `options.selectors` — 优先级数组 `['id', 'class', 'tag', 'attribute', 'nthchild']`
    - 支持 `options.blacklist` — 忽略的 class 名（如随机生成的 `css-xxx`, `sc-xxx`）
  - 生成策略:
    1. 优先用 `#id`（如果存在且不在 blacklist）
    2. 其次用 `.class`（过滤 blacklist 中的自动生成的 class）
    3. 再用 `tag.class` 组合
    4. 最后用 `tag:nth-child(n)` 兜底
  - 相对选择器: 当指定 `root` 时，从 element 向上遍历到 root，生成 `root 内的相对路径`
  - 黑名单: 自动过滤 `css-*`, `sc-*`, `emotion-*`, `makeStyles-*`, `Mui*`, 纯数字 class

  **Must NOT do**:
  - 不实现 css-selector-generator 的全部功能
  - 不处理 Shadow DOM 内部选择器（仅检测并提示）

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 算法明确，纯 DOM 遍历逻辑，无外部依赖
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 4)
  - **Blocks**: T5
  - **Blocked By**: None

  **References**:
  - css-selector-generator 源码: `https://github.com/fczbkk/css-selector-generator` — 参考生成策略
  - JSOUP Selector 文档: `https://jsoup.org/apidocs/org/jsoup/select/Selector.html` — 确保生成的选择器 JSOUP 支持
  - W3C CSS Selectors: `https://www.w3.org/TR/selectors-4/` — CSS 选择器标准

  **Acceptance Criteria**:
  - [ ] `getCssSelector(el)` 返回有效 CSS 选择器字符串
  - [ ] `getCssSelector(el, { root: parent })` 返回相对于 parent 的选择器
  - [ ] 对 `<div id="book">` 返回 `"#book"`
  - [ ] 对 `<div class="title">` 返回 `".title"`
  - [ ] 对 `<div class="css-abc123 title">` 返回 `".title"`（过滤自动生成的 class）
  - [ ] 对无 class/id 的元素返回 `"tag:nth-child(n)"` 形式

  **QA Scenarios**:

  ```
  Scenario: 基础选择器生成 — ID
    Tool: Bash (node + jsdom)
    Steps:
      1. npm install --save-dev jsdom
      2. 创建测试脚本加载 selector-generator.js
      3. 模拟 DOM: <div id="book"><span class="title">书名</span></div>
      4. 调用 getCssSelector(document.querySelector('.title'))
      5. 验证返回包含 ".title"
    Expected Result: 返回 ".title"
    Evidence: .sisyphus/evidence/task-3-selector-id.txt

  Scenario: 相对选择器生成 (root 选项)
    Tool: Bash (node + jsdom)
    Steps:
      1. 模拟 DOM: <div class="list"><div class="item"><span class="title">书名</span></div></div>
      2. const root = document.querySelector('.item')
      3. const target = document.querySelector('.title')
      4. const selector = getCssSelector(target, { root })
      5. 验证 selector 为 ".title" 或 "span.title"（不包含 .list 或 .item）
    Expected Result: 返回相对于 .item 的选择器，不包含父级
    Evidence: .sisyphus/evidence/task-3-relative-selector.txt

  Scenario: 自动生成的 class 名过滤
    Tool: Bash (node + jsdom)
    Steps:
      1. 模拟 DOM: <div class="css-1a2b3c book-title"><span>书名</span></div>
      2. const el = document.querySelector('.css-1a2b3c')
      3. const selector = getCssSelector(el)
      4. 验证 selector 不包含 "css-1a2b3c"
    Expected Result: 返回基于 tag 或 nth-child 的选择器，不包含 css-xxx
    Evidence: .sisyphus/evidence/task-3-blacklist-filter.txt
  ```

  **Commit**: YES (groups with 1, 2, 4)
  - Message: `feat(extension): initialize Chrome extension v3 scaffolding`

---

- [x] 4. 拾取模式覆盖层 + 高亮

  **What to do**:
  - 创建 `picker.css`: 定义拾取模式覆盖层样式
    - 鼠标悬停高亮: `outline: 2px solid #4CAF50; outline-offset: 2px;`
    - 已选中元素: `outline: 2px solid #2196F3;`
    - 不可选元素: `outline: 2px dashed #999; opacity: 0.5;`
  - 创建 `picker-overlay` div: 固定在页面右上角的浮动面板，显示当前步骤提示
  - 浮动面板内容: "当前步骤: 选择 [书名] 元素" + [退出拾取] 按钮
  - 键盘快捷键: `Escape` 退出拾取模式
  - 鼠标事件: `mouseover` 高亮元素，`mouseout` 移除高亮，`click` 选中元素
  - 阻止点击事件冒泡（不影响页面正常交互，仅在拾取模式下拦截）
  - 浮动面板使用 Shadow DOM 隔离样式（避免与页面样式冲突）

  **Must NOT do**:
  - 不实现选择器生成逻辑
  - 不实现与 popup 的通信

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 纯 CSS + DOM 操作，逻辑简单
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3)
  - **Blocks**: T5
  - **Blocked By**: T1

  **References**:
  - `src/content/picker.css` (T1) — 空样式文件
  - `src/content/picker.js` (T1) — 内容脚本入口
  - Chrome Content Script 文档: `https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts` — DOM 操作权限

  **Acceptance Criteria**:
  - [ ] 调用 `enterPickerMode()` 后，页面进入拾取模式
  - [ ] 鼠标悬停在元素上时显示绿色 outline
  - [ ] 点击元素后显示蓝色 outline
  - [ ] 页面右上角显示浮动面板，提示当前步骤
  - [ ] 按 Escape 键退出拾取模式，清除所有高亮
  - [ ] 浮动面板样式不受页面 CSS 影响

  **QA Scenarios**:

  ```
  Scenario: 拾取模式激活 + 高亮
    Tool: Playwright
    Preconditions: 打开测试页面（如 https://www.qidian.com/rank/yuepiao）
    Steps:
      1. 注入 picker.js 和 picker.css
      2. 调用 window.enterPickerMode()
      3. 移动鼠标到第一个书籍元素上
      4. 验证该元素有 outline 样式
      5. 截图
    Expected Result: 元素被绿色 outline 高亮
    Evidence: .sisyphus/evidence/task-4-picker-highlight.png

  Scenario: Escape 退出拾取模式
    Tool: Playwright
    Steps:
      1. 进入拾取模式
      2. 高亮一个元素
      3. 按 Escape 键
      4. 验证所有 outline 样式已移除
      5. 验证浮动面板已移除
    Expected Result: 页面恢复正常，无残留样式
    Evidence: .sisyphus/evidence/task-4-escape-exit.png
  ```

  **Commit**: YES (groups with 1, 2, 3)
  - Message: `feat(extension): initialize Chrome extension v3 scaffolding`

---

- [x] 5. 元素拾取 + 选择器生成集成

  **What to do**:
  - 在 `picker.js` 中实现完整的元素拾取流程:
    1. 监听 `chrome.runtime.onMessage` 接收 popup 指令 (`startPicker`, `stopPicker`, `getCurrentStep`)
    2. `startPicker` → 注入覆盖层 + 绑定鼠标事件
    3. `mouseover` → 高亮目标元素 + 在浮动面板显示元素信息（tag, class, id, 文本预览）
    4. `click` → 调用 `getCssSelector(clickedElement, { root: bookListElement })` 生成选择器
    5. 通过 `chrome.runtime.sendMessage` 将选择器发送回 popup
  - 智能父级检测: 如果已选择 bookList 容器，自动将其设为 root 生成相对选择器
  - 选择器预览: 在浮动面板中实时显示生成的选择器
  - 选中反馈: 点击后短暂高亮（蓝色 1s），然后恢复
  - 多元素检测: 如果选择器匹配多个元素，在浮动面板提示 "匹配 N 个元素"

  **Must NOT do**:
  - 不实现字段工作流（Task 6 做）
  - 不实现 JSOUP 格式转换（Task 7 做）

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: 涉及 content script 与 popup 的跨上下文通信、事件管理、选择器集成，需要仔细处理边界情况
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (with Tasks 6, 7)
  - **Blocks**: T6, T7
  - **Blocked By**: T1, T3, T4

  **References**:
  - `src/lib/selector-generator.js` (T3) — getCssSelector 函数
  - `src/content/picker.js` (T1, T4) — 拾取模式基础
  - Chrome Message Passing: `https://developer.chrome.com/docs/extensions/develop/concepts/messaging` — content script ↔ popup 通信
  - `src/manifest.json` (T1) — content_scripts 配置

  **Acceptance Criteria**:
  - [ ] popup 发送 `startPicker` 消息后，页面进入拾取模式
  - [ ] 鼠标悬停时浮动面板显示元素信息
  - [ ] 点击元素后，选择器发送到 popup
  - [ ] 已选 bookList 后，后续选择器相对于 bookList 生成
  - [ ] 选择器匹配多个元素时显示警告

  **QA Scenarios**:

  ```
  Scenario: 完整拾取流程 — 点击元素获取选择器
    Tool: Playwright
    Preconditions: 打开测试页面，扩展已加载
    Steps:
      1. 打开扩展 popup，点击 [选择元素]
      2. 验证页面进入拾取模式（覆盖层出现）
      3. 移动鼠标到第一个书籍标题元素
      4. 验证浮动面板显示元素信息
      5. 点击该元素
      6. 验证 popup 中显示生成的选择器
      7. 验证拾取模式自动退出
    Expected Result: 选择器正确生成并显示在 popup 中
    Evidence: .sisyphus/evidence/task-5-picker-flow.png

  Scenario: 相对选择器生成（基于 bookList）
    Tool: Playwright
    Steps:
      1. 先选择 bookList 容器（如 div.book-list）
      2. 验证选择器为 ".book-list" 或类似
      3. 再选择容器内的书名元素
      4. 验证生成的选择器不包含 bookList 的父级
      5. 验证选择器为 ".title" 或 "a.title" 而非 "body > ... > .title"
    Expected Result: 选择器相对于 bookList 容器生成
    Evidence: .sisyphus/evidence/task-5-relative-selector.txt

  Scenario: 多元素匹配警告
    Tool: Playwright
    Steps:
      1. 选择一个通用元素（如 div 或 span）
      2. 验证浮动面板显示 "匹配 N 个元素" 警告
      3. 验证 popup 中显示警告信息
    Expected Result: 用户收到选择器不够精确的提示
    Evidence: .sisyphus/evidence/task-5-multi-match-warning.txt
  ```

  **Commit**: YES (groups with 6, 7)
  - Message: `feat(picker): implement element picking with CSS selector generation`

---

- [x] 6. 引导式字段工作流

  **What to do**:
  - 在 popup 中实现完整的引导式字段工作流:
    - 字段顺序: `bookList → name → author → kind → wordCount → lastChapter → intro → coverUrl → bookUrl`
    - 每个字段状态: `pending` → `picking` → `selected` / `skipped` / `manual`
  - 步骤导航:
    - [选择元素] 按钮 → 发送 `startPicker` 消息到 content script，等待选择器返回
    - [跳过] 按钮 → 标记为 skipped，前进到下一步
    - [手动输入] → 展开文本框，用户输入选择器
  - 字段特殊处理:
    - **bookList**: 必须首先选择，选择后存储为 root 上下文
    - **bookUrl**: 提示用户点击链接元素（`<a>` 标签），自动提取 href
    - **coverUrl**: 提示用户点击 `<img>` 标签，自动提取 src
  - 进度保存: 每步操作后自动保存到 `chrome.storage.local`
  - 步骤指示器: 可视化显示已完成/当前/待完成的步骤
  - 必填字段标记: bookList, name, bookUrl 标红星，跳过时弹出确认

  **Must NOT do**:
  - 不实现搜索页/详情页等其他规则类型
  - 不实现 exploreUrl 的自动生成（用户手动输入）

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 状态机设计 + 多步骤 UI 交互 + 字段特殊逻辑，复杂度中高
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (with Tasks 5, 7)
  - **Blocks**: T7, T8
  - **Blocked By**: T2, T5

  **References**:
  - `src/popup/popup.js` (T2) — Popup UI 基础
  - `src/manifest.json` (T1) — permissions 配置
  - Legado 规则文档: `https://mgz0227.github.io/The-tutorial-of-Legado/Rule/source.html` — 字段说明
  - Chrome Storage API: `https://developer.chrome.com/docs/extensions/reference/api/storage`

  **Acceptance Criteria**:
  - [ ] 打开 popup 显示步骤 1/9 (bookList)
  - [ ] 点击 [选择元素] 后进入拾取模式
  - [ ] 选择器返回后自动前进到下一步
  - [ ] 点击 [跳过] 跳过当前字段
  - [ ] bookList 未选择时，后续字段的选择器不生成相对路径
  - [ ] 必填字段跳过时弹出确认对话框
  - [ ] 所有步骤完成后 [导出 JSON] 按钮可用

  **QA Scenarios**:

  ```
  Scenario: 完整引导流程 — 从 bookList 到 bookUrl
    Tool: Playwright
    Preconditions: 扩展已加载，打开测试页面
    Steps:
      1. 打开扩展 popup
      2. 验证显示 "1/9: 书籍列表容器"
      3. 点击 [选择元素]
      4. 在页面上点击书籍列表容器
      5. 验证自动前进到 "2/9: 书名"
      6. 点击 [跳过] 跳过作者
      7. 验证前进到 "3/9" 或 "4/9"
      8. 继续直到所有步骤完成
      9. 验证 [导出 JSON] 按钮变为可用
    Expected Result: 引导流程顺畅，步骤正确推进
    Evidence: .sisyphus/evidence/task-6-guided-workflow.png

  Scenario: 必填字段跳过确认
    Tool: Playwright
    Steps:
      1. 在 bookList 步骤点击 [跳过]
      2. 验证弹出确认对话框 "bookList 是必填字段，确定跳过？"
      3. 点击 [确认]
      4. 验证字段标记为 skipped
      5. 验证步骤前进
    Expected Result: 必填字段跳过时需要确认
    Evidence: .sisyphus/evidence/task-6-required-confirm.png

  Scenario: bookUrl 自动提取 href
    Tool: Playwright
    Steps:
      1. 到达 bookUrl 步骤
      2. 点击 [选择元素]
      3. 在页面上点击一个 <a> 链接
      4. 验证 popup 中显示的选择器包含 "@href" 或提示提取 href
    Expected Result: bookUrl 字段自动处理链接提取
    Evidence: .sisyphus/evidence/task-6-bookurl-href.txt
  ```

  **Commit**: YES (groups with 5, 7)
  - Message: `feat(picker): implement element picking with CSS selector generation`

---

- [x] 7. 字段映射 + JSOUP 格式转换

  **What to do**:
  - 实现 CSS 选择器到 Legado JSOUP 格式的转换:
    - 输入: CSS 选择器字符串 (如 `.title`, `a.book-link`, `img.cover`)
    - 输出: Legado 规则字符串 (如 `@css:.title@text`, `@css:a.book-link@href`, `@css:img.cover@src`)
  - 字段默认内容类型映射:
    - `name` → `@css:{selector}@text`
    - `author` → `@css:{selector}@text`
    - `kind` → `@css:{selector}@text`
    - `wordCount` → `@css:{selector}@text`
    - `lastChapter` → `@css:{selector}@text`
    - `intro` → `@css:{selector}@text` (或 `@html` 如果包含 HTML)
    - `coverUrl` → `@css:{selector}@src` (img) 或 `@css:{selector}@style` (background-image)
    - `bookUrl` → `@css:{selector}@href` (a 标签)
    - `bookList` → `@css:{selector}` (不需要 @content)
  - bookList 选择器特殊处理: 不加 `@css:` 前缀，直接使用 CSS 选择器
  - 支持用户手动修改生成的规则
  - 实时预览: 在 popup 中显示最终 Legado 规则格式

  **Must NOT do**:
  - 不支持 JSOUP Default 语法自动生成（仅支持 @css: 前缀）
  - 不支持正则替换

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 纯字符串转换逻辑，规则明确
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (with Tasks 5, 6)
  - **Blocks**: T8
  - **Blocked By**: T5, T6

  **References**:
  - Legado JSOUP 语法: `https://mgz0227.github.io/The-tutorial-of-Legado/Rule/source.html` — @css: 前缀和 @content 用法
  - `src/popup/popup.js` (T2, T6) — 字段状态管理
  - Try JSOUP: `https://try.jsoup.org/` — 在线测试选择器

  **Acceptance Criteria**:
  - [ ] `toLegadoRule('.title', 'name')` 返回 `"@css:.title@text"`
  - [ ] `toLegadoRule('a.link', 'bookUrl')` 返回 `"@css:a.link@href"`
  - [ ] `toLegadoRule('img.cover', 'coverUrl')` 返回 `"@css:img.cover@src"`
  - [ ] `toLegadoRule('div.item', 'bookList')` 返回 `"@css:div.item"`
  - [ ] 用户可手动修改转换后的规则

  **QA Scenarios**:

  ```
  Scenario: CSS 到 JSOUP 格式转换
    Tool: Bash (node)
    Steps:
      1. 加载 toLegadoRule 函数
      2. 测试: toLegadoRule('.book-title', 'name') → 验证返回 "@css:.book-title@text"
      3. 测试: toLegadoRule('a.detail-link', 'bookUrl') → 验证返回 "@css:a.detail-link@href"
      4. 测试: toLegadoRule('img.book-cover', 'coverUrl') → 验证返回 "@css:img.book-cover@src"
      5. 测试: toLegadoRule('.book-item', 'bookList') → 验证返回 "@css:.book-item"
    Expected Result: 所有转换结果正确
    Evidence: .sisyphus/evidence/task-7-format-conversion.txt

  Scenario: 手动修改规则
    Tool: Playwright
    Steps:
      1. 完成一个字段的选择
      2. 验证 popup 中显示 "@css:.xxx@text"
      3. 点击 [手动输入] 展开文本框
      4. 修改为 "@css:.xxx@ownText"
      5. 验证修改已保存
    Expected Result: 用户可手动覆盖自动生成的规则
    Evidence: .sisyphus/evidence/task-7-manual-override.txt
  ```

  **Commit**: YES (groups with 5, 6)
  - Message: `feat(picker): implement element picking with CSS selector generation`

---

- [x] 8. JSON 导出 + 校验

  **What to do**:
  - 实现 Legado JSON 组装函数:
    - 输入: 字段映射对象 `{ bookList, name, author, ... }` + 基本信息 `{ bookSourceName, bookSourceUrl, exploreUrl }`
    - 输出: 完整的 Legado 书源 JSON 对象
  - JSON 结构 (完整 Legado 书源格式):
    ```json
    {
      "ruleSearch": {},
      "ruleBookInfo": {},
      "ruleToc": {},
      "ruleContent": {},
      "ruleExplore": {
        "bookList": "@css:.book-item",
        "name": "@css:.title@text",
        "author": "@css:.author@text",
        "kind": "@css:.kind@text",
        "wordCount": "@css:.wordCount@text",
        "lastChapter": "@css:.lastChapter@text",
        "intro": "@css:.intro@text",
        "coverUrl": "@css:.cover@src",
        "bookUrl": "@css:a@href"
      },
      "bookSourceType": 0,
      "bookSourceUrl": "http://www.example.com",
      "bookSourceName": "示例文本源",
      "exploreUrl": "分类名::http://www.example.com/page/{{page}}"
    }
    ```
    - 顶层必须包含: ruleSearch, ruleBookInfo, ruleToc, ruleContent (空对象 {}), ruleExplore, bookSourceType, bookSourceUrl, bookSourceName, exploreUrl
    - ruleExplore 中已填写的字段填入选择器规则，未填写的字段不包含在输出中
  - 必填字段校验: bookList, name, bookUrl 不能为空
  - 导出方式:
    - [复制到剪贴板] — 使用 `navigator.clipboard.writeText()`
    - [下载 JSON] — 使用 Blob + URL.createObjectURL + 模拟点击
  - 导出前预览: 显示格式化 JSON 预览
  - 基本信息收集: 在导出前弹出表单让用户填写 bookSourceName, bookSourceUrl, exploreUrl

  **Must NOT do**:
  - 不自动生成 exploreUrl（用户手动输入）
  - ruleSearch/ruleBookInfo/ruleToc/ruleContent 输出为空对象 `{}`，不填充内容

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: JSON 组装 + 基础校验，逻辑简单
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 9, 10)
  - **Blocks**: F1-F4
  - **Blocked By**: T2, T6, T7

  **References**:
  - Legado 书源 JSON 格式: `https://mgz0227.github.io/The-tutorial-of-Legado/Rule/source.html` — 完整 JSON 结构
  - `src/popup/popup.js` (T2, T6) — 字段状态
  - Clipboard API: `https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText`

  **Acceptance Criteria**:
  - [ ] 所有必填字段有值时，[导出 JSON] 按钮可用
  - [ ] 点击导出显示 JSON 预览
  - [ ] [复制到剪贴板] 功能正常
  - [ ] [下载 JSON] 生成可下载文件
  - [ ] 必填字段缺失时弹出错误提示

  **QA Scenarios**:

  ```
  Scenario: 完整导出流程
    Tool: Playwright
    Preconditions: 已完成所有字段选择
    Steps:
      1. 点击 [导出 JSON] 按钮
      2. 验证弹出 JSON 预览对话框
      3. 验证 JSON 包含顶层字段: ruleSearch, ruleBookInfo, ruleToc, ruleContent, ruleExplore, bookSourceType, bookSourceUrl, bookSourceName, exploreUrl
      4. 验证 ruleSearch/ruleBookInfo/ruleToc/ruleContent 为空对象 {}
      5. 验证 ruleExplore 包含所有已填写字段
      6. 点击 [复制到剪贴板]
      7. 验证剪贴板内容为有效 JSON
    Expected Result: JSON 正确生成，包含完整 Legado 书源结构
    Evidence: .sisyphus/evidence/task-8-export-flow.txt

  Scenario: 必填字段缺失阻止导出
    Tool: Playwright
    Steps:
      1. 只填写 bookList，跳过 name 和 bookUrl
      2. 点击 [导出 JSON]
      3. 验证弹出错误提示 "缺少必填字段: name, bookUrl"
      4. 验证导出被阻止
    Expected Result: 必填字段缺失时阻止导出并提示
    Evidence: .sisyphus/evidence/task-8-validation-error.txt

  Scenario: JSON 格式校验
    Tool: Bash (node)
    Steps:
      1. 生成示例 JSON 输出
      2. node -e "const s = JSON.parse(require('fs').readFileSync('export.json','utf8')); console.assert(s.ruleSearch !== undefined); console.assert(s.ruleBookInfo !== undefined); console.assert(s.ruleToc !== undefined); console.assert(s.ruleContent !== undefined); console.assert(s.ruleExplore !== undefined); console.assert(s.bookSourceType === 0); console.log('Source OK')"
      3. 验证解析成功
      4. 验证包含所有必需顶层字段（ruleSearch, ruleBookInfo, ruleToc, ruleContent, ruleExplore, bookSourceType, bookSourceUrl, bookSourceName, exploreUrl）
    Expected Result: JSON 格式正确，符合 Legado 完整书源结构
    Evidence: .sisyphus/evidence/task-8-json-validation.txt
  ```

  **Commit**: YES (groups with 9, 10)
  - Message: `feat(export): add JSON export with validation and clipboard support`

---

- [x] 9. 错误处理 + 边界情况

  **What to do**:
  - 实现以下错误处理和边界情况:
    - **Shadow DOM 检测**: 检测页面是否有 Shadow Root，如有则提示 "检测到 Shadow DOM，部分元素可能无法选择"
    - **跨域 iframe**: 检测元素是否在跨域 iframe 内，如是则提示 "无法选择跨域 iframe 内的元素"
    - **动态 class 名警告**: 如果生成的选择器包含疑似自动生成的 class 名，提示 "选择器可能不够稳定"
    - **空选择器处理**: 用户点击空白区域时提示 "请选择一个有效元素"
    - **页面刷新检测**: 监听页面刷新事件，刷新后自动退出拾取模式
    - **Popup 关闭恢复**: popup 关闭时自动停止拾取模式（通过 content script 心跳检测）
    - **无匹配元素**: 如果选择器在当前页面找不到任何元素，提示 "选择器无效"
  - 所有错误提示使用统一的 toast 通知组件

  **Must NOT do**:
  - 不处理登录/认证相关错误
  - 不处理 JavaScript 渲染的页面（SPA）

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 错误处理逻辑，每个场景独立且简单
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 8, 10)
  - **Blocks**: F1-F4
  - **Blocked By**: T5, T6

  **References**:
  - `src/content/picker.js` (T5) — 拾取模式主逻辑
  - `src/popup/popup.js` (T6) — 弹窗状态管理
  - Shadow DOM API: `https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM`

  **Acceptance Criteria**:
  - [ ] Shadow DOM 页面显示警告
  - [ ] 点击空白区域显示提示
  - [ ] popup 关闭后拾取模式自动退出
  - [ ] 所有错误使用统一 toast 通知

  **QA Scenarios**:

  ```
  Scenario: Shadow DOM 警告
    Tool: Playwright
    Steps:
      1. 打开包含 Shadow DOM 的测试页面
      2. 启动拾取模式
      3. 验证显示 Shadow DOM 警告
    Expected Result: 用户收到 Shadow DOM 警告提示
    Evidence: .sisyphus/evidence/task-9-shadow-dom-warning.txt

  Scenario: Popup 关闭后拾取模式退出
    Tool: Playwright
    Steps:
      1. 打开 popup，进入拾取模式
      2. 关闭 popup
      3. 等待 2 秒
      4. 验证页面拾取模式已退出（覆盖层移除）
    Expected Result: popup 关闭后自动退出拾取模式
    Evidence: .sisyphus/evidence/task-9-popup-close-exit.txt
  ```

  **Commit**: YES (groups with 8, 10)
  - Message: `feat(error-handling): add error handling and edge case support`

---

- [x] 10. UI 精修 + 键盘快捷键

  **What to do**:
  - 精修 Popup UI:
    - 使用 Legado 风格配色（深色主题或简洁浅色）
    - 步骤指示器使用进度条 + 圆点标记
    - 字段卡片: 已完成的显示绿色勾选，跳过的显示灰色，当前的显示蓝色高亮
    - 响应式布局适配不同 popup 宽度
  - 键盘快捷键:
    - `Escape` — 退出拾取模式 / 关闭弹窗
    - `Enter` — 确认当前操作 / 前进到下一步
    - `Ctrl+S` — 保存当前进度
  - 浮动面板精修:
    - 毛玻璃效果 (backdrop-filter: blur)
    - 平滑过渡动画
    - 元素信息 tooltip 显示在鼠标附近
  - 添加扩展图标（简单的书籍/选择器图标）
  - 添加 README: 使用说明、安装步骤、已知限制

  **Must NOT do**:
  - 不做复杂的动画效果
  - 不做多语言支持（仅中文）

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 纯 UI 美化和快捷键绑定
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 8, 9)
  - **Blocks**: F1-F4
  - **Blocked By**: T6, T8

  **References**:
  - `src/popup/popup.css` — Popup 样式
  - `src/content/picker.css` (T4) — 拾取覆盖层样式
  - Chrome Commands API: `https://developer.chrome.com/docs/extensions/reference/api/commands`

  **Acceptance Criteria**:
  - [ ] Popup UI 美观，步骤指示器清晰
  - [ ] 键盘快捷键正常工作
  - [ ] 浮动面板有毛玻璃效果和过渡动画
  - [ ] README 包含安装和使用说明

  **QA Scenarios**:

  ```
  Scenario: 键盘快捷键测试
    Tool: Playwright
    Steps:
      1. 打开 popup
      2. 按 Enter 键
      3. 验证前进到下一步
      4. 进入拾取模式
      5. 按 Escape 键
      6. 验证拾取模式退出
    Expected Result: 键盘快捷键响应正确
    Evidence: .sisyphus/evidence/task-10-keyboard-shortcuts.txt

  Scenario: UI 视觉检查
    Tool: Playwright (screenshot)
    Steps:
      1. 打开 popup，完成 2-3 个步骤
      2. 截图
      3. 验证步骤指示器、字段卡片、按钮样式均正常
    Expected Result: UI 美观一致
    Evidence: .sisyphus/evidence/task-10-ui-screenshot.png
  ```

  **Commit**: YES (groups with 8, 9)
  - Message: `feat(ui): polish UI, add keyboard shortcuts and README`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
>
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**
> **Never mark F1-F4 as checked before getting user's okay.** Rejection or user feedback -> fix -> re-run -> present again -> wait for okay.

- [x] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [x] F2. **Code Quality Review** — `unspecified-high`
- [x] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill if UI)
- [x] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination: Task N touching Task M's files. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **Wave 1**: `feat(extension): initialize Chrome extension v3 scaffolding`
  - manifest.json, popup/index.html, popup/popup.js, content/picker.js, content/picker.css, lib/selector-generator.js
- **Wave 2**: `feat(picker): implement element picking with CSS selector generation`
  - content/picker.js (full), popup/popup.js (workflow), lib/selector-generator.js (integration)
- **Wave 3**: `feat(export): add JSON export with validation and clipboard support`
  - popup/popup.js (export), popup/export.js, content/picker.css (polish), README.md

---

## Success Criteria

### Verification Commands
```bash
# Load extension in Chrome
chrome --load-extension=./src

# Validate manifest
node -e "const m = require('./src/manifest.json'); console.assert(m.manifest_version === 3); console.log('Manifest OK')"

# Validate exported JSON
node -e "const s = JSON.parse(require('fs').readFileSync('export.json','utf8')); console.assert(s.ruleExplore.bookList); console.log('Source OK')"
```

### Final Checklist
- [ ] 扩展可加载到 Chrome 并正常运行
- [ ] 引导式字段工作流完整（bookList → name → ... → bookUrl）
- [ ] 选择器相对于 bookList 容器生成
- [ ] 导出的 JSON 可直接导入 Legado
- [ ] 必填字段校验生效
- [ ] 无 "Must NOT Have" 中的禁止项
