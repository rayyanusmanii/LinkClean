async function updatePopup() {

  const data = await chrome.storage.local.get({ hiddenCount: 0 });
  document.getElementById('total-count').textContent = data.hiddenCount.toLocaleString();


  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { action: "getPageCount" });
      document.getElementById('page-count').textContent = response?.count || 0;
    } catch (e) {
 
      document.getElementById('page-count').textContent = 0;
    }
  }
}


updatePopup();


chrome.storage.onChanged.addListener((changes) => {
  if (changes.hiddenCount) {
    document.getElementById('total-count').textContent = changes.hiddenCount.newValue.toLocaleString();
  }
});