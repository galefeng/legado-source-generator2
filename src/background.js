chrome.action.onClicked.addListener((tab) => {
  if (typeof chrome.sidePanel !== 'undefined') {
    // Chrome: open side panel
    chrome.sidePanel.open({ tabId: tab.id });
  } else {
    // Firefox fallback: open in new tab
    chrome.tabs.create({ url: chrome.runtime.getURL('popup/index.html') });
  }
});
