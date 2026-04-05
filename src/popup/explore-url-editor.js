const EXPLORE_PROPS = [
  'layout_flexGrow',
  'layout_flexShrink',
  'layout_alignSelf',
  'layout_flexBasisPercent',
  'layout_wrapBefore',
];

let exploreItems = [];
let selectedCardIndex = -1;
let exploreFormat = 2;
let isCollecting = false;

function initExploreEditor() {
  bindExploreEvents();
  loadExploreState();
}

function bindExploreEvents() {
  const collectBtn = document.getElementById('exploreCollectBtn');
  if (collectBtn) collectBtn.addEventListener('click', startExploreCollection);

  const stopBtn = document.getElementById('exploreStopCollectBtn');
  if (stopBtn) stopBtn.addEventListener('click', stopExploreCollection);

  const addItemBtn = document.getElementById('exploreAddItemBtn');
  if (addItemBtn) addItemBtn.addEventListener('click', () => addExploreItem({ title: '新分类', url: '' }));

  const addSepBtn = document.getElementById('exploreAddSeparatorBtn');
  if (addSepBtn) addSepBtn.addEventListener('click', () => addExploreItem({ title: '分隔', url: '', isSeparator: true }));

  const exportBtn = document.getElementById('exploreExportBtn');
  if (exportBtn) exportBtn.addEventListener('click', exportExploreJson);

  const clearBtn = document.getElementById('exploreClearBtn');
  if (clearBtn) clearBtn.addEventListener('click', () => {
    if (exploreItems.length && !confirm('确定要清空所有发现页URL吗？')) return;
    window.clearExploreEditor();
  });

  const copyBtn = document.getElementById('exploreCopyBtn');
  if (copyBtn) copyBtn.addEventListener('click', () => {
    const textarea = document.getElementById('exploreJsonOutput');
    navigator.clipboard.writeText(textarea.value).then(() => alert('已复制到剪贴板'));
  });

  const closeBtn = document.getElementById('exploreCloseModalBtn');
  if (closeBtn) closeBtn.addEventListener('click', () => {
    document.getElementById('exploreJsonModal').classList.add('hidden');
  });

  bindExplorePreviewInput();
  bindFormatToggle();
}

function updateCollectionStatus(active, count = 0) {
  isCollecting = active;
  const statusEl = document.getElementById('exploreCollectionStatus');
  const countDisplay = document.getElementById('exploreCountDisplay');
  const collectBtn = document.getElementById('exploreCollectBtn');
  const indicatorEl = document.getElementById('exploreCollectionIndicator');

  if (active) {
    if (statusEl) statusEl.classList.remove('hidden');
    if (indicatorEl) indicatorEl.classList.remove('hidden');
    if (countDisplay) countDisplay.textContent = count;
    if (collectBtn) collectBtn.disabled = true;
  } else {
    if (statusEl) statusEl.classList.add('hidden');
    if (indicatorEl) indicatorEl.classList.add('hidden');
    if (collectBtn) collectBtn.disabled = false;
  }
}

function updateExploreCollectionIndicator(step, elementInfo, elementText) {
  const indicatorEl = document.getElementById('exploreCollectionIndicator');
  const stepEl = document.getElementById('exploreIndicatorStep');
  const elementEl = document.getElementById('exploreIndicatorElement');
  if (!indicatorEl || indicatorEl.classList.contains('hidden')) return;
  if (stepEl) stepEl.textContent = step || '-';
  if (elementEl) elementEl.textContent = elementInfo ? `${elementInfo} ${elementText || ''}` : '-';
}

function startExploreCollection() {
  if (isCollecting) return;
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return;
    const tabId = tabs[0].id;
    chrome.tabs.sendMessage(tabId, { action: 'startExploreCollector' }, (response) => {
      if (chrome.runtime.lastError) {
        chrome.scripting.executeScript({
          target: { tabId },
          files: ['content/picker.js'],
        }).then(() => {
          chrome.scripting.insertCSS({
            target: { tabId },
            files: ['content/picker.css'],
          });
          setTimeout(() => {
            chrome.tabs.sendMessage(tabId, { action: 'startExploreCollector' });
          }, 200);
        });
      }
    });
  });
}

function stopExploreCollection() {
  if (!isCollecting) return;
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return;
    chrome.tabs.sendMessage(tabs[0].id, { action: 'stopExploreCollector' });
    finishCollection();
  });
}

function finishCollection() {
  isCollecting = false;
  updateCollectionStatus(false);
}

window.handleExploreCollected = function(items) {
  items.forEach(item => {
    addExploreItem({ title: item.title, url: item.url });
  });
  updateExploreUrlPreview();
  finishCollection();
};

window.handleExploreItemCollected = function(item, total) {
  updateCollectionStatus(true, total);
  updateExploreCollectionIndicator('收集中', `<a>`, item.title);
};

window.handleExploreCollectionStarted = function() {
  updateCollectionStatus(true, 0);
};

window.handleExploreElementHover = function(message) {
  updateExploreCollectionIndicator('收集中', message.elementInfo, message.elementText);
};

function loadExploreState() {
  chrome.storage.local.get(['exploreEditorState'], (result) => {
    if (result.exploreEditorState) {
      if (result.exploreEditorState.items) {
        exploreItems = result.exploreEditorState.items;
        renderExploreCards();
      }
      if (result.exploreEditorState.format) {
        exploreFormat = result.exploreEditorState.format;
      }
      updateExploreUrlPreview();
      updateFormatButtons();
    }
  });
}

function saveExploreState() {
  chrome.storage.local.set({ exploreEditorState: { items: exploreItems, format: exploreFormat } });
}

function addExploreItem(item) {
  const defaults = {
    title: '',
    url: '',
    isSeparator: false,
    style: {
      layout_flexGrow: 1,
      layout_flexShrink: 0,
      layout_alignSelf: 'auto',
      layout_flexBasisPercent: -1,
      layout_wrapBefore: false,
    },
  };
  exploreItems.push({ ...defaults, ...item, style: { ...defaults.style, ...(item.style || {}) } });
  saveExploreState();
  renderExploreCards();
  updateExploreUrlPreview();
}

function removeExploreItem(index) {
  exploreItems.splice(index, 1);
  if (selectedCardIndex === index) selectedCardIndex = -1;
  else if (selectedCardIndex > index) selectedCardIndex--;
  saveExploreState();
  renderExploreCards();
  renderPropsPanel();
  updateExploreUrlPreview();
}

function renderExploreCards() {
  const container = document.getElementById('exploreCards');
  if (!container) return;

  container.innerHTML = exploreItems.map((item, i) => {
    const selected = i === selectedCardIndex ? ' selected' : '';
    const sepClass = item.isSeparator ? ' separator' : '';
    const flexGrow = item.style?.layout_flexGrow ?? 1;
    const flexBasis = item.style?.layout_flexBasisPercent ?? -1;
    const widthStyle = flexBasis > 0
      ? `flex: 0 0 ${flexBasis * 100}%; max-width: ${flexBasis * 100}%;`
      : `flex: 1 0 calc((100% - 8px) / 3);`;

    return `<div class="editor-card${selected}${sepClass}" data-index="${i}" style="${widthStyle}">
      <span class="card-title">${escapeHtml(item.title)}</span>
      ${item.url ? `<span class="card-url">${escapeHtml(item.url.substring(0, 40))}${item.url.length > 40 ? '...' : ''}</span>` : ''}
      <button class="card-delete" data-index="${i}">×</button>
      <div class="card-resize-handle" data-index="${i}"></div>
    </div>`;
  }).join('');

  container.querySelectorAll('.editor-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('card-delete')) return;
      if (e.target.classList.contains('card-resize-handle')) return;
      selectedCardIndex = parseInt(card.dataset.index, 10);
      renderExploreCards();
      renderPropsPanel();
    });
  });

  container.querySelectorAll('.card-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeExploreItem(parseInt(btn.dataset.index, 10));
    });
  });

  initCardDragDrop();
  initCardResize();
}

function initCardDragDrop() {
  const container = document.getElementById('exploreCards');
  if (!container) return;

  let dragIndex = -1;

  container.querySelectorAll('.editor-card').forEach(card => {
    card.draggable = true;

    card.addEventListener('dragstart', (e) => {
      dragIndex = parseInt(card.dataset.index, 10);
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      container.querySelectorAll('.editor-card').forEach(c => c.style.borderTop = '');
    });

    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const targetIndex = parseInt(card.dataset.index, 10);
      if (targetIndex !== dragIndex && dragIndex >= 0) {
        card.style.borderTop = '2px solid var(--accent)';
      }
    });

    card.addEventListener('dragleave', () => {
      card.style.borderTop = '';
    });

    card.addEventListener('drop', (e) => {
      e.preventDefault();
      card.style.borderTop = '';
      const targetIndex = parseInt(card.dataset.index, 10);
      if (targetIndex !== dragIndex && dragIndex >= 0) {
        const [moved] = exploreItems.splice(dragIndex, 1);
        exploreItems.splice(targetIndex, 0, moved);
        if (selectedCardIndex === dragIndex) selectedCardIndex = targetIndex;
        saveExploreState();
        renderExploreCards();
      }
      dragIndex = -1;
    });
  });
}

function initCardResize() {
  const container = document.getElementById('exploreCards');
  if (!container) return;

  let resizing = false;
  let resizeStartX = 0;
  let resizeCardIndex = -1;
  let resizeStartFlexBasis = 0;

  container.querySelectorAll('.card-resize-handle').forEach(handle => {
    handle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      resizing = true;
      resizeStartX = e.clientX;
      resizeCardIndex = parseInt(handle.dataset.index, 10);
      resizeStartFlexBasis = exploreItems[resizeCardIndex].style?.layout_flexBasisPercent ?? -1;
      document.addEventListener('mousemove', onResizeMove);
      document.addEventListener('mouseup', onResizeEnd);
    });
  });

  function onResizeMove(e) {
    if (!resizing || resizeCardIndex < 0) return;
    const dx = e.clientX - resizeStartX;
    const pctChange = dx / 100;
    const newBasis = Math.round((Math.max(-1, Math.min(1, resizeStartFlexBasis + pctChange))) * 100) / 100;
    exploreItems[resizeCardIndex].style.layout_flexBasisPercent = newBasis;
    renderExploreCards();
    if (selectedCardIndex === resizeCardIndex) renderPropsPanel();
  }

  function onResizeEnd() {
    resizing = false;
    resizeCardIndex = -1;
    saveExploreState();
    document.removeEventListener('mousemove', onResizeMove);
    document.removeEventListener('mouseup', onResizeEnd);
  }
}

function renderPropsPanel() {
  const container = document.getElementById('exploreProps');
  if (!container) return;

  if (selectedCardIndex < 0 || selectedCardIndex >= exploreItems.length) {
    container.innerHTML = '<div class="props-placeholder">选择卡片编辑样式</div>';
    return;
  }

  const item = exploreItems[selectedCardIndex];
  const s = item.style || {};

  container.innerHTML = `
    <div class="props-form">
      <label>
        <span>标题</span>
        <textarea id="propTitle" rows="2">${escapeHtml(item.title)}</textarea>
      </label>
      <label>
        <span>URL</span>
        <textarea id="propUrl" rows="2" ${item.isSeparator ? 'readonly placeholder="分隔项无URL"' : ''}>${escapeHtml(item.url)}</textarea>
      </label>
      <div class="prop-row">
        <span class="prop-label">layout_flexGrow</span>
        <input type="number" id="propFlexGrow" value="${s.layout_flexGrow ?? 1}" step="1">
      </div>
      <div class="prop-row">
        <span class="prop-label">layout_flexShrink</span>
        <input type="number" id="propFlexShrink" value="${s.layout_flexShrink ?? 0}" step="1">
      </div>
      <div class="prop-row">
        <span class="prop-label">layout_alignSelf</span>
        <input type="text" id="propAlignSelf" value="${s.layout_alignSelf ?? 'auto'}">
      </div>
      <div class="prop-row">
        <span class="prop-label">layout_flexBasisPercent</span>
        <input type="number" id="propFlexBasisPercent" value="${s.layout_flexBasisPercent ?? -1}" step="0.1">
      </div>
      <div class="prop-row">
        <span class="prop-label">layout_wrapBefore</span>
        <input type="checkbox" id="propWrapBefore" ${s.layout_wrapBefore ? 'checked' : ''}>
      </div>
    </div>
  `;

  const bind = (id, prop, transform) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
      const val = transform ? transform(el) : el.value;
      exploreItems[selectedCardIndex].style[prop] = val;
      saveExploreState();
      renderExploreCards();
    });
    if (el.type === 'checkbox') {
      el.addEventListener('change', () => {
        exploreItems[selectedCardIndex].style[prop] = el.checked;
        saveExploreState();
        renderExploreCards();
      });
    }
  };

  bind('propTitle', 'title', el => el.value);
  bind('propUrl', 'url', el => el.value);
  bind('propFlexGrow', 'layout_flexGrow', el => parseFloat(el.value) || 0);
  bind('propFlexShrink', 'layout_flexShrink', el => parseFloat(el.value) || 0);
  bind('propAlignSelf', 'layout_alignSelf', el => el.value);
  bind('propFlexBasisPercent', 'layout_flexBasisPercent', el => parseFloat(el.value) ?? -1);
  bind('propWrapBefore', 'layout_wrapBefore', el => el.checked);

  const propTitle = document.getElementById('propTitle');
  const propUrl = document.getElementById('propUrl');
  if (propTitle) autoResize(propTitle);
  if (propUrl) autoResize(propUrl);
}

function autoResize(el) {
  const resize = () => {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  };
  el.addEventListener('input', resize);
  resize();
}

function exportExploreJson() {
  const output = exploreFormat === 1
    ? itemsToExploreUrlFormat1(exploreItems)
    : JSON.stringify(itemsToExploreJson(exploreItems), null, 2);

  document.getElementById('exploreJsonOutput').value = output;
  document.getElementById('exploreJsonModal').classList.remove('hidden');
}

function getExploreJsonString() {
  return exploreFormat === 1
    ? itemsToExploreUrlFormat1(exploreItems)
    : itemsToExploreJson(exploreItems);
}

window.getExploreUrlEditorItems = getExploreJsonString;
window.itemsToExploreUrl = itemsToExploreUrl;
window.clearExploreEditor = function() {
  exploreItems = [];
  selectedCardIndex = -1;
  saveExploreState();
  renderExploreCards();
  renderPropsPanel();
  updateExploreUrlPreview();
};

function itemsToExploreUrl(items) {
  return items.map(item => {
    const url = item.isSeparator ? '' : item.url;
    return `${item.title}::${url}`;
  }).join('\n');
}

function updateExploreUrlPreview() {
  const textarea = document.getElementById('exploreUrlPreview');
  if (!textarea) return;
  if (!exploreItems.length) {
    textarea.value = '';
    textarea.style.height = 'auto';
    return;
  }
  textarea.value = exploreFormat === 1
    ? itemsToExploreUrlFormat1(exploreItems)
    : JSON.stringify(itemsToExploreJson(exploreItems), null, 2);
  autoResizePreview();
}

function autoResizePreview() {
  const textarea = document.getElementById('exploreUrlPreview');
  if (!textarea) return;
  const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight) || 19;
  const maxHeight = lineHeight * 10;
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + 'px';
}

function itemsToExploreUrlFormat1(items) {
  return items.map(item => {
    const url = item.isSeparator ? '' : item.url;
    return `${item.title}::${url}`;
  }).join('\n');
}

function itemsToExploreJson(items) {
  return items.map(item => {
    const obj = { title: item.title, url: item.url };
    const style = {};
    EXPLORE_PROPS.forEach(prop => {
      const val = item.style?.[prop];
      if (val !== undefined && val !== null && val !== false && val !== 'auto' && val !== -1 && val !== 0) {
        style[prop] = val;
      }
    });
    if (Object.keys(style).length > 0) obj.style = style;
    return obj;
  });
}

function bindFormatToggle() {
  document.querySelectorAll('.format-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      exploreFormat = parseInt(btn.dataset.format, 10);
      saveExploreState();
      updateExploreUrlPreview();
      updateFormatButtons();
    });
  });
}

function updateFormatButtons() {
  document.querySelectorAll('.format-btn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.format, 10) === exploreFormat);
  });
}

function bindExplorePreviewInput() {
  const textarea = document.getElementById('exploreUrlPreview');
  if (!textarea) return;

  textarea.addEventListener('input', () => {
    const lines = textarea.value.split('\n').filter(l => l.trim());
    exploreItems = lines.map(line => {
      const sepIdx = line.indexOf('::');
      if (sepIdx === -1) {
        return { title: line.trim(), url: '', isSeparator: false, style: getDefaultStyle() };
      }
      const title = line.substring(0, sepIdx).trim();
      const url = line.substring(sepIdx + 2).trim();
      return { title, url, isSeparator: !url, style: getDefaultStyle() };
    });
    saveExploreState();
    renderExploreCards();
    renderPropsPanel();
  });
}

function getDefaultStyle() {
  return {
    layout_flexGrow: 1,
    layout_flexShrink: 0,
    layout_alignSelf: 'auto',
    layout_flexBasisPercent: -1,
    layout_wrapBefore: false,
  };
}