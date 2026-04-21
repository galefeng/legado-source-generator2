# 规则字段鼠标导航设计文档

**日期**: 2026-04-21
**主题**: 规则面板字段级鼠标导航
**状态**: 已确认

## 背景与问题

在 Legado 书源生成器的「规则」模式下，每个规则类型（搜索页、发现页、详情页、目录页、正文页）包含多个字段（如书名、作者、分类等）。用户目前只能在字段间通过「上一步 / 下一步」按钮线性导航，无法直接跳转到目标字段，操作效率低。

## 目标

为规则面板下的各字段增加鼠标点击导航功能，让用户可以直接跳转到想要修改的字段，同时兼顾 UI/UX 质量。

## 方案选择

经过对比，采用 **方案 A：让现有字段状态摘要可点击**。

- **方案 A（推荐）**: 将 `#fieldStatusSummary` 中的字段标签变为可点击链接。零额外空间，最直观。
- **方案 B**: 新增步骤圆点导航条。视觉上紧凑，但圆点可点击区域小、辨识度不如文字。
- **方案 C**: 新增下拉快速跳转菜单。需要多一次点击，不如直接点击高效。

## 设计细节

### 交互逻辑

1. `#fieldStatusSummary` 中的每个 `.status-item` 添加 `click` 事件监听器。
2. 点击时调用 `goToStep(index)` 函数，将当前规则类型的 `currentStep` 设置为对应索引。
3. 触发后续渲染：`saveState()` → `updateStepIndicator()` → `renderFields()` → `updateNavButtons()` → `renderFieldStatusSummary()`。
4. 「上一步 / 下一步」按钮保留，作为辅助导航方式。

### 视觉设计

- **Cursor**: `.status-item` 统一设置为 `cursor: pointer`。
- **Hover**: 背景色变为 `var(--bg-hover)`，文字颜色变为 `var(--text)`，增加微圆角和内边距，明确传达可点击 affordance。
- **Active（当前字段）**: 文字加粗、颜色变为 `var(--accent)`、背景变为 `var(--accent-dim)`、圆角 `var(--radius-sm)`、增加水平内边距，使其在字段列表中一眼可辨。
- **过渡**: 颜色和背景变化添加 `0.15s` 过渡，保持与现有 UI 一致的微交互节奏。

### 可访问性

- 可点击元素提供清晰的视觉反馈（hover / active 状态）。
- 不依赖颜色作为唯一信息来源：当前字段除了颜色变化，还有加粗和背景色双重标识。
- 保留原有的键盘可访问路径（Tab 到上一步/下一步按钮）。

### 边界情况

- **点击当前字段**: 不做任何操作，避免无意义重渲染。
- **字段数量变化**: 切换 ruleType 时，`renderFieldStatusSummary` 会根据当前类型的字段数量重新生成列表，索引自然对齐。
- **状态保持**: 跳转后字段的填写状态（已选择 / 已跳过 / 手动输入等）完全保留，不受影响。

## 实现范围

- `src/popup/popup.js`: 修改 `renderFieldStatusSummary()` 添加点击事件与 active 类；新增 `goToStep(index)` 函数。
- `src/popup/popup.css`: 添加 `.status-item` 的 hover 与 active 样式。
- `src-firefox/popup/popup.js`: 同步上述 JS 改动。
- `src-firefox/popup/popup.css`: 同步上述 CSS 改动。

## 不做的范围（YAGNI）

- 不新增独立的侧边栏或抽屉组件。
- 不修改字段本身的编辑逻辑或数据存储结构。
- 不增加动画过渡（如滑动切换字段），保持改动最小化。

## 验收标准

- [ ] 在「规则」模式下，`fieldStatusSummary` 中的每个字段名均可点击。
- [ ] 点击后正确跳转到对应字段的编辑界面。
- [ ] 当前字段在 `fieldStatusSummary` 中高亮显示。
- [ ] hover 时有明确的视觉反馈。
- [ ] 上一步 / 下一步按钮继续正常工作。
- [ ] `src` 与 `src-firefox` 两份代码行为一致。
