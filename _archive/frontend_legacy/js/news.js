const API_BASE = "";
const NEWS_ENDPOINT = `${API_BASE}/api/news`;

const newsImage = document.getElementById("news-image");
const newsText = document.getElementById("news-text");
const newsDate = document.getElementById("news-date");
const refreshBtn = document.getElementById("refresh-btn");
const loadingOverlay = document.getElementById("loading");

async function loadNews() {
    try {
        const response = await fetch(NEWS_ENDPOINT);
        if (!response.ok) throw new Error("API Error");

        const data = await response.json();
        renderNews(data);
    } catch (error) {
        console.error(error);
        newsText.innerHTML = "<p>ニュースの読み込みに失敗しました。</p>";
    }
}

async function refreshNews() {
    loadingOverlay.classList.remove("hidden");
    try {
        const response = await fetch(NEWS_ENDPOINT, { method: "POST" });
        if (!response.ok) throw new Error("API Error");

        const data = await response.json();
        renderNews(data);
    } catch (error) {
        console.error(error);
        alert("ニュース生成に失敗しました。");
    } finally {
        loadingOverlay.classList.add("hidden");
    }
}

function renderNews(data) {
    if (!data.summary) {
        newsText.innerHTML = "<p>まだニュースがありません。「最新ニュースを取得」ボタンを押して生成してください。</p>";
        newsDate.textContent = "Updated at: -";
        return;
    }

    // Use marked library to parse markdown
    newsText.innerHTML = marked.parse(data.summary);

    if (data.image_url) {
        newsImage.src = data.image_url;
    }

    if (data.created_at) {
        newsDate.textContent = `Updated at: ${data.created_at}`;
    }
}

refreshBtn.addEventListener("click", refreshNews);

// Initial load
loadNews();
