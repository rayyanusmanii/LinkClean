const internshipKeywords = ["internship", "summer 2026", "co-op", "early career", "software engineer intern", "student openings", "new grad"];

const hardHiringPhrases = [
  "is hiring", "we are hiring", "now hiring", "apply here", "apply now", 
  "open roles", "positions available", "applications open", "looking for talented",
  "looking for students", "check out these openings", "join our team", "we're looking for",
  "dropped roles", "hiring for", "careers site", "job link"
];


const softBlockKeywords = ["thesis", "defended", "phd", "published a paper", "research paper", "congrats to", "university was bombed", "war broke out"];

const personalOutcomePhrases = ["i've accepted", "i wrapped up", "starting my", "joining the team", "next chapter", "humbled to share", "beyond excited to share"];

let pageCount = 0; 

function normalize(text) {
  return text.toLowerCase().replace(/\s+/g, " ");
}

async function incrementCounter() {
  pageCount++; 
  const data = await chrome.storage.local.get({ hiddenCount: 0 });
  chrome.storage.local.set({ hiddenCount: data.hiddenCount + 1 });
}

async function checkWithGemini(text) {
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ type: "checkPost", prompt: text }, response => {
      resolve(response?.result === true);
    });
  });
}

async function filterPosts() {
  const wrappers = document.querySelectorAll('div[data-urn^="urn:li:activity"]');

  for (const wrapper of wrappers) {
    const card = wrapper.querySelector('[class*="feed-shared-update-v2"]');
    if (!card || card.classList.contains("lfc-processed")) continue;

    card.classList.add("lfc-processed");
    const rawText = card.innerText;
    if (!rawText || rawText.length < 30) continue;

    const text = normalize(rawText);


    const isAcademic = softBlockKeywords.some(k => text.includes(k));
    const mentionsHiring = hardHiringPhrases.some(k => text.includes(k));

    if (isAcademic && !mentionsHiring) {
      console.log("🚫 Blocking Academic/Personal News");
      hidePost(wrapper);
      continue;
    }


    const hasShortLink = text.includes("lnkd.in/") || text.includes("bit.ly/") || text.includes("link in");
    const isHiring = mentionsHiring;
    const isEarlyCareer = internshipKeywords.some(k => text.includes(k));
    
    const listsRoles = /[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/.test(rawText) && 
                       (text.includes("engineer") || text.includes("analyst") || text.includes("developer") || text.includes("manager"));

    if ((isHiring || isEarlyCareer || listsRoles) && hasShortLink) {
      continue; 
    }


    const isPersonalAnnouncement = personalOutcomePhrases.some(k => text.includes(k));
    if (isPersonalAnnouncement && !listsRoles) {
      hidePost(wrapper);
      continue;
    }

    
    const snippet = rawText.slice(0, 1500);
    const isRelevant = await checkWithGemini(snippet);

    if (!isRelevant) {
      hidePost(wrapper);
    }
  }
}

function hidePost(wrapper) {
  wrapper.classList.add("lfc-hidden");
  incrementCounter();
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getPageCount") {
    sendResponse({ count: pageCount });
  }
});

filterPosts();
const observer = new MutationObserver(() => filterPosts());
observer.observe(document.body, { childList: true, subtree: true });