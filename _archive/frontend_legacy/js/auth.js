const TOKEN_KEY = "portfolio_admin_token";
const API_BASE = "";
const LOGIN_ENDPOINT = `${API_BASE}/api/login`;
const REGISTER_ENDPOINT = `${API_BASE}/api/register`;

function setStatus(element, message) {
  if (element) {
    element.textContent = message;
  }
}

function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function setMode(card, mode) {
  if (!card) {
    return;
  }
  card.dataset.mode = mode;
}

async function handleLogin(event, statusElement) {
  event.preventDefault();
  const form = event.currentTarget;
  const identifier = form.querySelector("#login-identifier").value.trim();
  const password = form.querySelector("#login-password").value;

  setStatus(statusElement, "ログイン中...");

  try {
    const response = await fetch(LOGIN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });

    if (!response.ok) {
      throw new Error(`Login failed (${response.status})`);
    }

    const data = await response.json();
    if (!data.token) {
      throw new Error("Login response missing token");
    }

    setToken(data.token);
    setStatus(statusElement, "ログインしました。移動します...");
    form.reset();
    window.location.href = "profile.html";
  } catch (error) {
    console.error(error);
    setStatus(statusElement, "ログイン失敗。入力内容を確認してください。");
  }
}

async function handleRegister(event, statusElement) {
  event.preventDefault();
  const form = event.currentTarget;
  const name = form.querySelector("#register-name").value.trim();
  const contact = form.querySelector("#register-contact").value.trim();
  const password = form.querySelector("#register-password").value;

  setStatus(statusElement, "アカウント作成中...");

  try {
    const response = await fetch(REGISTER_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, contact, password }),
    });

    if (!response.ok) {
      throw new Error(`Register failed (${response.status})`);
    }

    const data = await response.json();
    if (!data.token) {
      throw new Error("Register response missing token");
    }

    setToken(data.token);
    setStatus(statusElement, "アカウントを作成しました。移動します...");
    form.reset();
    window.location.href = "profile.html";
  } catch (error) {
    console.error(error);
    setStatus(statusElement, "登録に失敗しました。もう一度お試しください。");
  }
}

function wireSocialButtons(container) {
  if (!container) {
    return;
  }
  container.querySelectorAll(".social-button").forEach((button) => {
    button.addEventListener("click", () => {
      setStatus(
        document.getElementById("login-status"),
        "ソーシャルログインはまだ使えません。"
      );
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const card = document.querySelector(".auth-card");
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const loginStatus = document.getElementById("login-status");
  const registerStatus = document.getElementById("register-status");

  document.querySelectorAll("[data-action='show-signin']").forEach((button) => {
    button.addEventListener("click", () => setMode(card, "signin"));
  });

  document.querySelectorAll("[data-action='show-signup']").forEach((button) => {
    button.addEventListener("click", () => setMode(card, "signup"));
  });

  if (loginForm) {
    loginForm.addEventListener("submit", (event) =>
      handleLogin(event, loginStatus)
    );
  }

  if (registerForm) {
    registerForm.addEventListener("submit", (event) =>
      handleRegister(event, registerStatus)
    );
  }

  wireSocialButtons(document);

  // TODO: Add real OAuth flows for Apple, Facebook, and Google.
  // TODO: Add forgot-password and email/phone verification flows.
});
