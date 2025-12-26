
const CLOUD_FUNCTION_URL = "https://linkedin-filter-proxy-960436206674.us-central1.run.app";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "checkPost") {


    fetch(CLOUD_FUNCTION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: request.prompt })
    })
    .then(res => res.json())
    .then(data => {

      sendResponse({ result: data.result });
    })
    .catch((err) => {
      console.error("Server Connection Error:", err);

      sendResponse({ result: false }); 
    });

    return true;
  }
});