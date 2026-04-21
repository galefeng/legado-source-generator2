const RULE_TYPE_ORDER = ['search', 'explore', 'bookInfo', 'toc', 'content'];

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
      { key: 'name', label: '书名', required: false },
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
  activeMode: 'searchUrl',
  activeRuleType: 'search',
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
  // Captured search configuration
  searchConfig: null, // { method, url, charset, body, pageTemplate }
  // Debug configuration
  debugIp: ['192', '168', '1', '100'],
  debugPort: '1122',
  headerItems: [],
  enableCfShield: false,
};

const CF_LOGIN_CHECK_JS = `var resultUrl = result.url();
var resultCode = result.code();
var resultBoDy = result.body();
if (/_cf_|ge_ua|verify.php/gi.test(resultBoDy) && resultCode >= 403) {
  if (key) {
    url = baseUrl + java.ruleUrl;
  }
  cookie.removeCookie(baseUrl);
  result = java.startBrowserAwait(resultUrl, "验证", false);
  if (key) {
    url =
      org.jsoup.Jsoup.parse(result.body())
        .select('meta[property="og:url"]')
        .attr("content") || url;
  }
}
result;`;

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
    { key: 'searchUrl', label: '搜索URL' },
    { key: 'exploreUrl', label: '发现页URL' },
    { key: 'rules', label: '规则' },
    { key: 'advanced', label: '进阶' },
    { key: 'debug', label: '调试' },
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
  const searchEditor = document.getElementById('searchUrlEditor');
  const exploreEditor = document.getElementById('exploreUrlEditor');
  const advancedPanel = document.getElementById('advancedPanel');
  const ruleTabs = document.getElementById('ruleTypeTabs');
  const stepIndicator = document.querySelector('.step-indicator');
  const formArea = document.querySelector('.form-area');
  const navButtons = document.getElementById('navButtons');

  if (state.activeMode === 'searchUrl') {
    searchEditor?.classList.remove('hidden');
    exploreEditor?.classList.add('hidden');
    advancedPanel?.classList.add('hidden');
    document.getElementById('debugPanel')?.classList.add('hidden');
    ruleTabs?.classList.add('hidden');
    stepIndicator?.classList.add('hidden');
    formArea?.classList.add('hidden');
    navButtons?.classList.add('hidden');
  } else if (state.activeMode === 'exploreUrl') {
    searchEditor?.classList.add('hidden');
    exploreEditor?.classList.remove('hidden');
    advancedPanel?.classList.add('hidden');
    document.getElementById('debugPanel')?.classList.add('hidden');
    ruleTabs?.classList.add('hidden');
    stepIndicator?.classList.add('hidden');
    formArea?.classList.add('hidden');
    navButtons?.classList.add('hidden');
  } else if (state.activeMode === 'debug') {
    searchEditor?.classList.add('hidden');
    exploreEditor?.classList.add('hidden');
    advancedPanel?.classList.add('hidden');
    document.getElementById('debugPanel')?.classList.remove('hidden');
    ruleTabs?.classList.add('hidden');
    stepIndicator?.classList.add('hidden');
    formArea?.classList.add('hidden');
    navButtons?.classList.add('hidden');
  } else if (state.activeMode === 'rules') {
    searchEditor?.classList.add('hidden');
    exploreEditor?.classList.add('hidden');
    advancedPanel?.classList.add('hidden');
    document.getElementById('debugPanel')?.classList.add('hidden');
    ruleTabs?.classList.remove('hidden');
    stepIndicator?.classList.remove('hidden');
    formArea?.classList.remove('hidden');
    navButtons?.classList.remove('hidden');
  } else if (state.activeMode === 'advanced') {
    searchEditor?.classList.add('hidden');
    exploreEditor?.classList.add('hidden');
    advancedPanel?.classList.remove('hidden');
    document.getElementById('debugPanel')?.classList.add('hidden');
    ruleTabs?.classList.add('hidden');
    stepIndicator?.classList.add('hidden');
    formArea?.classList.add('hidden');
    navButtons?.classList.add('hidden');
  } else {
    searchEditor?.classList.add('hidden');
    exploreEditor?.classList.add('hidden');
    advancedPanel?.classList.add('hidden');
    document.getElementById('debugPanel')?.classList.remove('hidden');
    ruleTabs?.classList.add('hidden');
    stepIndicator?.classList.add('hidden');
    formArea?.classList.add('hidden');
    navButtons?.classList.add('hidden');
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
      document.getElementById('searchUrlTemplate').value = state.searchUrl || '';
      const debugIp = state.debugIp || ['192', '168', '1', '100'];
      document.getElementById('debugIp1').value = debugIp[0] || '';
      document.getElementById('debugIp2').value = debugIp[1] || '';
      document.getElementById('debugIp3').value = debugIp[2] || '';
      document.getElementById('debugIp4').value = debugIp[3] || '';
      document.getElementById('debugPort').value = state.debugPort || '1122';
      const migrated = Array.isArray(state.headerItems)
        ? state.headerItems
        : [
            { key: 'User-Agent', value: state.advancedHeaderUa || '' },
            { key: 'Referer', value: state.advancedHeaderRefer || '' },
          ].filter(item => item.value);
      state.headerItems = migrated;
      document.getElementById('enableCfShield').checked = !!state.enableCfShield;
      setTimeout(() => {
        autoResizeTextarea(document.getElementById('bookSourceName'));
        autoResizeTextarea(document.getElementById('bookSourceUrl'));
        autoResizeTextarea(document.getElementById('searchUrlTemplate'));
      }, 0);
    }
    renderModeTabs();
    renderRuleTypeTabs();
    updateStepIndicator();
    renderFields();
    updateNavButtons();
    renderFieldStatusSummary();
    renderHeaderItems();
    updateEditorVisibility();
  });
}

function getDefaultRefer() {
  const url = (document.getElementById('bookSourceUrl')?.value || '').trim();
  if (!url) return '';
  try {
    return new URL(url).origin;
  } catch {
    return '';
  }
}

function renderHeaderItems() {
  const container = document.getElementById('advancedHeadersList');
  if (!container) return;
  const items = Array.isArray(state.headerItems) ? state.headerItems : [];
  container.innerHTML = items.map((item, index) => {
    const key = (item?.key || '').replace(/"/g, '&quot;');
    const value = (item?.value || '').replace(/"/g, '&quot;');
    return `<div class="advanced-item" data-index="${index}">
      <textarea class="input advanced-key" data-role="key" rows="1" placeholder="键">${key}</textarea>
      <textarea class="input advanced-value" data-role="value" rows="1" placeholder="值">${value}</textarea>
      <button class="btn btn-clear advanced-remove" data-action="remove" type="button">删除</button>
    </div>`;
  }).join('');
  container.querySelectorAll('textarea.input').forEach(el => autoResizeTextarea(el));
}

function collectHeaderItemsFromDom() {
  const container = document.getElementById('advancedHeadersList');
  if (!container) return [];
  const rows = Array.from(container.querySelectorAll('.advanced-item'));
  return rows.map(row => {
    const key = row.querySelector('[data-role="key"]')?.value?.trim() || '';
    const value = row.querySelector('[data-role="value"]')?.value?.trim() || '';
    return { key, value };
  }).filter(item => item.key || item.value);
}

function addHeaderItem(key = '', value = '') {
  if (!Array.isArray(state.headerItems)) state.headerItems = [];
  state.headerItems.push({ key, value });
  renderHeaderItems();
  saveState();
}

function addDefaultUserAgentHeader() {
  if (!Array.isArray(state.headerItems)) state.headerItems = [];
  state.headerItems.push({ key: 'User-Agent', value: navigator.userAgent || '' });
  renderHeaderItems();
  saveState();
}

function addDefaultRefererHeader() {
  if (!Array.isArray(state.headerItems)) state.headerItems = [];
  state.headerItems.push({ key: 'Referer', value: getDefaultRefer() });
  renderHeaderItems();
  saveState();
}

function saveState() {
  state.bookSourceName = document.getElementById('bookSourceName').value;
  state.bookSourceUrl = document.getElementById('bookSourceUrl').value;
  state.searchUrl = document.getElementById('searchUrlTemplate').value;
  state.debugIp = [
    document.getElementById('debugIp1').value,
    document.getElementById('debugIp2').value,
    document.getElementById('debugIp3').value,
    document.getElementById('debugIp4').value,
  ];
  state.debugPort = document.getElementById('debugPort').value;
  state.headerItems = collectHeaderItemsFromDom();
  state.enableCfShield = !!document.getElementById('enableCfShield')?.checked;
  chrome.storage.local.set({ legadoSourceState: state });
}

function syncSearchUrlState() {
  state.searchUrl = document.getElementById('searchUrlTemplate').value;
  chrome.storage.local.set({ legadoSourceState: state });
}

// ============================================
//    Debug Functions
// ============================================

let debugWs = null;
let debugMessages = [];
let debugTimeout = null;
let debugFinished = false;

function handleDebugStart() {
  const defaultIp = ['192', '168', '1', '100'];
  const ipParts = [
    document.getElementById('debugIp1').value.trim() || defaultIp[0],
    document.getElementById('debugIp2').value.trim() || defaultIp[1],
    document.getElementById('debugIp3').value.trim() || defaultIp[2],
    document.getElementById('debugIp4').value.trim() || defaultIp[3],
  ];
  const host = ipParts.join('.');
  const port = parseInt(document.getElementById('debugPort').value, 10) || 1122;
  const key = document.getElementById('debugKey').value.trim() || '我的';
  const resultEl = document.getElementById('debugResult');
  const startBtn = document.getElementById('debugStartBtn');
  const stopBtn = document.getElementById('debugStopBtn');

  // Get the JSON for the current book source
  const sourceJson = generateJson();
  if (!sourceJson.ruleSearch && !sourceJson.ruleExplore) {
    showToast('请先配置至少一个规则页', 'warning');
    return;
  }

  // Reset state
  resultEl.textContent = '';
  debugMessages = [];
  debugFinished = false;

  // Disable start, enable stop
  startBtn.disabled = true;
  stopBtn.disabled = false;

  // Step 1: Save the book source via HTTP
  appendDebugLine('正在保存书源到 Legado...', 'info');

  const httpUrl = `http://${host}:${port}/saveBookSource`;
  fetch(httpUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(sourceJson),
  })
    .then((res) => res.json())
    .then((saveResult) => {
      if (!saveResult.isSuccess) {
        appendDebugLine(`保存失败: ${saveResult.errorMsg}`, 'error');
        finishDebug(false);
        return;
      }
      appendDebugLine('书源保存成功', 'success');
      // Step 2: Connect to WebSocket
      connectAndDebug(host, port, key, sourceJson);
    })
    .catch((err) => {
      appendDebugLine(`保存失败: ${err.message}`, 'error');
      finishDebug(false);
    });
}

function connectAndDebug(host, port, key, sourceJson) {
  const wsPort = port + 1;
  const wsUrl = `ws://${host}:${wsPort}/bookSourceDebug`;

  appendDebugLine(`正在连接调试服务器...`, 'info');

  try {
    debugWs = new WebSocket(wsUrl);
  } catch (e) {
    appendDebugLine(`WebSocket 创建失败: ${e.message}`, 'error');
    finishDebug(false);
    return;
  }

  debugWs.onopen = () => {
    appendDebugLine('连接成功，正在发送调试请求...', 'info');
    const tag = sourceJson.bookSourceUrl || sourceJson.sourceUrl || '';
    debugWs.send(JSON.stringify({ tag, key }));
  };

  debugWs.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (Array.isArray(data)) {
        data.forEach((msg) => appendDebugLine(msg, ''));
      } else if (typeof data === 'string') {
        appendDebugLine(data, '');
      } else {
        appendDebugLine(JSON.stringify(data, null, 2), '');
      }
    } catch {
      appendDebugLine(event.data, '');
    }
  };

  debugWs.onerror = () => {
    if (!debugFinished) {
      appendDebugLine('WebSocket 连接错误', 'error');
    }
  };

  debugWs.onclose = () => {
    if (!debugFinished) {
      appendDebugLine('连接已关闭', 'info');
      finishDebug(true);
    }
  };

  // Auto-timeout after 90 seconds
  debugTimeout = setTimeout(() => {
    if (debugWs && (debugWs.readyState === WebSocket.OPEN || debugWs.readyState === WebSocket.CONNECTING)) {
      appendDebugLine('调试超时，自动停止', 'info');
      debugWs.close();
    }
  }, 90000);
}

function handleDebugStop() {
  if (debugWs) {
    appendDebugLine('正在停止...', 'info');
    debugWs.close();
    debugWs = null;
  }
  finishDebug(false);
}

function finishDebug(success) {
  if (debugFinished) return;
  debugFinished = true;

  // Clear timeout
  if (debugTimeout) {
    clearTimeout(debugTimeout);
    debugTimeout = null;
  }

  const startBtn = document.getElementById('debugStartBtn');
  const stopBtn = document.getElementById('debugStopBtn');
  startBtn.disabled = false;
  stopBtn.disabled = true;

  if (success) {
    appendDebugLine('===== 调试完成 =====', 'success');
  } else {
    appendDebugLine('===== 调试结束 =====', 'error');
  }
}

function appendDebugLine(text, type) {
  const resultEl = document.getElementById('debugResult');
  const line = document.createElement('div');
  line.className = 'debug-line';
  if (type === 'error') line.className += ' debug-line-error';
  else if (type === 'success') line.className += ' debug-line-success';
  else if (type === 'info') line.className += ' debug-line-info';
  line.textContent = text;
  resultEl.appendChild(line);
  debugMessages.push(text);
  resultEl.scrollTop = resultEl.scrollHeight;
}

function buildJsRule(body, returnsList = false) {
  const catchReturnExpr = returnsList ? '[""+e]' : '""+e';
  return `<js>(function(result){
    try{
${body}
    }catch(e){
      return ${catchReturnExpr};
    }
})(result)</js>`;
}

function renderRuleTypeTabs() {
  const container = document.getElementById('ruleTypeTabs');
  if (!container) return;

  container.innerHTML = RULE_TYPE_ORDER.map(key => {
    const cfg = RULE_TYPES[key];
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
  const fieldData = rule.fields[field.key] || {};
  let stateLabel;
  if (fieldState === 'selected' && fieldData.state === 'manual') {
    stateLabel = '(手动输入)';
  } else {
    stateLabel = getStateLabel(fieldState);
  }
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
  const isLinkField = LINK_FIELDS.includes(field.key);
  const rawValue = fieldData.value || '';
  const value = (fieldData.webView && isLinkField && rawValue) ? applyWebView(rawValue) : rawValue;
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
          <input type="text" id="indexStart" class="input input--center input--50" value="${escapeHtml(fieldIndex.start || '')}" placeholder="0">
          <span class="index-sep">至</span>
          <input type="text" id="indexEnd" class="input input--center input--50" value="${escapeHtml(fieldIndex.end || '')}" placeholder="-1">
          <button id="indexApplyBtn" class="btn btn-action btn-index-apply">确认</button>
        </div>
      </div>`
    : `<div class="index-row index-row-single">
        <label>索引</label>
        <div class="index-inputs-single">
          <input type="text" id="indexSingle" class="input input--center input--50" value="${escapeHtml(fieldIndex.single || '')}" placeholder="0">
          <button id="indexApplyBtn" class="btn btn-action btn-index-apply">确认</button>
        </div>
      </div>`;

  container.innerHTML = `
    <div class="field-item">
      <label>${field.label}${field.required ? ' <span class="required">*</span>' : ''}</label>
      <div class="field-value">
        <textarea id="fieldValue" class="input" rows="1"
          placeholder="请输入或选择" ${isManual ? '' : 'readonly'}>${escapeHtml(value)}</textarea>
      </div>
      <div class="field-actions">
        <button id="selectBtn" class="btn btn-action" ${fieldState === 'picking' ? 'disabled' : ''}>
          ${fieldState === 'picking' ? '选择中...' : '选择元素'}
        </button>
        ${fieldState === 'picking' ? `<button id="cancelBtn" class="btn btn-action btn-cancel">取消选择</button>` : ''}
        <button id="skipBtn" class="btn btn-action">跳过</button>
        <button id="manualBtn" class="btn btn-action ${fieldState === 'manual' ? 'btn-active' : ''}">
          ${fieldState === 'manual' ? '确认输入' : '手动输入'}
        </button>
        ${fieldState === 'selected' || fieldState === 'manual' ? `
        ${isLinkField ? `<button id="webViewBtn" class="btn btn-action${fieldData.webView ? ' btn-active' : ''}">webView${fieldData.webView ? ' ✓' : ''}</button>` : ''}
        <button id="clearBtn" class="btn btn-action btn-clear">清空</button>
        ` : ''}
      </div>
      ${indexHTML}
      ${isListField ? `
      <div class="list-hint">⚠️ <strong>需要选择两个同列表元素</strong>，自动提取交集生成选择器</div>
      ` : ''}
      ${fieldState === 'selected' && (fieldData.rawSelector || (fieldData.state === 'manual' && fieldData.value)) ? `
        <div class="selector-info">
          <span class="selector-label">${fieldData.state === 'manual' ? '规则' : '选择器'}:</span>
          <code class="selector-value">${escapeHtml(fieldData.state === 'manual' ? fieldData.value : fieldData.rawSelector)}</code>
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
  if (fieldValue) {
    fieldValue.addEventListener('input', handleFieldInput);
    autoResizeTextarea(fieldValue);
  }
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
  const webViewBtn = document.getElementById('webViewBtn');
  if (webViewBtn) {
    webViewBtn.addEventListener('click', () => {
      const fields = getFields();
      const rule = getRuleState();
      const field = fields[rule.currentStep];
      if (!rule.fields[field.key]) rule.fields[field.key] = {};
      rule.fields[field.key].webView = !rule.fields[field.key].webView;
      saveState();
      renderFields();
    });
  }
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
  const listFields = ['bookList', 'chapterList'];

  if (rule.fieldStates[field.key] === 'manual') {
    // Confirm: manual → selected
    rule.fieldStates[field.key] = 'selected';
    // Trigger preview for confirmed manual input
    const value = rule.fields[field.key]?.value?.trim();
    if (value && !value.startsWith('<js>')) {
      previewManualSelector(field.key, value);
      // Set bookListSelector for list fields so subsequent fields can scope selection
      if (listFields.includes(field.key)) {
        rule.bookListSelector = value;
      }
    }
  } else {
    // Enter manual mode: clear selector info from previous selection
    rule.fieldStates[field.key] = 'manual';
    rule.fields[field.key] = rule.fields[field.key] || { value: '', state: 'manual', rawSelector: '' };
    rule.fields[field.key].state = 'manual';
    rule.fields[field.key].rawSelector = '';
    rule.fields[field.key].previews = undefined;
  }

  saveState();
  renderFields();
  renderFieldStatusSummary();
  updateStepIndicator();

  if (rule.fieldStates[field.key] === 'manual') {
    setTimeout(() => {
      const input = document.getElementById('fieldValue');
      if (input) input.focus();
    }, 50);
  }
}

function resolvePreviewSelector(input) {
  const raw = (input || '').trim();
  if (!raw) return '';

  const canQuery = (sel) => {
    try {
      document.createElement('div').querySelector(sel);
      return true;
    } catch (e) {
      return false;
    }
  };

  if (canQuery(raw)) return raw;

  let candidate = raw
    .replace(/^<js>\s*/i, '')
    .replace(/\s*<\/js>$/i, '')
    .trim();

  candidate = candidate.replace(/\s*@[^@\s]+$/, '').trim();

  if (candidate && canQuery(candidate)) return candidate;

  return '';
}

function previewManualSelector(fieldKey, selector) {
  const previewSelector = resolvePreviewSelector(selector);

  // Always set rawSelector so the rule label shows even if preview fails
  const rule = getRuleState();
  const fieldData = rule.fields[fieldKey];
  if (fieldData) {
    fieldData.rawSelector = previewSelector || selector;
    // Set bookListSelector for list fields so subsequent fields can scope selection
    const listFields = ['bookList', 'chapterList'];
    if (listFields.includes(fieldKey)) {
      rule.bookListSelector = previewSelector || selector;
    }
    saveState();
    renderFields();
  }

  if (!previewSelector) return;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return;
    chrome.tabs.sendMessage(tabs[0].id, {
      action: 'previewSelector',
      selector: previewSelector,
    }, (response) => {
      if (chrome.runtime.lastError || !response) return;
      const rule = getRuleState();
      const fieldData = rule.fields[fieldKey];
      if (fieldData) {
        fieldData.previews = response.previews || [];
        saveState();
        renderFields();
      }
    });
  });
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

    let endExpr;
    if (endVal > 0) {
      endExpr = String(endVal);
    } else if (endVal === -1) {
      endExpr = 'list.size()';
    } else if (endVal < -1) {
      endExpr = `list.size() + (${endVal}) + 1`;
    } else {
      endExpr = 'list.size()';
    }

    const s = startVal > 1 ? startVal - 1 : 0;
    let jsCode;
    if (startVal > 1 || endVal > 0 || endVal < -1) {
      jsCode = buildJsRule(`        var doc = org.jsoup.Jsoup.parse(result);
        var list = doc.select("${baseSelector}");
        var start = ${s};
        var end = ${endExpr};
        var result = new org.jsoup.select.Elements();
        for (var i = start; i < end; i++) {
          result.add(list.get(i));
        }
        return result;`, true);
    } else {
      jsCode = buildJsRule(`        var doc = org.jsoup.Jsoup.parse(result);
        var list = doc.select("${baseSelector}");
        return list;`, true);
    }

    rule.fields[field.key].value = jsCode;
  } else {
    const singleVal = fieldData.listIndex.single ? parseInt(fieldData.listIndex.single, 10) : 0;
    const selectedTag = fieldData.tagName || '';

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

      jsCode = buildJsRule(`    var doc = org.jsoup.Jsoup.parse(result);
    var list = doc.select("${baseSelector}");
    var index = ${index};
    return ${returnExpr};`);
    } else {
      if (['bookUrl', 'chapterUrl', 'tocUrl', 'nextTocUrl', 'nextContentUrl'].includes(field.key)) {
        jsCode = selectedTag === 'a' ? baseSelector + '@href' : baseSelector + ' a@href';
      } else if (field.key === 'coverUrl') {
        jsCode = selectedTag === 'img' ? baseSelector + '@src' : baseSelector + ' img@src';
      } else {
        jsCode = baseSelector + '@text';
      }
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
  let value = e.target.value;

  // Strip webView suffix if the field has webView enabled,
  // so we store the raw rule and apply webView dynamically on export/display
  if (rule.fields[field.key]?.webView && LINK_FIELDS.includes(field.key)) {
    value = stripWebView(value);
  }

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

  autoResizeTextarea(document.getElementById('bookSourceName'));
  autoResizeTextarea(document.getElementById('bookSourceUrl'));
  autoResizeTextarea(document.getElementById('searchUrlTemplate'));

  document.getElementById('autoFillBtn').addEventListener('click', handleAutoFill);
  document.getElementById('checkUpdateBtn').addEventListener('click', handleCheckUpdate);
  document.getElementById('closeUpdateBtn').addEventListener('click', () => {
    document.getElementById('updateModal').classList.add('hidden');
  });
  document.getElementById('debugTutorialBtn')?.addEventListener('click', () => {
    document.getElementById('debugTutorialModal')?.classList.remove('hidden');
  });
  document.getElementById('closeDebugTutorialBtn')?.addEventListener('click', () => {
    document.getElementById('debugTutorialModal')?.classList.add('hidden');
  });

  document.getElementById('captureSearchUrlBtn').addEventListener('click', handleCaptureSearchUrl);
  document.getElementById('searchCaptureCancelListenBtn').addEventListener('click', handleCancelSearchListen);
  document.getElementById('searchMethod').addEventListener('change', onSearchConfigChange);
  document.getElementById('searchCharset').addEventListener('input', rebuildSearchUrlFromForm);
  document.getElementById('searchWebView').addEventListener('change', rebuildSearchUrlFromForm);
  document.getElementById('searchBodyTemplate').addEventListener('input', () => {
    autoResizeTextarea(document.getElementById('searchBodyTemplate'));
    rebuildSearchUrlFromForm();
  });
  document.getElementById('searchUrlTemplate').addEventListener('input', () => {
    autoResizeTextarea(document.getElementById('searchUrlTemplate'));
    state.searchConfig = null;
    saveState();
  });
  document.getElementById('insertPagePlaceholderBtn').addEventListener('click', () => {
    const el = document.getElementById('searchUrlTemplate');
    const pos = el.selectionStart;
    const before = el.value.substring(0, pos);
    const after = el.value.substring(pos);
    el.value = before + '{{page}}' + after;
    autoResizeTextarea(el);
    saveState();
    el.focus();
  });

  // Debug panel events
  ['debugIp1', 'debugIp2', 'debugIp3', 'debugIp4'].forEach((id, idx) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', (e) => {
      // Only allow digits
      e.target.value = e.target.value.replace(/\D/g, '');
      // Auto-advance to next field when 3 digits entered
      if (e.target.value.length >= 3) {
        const nextId = ['debugIp2', 'debugIp3', 'debugIp4'][idx];
        if (nextId) document.getElementById(nextId)?.focus();
      }
      saveState();
    });
    el.addEventListener('keydown', (e) => {
      // Move to previous field on backspace if empty
      if (e.key === 'Backspace' && e.target.value === '') {
        const prevId = ['debugIp1', 'debugIp2', 'debugIp3'][idx - 1];
        if (prevId) document.getElementById(prevId)?.focus();
      }
      // Move to next field on period/dot
      if (e.key === '.' || e.key === 'Tab') {
        if (e.key === '.') e.preventDefault();
        const nextId = ['debugIp2', 'debugIp3', 'debugIp4'][idx];
        if (nextId) document.getElementById(nextId)?.focus();
      }
    });
  });
  document.getElementById('debugPort')?.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '');
    saveState();
  });
  document.getElementById('advancedHeadersList')?.addEventListener('input', saveState);
  document.getElementById('advancedHeadersList')?.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action="remove"]');
    if (!target) return;
    const row = target.closest('.advanced-item');
    const index = Number(row?.dataset?.index);
    if (Number.isNaN(index) || !Array.isArray(state.headerItems)) return;
    state.headerItems.splice(index, 1);
    renderHeaderItems();
    saveState();
  });
  document.getElementById('addHeaderItemBtn')?.addEventListener('click', () => addHeaderItem('', ''));
  document.getElementById('addUaHeaderBtn')?.addEventListener('click', addDefaultUserAgentHeader);
  document.getElementById('addRefererHeaderBtn')?.addEventListener('click', addDefaultRefererHeader);
  document.getElementById('enableCfShield')?.addEventListener('change', saveState);
  document.getElementById('debugStartBtn')?.addEventListener('click', handleDebugStart);
  document.getElementById('debugStopBtn')?.addEventListener('click', handleDebugStop);
}

function handleAutoFill() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return;
    const tab = tabs[0];
    const nameEl = document.getElementById('bookSourceName');
    const urlEl = document.getElementById('bookSourceUrl');

    if (nameEl) nameEl.value = tab.title || '';
    if (urlEl) {
      try {
        const url = new URL(tab.url);
        urlEl.value = url.origin;
      } catch {
        urlEl.value = tab.url || '';
      }
    }

    autoResizeTextarea(nameEl);
    autoResizeTextarea(urlEl);
    saveState();
  });
}

function handleCheckUpdate() {
  const modal = document.getElementById('updateModal');
  const currentEl = document.getElementById('currentVersion');
  const latestEl = document.getElementById('latestVersion');
  const statusEl = document.getElementById('updateStatus');

  modal.classList.remove('hidden');
  const currentVersion = chrome.runtime.getManifest().version;
  currentEl.textContent = currentVersion;
  latestEl.textContent = '检查中...';
  statusEl.textContent = '';

  getLatestVersionWithFallback()
    .then(latest => {
      latestEl.textContent = latest;
      const compareResult = compareVersions(latest, currentVersion);

      if (compareResult > 0) {
        statusEl.textContent = '发现新版本';
        statusEl.style.color = 'var(--success)';
      } else {
        statusEl.textContent = '已是最新版本';
        statusEl.style.color = '';
      }
    })
    .catch(() => {
      latestEl.textContent = '检查失败';
      statusEl.textContent = '请检查网络连接或手动访问仓库查看';
      statusEl.style.color = 'var(--danger)';
    });
}

async function getLatestVersionWithFallback() {
  try {
    return await fetchLatestTagFromGitee();
  } catch {
    return fetchLatestTagFromGitHub();
  }
}

function fetchLatestTagFromGitee() {
  return fetchLatestTagVersion('https://gitee.com/api/v5/repos/z1131392774/legado-source-generator/tags', 'name');
}

function fetchLatestTagFromGitHub() {
  return fetchLatestTagVersion('https://api.github.com/repos/z1131392774/legado-source-generator/tags', 'name');
}

async function fetchLatestTagVersion(url, fieldName) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Network error');

  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) throw new Error('No tags found');

  const versions = data
    .map(item => normalizeTagVersion(item?.[fieldName]))
    .filter(Boolean);

  if (!versions.length) throw new Error('No valid semver tag found');

  return versions.reduce((latest, current) => {
    if (!latest) return current;
    return compareVersions(current, latest) > 0 ? current : latest;
  }, '');
}

function normalizeTagVersion(tagName) {
  if (typeof tagName !== 'string') return '';
  const version = tagName.trim().replace(/^v/i, '');
  return /^\d+(\.\d+){1,3}$/.test(version) ? version : '';
}

function compareVersions(a, b) {
  const pa = String(a).split('.').map(n => parseInt(n, 10) || 0);
  const pb = String(b).split('.').map(n => parseInt(n, 10) || 0);
  const length = Math.max(pa.length, pb.length);

  for (let i = 0; i < length; i += 1) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }

  return 0;
}

function autoResizeTextarea(el) {
  if (!el) return;
  const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 19;
  const maxHeight = lineHeight * 10;
  const resize = () => {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, maxHeight) + 'px';
  };
  el.addEventListener('input', resize);
  resize();
}

function handleNext() {
  const fields = getFields();
  const rule = getRuleState();
  const field = fields[rule.currentStep];
  const fieldState = rule.fieldStates[field.key];

  if (field.required) {
    if (!fieldState || fieldState === 'pending' || fieldState === 'skipped') {
      showToast(`请完成必填字段"${field.label}"`, 'warning');
      return;
    }
    if (fieldState === 'manual') {
      const fieldData = rule.fields[field.key];
      if (!fieldData || !fieldData.value || !fieldData.value.trim()) {
        showToast(`请输入"${field.label}"的值`, 'warning');
        return;
      }
    }
  }

  if (rule.currentStep === fields.length - 1) {
    handleExport();
  } else {
    goToNextStep();
  }
}

function handleExport() {
  const bookSourceName = (state.bookSourceName || '').trim();
  const bookSourceUrl = (state.bookSourceUrl || '').trim();
  if (!bookSourceName) {
    showToast('请先填写书源名称', 'warning');
    return;
  }
  if (!bookSourceUrl) {
    showToast('请先填写书源 URL', 'warning');
    return;
  }
  const jsonData = generateJson();
  const textarea = document.getElementById('jsonOutput');
  textarea.value = JSON.stringify(jsonData, null, 2);
  textarea.dataset.downloadJson = JSON.stringify([jsonData], null, 2);
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
    bookSourceUrl: (state.bookSourceUrl || '').trim(),
    bookSourceName: (state.bookSourceName || '').trim(),
    searchUrl: state.searchUrl || '',
    exploreUrl: exploreUrlValue,
  };

  const items = Array.isArray(state.headerItems) ? state.headerItems : [];
  const header = {};
  items.forEach(item => {
    const key = (item?.key || '').trim();
    const value = (item?.value || '').trim();
    if (key && value) {
      header[key] = value;
    }
  });
  result.header = header;
  result.loginCheckJs = state.enableCfShield ? CF_LOGIN_CHECK_JS : '';

  return result;
}

const LINK_FIELDS = ['bookUrl', 'chapterUrl', 'tocUrl', 'nextTocUrl', 'nextContentUrl'];

function applyWebView(rule) {
  if (!rule) return rule;
  if (rule.includes('{"webView":true}')) return rule; // already applied
  if (rule.includes('<js>') && rule.includes('</js>')) {
    // JS script: only modify the return in the try block (before }catch or } catch),
    // not the catch block's return ""+e
    const catchIdx = rule.search(/\}\s*catch/);
    if (catchIdx !== -1) {
      const tryPart = rule.substring(0, catchIdx);
      const catchPart = rule.substring(catchIdx);
      const modified = tryPart.replace(/return\s+([^;]+);/g, "return $1 + ',{\"webView\":true}';");
      return modified + catchPart;
    }
    // Fallback: no catch block found, replace all returns
    return rule.replace(/return\s+([^;]+);/g, "return $1 + ',{\"webView\":true}';");
  } else {
    // Pure selector: append @js suffix
    return rule + "@js:result+',{\"webView\":true}'";
  }
}

function stripWebView(rule) {
  if (!rule) return rule;
  // Strip @js suffix for pure selectors
  let stripped = rule.replace(/@js:result\+',\{"webView":true\}'$/, '');
  if (stripped !== rule) return stripped;
  // Strip webView from JS return statements (only in try block)
  const catchIdx = rule.search(/\}\s*catch/);
  if (catchIdx !== -1) {
    const tryPart = rule.substring(0, catchIdx);
    const catchPart = rule.substring(catchIdx);
    const modified = tryPart.replace(/ \+',\{"webView":true\}'/g, '');
    return modified + catchPart;
  }
  // Fallback: no catch block, strip all occurrences
  stripped = rule.replace(/ \+',\{"webView":true\}'/g, '');
  return stripped;
}

function buildRuleSection(type) {
  const rule = state.rules[type];
  const fields = RULE_TYPES[type].fields;
  const section = {};

  fields.forEach(field => {
    const fieldData = rule.fields[field.key];
    if (fieldData && fieldData.value) {
      let value = fieldData.value;
      if (fieldData.webView && LINK_FIELDS.includes(field.key)) {
        value = applyWebView(value);
      }
      section[field.key] = value;
    }
  });

  return section;
}

function handleCopy() {
  const textarea = document.getElementById('jsonOutput');
  navigator.clipboard.writeText(textarea.value).then(() => {
    showToast('已复制到剪贴板', 'info');
  }).catch(() => {
    textarea.select();
    document.execCommand('copy');
  });
}

function handleDownload() {
  const textarea = document.getElementById('jsonOutput');
  const jsonStr = textarea.dataset.downloadJson || textarea.value;
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
  state.activeRuleType = 'search';
  state.searchUrl = '';
  state.searchConfig = null;
  state.bookSourceName = '';
  state.bookSourceUrl = '';

  chrome.storage.local.remove(['legadoSourceState', 'exploreEditorState']);

  document.getElementById('bookSourceName').value = '';
  document.getElementById('bookSourceUrl').value = '';
  document.getElementById('searchUrlTemplate').value = '';
  document.getElementById('searchMethod').value = 'GET';
  document.getElementById('searchCharset').value = '';
  document.getElementById('searchWebView').value = 'false';
  document.getElementById('searchBodyTemplate').value = '';

  // Reset debug panel
  document.getElementById('debugKey').value = '';
  document.getElementById('debugResult').textContent = '';
  const debugIpParts = document.querySelectorAll('#debugIp1, #debugIp2, #debugIp3, #debugIp4');
  debugIpParts.forEach(el => el.value = '');
  document.getElementById('debugPort').value = '';
  if (debugWs) {
    debugWs.close();
    debugWs = null;
  }
  debugFinished = false;
  if (debugTimeout) {
    clearTimeout(debugTimeout);
    debugTimeout = null;
  }
  document.getElementById('debugStartBtn').disabled = false;
  document.getElementById('debugStopBtn').disabled = true;

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

function toLegadoRule(selector, fieldKey, fieldData, tagName) {
  const listFields = ['bookList', 'chapterList'];
  const isListField = listFields.includes(fieldKey);

  // Get index info
  const hasListIndex = fieldData?.listIndex?.start || fieldData?.listIndex?.end;
  const hasSingleIndex = fieldData?.listIndex?.single !== undefined && fieldData?.listIndex?.single !== '';
  const hasIndex = isListField ? hasListIndex : hasSingleIndex;

  // Helper: build @ selector with smart attribute detection
  function buildAtSelector(sel, key, tag) {
    const linkFields = ['bookUrl', 'chapterUrl', 'tocUrl', 'nextTocUrl', 'nextContentUrl'];
    if (linkFields.includes(key)) {
      // If the selected element is already a link, use it directly
      return tag === 'a' ? sel + '@href' : sel + ' a@href';
    } else if (key === 'coverUrl') {
      return tag === 'img' ? sel + '@src' : sel + ' img@src';
    } else {
      return sel + '@text';
    }
  }

  // No index: return selector with @ extraction suffix
  if (!hasIndex) {
    if (isListField) {
      return selector;
    }
    return buildAtSelector(selector, fieldKey, tagName);
  }

  // Has index: generate JS code
  const startVal = fieldData.listIndex.start ? parseInt(fieldData.listIndex.start, 10) : 0;
  const endVal = fieldData.listIndex.end ? parseInt(fieldData.listIndex.end, 10) : 0;
  const singleVal = fieldData.listIndex.single ? parseInt(fieldData.listIndex.single, 10) : 0;

  // Validate parse result
  if (isNaN(startVal) || isNaN(endVal) || isNaN(singleVal)) {
    return selector; // Fallback to pure selector on invalid input
  }

  if (isListField) {
    // Note: List fields (bookList/chapterList) typically don't reach here because
    // they usually go through handleIndexApply() after index input.
    // This branch exists as defensive coding for edge cases.
    return selector;
  }

  // Non-list field with index
  const index = singleVal > 0 ? singleVal - 1 : singleVal;

  // If index is 0 (default), no need to generate JS - return selector with @ suffix
  if (index === 0) {
    return buildAtSelector(selector, fieldKey, tagName);
  }

  let returnExpr;
  const linkFields = ['bookUrl', 'chapterUrl', 'tocUrl', 'nextTocUrl', 'nextContentUrl'];
  if (linkFields.includes(fieldKey)) {
    const childSel = tagName === 'a' ? '' : ' a';
    returnExpr = `String(list.select("${selector}${childSel}").get(${index}).attr("href"))`;
  } else if (fieldKey === 'coverUrl') {
    const childSel = tagName === 'img' ? '' : ' img';
    returnExpr = `String(list.select("${selector}${childSel}").get(${index}).attr("src"))`;
  } else {
    returnExpr = `String(list.get(${index}).text())`;
  }

  return buildJsRule(`    var doc = org.jsoup.Jsoup.parse(result);
    var list = doc.select("${selector}");
    return ${returnExpr};`);
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
  const fieldData = rule.fields[step] || {};
  const legadoRule = toLegadoRule(selector, step, fieldData, message.tagName);

  rule.fields[step] = {
    value: legadoRule,
    state: 'selected',
    rawSelector: selector,
    tagName: message.tagName || '',
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
      case 'showToast':
        showToast(message.message, message.type);
        break;
      case 'searchCaptured':
        handleSearchCaptured(message);
        // Stop the content script capture
        if (searchCaptureTabId) {
          chrome.tabs.sendMessage(searchCaptureTabId, { action: 'stopSearchCapture' });
        }
        break;
      case 'searchCaptureForms':
        handleSearchCaptureForms(message);
        break;
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

/**
 * Show toast notification (same style as picker.js)
 * @param {string} message - Toast message
 * @param {string} type - Toast type: 'warning' | 'error' | 'info'
 */
function showToast(message, type = 'warning') {
  const colors = {
    warning: '#faad14',
    error: '#ff4d4f',
    info: '#1890ff'
  };

  let container = document.getElementById('popup-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'popup-toast-container';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 2147483647;
      display: flex;
      flex-direction: column;
      gap: 8px;
      pointer-events: none;
    `;
    document.documentElement.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `popup-toast popup-toast-${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    background: ${colors[type] || colors.warning};
    color: #fff;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 13px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    animation: toast-in 0.3s ease;
  `;
  container.appendChild(toast);

  setTimeout(() => {
    if (toast && toast.parentNode) {
      toast.style.animation = 'toast-out 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }
  }, 4000);
}

/* ============================================
   Search URL Capture
   ============================================ */

let searchCaptureTabId = null;
let searchCaptureReceived = false; // Track if we already received a capture
let searchCaptureCancelled = false; // Track if user cancelled the capture

function handleCaptureSearchUrl() {
  state.activeMode = 'searchUrl';
  saveState();
  renderModeTabs();
  updateEditorVisibility();

  searchCaptureCancelled = false; // Reset cancelled flag for new capture

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return;
    searchCaptureTabId = tabs[0].id;

    // Show modal with listening state
    openSearchCaptureModal();
    showSearchCaptureListening();

    // Inject content script if needed, then start capture
    injectSearchCaptureScript(tabs[0].id, () => {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'startSearchCapture' }, (response) => {
        if (chrome.runtime.lastError) {
          showToast('无法注入脚本，请确认当前页面可访问', 'error');
          closeSearchCaptureModal();
        }
      });
    });
  });
}

function injectSearchCaptureScript(tabId, callback) {
  const inject = typeof chrome.scripting !== 'undefined'
    ? () => chrome.scripting.executeScript({
        target: { tabId },
        files: ['content/search-capture.js'],
      })
    : () => new Promise((resolve) => {
        chrome.tabs.executeScript(tabId, { file: 'content/search-capture.js' }, resolve);
      });

  inject().then(callback).catch(() => {
    showToast('脚本注入失败', 'error');
    closeSearchCaptureModal();
  });
}

function handleCancelSearchListen() {
  if (searchCaptureTabId) {
    chrome.tabs.sendMessage(searchCaptureTabId, { action: 'stopSearchCapture' });
  }
  searchCaptureCancelled = true; // Prevent subsequent searchCaptureForms from filling
  closeSearchCaptureModal();
}

function openSearchCaptureModal() {
  searchCaptureReceived = false;
  document.getElementById('searchCaptureListening').classList.add('hidden');
  document.getElementById('searchCaptureForm').classList.remove('hidden');
  // Auto-resize textareas
  autoResizeTextarea(document.getElementById('searchUrlTemplate'));
  autoResizeTextarea(document.getElementById('searchBodyTemplate'));
}

function closeSearchCaptureModal() {
  document.getElementById('searchCaptureListening').classList.add('hidden');
  document.getElementById('searchCaptureForm').classList.remove('hidden');
  searchCaptureTabId = null;
}

function showSearchCaptureListening() {
  document.getElementById('searchCaptureListening').classList.remove('hidden');
  document.getElementById('searchCaptureForm').classList.add('hidden');
}

function showSearchCaptureForm(data) {
  document.getElementById('searchCaptureListening').classList.add('hidden');
  document.getElementById('searchCaptureForm').classList.remove('hidden');

  const methodEl = document.getElementById('searchMethod');
  const urlEl = document.getElementById('searchUrlTemplate');
  const charsetEl = document.getElementById('searchCharset');
  const bodyEl = document.getElementById('searchBodyTemplate');
  const bodyField = document.getElementById('searchBodyField');

  methodEl.value = data.method || 'GET';
  charsetEl.value = data.charset || 'utf-8';
  bodyEl.value = data.body || '';

  const webViewEl = document.getElementById('searchWebView');
  webViewEl.value = (data.webView === true || data.webView === 'true') ? 'true' : 'false';

  // Build complete Legado-format search URL
  const method = methodEl.value;
  const charset = charsetEl.value;
  const body = bodyEl.value;
  const webView = webViewEl.value === 'true';
  const url = data.url || '';

  const needsCharset = charset && charset !== 'utf-8';
  if (method === 'POST' || needsCharset || webView) {
    // POST, non-UTF8, or webView: use JSON format
    const config = {};
    if (needsCharset) config.charset = charset;
    config.method = method;
    if (method === 'POST' && body) {
      config.body = body;
    }
    if (webView) {
      config.webView = true;
    }
    urlEl.value = url + ',' + JSON.stringify(config);
    bodyField.classList.remove('hidden');
  } else {
    // Simple GET UTF-8
    urlEl.value = url;
    bodyField.classList.add('hidden');
  }

  // Auto-resize textareas
  autoResizeTextarea(urlEl);
  autoResizeTextarea(bodyEl);
  syncSearchUrlState();
}

function onSearchConfigChange() {
  const method = document.getElementById('searchMethod').value;
  const bodyField = document.getElementById('searchBodyField');
  // POST Body 始终显示
  rebuildSearchUrlFromForm();
}

/**
 * Rebuild the search URL textarea when user edits method/charset/body in the capture form
 */
function rebuildSearchUrlFromForm() {
  const urlEl = document.getElementById('searchUrlTemplate');
  const methodEl = document.getElementById('searchMethod');
  const charsetEl = document.getElementById('searchCharset');
  const bodyEl = document.getElementById('searchBodyTemplate');
  const webViewEl = document.getElementById('searchWebView');

  const method = methodEl.value;
  const charset = charsetEl.value;
  const body = bodyEl.value;
  const webView = webViewEl.value === 'true';

  // Extract base URL (everything before the first comma+JSON)
  let baseUrl = urlEl.value || '';
  const commaIdx = baseUrl.indexOf(',{');
  if (commaIdx !== -1) {
    baseUrl = baseUrl.substring(0, commaIdx);
  }

  const needsCharset = charset && charset !== 'utf-8';
  if (method === 'POST' || needsCharset || webView) {
    const config = {};
    if (needsCharset) config.charset = charset;
    config.method = method;
    if (method === 'POST' && body) {
      config.body = body;
    }
    if (webView) {
      config.webView = true;
    }
    urlEl.value = baseUrl + ',' + JSON.stringify(config);
  } else {
    urlEl.value = baseUrl;
  }

  syncSearchUrlState();
}

function handleSearchCaptureConfirm() {
  const url = document.getElementById('searchUrlTemplate').value.trim();

  if (!url) {
    showToast('请输入搜索 URL', 'warning');
    return;
  }

  // 下方搜索 URL 输入框作为唯一数据源
  const searchUrlEl = document.getElementById('searchUrlTemplate');
  searchUrlEl.value = url;
  autoResizeTextarea(searchUrlEl);

  // Save state
  const method = document.getElementById('searchMethod').value;
  const charset = document.getElementById('searchCharset').value.trim() || 'utf-8';
  const body = document.getElementById('searchBodyTemplate').value.trim();
  state.searchConfig = { method, url, charset, body, pageTemplate: '' };
  saveState();

  showToast('搜索 URL 已更新', 'info');
  closeSearchCaptureModal();
}

function handleSearchCaptured(message) {
  // Called when a search request is captured
  searchCaptureReceived = true;
  console.log('[popup] searchCaptured received:', {
    method: message.method,
    url: message.url,
    charset: message.charset,
    body: message.body,
  });
  showSearchCaptureForm({
    method: message.method,
    url: message.url,
    charset: message.charset,
    body: message.body,
    forms: message.forms,
  });
}

function handleSearchCaptureForms(message) {
  // Fallback: called when forms are detected but no request was captured
  // Skip if we already received searchCaptured (don't overwrite correct data)
  // Skip if user cancelled the capture
  if (searchCaptureReceived || searchCaptureCancelled) return;

  if (message.forms && message.forms.length > 0) {
    const form = message.forms.find(f => f.hasSearchInput) || message.forms[0];
    if (form && form.action) {
      showSearchCaptureForm({
        method: form.method,
        url: form.action,
        charset: form.charset,
        body: '',
        forms: message.forms,
      });
      return;
    }
  }

  // No forms found, show blank form
  showSearchCaptureForm({
    method: 'GET',
    url: '',
    charset: message.charset || 'utf-8',
    body: '',
    forms: [],
  });
}
