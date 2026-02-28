const API_BASE = "";
const COURSES_ENDPOINT = `${API_BASE}/api/courses`;
const TOKEN_KEY = "portfolio_admin_token";
const draftTimers = new Map();

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setStatus(element, message) {
  if (!element) {
    return;
  }
  element.textContent = message;
}

function setAuthUI(isAuthenticated) {
  const form = document.getElementById("course-form");

  if (form) {
    form.classList.toggle("hidden", !isAuthenticated);
  }
}

function setPanelOpen(isOpen, isAuthenticated) {
  const modal = document.getElementById("course-modal");
  if (!modal) {
    return;
  }
  modal.classList.toggle("hidden", !isOpen);
  if (isOpen) {
    setAuthUI(isAuthenticated);
  }
}

function getFilters() {
  const filterYear = document.getElementById("filter-year");
  const filterTerm = document.getElementById("filter-term");
  return {
    year: filterYear ? filterYear.value : "all",
    term: filterTerm ? filterTerm.value : "all",
  };
}

function applyCourseFilters(courses, filters) {
  const { year, term } = filters;
  return courses.filter((course) => {
    const matchesYear = year === "all" || String(course.year_level) === year;
    const matchesTerm = term === "all" || course.term === term;
    return matchesYear && matchesTerm;
  });
}

function createBadge(label, className) {
  const badge = document.createElement("span");
  badge.className = `course-badge ${className}`;
  badge.textContent = label;
  return badge;
}

function createNoteBlock(title, content) {
  const block = document.createElement("div");
  const heading = document.createElement("p");
  heading.className = "course-note-title";
  heading.textContent = title;
  const body = document.createElement("p");
  body.textContent = content || "未記入";
  block.appendChild(heading);
  block.appendChild(body);
  return block;
}

async function saveCourse(courseId, payload) {
  const token = getToken();
  if (!token) {
    window.location.href = "auth.html";
    return { ok: false };
  }

  const response = await fetch(`${COURSES_ENDPOINT}/${courseId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return response;
}

function queueDraftSave(courseId, payload, statusElement) {
  if (draftTimers.has(courseId)) {
    clearTimeout(draftTimers.get(courseId));
  }
  setStatus(statusElement, "下書きを保存中...");
  const timer = setTimeout(async () => {
    try {
      const response = await saveCourse(courseId, payload);
      if (!response.ok) {
        throw new Error(`Draft save failed (${response.status})`);
      }
      setStatus(statusElement, "下書きを保存しました。");
    } catch (error) {
      console.error(error);
      setStatus(statusElement, "下書き保存に失敗しました。");
    }
  }, 300);
  draftTimers.set(courseId, timer);
}

function buildCourseCard(course) {
  const card = document.createElement("article");
  card.className = "card course-card";

  const meta = document.createElement("div");
  meta.className = "course-meta";
  meta.textContent = `${course.year_level}年・${course.term}`;

  const title = document.createElement("h3");
  title.textContent = course.course_name;

  const badges = document.createElement("div");
  badges.className = "course-badges";
  if (course.status === "draft") {
    badges.appendChild(createBadge("下書き", "course-badge--draft"));
  }
  if (course.visibility === "public") {
    badges.appendChild(createBadge("公開", "course-badge--public"));
  } else {
    badges.appendChild(createBadge("非公開", "course-badge--private"));
  }

  const notes = document.createElement("div");
  notes.className = "course-notes";
  notes.appendChild(createNoteBlock("学んだこと", course.learned_notes));
  notes.appendChild(createNoteBlock("成果・制作物", course.outcome_notes));
  notes.appendChild(createNoteBlock("次に活かすこと", course.next_notes));

  const actions = document.createElement("div");
  actions.className = "course-actions";

  const form = document.createElement("form");
  form.className = "course-note-form hidden";

  const learnedLabel = document.createElement("label");
  learnedLabel.setAttribute("for", `learned-${course.id}`);
  learnedLabel.textContent = "学んだこと";
  const learnedInput = document.createElement("textarea");
  learnedInput.id = `learned-${course.id}`;
  learnedInput.rows = 3;
  learnedInput.value = course.learned_notes || "";

  const outcomeLabel = document.createElement("label");
  outcomeLabel.setAttribute("for", `outcome-${course.id}`);
  outcomeLabel.textContent = "成果・制作物";
  const outcomeInput = document.createElement("textarea");
  outcomeInput.id = `outcome-${course.id}`;
  outcomeInput.rows = 3;
  outcomeInput.value = course.outcome_notes || "";

  const nextLabel = document.createElement("label");
  nextLabel.setAttribute("for", `next-${course.id}`);
  nextLabel.textContent = "次に活かすこと";
  const nextInput = document.createElement("textarea");
  nextInput.id = `next-${course.id}`;
  nextInput.rows = 3;
  nextInput.value = course.next_notes || "";

  const visibilityLabel = document.createElement("label");
  visibilityLabel.setAttribute("for", `visibility-${course.id}`);
  visibilityLabel.textContent = "公開設定";
  const visibilitySelect = document.createElement("select");
  visibilitySelect.id = `visibility-${course.id}`;
  const optionPrivate = document.createElement("option");
  optionPrivate.value = "private";
  optionPrivate.textContent = "非公開";
  const optionPublic = document.createElement("option");
  optionPublic.value = "public";
  optionPublic.textContent = "公開";
  visibilitySelect.appendChild(optionPrivate);
  visibilitySelect.appendChild(optionPublic);
  visibilitySelect.value = course.visibility || "private";

  const saveButton = document.createElement("button");
  saveButton.type = "submit";
  saveButton.className = "button";
  saveButton.textContent = "保存する";

  const status = document.createElement("p");
  status.className = "course-status";
  status.setAttribute("role", "status");

  form.appendChild(learnedLabel);
  form.appendChild(learnedInput);
  form.appendChild(outcomeLabel);
  form.appendChild(outcomeInput);
  form.appendChild(nextLabel);
  form.appendChild(nextInput);
  form.appendChild(visibilityLabel);
  form.appendChild(visibilitySelect);
  form.appendChild(saveButton);
  form.appendChild(status);

  if (course.can_edit) {
    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "button ghost";
    editButton.textContent = "編集する";
    editButton.addEventListener("click", () => {
      form.classList.toggle("hidden");
    });
    actions.appendChild(editButton);

    const handleDraftSave = () => {
      queueDraftSave(
        course.id,
        {
          learned_notes: learnedInput.value.trim(),
          outcome_notes: outcomeInput.value.trim(),
          next_notes: nextInput.value.trim(),
          visibility: visibilitySelect.value,
          status: "draft",
        },
        status
      );
    };

    learnedInput.addEventListener("input", handleDraftSave);
    outcomeInput.addEventListener("input", handleDraftSave);
    nextInput.addEventListener("input", handleDraftSave);
    visibilitySelect.addEventListener("change", handleDraftSave);

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      setStatus(status, "保存中...");
      try {
        const response = await saveCourse(course.id, {
          learned_notes: learnedInput.value.trim(),
          outcome_notes: outcomeInput.value.trim(),
          next_notes: nextInput.value.trim(),
          visibility: visibilitySelect.value,
          status: "published",
        });
        if (!response.ok) {
          throw new Error(`Save failed (${response.status})`);
        }
        setStatus(status, "保存しました。");
        const filters = getFilters();
        await loadCourses(filters);
        form.classList.add("hidden");
      } catch (error) {
        console.error(error);
        setStatus(status, "保存に失敗しました。");
      }
    });
  }

  card.appendChild(meta);
  card.appendChild(title);
  card.appendChild(badges);
  card.appendChild(notes);
  if (course.can_edit) {
    card.appendChild(actions);
    card.appendChild(form);
  }

  return card;
}

function renderCourseList(container, courses, emptyMessage) {
  if (!container) {
    return;
  }
  container.innerHTML = "";
  if (!courses.length) {
    const empty = document.createElement("p");
    empty.textContent = emptyMessage;
    container.appendChild(empty);
    return;
  }
  courses.forEach((course) => {
    container.appendChild(buildCourseCard(course));
  });
}

async function loadCourses(filters) {
  const coursesList = document.getElementById("courses-list");
  const draftsList = document.getElementById("courses-drafts");
  const draftsSection = document.getElementById("drafts-section");

  if (coursesList) {
    coursesList.textContent = "科目を読み込み中...";
  }

  try {
    const response = await fetch(COURSES_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${getToken() || ""}`,
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to load courses (${response.status})`);
    }
    const data = await response.json();
    const courses = Array.isArray(data) ? data : data.items || [];

    const filtered = applyCourseFilters(courses, filters);
    const drafts = filtered.filter((course) => course.status === "draft" && course.is_owner);
    const published = filtered.filter((course) => course.status !== "draft");

    if (draftsSection) {
      const showDrafts = drafts.length > 0;
      draftsSection.classList.toggle("hidden", !showDrafts);
    }

    renderCourseList(coursesList, published, "表示できる科目がありません。");
    renderCourseList(draftsList, drafts, "下書きはありません。");
  } catch (error) {
    console.error(error);
    if (coursesList) {
      coursesList.textContent = "科目を読み込めませんでした。";
    }
  }
}

async function handleCreateCourse(event, statusElement) {
  event.preventDefault();
  const form = event.currentTarget;
  const token = getToken();

  if (!token) {
    window.location.href = "auth.html";
    return;
  }

  const payload = {
    year_level: Number(form.querySelector("#course-year").value),
    term: form.querySelector("#course-term").value,
    course_name: form.querySelector("#course-name").value.trim(),
  };

  setStatus(statusElement, "登録中...");

  try {
    const response = await fetch(COURSES_ENDPOINT, {
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

    setStatus(statusElement, "科目を登録しました。");
    form.reset();
    await loadCourses(getFilters());
    setPanelOpen(false, true);
  } catch (error) {
    console.error(error);
    setStatus(statusElement, "登録に失敗しました。");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const courseForm = document.getElementById("course-form");
  const courseStatus = document.getElementById("course-status");
  const addButton = document.getElementById("course-add-button");
  const closeButton = document.getElementById("course-close-button");
  const courseModal = document.getElementById("course-modal");
  const filterYear = document.getElementById("filter-year");
  const filterTerm = document.getElementById("filter-term");

  const isAuthenticated = Boolean(getToken());
  setPanelOpen(false, isAuthenticated);

  if (courseForm) {
    courseForm.addEventListener("submit", (event) =>
      handleCreateCourse(event, courseStatus)
    );
  }

  if (addButton) {
    addButton.addEventListener("click", () => {
      const authed = Boolean(getToken());
      if (!authed) {
        window.location.href = "auth.html";
        return;
      }
      setPanelOpen(true, authed);
    });
  }

  if (closeButton) {
    closeButton.addEventListener("click", () => setPanelOpen(false, true));
  }

  if (courseModal) {
    courseModal.addEventListener("click", (event) => {
      if (event.target === courseModal) {
        setPanelOpen(false, true);
      }
    });
  }

  const applyFilters = () => {
    loadCourses(getFilters());
  };

  if (filterYear) {
    filterYear.addEventListener("change", applyFilters);
  }
  if (filterTerm) {
    filterTerm.addEventListener("change", applyFilters);
  }

  applyFilters();
});
