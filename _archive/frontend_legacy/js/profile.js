const API_BASE = "";
const PROFILE_ENDPOINT = `${API_BASE}/api/profile`;
const COURSES_ENDPOINT = `${API_BASE}/api/courses`;
const TOKEN_KEY = "portfolio_admin_token";

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function requireAuth() {
  if (!getToken()) {
    window.location.href = "auth.html";
    return false;
  }
  return true;
}

function setStatus(element, message) {
  if (!element) {
    return;
  }
  element.textContent = message;
}

function setText(id, value, fallback = "-") {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = value && value.trim() ? value : fallback;
  }
}

function schoolTypeLabel(value) {
  switch (value) {
    case "japanese_school":
      return "日本語学校";
    case "vocational":
      return "専門学校";
    case "university":
      return "大学";
    case "graduate":
      return "大学院";
    default:
      return "その他";
  }
}

async function loadProfile() {
  const token = getToken();
  if (!token) {
    return;
  }

  const response = await fetch(PROFILE_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Profile load failed (${response.status})`);
  }

  return response.json();
}

function applyProfile(profile) {
  setText("profile-headline", profile.headline || "あなたのプロフィール");
  setText("profile-summary", profile.summary || "自己紹介を追加しましょう。", "自己紹介を追加しましょう。");
  setText("profile-nationality", profile.nationality || "-");
  const location = [profile.prefecture, profile.city].filter(Boolean).join(" ");
  setText("profile-location", location || "-");
  const school = [schoolTypeLabel(profile.school_type), profile.school_name]
    .filter(Boolean)
    .join(" / ");
  setText("profile-school", school || "-");

  const headlineInput = document.getElementById("profile-headline-input");
  const summaryInput = document.getElementById("profile-summary-input");
  const nationalityInput = document.getElementById("profile-nationality-input");
  const prefectureInput = document.getElementById("profile-prefecture-input");
  const cityInput = document.getElementById("profile-city-input");
  const schoolTypeInput = document.getElementById("profile-school-type");
  const schoolNameInput = document.getElementById("profile-school-name");

  if (headlineInput) headlineInput.value = profile.headline || "";
  if (summaryInput) summaryInput.value = profile.summary || "";
  if (nationalityInput) nationalityInput.value = profile.nationality || "";
  if (prefectureInput) prefectureInput.value = profile.prefecture || "";
  if (cityInput) cityInput.value = profile.city || "";
  if (schoolTypeInput) schoolTypeInput.value = profile.school_type || "other";
  if (schoolNameInput) schoolNameInput.value = profile.school_name || "";
}

function toggleProfileForm(forceOpen) {
  const card = document.getElementById("profile-form-card");
  if (!card) {
    return;
  }
  if (typeof forceOpen === "boolean") {
    card.classList.toggle("hidden", !forceOpen);
  } else {
    card.classList.toggle("hidden");
  }
}

async function saveProfile(event) {
  event.preventDefault();
  const token = getToken();
  if (!token) {
    window.location.href = "auth.html";
    return;
  }

  const payload = {
    headline: document.getElementById("profile-headline-input").value.trim(),
    summary: document.getElementById("profile-summary-input").value.trim(),
    nationality: document.getElementById("profile-nationality-input").value.trim(),
    prefecture: document.getElementById("profile-prefecture-input").value.trim(),
    city: document.getElementById("profile-city-input").value.trim(),
    school_type: document.getElementById("profile-school-type").value,
    school_name: document.getElementById("profile-school-name").value.trim(),
  };

  const status = document.getElementById("profile-status");
  setStatus(status, "保存中...");

  try {
    const response = await fetch(PROFILE_ENDPOINT, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Profile save failed (${response.status})`);
    }

    const profile = await response.json();
    applyProfile(profile);
    setStatus(status, "保存しました。");
    toggleProfileForm(false);
  } catch (error) {
    console.error(error);
    setStatus(status, "保存に失敗しました。");
  }
}

function renderNoteCard(course) {
  const card = document.createElement("article");
  card.className = "card course-card";

  const meta = document.createElement("div");
  meta.className = "course-meta";
  meta.textContent = `${course.year_level}年・${course.term}`;

  const title = document.createElement("h3");
  title.textContent = course.course_name;

  const notes = document.createElement("div");
  notes.className = "course-notes";

  const blocks = [
    { title: "学んだこと", value: course.learned_notes },
    { title: "成果・制作物", value: course.outcome_notes },
    { title: "次に活かすこと", value: course.next_notes },
  ];

  blocks.forEach((block) => {
    const titleEl = document.createElement("p");
    titleEl.className = "course-note-title";
    titleEl.textContent = block.title;
    const bodyEl = document.createElement("p");
    bodyEl.textContent = block.value || "未記入";
    notes.appendChild(titleEl);
    notes.appendChild(bodyEl);
  });

  card.appendChild(meta);
  card.appendChild(title);
  card.appendChild(notes);
  return card;
}

function renderSection(sectionId, listId, items, emptyMessage) {
  const section = document.getElementById(sectionId);
  const list = document.getElementById(listId);
  if (!list || !section) {
    return;
  }
  list.innerHTML = "";
  if (!items.length) {
    section.classList.add("hidden");
    return;
  }
  section.classList.remove("hidden");
  items.forEach((item) => list.appendChild(renderNoteCard(item)));
}

async function loadMyNotes() {
  const token = getToken();
  if (!token) {
    return;
  }

  const response = await fetch(COURSES_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Courses load failed (${response.status})`);
  }

  const data = await response.json();
  const courses = Array.isArray(data) ? data : data.items || [];
  const mine = courses.filter((course) => course.is_owner);

  const drafts = mine.filter((course) => course.status === "draft");
  const privates = mine.filter(
    (course) => course.status === "published" && course.visibility === "private"
  );
  const publics = mine.filter(
    (course) => course.status === "published" && course.visibility === "public"
  );

  renderSection("my-drafts", "my-drafts-list", drafts, "下書きはありません。");
  renderSection("my-private", "my-private-list", privates, "非公開はありません。");
  renderSection("my-public", "my-public-list", publics, "公開はありません。");
}

document.addEventListener("DOMContentLoaded", async () => {
  if (!requireAuth()) {
    return;
  }

  const editButton = document.getElementById("profile-edit-button");
  const form = document.getElementById("profile-form");

  if (editButton) {
    editButton.addEventListener("click", () => toggleProfileForm());
  }

  if (form) {
    form.addEventListener("submit", saveProfile);
  }

  try {
    const profile = await loadProfile();
    if (profile) {
      applyProfile(profile);
    }
  } catch (error) {
    console.error(error);
  }

  try {
    await loadMyNotes();
  } catch (error) {
    console.error(error);
  }
});
