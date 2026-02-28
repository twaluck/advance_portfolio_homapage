const API_BASE = "";
const LOGS_ENDPOINT = `${API_BASE}/api/logs`;
const TOKEN_KEY = "portfolio_admin_token";

function setStatus(element, message) {
  if (!element) {
    return;
  }
  element.textContent = message;
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}


function renderLogs(container, logs) {
  if (!logs.length) {
    container.textContent = "まだログはありません。";
    return;
  }

  container.innerHTML = "";
  logs.forEach((log) => {
    const article = document.createElement("article");
    article.classList.add("card");
    const title = document.createElement("h2");
    const meta = document.createElement("p");
    const summary = document.createElement("p");
    const tags = document.createElement("p");

    title.textContent = log.title || "Untitled log";
    meta.textContent = log.date ? `Date: ${log.date}` : "Date: TBD";
    summary.textContent = log.summary || "Summary coming soon.";
    tags.textContent = Array.isArray(log.tags) && log.tags.length
      ? `Tags: ${log.tags.join(", ")}`
      : "";

    article.appendChild(title);
    article.appendChild(meta);
    article.appendChild(summary);
    if (tags.textContent) {
      article.appendChild(tags);
    }
    container.appendChild(article);
  });
}

async function loadLogs(container) {
  if (!container) {
    return;
  }

  container.textContent = "ログを読み込み中...";

  try {
    const response = await fetch(LOGS_ENDPOINT);
    if (!response.ok) {
      throw new Error(`Failed to load logs (${response.status})`);
    }
    const data = await response.json();
    const logs = Array.isArray(data) ? data : data.items || [];
    renderLogs(container, logs);
  } catch (error) {
    console.error(error);
    container.textContent = "ログを読み込めませんでした。";
  }
}

async function handleCreateLog(event, statusElement, container) {
  event.preventDefault();
  const form = event.currentTarget;
  const token = getToken();

  if (!token) {
    setStatus(statusElement, "ログを作成するにはログインしてください。");
    return;
  }

  const tagsValue = form.querySelector("#log-tags").value;
  const tags = tagsValue
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  const payload = {
    title: form.querySelector("#log-title").value.trim(),
    summary: form.querySelector("#log-summary").value.trim(),
    content: form.querySelector("#log-content").value.trim(),
    log_date: form.querySelector("#log-date").value,
    tags: tags.length ? tags : undefined,
  };

  setStatus(statusElement, "ログを作成中...");

  try {
    const response = await fetch(LOGS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Create failed (${response.status})`);
    }

    setStatus(statusElement, "ログを作成しました。");
    form.reset();
    await loadLogs(container);
  } catch (error) {
    console.error(error);
    setStatus(statusElement, "ログの作成に失敗しました。");
  }
}

function setAuthUI(isAuthenticated) {
  const logForm = document.getElementById("log-form");
  const authRequired = document.getElementById("auth-required");

  if (logForm) {
    logForm.classList.toggle("hidden", !isAuthenticated);
  }
  if (authRequired) {
    authRequired.classList.toggle("hidden", isAuthenticated);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("logs-list");
  const logForm = document.getElementById("log-form");
  const logStatus = document.getElementById("log-status");

  const hasToken = Boolean(getToken());
  setAuthUI(hasToken);

  if (logForm) {
    logForm.addEventListener("submit", (event) =>
      handleCreateLog(event, logStatus, container)
    );
  }

  loadLogs(container);
});

// TODO: Move API base to a config file or environment-driven setting.
// TODO: Add pagination or filtering when logs grow.
// TODO: Add edit/delete UI flows with confirmations.
// TODO: Add richer tag styling and metadata display.
