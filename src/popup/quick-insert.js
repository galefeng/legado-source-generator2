(function() {
'use strict';

// ── Quick Insert Snippets Module ──────────────────

const STORAGE_KEY = 'quickInsertSnippets';

let snippets = [];
let editingIndex = -1;
let dragSrcIndex = -1;

// ── Storage ──────────────────────────────────────

window.loadSnippets = function(callback) {
  chrome.storage.local.get([STORAGE_KEY], function(result) {
    snippets = Array.isArray(result[STORAGE_KEY]) ? result[STORAGE_KEY] : [];
    if (callback) callback(snippets);
  });
};

window.saveSnippets = function(newSnippets) {
  snippets = newSnippets;
  chrome.storage.local.set({ [STORAGE_KEY]: snippets });
};

// ── Insert ───────────────────────────────────────

window.insertSnippet = function(text, targetEl) {
  const el = targetEl || document.activeElement;
  if (!el || !(el.tagName === 'TEXTAREA' || el.tagName === 'INPUT')) {
    return false;
  }
  el.focus();
  const start = el.selectionStart;
  const end = el.selectionEnd;
  el.setRangeText(text, start, end, 'end');
  el.focus();
  // Trigger input and change events so existing save logic fires
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
};

// ── Panel ─────────────────────────────────────────

window.openQuickInsertPanel = function(targetEl) {
  const activeEl = targetEl || document.activeElement;
  renderQuickInsertModal(activeEl);
  document.getElementById('quickInsertModal').classList.remove('hidden');
};

function renderQuickInsertModal(targetEl) {
  const container = document.getElementById('quickInsertModalContent');
  if (!container) return;

  // Remember the element that had focus
  container._targetEl = targetEl;

  const html = `
    <div class="qi-header">
      <h3>快速插入</h3>
      <button id="qiCloseBtn" class="btn btn-icon" title="关闭">✕</button>
    </div>
    <div class="qi-add-row">
      <textarea id="qiNewSnippet" class="input qi-input" rows="1" placeholder="输入新文本片段..."></textarea>
      <button id="qiAddBtn" class="btn btn-action">添加</button>
    </div>
    <div class="qi-list" id="qiSnippetList">
      ${renderSnippetList()}
    </div>
    <div class="qi-footer">
      <button id="qiExportBtn" class="btn btn-action">导出 JSON</button>
      <button id="qiImportBtn" class="btn btn-action">导入 JSON</button>
      <input type="file" id="qiImportFileInput" accept=".json,application/json" style="display:none">
      <button id="qiCloseFooterBtn" class="btn btn-secondary">关闭</button>
    </div>
  `;

  container.innerHTML = html;

  // Auto-resize
  const qiInput = document.getElementById('qiNewSnippet');
  if (qiInput) {
    autoResizeTextarea(qiInput);
    qiInput.focus();
  }

  bindQuickInsertEvents(container);
}

function renderSnippetList() {
  if (snippets.length === 0) {
    return '<div class="qi-empty">暂无文本片段，请添加</div>';
  }

  return snippets.map(function(text, i) {
    const display = text.length > 80 ? text.substring(0, 80) + '...' : text;
    return `
      <div class="qi-item" draggable="true" data-qi-index="${i}" data-qi-editing="false">
        <span class="qi-drag-handle" title="拖拽排序">⋮⋮</span>
        <div class="qi-item-content">
          <div class="qi-item-preview ${editingIndex === i ? 'hidden' : ''}">${escapeHtml(display)}</div>
          <textarea class="input qi-edit-input ${editingIndex !== i ? 'hidden' : ''}" rows="1" data-qi-edit="${i}">${escapeHtml(text)}</textarea>
        </div>
        <div class="qi-item-actions">
          <button class="btn btn-action qi-edit-btn" data-qi-action="edit" data-qi-index="${i}">${editingIndex === i ? '保存' : '编辑'}</button>
          ${editingIndex === i ? `<button class="btn btn-action qi-cancel-edit-btn" data-qi-action="cancel-edit" data-qi-index="${i}">取消</button>` : ''}
          <button class="btn btn-clear qi-delete-btn" data-qi-action="delete" data-qi-index="${i}">删除</button>
        </div>
      </div>`;
  }).join('');
}

function bindQuickInsertEvents(container) {
  // Close buttons
  const closeBtn = document.getElementById('qiCloseBtn');
  if (closeBtn) closeBtn.addEventListener('click', closeQuickInsertModal);

  const closeFooterBtn = document.getElementById('qiCloseFooterBtn');
  if (closeFooterBtn) closeFooterBtn.addEventListener('click', closeQuickInsertModal);

  // Add snippet
  const addBtn = document.getElementById('qiAddBtn');
  if (addBtn) addBtn.addEventListener('click', handleAddSnippet);

  // Enter key in input
  const newInput = document.getElementById('qiNewSnippet');
  if (newInput) {
    newInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleAddSnippet();
      }
    });
  }

  // Snippet list click delegation
  const list = document.getElementById('qiSnippetList');
  if (list) {
    list.addEventListener('click', handleSnippetClick);
  }

  // Bind drag events on initial items (re-bound in refreshSnippetList after DOM replacement)
  if (list) {
    list.querySelectorAll('.qi-item').forEach(function(item) {
      item.addEventListener('dragstart', handleDragStart);
      item.addEventListener('dragover', handleDragOver);
      item.addEventListener('drop', handleDrop);
      item.addEventListener('dragend', handleDragEnd);
    });
  }

  // Export
  const exportBtn = document.getElementById('qiExportBtn');
  if (exportBtn) exportBtn.addEventListener('click', handleExportSnippets);

  // Import: click directly opens file picker
  const importBtn = document.getElementById('qiImportBtn');
  const importFileInput = document.getElementById('qiImportFileInput');
  if (importBtn && importFileInput) {
    importBtn.addEventListener('click', function() {
      importFileInput.click();
    });
    importFileInput.addEventListener('change', handleImportFile);
  }

  // Backdrop click to close
  const modal = document.getElementById('quickInsertModal');
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        closeQuickInsertModal();
      }
    });
  }
}

// ── Snippet Actions ──────────────────────────────

function handleAddSnippet() {
  const input = document.getElementById('qiNewSnippet');
  const text = (input?.value || '').trim();
  if (!text) return;

  snippets.push(text);
  window.saveSnippets(snippets);
  editingIndex = -1;
  input.value = '';
  autoResizeTextarea(input);
  refreshSnippetList();
  input.focus();
}

function handleSnippetClick(e) {
  const target = e.target;

  // Click on snippet item itself (to insert)
  const item = e.target.closest('.qi-item');
  if (item && !e.target.closest('button') && !e.target.closest('textarea') && !e.target.closest('.qi-drag-handle')) {
    const index = parseInt(item.dataset.qiIndex, 10);
    if (!Number.isNaN(index) && editingIndex !== index) {
      const text = snippets[index];
      const container = document.getElementById('quickInsertModalContent');
      const targetEl = container && container._targetEl;
      if (window.insertSnippet(text, targetEl)) {
        closeQuickInsertModal();
        // Trigger blur to save via existing field logic
        if (targetEl) {
          targetEl.dispatchEvent(new Event('blur', { bubbles: true }));
        }
      }
    }
    return;
  }

  // Handle button actions
  const btn = e.target.closest('button');
  if (!btn) return;

  const action = btn.dataset.qiAction;
  const index = parseInt(btn.dataset.qiIndex, 10);

  if (action === 'edit') {
    handleEditSnippet(index);
  } else if (action === 'cancel-edit') {
    editingIndex = -1;
    refreshSnippetList();
  } else if (action === 'delete') {
    handleDeleteSnippet(index);
  }
}

function handleEditSnippet(index) {
  if (editingIndex === index) {
    // Save edit
    const textarea = document.querySelector(`[data-qi-edit="${index}"]`);
    if (textarea) {
      const newText = textarea.value.trim();
      if (newText) {
        snippets[index] = newText;
        window.saveSnippets(snippets);
      }
    }
    editingIndex = -1;
    refreshSnippetList();
  } else {
    // Enter edit mode
    editingIndex = index;
    refreshSnippetList();
    // Focus and select the textarea
    setTimeout(function() {
      const textarea = document.querySelector(`[data-qi-edit="${index}"]`);
      if (textarea) {
        textarea.focus();
        textarea.select();
        autoResizeTextarea(textarea);
        textarea.addEventListener('keydown', function onKey(e) {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleEditSnippet(index);
          } else if (e.key === 'Escape') {
            editingIndex = -1;
            refreshSnippetList();
          }
        }, { once: true });
      }
    }, 50);
  }
}

function handleDeleteSnippet(index) {
  if (index < 0 || index >= snippets.length) return;
  snippets.splice(index, 1);
  editingIndex = -1;
  window.saveSnippets(snippets);
  refreshSnippetList();
}

function refreshSnippetList() {
  const list = document.getElementById('qiSnippetList');
  if (list) {
    list.innerHTML = renderSnippetList();
    // Re-bind drag events since innerHTML replaced the elements
    list.querySelectorAll('.qi-item').forEach(function(item) {
      item.addEventListener('dragstart', handleDragStart);
      item.addEventListener('dragover', handleDragOver);
      item.addEventListener('drop', handleDrop);
      item.addEventListener('dragend', handleDragEnd);
    });
  }
}

// ── Drag & Drop Reorder ──────────────────────────

function handleDragStart(e) {
  const item = e.target.closest('.qi-item');
  if (!item) return;
  dragSrcIndex = parseInt(item.dataset.qiIndex, 10);
  item.classList.add('qi-dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', '');
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

function handleDrop(e) {
  e.preventDefault();
  const item = e.target.closest('.qi-item');
  if (!item) return;
  const dropIndex = parseInt(item.dataset.qiIndex, 10);
  if (dragSrcIndex < 0 || dragSrcIndex >= snippets.length) return;
  if (dropIndex < 0 || dropIndex >= snippets.length) return;
  if (dragSrcIndex === dropIndex) return;

  // Reorder
  const moved = snippets.splice(dragSrcIndex, 1)[0];
  snippets.splice(dropIndex, 0, moved);
  window.saveSnippets(snippets);
  editingIndex = -1;
  refreshSnippetList();
}

function handleDragEnd(e) {
  const item = e.target.closest('.qi-item');
  if (item) item.classList.remove('qi-dragging');
  dragSrcIndex = -1;
}

// ── Import / Export ──────────────────────────────

function handleExportSnippets() {
  const json = JSON.stringify(snippets, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'quick-insert-snippets.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function handleImportFile() {
  const input = document.getElementById('qiImportFileInput');
  const file = input.files && input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    let parsed;
    try {
      parsed = JSON.parse(e.target.result);
    } catch (err) {
      showToast('JSON 格式错误', 'error');
      return;
    }

    let newSnippets;
    if (Array.isArray(parsed)) {
      newSnippets = parsed.filter(function(item) { return typeof item === 'string'; });
    } else if (parsed && Array.isArray(parsed.snippets)) {
      newSnippets = parsed.snippets.filter(function(item) { return typeof item === 'string'; });
    } else {
      showToast('JSON 格式不正确，应为字符串数组', 'error');
      return;
    }

    if (newSnippets.length === 0) {
      showToast('未找到有效的文本片段', 'warning');
      return;
    }

    snippets = newSnippets;
    window.saveSnippets(snippets);
    editingIndex = -1;
    refreshSnippetList();
    showToast('已导入 ' + snippets.length + ' 条文本片段', 'success');
  };
  reader.readAsText(file);
  input.value = '';
}

// ── Close ────────────────────────────────────────

function closeQuickInsertModal() {
  const modal = document.getElementById('quickInsertModal');
  if (modal) modal.classList.add('hidden');
  editingIndex = -1;
}

window.closeQuickInsertModal = closeQuickInsertModal;

})();
