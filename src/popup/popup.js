const RULE_TYPES = {
  explore: {
    label: '发现页',
    fields: [
      { key: 'bookList', label: '书籍列表容器', required: true },
      { key: 'name', label: '书名', required: true },
      { key: 'author', label: '作者', required: false },
      { key: 'kind', label: '分类', required: false },
      { key: 'wordCount', label: '字数', required: false },
      { key: 'lastChapter', label: '最新章节', required: false },
      { key: 'intro', label: '简介', required: false },
      { key: 'coverUrl', label: '封面URL', required: false },
      { key: 'bookUrl', label: '书籍链接', required: true },
    ],
  },
  search: {
    label: '搜索页',
    fields: [
      { key: 'bookList', label: '搜索结果列表', required: true },
      { key: 'name', label: '书名', required: true },
      { key: 'author', label: '作者', required: false },
      { key: 'kind', label: '分类', required: false },
      { key: 'wordCount', label: '字数', required: false },
      { key: 'lastChapter', label: '最新章节', required: false },
      { key: 'intro', label: '简介', required: false },
      { key: 'coverUrl', label: '封面URL', required: false },
      { key: 'bookUrl', label: '书籍链接', required: true },
      { key: 'checkKeyWord', label: '校验关键词', required: false },
    ],
  },
  bookInfo: {
    label: '详情页',
    fields: [
      { key: 'name', label: '书名', required: true },
      { key: 'author', label: '作者', required: false },
      { key: 'kind', label: '分类', required: false },
      { key: 'wordCount', label: '字数', required: false },
      { key: 'lastChapter', label: '最新章节', required: false },
      { key: 'intro', label: '简介', required: false },
      { key: 'coverUrl', label: '封面URL', required: false },
      { key: 'tocUrl', label: '目录链接', required: true },
    ],
  },
  toc: {
    label: '目录页',
    fields: [
      { key: 'chapterList', label: '章节列表容器', required: true },
      { key: 'chapterName', label: '章节名称', required: true },
      { key: 'chapterUrl', label: '章节链接', required: true },
      { key: 'isVolume', label: '卷名标识', required: false },
      { key: 'updateTime', label: '更新时间', required: false },
      { key: 'isVip', label: 'VIP标识', required: false },
      { key: 'isPay', label: '付费标识', required: false },
      { key: 'nextTocUrl', label: '下一页目录', required: false },
    ],
  },
  content: {
    label: '正文页',
    fields: [
      { key: 'content', label: '正文内容', required: true },
      { key: 'subContent', label: '后续正文', required: false },
      { key: 'title', label: '章节标题', required: false },
      { key: 'nextContentUrl', label: '下一页正文', required: false },
    ],
  },
};

let state = {
  activeRuleType: 'explore',
  rules: {
    explore: { currentStep: 0, fields: {}, fieldStates: {}, bookListSelector: null },
    search: { currentStep: 0, fields: {}, fieldStates: {}, bookListSelector: null },
    bookInfo: { currentStep: 0, fields: {}, fieldStates: {}, bookListSelector: null },
    toc: { currentStep: 0, fields: {}, fieldStates: {}, bookListSelector: null },
    content: { currentStep: 0, fields: {}, fieldStates: {}, bookListSelector: null },
  },
  exploreUrl: '',
  searchUrl: '',
  bookSourceName: '',
  bookSourceUrl: '',
};

function getFields() {
  return RULE_TYPES[state.activeRuleType].fields;
}

function getRuleState() {
  return state.rules[state.activeRuleType];
}

document.addEventListener('DOMContentLoaded', () => {
  renderRuleTypeTabs();
  renderFields();
  loadState();
  bindEvents();
  bindMessageListener();
});

function loadState() {
  chrome.storage.local.get(['legadoSourceState'], (result) => {
    if (result.legadoSourceState) {
      state = { ...state, ...result.legadoSourceState };
      document.getElementById('bookSourceName').value = state.bookSourceName || '';
      document.getElementById('bookSourceUrl').value = state.bookSourceUrl || '';
      document.getElementById('exploreUrl').value = state.exploreUrl || '';
      document.getElementById('searchUrl').value = state.searchUrl || '';
    }
    renderRuleTypeTabs();
    updateStepIndicator();
    renderFields();
    updateNavButtons();
    renderFieldStatusSummary();
  });
}

function saveState() {
  state.bookSourceName = document.getElementById('bookSourceName').value;
  state.bookSourceUrl = document.getElementById('bookSourceUrl').value;
  state.exploreUrl = document.getElementById('exploreUrl').value;
  state.searchUrl = document.getElementById('searchUrl').value;
  chrome.storage.local.set({ legadoSourceState: state });
}

function renderRuleTypeTabs() {
  const container = document.getElementById('ruleTypeTabs');
  if (!container) return;

  container.innerHTML = Object.entries(RULE_TYPES).map(([key, cfg]) => {
    const active = key === state.activeRuleType ? ' active' : '';
    return `<button class="rule-tab${active}" data-type="${key}">${cfg.label}</button>`;
  }).join('');

  container.querySelectorAll('.rule-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      state.activeRuleType = btn.dataset.type;
      saveState();
      renderRuleTypeTabs();
      updateStepIndicator();
      renderFields();
      updateNavButtons();
      renderFieldStatusSummary();
    });
  });
}

function updateStepIndicator() {
  const fields = getFields();
  const rule = getRuleState();
  const field = fields[rule.currentStep];
  const fieldState = rule.fieldStates[field.key] || 'pending';
  const stateLabel = getStateLabel(fieldState);
  const stepText = `${rule.currentStep + 1}/${fields.length}: ${field.label}${field.required ? ' *' : ''} ${stateLabel}`;
  document.getElementById('stepText').textContent = stepText;
}

function getStateLabel(fieldState) {
  const labels = {
    pending: '',
    picking: '(选择中...)',
    selected: '(已选择)',
    skipped: '(已跳过)',
    manual: '(手动输入)',
  };
  return labels[fieldState] || '';
}

function renderFields() {
  const container = document.getElementById('fieldContainer');
  const fields = getFields();
  const rule = getRuleState();
  const field = fields[rule.currentStep];
  const fieldData = rule.fields[field.key] || {};
  const fieldState = rule.fieldStates[field.key] || 'pending';
  const value = fieldData.value || '';
  const isManual = fieldState === 'manual';
  const isListField = ['bookList', 'chapterList'].includes(field.key);
  const listIndex = isListField ? (rule.listIndex || {}) : {};
  const filteredPreviews = isListField && fieldData.previews
    ? filterPreviewsByIndex(fieldData.previews, listIndex)
    : fieldData.previews;

  container.innerHTML = `
    <div class="field-item">
      <label>${field.label}${field.required ? ' <span class="required">*</span>' : ''}</label>
      <div class="field-value">
        <input type="text" id="fieldValue" class="input-field" value="${escapeHtml(value)}"
          placeholder="请输入或选择" ${isManual ? '' : 'readonly'}>
      </div>
      <div class="field-actions">
        <button id="selectBtn" class="btn btn-action" ${fieldState === 'picking' ? 'disabled' : ''}>
          ${fieldState === 'picking' ? '选择中...' : '选择元素'}
        </button>
        ${fieldState === 'picking' ? `<button id="cancelBtn" class="btn btn-action btn-cancel">取消选择</button>` : ''}
        <button id="skipBtn" class="btn btn-action">跳过</button>
        <button id="manualBtn" class="btn btn-action ${fieldState === 'manual' ? 'btn-active' : ''}">
          手动输入
        </button>
        ${fieldState === 'selected' || fieldState === 'manual' ? `
        <button id="clearBtn" class="btn btn-action btn-clear">清除</button>
        ` : ''}
      </div>
      ${isListField ? `
      <div class="index-row">
        <label>索引范围</label>
        <div class="index-inputs">
          <input type="text" id="indexStart" class="input-field index-field" value="${escapeHtml(listIndex.start || '')}" placeholder="起始">
          <span class="index-sep">至</span>
          <input type="text" id="indexEnd" class="input-field index-field" value="${escapeHtml(listIndex.end || '')}" placeholder="结束">
        </div>
      </div>
      <div class="list-hint">⚠️ <strong>需要选择两个同列表元素</strong>，自动提取交集生成选择器</div>
      ` : ''}
      ${fieldState === 'selected' && fieldData.selector ? `
        <div class="selector-info">
          <span class="selector-label">选择器:</span>
          <code class="selector-value">${escapeHtml(fieldData.selector)}</code>
        </div>
        ${filteredPreviews && filteredPreviews.length > 0 ? `
          <div class="preview-section">
            <div class="preview-header" data-toggle="preview">
              <span class="preview-toggle">▶</span>
              预览 (${filteredPreviews.length} 个匹配)
            </div>
            <div class="preview-list hidden">
              ${filteredPreviews.map((p, i) => `
                <div class="preview-item">
                  <div class="preview-item-header">
                    <span class="preview-index">#${i + 1}</span>
                    <span class="preview-text">${escapeHtml(p.text.substring(0, 80))}${p.text.length > 80 ? '...' : ''}</span>
                  </div>
                  <div class="preview-html"><pre class="preview-code">${escapeHtml(p.html)}</pre></div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      ` : ''}
    </div>
  `;

  bindFieldEvents();
}

function bindFieldEvents() {
  const selectBtn = document.getElementById('selectBtn');
  if (selectBtn) selectBtn.addEventListener('click', handleSelectElement);
  const cancelBtn = document.getElementById('cancelBtn');
  if (cancelBtn) cancelBtn.addEventListener('click', handleCancelSelection);
  const skipBtn = document.getElementById('skipBtn');
  if (skipBtn) skipBtn.addEventListener('click', handleSkip);
  const manualBtn = document.getElementById('manualBtn');
  if (manualBtn) manualBtn.addEventListener('click', handleManualInput);
  const fieldValue = document.getElementById('fieldValue');
  if (fieldValue) fieldValue.addEventListener('input', handleFieldInput);
  const indexStart = document.getElementById('indexStart');
  if (indexStart) indexStart.addEventListener('input', handleIndexInput);
  const indexEnd = document.getElementById('indexEnd');
  if (indexEnd) indexEnd.addEventListener('input', handleIndexInput);
  const clearBtn = document.getElementById('clearBtn');
  if (clearBtn) clearBtn.addEventListener('click', handleClearField);
}

function handleSelectElement() {
  const fields = getFields();
  const rule = getRuleState();
  const field = fields[rule.currentStep];

  const listFields = ['bookList', 'chapterList'];
  const isListField = listFields.includes(field.key);
  const isPageScopedList = ['explore', 'search'].includes(state.activeRuleType);

  if (!isListField && isPageScopedList && !rule.bookListSelector) {
    return;
  }

  // Extract item selector from bookListSelector (remove @css: prefix if present)
  let itemSelector = '';
  if (rule.bookListSelector && isPageScopedList) {
    itemSelector = rule.bookListSelector.startsWith('@css:')
      ? rule.bookListSelector.slice(5)
      : rule.bookListSelector;
  }

  rule.fieldStates[field.key] = 'picking';
  saveState();
  updateStepIndicator();
  renderFields();

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return;
    const tabId = tabs[0].id;

    chrome.tabs.sendMessage(tabId, {
      action: 'startPicker',
      step: field.key,
      isListField,
      rootSelector: rule.bookListSelector,
      itemSelector,
    }, (response) => {
      if (chrome.runtime.lastError) {
        // Content script disconnected (extension updated) — re-inject and retry
        chrome.scripting.executeScript({
          target: { tabId },
          files: ['lib/selector-generator.js', 'content/picker.js'],
        }).then(() => {
          chrome.scripting.insertCSS({
            target: { tabId },
            files: ['content/picker.css'],
          });
          setTimeout(() => {
            chrome.tabs.sendMessage(tabId, {
              action: 'startPicker',
              step: field.key,
              isListField,
              rootSelector: rule.bookListSelector,
              itemSelector,
            });
          }, 200);
        });
      }
    });
  });
}

function handleCancelSelection() {
  const fields = getFields();
  const rule = getRuleState();
  const field = fields[rule.currentStep];

  rule.fieldStates[field.key] = 'pending';
  saveState();
  updateStepIndicator();
  renderFields();

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'stopPicker' });
    }
  });
}

function handleSkip() {
  const fields = getFields();
  const rule = getRuleState();
  const field = fields[rule.currentStep];

  if (field.required) {
    if (!confirm(`"${field.label}"是必填字段，确定要跳过吗？`)) {
      return;
    }
  }

  rule.fields[field.key] = { value: '', state: 'skipped', selector: '' };
  rule.fieldStates[field.key] = 'skipped';
  saveState();
  goToNextStep();
}

function handleManualInput() {
  const fields = getFields();
  const rule = getRuleState();
  const field = fields[rule.currentStep];

  if (rule.fieldStates[field.key] === 'manual') {
    rule.fieldStates[field.key] = 'pending';
  } else {
    rule.fieldStates[field.key] = 'manual';
    rule.fields[field.key] = rule.fields[field.key] || { value: '', state: 'manual', selector: '' };
    rule.fields[field.key].state = 'manual';
  }

  saveState();
  renderFields();
  renderFieldStatusSummary();

  if (rule.fieldStates[field.key] === 'manual') {
    setTimeout(() => {
      const input = document.getElementById('fieldValue');
      if (input) input.focus();
    }, 50);
  }
}

function handleClearField() {
  const fields = getFields();
  const rule = getRuleState();
  const field = fields[rule.currentStep];

  delete rule.fields[field.key];
  rule.fieldStates[field.key] = 'pending';

  const listFields = ['bookList', 'chapterList'];
  if (listFields.includes(field.key)) {
    rule.bookListSelector = null;
    rule.listIndex = { start: '', end: '' };
  }

  saveState();
  renderFields();
  renderFieldStatusSummary();
  updateStepIndicator();
}

function handleIndexInput(e) {
  const fields = getFields();
  const rule = getRuleState();
  const field = fields[rule.currentStep];
  const isListField = ['bookList', 'chapterList'].includes(field.key);
  if (!isListField) return;

  if (!rule.listIndex) rule.listIndex = { start: '', end: '' };
  rule.listIndex[e.target.id === 'indexStart' ? 'start' : 'end'] = e.target.value;
  saveState();
  renderFields();
}

function filterPreviewsByIndex(previews, index) {
  if (!previews || !previews.length) return previews;
  const start = index.start ? parseInt(index.start, 10) : 0;
  const end = index.end ? parseInt(index.end, 10) : previews.length;
  const s = start < 0 ? previews.length + start : Math.max(0, start - 1);
  const e = end < 0 ? previews.length + end + 1 : Math.min(previews.length, end);
  return previews.slice(s, e);
}

function handleFieldInput(e) {
  const fields = getFields();
  const rule = getRuleState();
  const field = fields[rule.currentStep];
  const value = e.target.value;

  if (!rule.fields[field.key]) {
    rule.fields[field.key] = { value: '', state: 'manual', selector: '' };
  }
  rule.fields[field.key].value = value;
  rule.fields[field.key].state = 'manual';
  rule.fieldStates[field.key] = 'manual';

  saveState();
  renderFieldStatusSummary();
}

function goToNextStep() {
  const fields = getFields();
  const rule = getRuleState();
  if (rule.currentStep < fields.length - 1) {
    rule.currentStep++;
    saveState();
    updateStepIndicator();
    renderFields();
    updateNavButtons();
  }
}

function goToPrevStep() {
  const rule = getRuleState();
  if (rule.currentStep > 0) {
    rule.currentStep--;
    saveState();
    updateStepIndicator();
    renderFields();
    updateNavButtons();
  }
}

function updateNavButtons() {
  const fields = getFields();
  const rule = getRuleState();
  document.getElementById('prevBtn').disabled = rule.currentStep === 0;
  document.getElementById('nextBtn').textContent =
    rule.currentStep === fields.length - 1 ? '完成' : '下一步';
}

function renderFieldStatusSummary() {
  const summaryContainer = document.getElementById('fieldStatusSummary');
  if (!summaryContainer) return;

  const fields = getFields();
  const rule = getRuleState();
  const summary = fields.map(f => {
    const fieldState = rule.fieldStates[f.key] || 'pending';
    const stateIcon = {
      pending: '○',
      picking: '◐',
      selected: '●',
      skipped: '⊘',
      manual: '◉',
    }[fieldState];

    return `<span class="status-item" data-field="${f.key}">${stateIcon} ${f.label}</span>`;
  }).join(' | ');

  summaryContainer.innerHTML = summary;
}

function bindEvents() {
  document.getElementById('prevBtn').addEventListener('click', goToPrevStep);
  document.getElementById('nextBtn').addEventListener('click', handleNext);
  document.getElementById('exportBtn').addEventListener('click', handleExport);
  document.getElementById('copyBtn').addEventListener('click', handleCopy);
  document.getElementById('downloadBtn').addEventListener('click', handleDownload);
  document.getElementById('closeModalBtn').addEventListener('click', closeModal);
  document.getElementById('resetBtn').addEventListener('click', handleReset);
  document.getElementById('app').addEventListener('click', (e) => {
    const header = e.target.closest('[data-toggle="preview"]');
    if (header) togglePreviews(header);
  });

  document.getElementById('bookSourceName').addEventListener('input', saveState);
  document.getElementById('bookSourceUrl').addEventListener('input', saveState);
  document.getElementById('exploreUrl').addEventListener('input', saveState);
  document.getElementById('searchUrl').addEventListener('input', saveState);
}

function handleNext() {
  const fields = getFields();
  const rule = getRuleState();
  const field = fields[rule.currentStep];
  const fieldState = rule.fieldStates[field.key];

  if (field.required && (!fieldState || fieldState === 'pending' || fieldState === 'skipped')) {
    alert(`请完成必填字段"${field.label}"`);
    return;
  }

  if (rule.currentStep === fields.length - 1) {
    handleExport();
  } else {
    goToNextStep();
  }
}

function handleExport() {
  const jsonData = generateJson();
  document.getElementById('jsonOutput').value = JSON.stringify(jsonData, null, 2);
  document.getElementById('exportModal').classList.remove('hidden');
}

function generateJson() {
  const result = {
    ruleSearch: buildRuleSection('search'),
    ruleBookInfo: buildRuleSection('bookInfo'),
    ruleToc: buildRuleSection('toc'),
    ruleContent: buildRuleSection('content'),
    ruleExplore: buildRuleSection('explore'),
    bookSourceType: 0,
    bookSourceUrl: state.bookSourceUrl || '',
    bookSourceName: state.bookSourceName || '',
    searchUrl: state.searchUrl || '',
    exploreUrl: state.exploreUrl || '',
  };
  return result;
}

function buildRuleSection(type) {
  const rule = state.rules[type];
  const fields = RULE_TYPES[type].fields;
  const section = {};

  fields.forEach(field => {
    const fieldData = rule.fields[field.key];
    if (fieldData && (fieldData.selector || fieldData.value)) {
      section[field.key] = fieldData.selector || fieldData.value;
    }
  });

  if (rule.listIndex && (rule.listIndex.start || rule.listIndex.end)) {
    const parts = [];
    if (rule.listIndex.start) parts.push(rule.listIndex.start);
    if (rule.listIndex.end) parts.push(rule.listIndex.end);
    section.bookListIndex = parts.join(',');
  }

  return section;
}

function handleCopy() {
  const textarea = document.getElementById('jsonOutput');
  navigator.clipboard.writeText(textarea.value).then(() => {
    alert('已复制到剪贴板');
  }).catch(() => {
    textarea.select();
    document.execCommand('copy');
  });
}

function handleDownload() {
  const textarea = document.getElementById('jsonOutput');
  const jsonStr = textarea.value;
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `legado-source-${state.bookSourceName || 'export'}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function closeModal() {
  document.getElementById('exportModal').classList.add('hidden');
}

function handleReset() {
  if (!confirm('确定要重置所有进度吗？')) return;

  state.rules = {
    explore: { currentStep: 0, fields: {}, fieldStates: {}, bookListSelector: null },
    search: { currentStep: 0, fields: {}, fieldStates: {}, bookListSelector: null },
    bookInfo: { currentStep: 0, fields: {}, fieldStates: {}, bookListSelector: null },
    toc: { currentStep: 0, fields: {}, fieldStates: {}, bookListSelector: null },
    content: { currentStep: 0, fields: {}, fieldStates: {}, bookListSelector: null },
  };
  state.activeRuleType = 'explore';
  state.exploreUrl = '';
  state.searchUrl = '';
  state.bookSourceName = '';
  state.bookSourceUrl = '';

  chrome.storage.local.remove('legadoSourceState');

  document.getElementById('bookSourceName').value = '';
  document.getElementById('bookSourceUrl').value = '';
  document.getElementById('exploreUrl').value = '';
  document.getElementById('searchUrl').value = '';

  renderRuleTypeTabs();
  updateStepIndicator();
  renderFields();
  updateNavButtons();
  renderFieldStatusSummary();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

window.togglePreviews = function(header) {
  const list = header.nextElementSibling;
  const toggle = header.querySelector('.preview-toggle');
  if (list.classList.contains('hidden')) {
    list.classList.remove('hidden');
    toggle.textContent = '▼';
  } else {
    list.classList.add('hidden');
    toggle.textContent = '▶';
  }
};

function toLegadoRule(selector, fieldKey) {
  const listFields = ['bookList', 'chapterList'];
  if (listFields.includes(fieldKey)) {
    return `@css:${selector}`;
  }

  switch (fieldKey) {
    case 'bookUrl':
    case 'chapterUrl':
    case 'tocUrl':
    case 'nextTocUrl':
    case 'nextContentUrl':
      return `@css:${selector}@href`;
    case 'coverUrl':
      return `@css:${selector}@src`;
    default:
      return `@css:${selector}@text`;
  }
}

function handleSelectorSelected(message) {
  const { selector, step, previews } = message;

  const fields = getFields();
  const field = fields.find(f => f.key === step);

  if (!field) {
    console.error('Unknown field step:', step);
    return;
  }

  const rule = getRuleState();
  const legadoRule = toLegadoRule(selector, step);

  rule.fields[step] = {
    value: legadoRule,
    state: 'selected',
    selector: legadoRule,
    previews: previews || [],
  };
  rule.fieldStates[step] = 'selected';

  const listFields = ['bookList', 'chapterList'];
  if (listFields.includes(step)) {
    rule.bookListSelector = selector;
  }

  saveState();
  renderFields();
  renderFieldStatusSummary();
}

function bindMessageListener() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
      case 'selectorSelected':
        handleSelectorSelected(message);
        sendResponse({ success: true });
        break;
      case 'pickerReady':
        break;
      case 'pickerStopped': {
        const fields = getFields();
        const rule = getRuleState();
        const currentField = fields[rule.currentStep];
        if (currentField && rule.fieldStates[currentField.key] === 'picking') {
          rule.fieldStates[currentField.key] = 'pending';
          saveState();
          updateStepIndicator();
          renderFields();
        }
        break;
      }
      default:
        break;
    }
    return true;
  });
}
