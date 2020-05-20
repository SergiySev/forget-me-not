chrome.runtime.onInstalled.addListener(() => {
  const urlMatch = 'app.slack.com';

  const activatePlugin = (tabId) => {
    chrome.pageAction.show(tabId);
  }

  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tab.url.indexOf(urlMatch) >= 0) {
      activatePlugin(tabId);
    }
  });

  chrome.webNavigation.onCompleted.addListener(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([{ id }]) => {
      activatePlugin(id);
    });
  }, { url: [{ urlMatches: urlMatch }] });
});
