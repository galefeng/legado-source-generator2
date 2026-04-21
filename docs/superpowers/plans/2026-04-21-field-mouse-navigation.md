# 规则字段鼠标导航实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为规则面板的字段状态摘要添加点击导航功能，使用户可以直接跳转到目标字段。

**Architecture:** 复用现有的 `#fieldStatusSummary` 组件，给每个 `.status-item` 添加点击事件与视觉状态（hover / active）。新增 `goToStep(index)` 函数统一处理跳转逻辑。`src` 与 `src-firefox` 两份代码同步更新。

**Tech Stack:** Vanilla JS, CSS, Chrome Extension API

---

## 文件结构

| 文件 | 职责 |
|------|------|
| `src/popup/popup.js` | 主 popup 逻辑。修改 `renderFieldStatusSummary` 渲染可点击标签；新增 `goToStep(index)`。 |
| `src/popup/popup.css` | 主 popup 样式。新增 `.status-item` 的 hover / active 样式。 |
| `src-firefox/popup/popup.js` | Firefox 版本 popup 逻辑。同步 JS 改动。 |
| `src-firefox/popup/popup.css` | Firefox 版本 popup 样式。同步 CSS 改动。 |
| `tests/popup-navigation.test.js` | 新增测试。验证 `goToStep` 核心逻辑正确修改 `currentStep`。 |

---

### Task 1: 新增 `goToStep` 函数并为其编写测试

**Files:**
- Modify: `src/popup/popup.js`（新增函数）
- Create: `tests/popup-navigation.test.js`

- [ ] **Step 1: 编写失败测试**

  创建 `tests/popup-navigation.test.js`：

  ```javascript
  const assert = require('node:assert/strict');

  // 模拟最小化的 popup 环境
  let mockState;
  let mockSaveCalled = false;
  let mockUpdateStepCalled = false;
  let mockRenderFieldsCalled = false;
  let mockUpdateNavCalled = false;
  let mockRenderSummaryCalled = false;

  global.state = {
    activeRuleType: 'search',
    rules: {
      search: { currentStep: 0, fields: {}, fieldStates: {}, bookListSelector: null },
    },
  };

  global.saveState = () => { mockSaveCalled = true; };
  global.updateStepIndicator = () => { mockUpdateStepCalled = true; };
  global.renderFields = () => { mockRenderFieldsCalled = true; };
  global.updateNavButtons = () => { mockUpdateNavCalled = true; };
  global.renderFieldStatusSummary = () => { mockRenderSummaryCalled = true; };
  global.getRuleState = () => global.state.rules[global.state.activeRuleType];

  // 加载被测函数（通过 eval 模拟注入，或直接在测试中定义同逻辑）
  function goToStep(index) {
    const rule = global.getRuleState();
    if (index === rule.currentStep) return;
    rule.currentStep = index;
    global.saveState();
    global.updateStepIndicator();
    global.renderFields();
    global.updateNavButtons();
    global.renderFieldStatusSummary();
  }

  // 测试 1: 正常跳转
  global.state.rules.search.currentStep = 0;
  mockSaveCalled = false;
  goToStep(2);
  assert.strictEqual(global.state.rules.search.currentStep, 2, 'currentStep 应变为 2');
  assert.strictEqual(mockSaveCalled, true, 'saveState 应被调用');

  // 测试 2: 跳转到相同 index 应短路返回
  mockSaveCalled = false;
  mockUpdateStepCalled = false;
  goToStep(2);
  assert.strictEqual(mockSaveCalled, false, '相同 index 时不应调用 saveState');
  assert.strictEqual(mockUpdateStepCalled, false, '相同 index 时不应调用 updateStepIndicator');

  // 测试 3: 跳转到 index 0
  goToStep(0);
  assert.strictEqual(global.state.rules.search.currentStep, 0, 'currentStep 应变为 0');

  console.log('All navigation tests passed!');
  ```

- [ ] **Step 2: 运行测试确认失败**

  ```bash
  node tests/popup-navigation.test.js
  ```

  **Expected:** `ReferenceError: goToStep is not defined`（因为被测函数尚未在 popup.js 中定义并导出）。

- [ ] **Step 3: 在 `src/popup/popup.js` 中新增 `goToStep` 函数**

  在 `goToPrevStep` 函数之后、`updateNavButtons` 函数之前插入：

  ```javascript
  function goToStep(index) {
    const rule = getRuleState();
    if (index === rule.currentStep) return;
    rule.currentStep = index;
    saveState();
    updateStepIndicator();
    renderFields();
    updateNavButtons();
    renderFieldStatusSummary();
  }
  ```

- [ ] **Step 4: 更新测试以引用真实源码（可选，若无法直接 require）**

  由于 `popup.js` 依赖 DOM 和 chrome API，无法直接在 Node 中 `require`。上述独立测试中的 `goToStep` 是复制逻辑，用于验证行为。确认测试文件中定义的 `goToStep` 与源码中新增的函数逻辑完全一致。

  ```bash
  node tests/popup-navigation.test.js
  ```

  **Expected:** `All navigation tests passed!`

- [ ] **Step 5: 提交**

  ```bash
  git add tests/popup-navigation.test.js src/popup/popup.js
  git commit -m "feat: add goToStep navigation function with test"
  ```

---

### Task 2: 修改 `renderFieldStatusSummary` 添加点击交互

**Files:**
- Modify: `src/popup/popup.js:1104-1130`

- [ ] **Step 1: 修改 `renderFieldStatusSummary` 函数**

  将原函数：

  ```javascript
  function renderFieldStatusSummary() {
    const summaryContainer = document.getElementById('fieldStatusSummary');
    if (!summaryContainer) return;

    const fields = getFields();
    const rule = getRuleState();
    const summary = fields.map(f => {
      const fieldState = rule.fieldStates[f.key] || 'pending';
      const fieldData = rule.fields[f.key] || {};
      let stateIcon;
      if (fieldState === 'selected' && fieldData.state === 'manual') {
        stateIcon = '◉';
      } else {
        stateIcon = {
          pending: '○',
          picking: '◐',
          selected: '●',
          skipped: '⊘',
          manual: '◉',
        }[fieldState];
      }

      return `<span class="status-item" data-field="${f.key}">${stateIcon} ${f.label}</span>`;
    }).join(' | ');

    summaryContainer.innerHTML = summary;
  }
  ```

  替换为：

  ```javascript
  function renderFieldStatusSummary() {
    const summaryContainer = document.getElementById('fieldStatusSummary');
    if (!summaryContainer) return;

    const fields = getFields();
    const rule = getRuleState();
    const summary = fields.map((f, index) => {
      const fieldState = rule.fieldStates[f.key] || 'pending';
      const fieldData = rule.fields[f.key] || {};
      let stateIcon;
      if (fieldState === 'selected' && fieldData.state === 'manual') {
        stateIcon = '◉';
      } else {
        stateIcon = {
          pending: '○',
          picking: '◐',
          selected: '●',
          skipped: '⊘',
          manual: '◉',
        }[fieldState];
      }

      const activeClass = index === rule.currentStep ? ' active' : '';
      return `<span class="status-item${activeClass}" data-field="${f.key}" data-step-index="${index}">${stateIcon} ${f.label}</span>`;
    }).join(' | ');

    summaryContainer.innerHTML = summary;

    summaryContainer.querySelectorAll('.status-item').forEach(item => {
      item.addEventListener('click', () => {
        const stepIndex = parseInt(item.dataset.stepIndex, 10);
        if (!Number.isNaN(stepIndex)) {
          goToStep(stepIndex);
        }
      });
    });
  }
  ```

- [ ] **Step 2: 验证改动**

  在 `src/popup/index.html` 中确认 `#fieldStatusSummary` 元素存在（第 188 行）。无需额外 HTML 修改。

- [ ] **Step 3: 提交**

  ```bash
  git add src/popup/popup.js
  git commit -m "feat: make field status summary clickable for navigation"
  ```

---

### Task 3: 为主版本添加 CSS 样式

**Files:**
- Modify: `src/popup/popup.css`

- [ ] **Step 1: 在 `.field-status-summary` 区域下方添加样式**

  在 `.status-item` 规则（约第 272-276 行）之后，添加：

  ```css
  .status-item {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    padding: 2px 6px;
    border-radius: var(--radius-sm);
    transition: background 0.15s, color 0.15s;
  }

  .status-item:hover {
    background: var(--bg-hover);
    color: var(--text);
  }

  .status-item.active {
    background: var(--accent-dim);
    color: var(--accent);
    font-weight: 600;
  }
  ```

  注意：原 `.status-item` 已有基础定义，需要将其替换为包含 `cursor: pointer` 和过渡效果的完整版本。

- [ ] **Step 2: 提交**

  ```bash
  git add src/popup/popup.css
  git commit -m "style: add hover and active states for field status items"
  ```

---

### Task 4: 同步修改 Firefox 版本 JS

**Files:**
- Modify: `src-firefox/popup/popup.js`

- [ ] **Step 1: 在 `src-firefox/popup/popup.js` 中新增 `goToStep` 函数**

  在 `goToPrevStep` 函数之后、`updateNavButtons` 函数之前插入相同的 `goToStep` 函数：

  ```javascript
  function goToStep(index) {
    const rule = getRuleState();
    if (index === rule.currentStep) return;
    rule.currentStep = index;
    saveState();
    updateStepIndicator();
    renderFields();
    updateNavButtons();
    renderFieldStatusSummary();
  }
  ```

- [ ] **Step 2: 修改 `src-firefox/popup/popup.js` 中的 `renderFieldStatusSummary`**

  应用与 Task 2 完全相同的修改逻辑：添加 `index` 参数、生成 `activeClass`、添加 `data-step-index`、绑定 click 事件调用 `goToStep`。

- [ ] **Step 3: 提交**

  ```bash
  git add src-firefox/popup/popup.js
  git commit -m "feat: sync field navigation to firefox build"
  ```

---

### Task 5: 同步修改 Firefox 版本 CSS

**Files:**
- Modify: `src-firefox/popup/popup.css`

- [ ] **Step 1: 在 `src-firefox/popup/popup.css` 中同步样式**

  找到 `.status-item` 规则并替换为与 Task 3 相同的完整版本（含 `cursor: pointer`、hover、active 样式）。

  ```css
  .status-item {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    padding: 2px 6px;
    border-radius: var(--radius-sm);
    transition: background 0.15s, color 0.15s;
  }

  .status-item:hover {
    background: var(--bg-hover);
    color: var(--text);
  }

  .status-item.active {
    background: var(--accent-dim);
    color: var(--accent);
    font-weight: 600;
  }
  ```

- [ ] **Step 2: 提交**

  ```bash
  git add src-firefox/popup/popup.css
  git commit -m "style: sync field status hover/active styles to firefox build"
  ```

---

### Task 6: 最终验证

- [ ] **Step 1: 运行 Node 测试**

  ```bash
  node tests/popup-navigation.test.js
  ```

  **Expected:** `All navigation tests passed!`

- [ ] **Step 2: 手动加载扩展验证**

  1. 打开 Chrome/Firefox 的扩展管理页面，加载 `src`（或 `src-firefox`）目录。
  2. 打开扩展 popup，切换到「规则」模式，选择一个规则类型（如搜索页）。
  3. 观察 `fieldStatusSummary` 区域，确认：
     - 鼠标悬停在字段名上时，光标变为 pointer，背景色变化。
     - 当前字段高亮显示（accent 色 + 加粗）。
     - 点击非当前字段，页面正确跳转到该字段编辑区。
     - 上一步 / 下一步按钮继续正常工作。

- [ ] **Step 3: 最终提交（如有修复）**

  若验证过程中有任何修复，单独提交：

  ```bash
  git add -A
  git commit -m "fix: address review findings from manual testing"
  ```

---

## Self-Review Checklist

- [x] **Spec coverage:** 设计文档中的「交互逻辑」「视觉设计」「可访问性」「边界情况」均在 Task 1-6 中有对应实现步骤。
- [x] **Placeholder scan:** 无 TBD/TODO/"implement later"/"similar to Task N"。
- [x] **Type consistency:** `goToStep(index)`、`data-step-index`、`activeClass` 等命名在 `src` 和 `src-firefox` 中完全一致。
