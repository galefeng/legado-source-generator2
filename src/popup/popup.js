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
  activeMode: 'rules',
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

function renderModeTabs() {
  const container = document.getElementById('modeTabs');
  if (!container) return;

  const modes = [
    { key: 'rules', label: '规则' },
    { key: 'exploreUrl', label: '发现页URL' },
  ];

  container.innerHTML = modes.map(m => {
    const active = m.key === state.activeMode ? ' active' : '';
    return `<button class="rule-tab${active}" data-mode="${m.key}">${m.label}</button>`;
  }).join('');

  container.querySelectorAll('.rule-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      state.activeMode = btn.dataset.mode;
      saveState();
      renderModeTabs();
      updateEditorVisibility();
    });
  });
}

function updateEditorVisibility() {
  const editor = document.getElementById('exploreUrlEditor');
  const ruleTabs = document.getElementById('ruleTypeTabs');
  const stepIndicator = document.querySelector('.step-indicator');
  const formArea = document.querySelector('.form-area');
  const navButtons = document.getElementById('navButtons');

  if (state.activeMode === 'exploreUrl') {
    editor?.classList.remove('hidden');
    ruleTabs?.classList.add('hidden');
    stepIndicator?.classList.add('hidden');
    formArea?.classList.add('hidden');
    navButtons?.classList.add('hidden');
  } else {
    editor?.classList.add('hidden');
    ruleTabs?.classList.remove('hidden');
    stepIndicator?.classList.remove('hidden');
    formArea?.classList.remove('hidden');
    navButtons?.classList.remove('hidden');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initExploreEditor();
  renderModeTabs();
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
      document.getElementById('searchUrl').value = state.searchUrl || '';
    }
    renderModeTabs();
    renderRuleTypeTabs();
    updateStepIndicator();
    renderFields();
    updateNavButtons();
    renderFieldStatusSummary();
    updateEditorVisibility();
  });
}

function saveState() {
  state.bookSourceName = document.getElementById('bookSourceName').value;
  state.bookSourceUrl = document.getElementById('bookSourceUrl').value;
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
  const fieldIndex = fieldData.listIndex || {};
  const filteredPreviews = fieldData.previews
    ? filterPreviewsByIndex(fieldData.previews, fieldIndex, isListField)
    : fieldData.previews;

  const indexHTML = isListField
    ? `<div class="index-row">
        <label>索引范围</label>
        <div class="index-inputs">
          <input type="text" id="indexStart" class="input-field index-field" value="${escapeHtml(fieldIndex.start || '')}" placeholder="0">
          <span class="index-sep">至</span>
          <input type="text" id="indexEnd" class="input-field index-field" value="${escapeHtml(fieldIndex.end || '')}" placeholder="-1">
          <button id="indexApplyBtn" class="btn btn-action btn-index-apply">确认</button>
        </div>
      </div>`
    : `<div class="index-row index-row-single">
        <label>索引</label>
        <div class="index-inputs-single">
          <input type="text" id="indexSingle" class="input-field index-field" value="${escapeHtml(fieldIndex.single || '')}" placeholder="0">
          <button id="indexApplyBtn" class="btn btn-action btn-index-apply">确认</button>
        </div>
      </div>`;

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
      ${indexHTML}
      ${isListField ? `
      <div class="list-hint">⚠️ <strong>需要选择两个同列表元素</strong>，自动提取交集生成选择器</div>
      ` : ''}
      ${fieldState === 'selected' && fieldData.rawSelector ? `
        <div class="selector-info">
          <span class="selector-label">选择器:</span>
          <code class="selector-value">${escapeHtml(fieldData.rawSelector)}</code>
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
  const indexSingle = document.getElementById('indexSingle');
  if (indexSingle) indexSingle.addEventListener('input', handleIndexInput);
  const indexApplyBtn = document.getElementById('indexApplyBtn');
  if (indexApplyBtn) indexApplyBtn.addEventListener('click', handleIndexApply);
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

  let itemSelector = '';
  if (rule.bookListSelector && isPageScopedList) {
    itemSelector = rule.bookListSelector;
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
        reInjectContentScript(tabId, field.key, isListField, rule.bookListSelector, itemSelector);
      }
    });
  });
}

function reInjectContentScript(tabId, step, isListField, rootSelector, itemSelector) {
  const injectJS = typeof chrome.scripting !== 'undefined'
    ? () => chrome.scripting.executeScript({
        target: { tabId },
        files: ['lib/selector-generator.js', 'content/picker.js'],
      })
    : () => new Promise((resolve) => {
        chrome.tabs.executeScript(tabId, { file: 'lib/selector-generator.js' }, () => {
          chrome.tabs.executeScript(tabId, { file: 'content/picker.js' }, resolve);
        });
      });

  const injectCSS = typeof chrome.scripting !== 'undefined'
    ? () => chrome.scripting.insertCSS({
        target: { tabId },
        files: ['content/picker.css'],
      })
    : () => new Promise((resolve) => {
        chrome.tabs.insertCSS(tabId, { file: 'content/picker.css' }, resolve);
      });

  injectJS().then(() => {
    injectCSS();
    setTimeout(() => {
      chrome.tabs.sendMessage(tabId, {
        action: 'startPicker',
        step,
        isListField,
        rootSelector,
        itemSelector,
      });
    }, 200);
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

  rule.fields[field.key] = { value: '', state: 'skipped', rawSelector: '' };
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
    rule.fields[field.key] = rule.fields[field.key] || { value: '', state: 'manual', rawSelector: '' };
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
  const fieldData = rule.fields[field.key] || {};
  if (!fieldData.listIndex) fieldData.listIndex = {};
  if (e.target.id === 'indexSingle') {
    fieldData.listIndex.single = e.target.value;
  } else {
    fieldData.listIndex[e.target.id === 'indexStart' ? 'start' : 'end'] = e.target.value;
  }
  saveState();
}

function handleIndexApply() {
  const fields = getFields();
  const rule = getRuleState();
  const field = fields[rule.currentStep];
  const isListField = ['bookList', 'chapterList'].includes(field.key);

  const fieldData = rule.fields[field.key];
  if (!fieldData || !fieldData.rawSelector) return;

  if (!fieldData.listIndex) fieldData.listIndex = {};

  const baseSelector = fieldData.rawSelector;

  if (isListField) {
    const { start, end } = fieldData.listIndex;
    const startVal = start ? parseInt(start, 10) : 0;
    const endVal = end ? parseInt(end, 10) : 0;

    let jsCode;
    let endExpr;
    if (endVal > 0) {
      endExpr = String(endVal);
    } else if (endVal < -1) {
      endExpr = `list.size() + (${endVal}) + 1`;
    } else {
      endExpr = 'list.size()';
    }

    if (startVal > 1 || endVal > 0 || endVal < -1) {
      const s = startVal > 1 ? startVal - 1 : 0;
      jsCode = `<js>(function(result){
        var doc = org.jsoup.Jsoup.parse(result);
        var list = doc.select("${baseSelector}");
        var start = ${s};
        var end = ${endExpr};
        var result = new org.jsoup.select.Elements();
        for (var i = start; i < end; i++) {
          result.add(list.get(i));
        }
        return result;
      })(result)</js>`;
    } else {
      jsCode = `<js>(function(result){
        var doc = org.jsoup.Jsoup.parse(result);
        var list = doc.select("${baseSelector}");
        return list;
      })(result)</js>`;
    }

    rule.fields[field.key].value = jsCode;
  } else {
    const singleVal = fieldData.listIndex.single ? parseInt(fieldData.listIndex.single, 10) : 0;

    let jsCode;
    if (singleVal !== 0) {
      const index = singleVal > 0 ? singleVal - 1 : singleVal;
      let returnExpr;
      if (['bookUrl', 'chapterUrl', 'tocUrl', 'nextTocUrl', 'nextContentUrl'].includes(field.key)) {
        returnExpr = `String(list.get(${index}).attr("href"))`;
      } else if (field.key === 'coverUrl') {
        returnExpr = `String(list.get(${index}).attr("src"))`;
      } else {
        returnExpr = `String(list.get(${index}).text())`;
      }

      jsCode = `<js>(function(result){
    var doc = org.jsoup.Jsoup.parse(result);
    var list = doc.select("${baseSelector}");
    var index = ${index};
    return ${returnExpr};
})(result)</js>`;
    } else {
      let returnExpr;
      if (['bookUrl', 'chapterUrl', 'tocUrl', 'nextTocUrl', 'nextContentUrl'].includes(field.key)) {
        returnExpr = 'String(list.attr("href"))';
      } else if (field.key === 'coverUrl') {
        returnExpr = 'String(list.attr("src"))';
      } else {
        returnExpr = 'String(list.text())';
      }

      jsCode = `<js>(function(result){
    var doc = org.jsoup.Jsoup.parse(result);
    var list = doc.select("${baseSelector}");
    return ${returnExpr};
})(result)</js>`;
    }

    rule.fields[field.key].value = jsCode;
  }

  saveState();
  renderFields();
  renderFieldStatusSummary();
}

function filterPreviewsByIndex(previews, index, isListField) {
  if (!previews || !previews.length) return previews;

  if (!isListField) {
    if (index.single !== undefined && index.single !== '') {
      const i = parseInt(index.single, 10) - 1;
      if (i >= 0 && i < previews.length) {
        return [previews[i]];
      }
      return [];
    }
    return previews;
  }

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
    rule.fields[field.key] = { value: '', state: 'manual', rawSelector: '' };
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
  const exploreResult = typeof window.getExploreJsonString === 'function'
    ? window.getExploreJsonString()
    : (state.exploreUrl || '');
  const exploreUrlValue = typeof exploreResult === 'string'
    ? exploreResult
    : (exploreResult.length > 0 ? JSON.stringify(exploreResult, null, 2) : '');

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
    exploreUrl: exploreUrlValue,
  };
  return result;
}

function buildRuleSection(type) {
  const rule = state.rules[type];
  const fields = RULE_TYPES[type].fields;
  const section = {};

  fields.forEach(field => {
    const fieldData = rule.fields[field.key];
    if (fieldData && fieldData.value) {
      section[field.key] = fieldData.value;
    }
  });

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
  state.searchUrl = '';
  state.bookSourceName = '';
  state.bookSourceUrl = '';

  chrome.storage.local.remove(['legadoSourceState', 'exploreEditorState']);

  document.getElementById('bookSourceName').value = '';
  document.getElementById('bookSourceUrl').value = '';
  document.getElementById('searchUrl').value = '';

  if (typeof window.clearExploreEditor === 'function') {
    window.clearExploreEditor();
  }

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
    return selector;
  }

  let returnExpr;
  if (['bookUrl', 'chapterUrl', 'tocUrl', 'nextTocUrl', 'nextContentUrl'].includes(fieldKey)) {
    returnExpr = 'String(list.attr("href"))';
  } else if (fieldKey === 'coverUrl') {
    returnExpr = 'String(list.attr("src"))';
  } else {
    returnExpr = 'String(list.text())';
  }

  return `<js>(function(result){
    var doc = org.jsoup.Jsoup.parse(result);
    var list = doc.select("${selector}");
    return ${returnExpr};
})(result)</js>`;
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
    rawSelector: selector,
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
      case 'exploreCollected':
        if (typeof window.handleExploreCollected === 'function') {
          window.handleExploreCollected(message.items);
        }
        sendResponse({ success: true });
        break;
      case 'exploreItemCollected':
        if (typeof window.handleExploreItemCollected === 'function') {
          window.handleExploreItemCollected(message.item, message.total);
        }
        sendResponse({ success: true });
        break;
      case 'exploreCollectionStarted':
        if (typeof window.handleExploreCollectionStarted === 'function') {
          window.handleExploreCollectionStarted();
        }
        sendResponse({ success: true });
        break;
      case 'exploreElementHover':
        if (typeof window.handleExploreElementHover === 'function') {
          window.handleExploreElementHover(message);
        }
        sendResponse({ success: true });
        break;
      case 'pickerReady':
        showPickerStatus();
        break;
      case 'pickerElementInfo':
        updatePickerStatus(message);
        break;
      case 'pickerStopped': {
        hidePickerStatus();
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

function showPickerStatus() {
  const container = document.getElementById('pickerStatusContainer');
  if (container) container.classList.remove('hidden');
}

function hidePickerStatus() {
  const container = document.getElementById('pickerStatusContainer');
  if (container) container.classList.add('hidden');
}

function updatePickerStatus(message) {
  const stepEl = document.getElementById('pickerStatusStep');
  const elementEl = document.getElementById('pickerStatusElement');
  if (stepEl) stepEl.textContent = message.step || '-';
  if (elementEl) elementEl.textContent = message.elementInfo ? `${message.elementInfo} ${message.elementText || ''}` : '-';
}
