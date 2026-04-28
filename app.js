const STORAGE_KEY = "flashflow-data-v1";

const paletteMap = {
  sun: "var(--sun)",
  mint: "var(--mint)",
  sky: "var(--sky)",
  coral: "var(--coral)"
};

const demoState = {
  streak: 3,
  lastStudiedOn: "2026-04-28",
  selectedDeckId: "deck-js",
  studySession: {
    deckId: "deck-js",
    index: 0,
    completed: 0
  },
  decks: [
    {
      id: "deck-js",
      name: "JavaScript Basics",
      category: "Coding",
      color: "sky",
      cards: [
        { id: "js-1", question: "Какво прави let?", answer: "Създава променлива с block scope.", known: true, hard: false, reviews: 2 },
        { id: "js-2", question: "Каква е разликата между == и ===?", answer: "=== сравнява и стойност, и тип, без type coercion.", known: false, hard: true, reviews: 1 },
        { id: "js-3", question: "Какво е array method map()?", answer: "Създава нов масив, като трансформира всеки елемент.", known: true, hard: false, reviews: 4 }
      ]
    },
    {
      id: "deck-eng",
      name: "English Verbs",
      category: "Language",
      color: "mint",
      cards: [
        { id: "eng-1", question: "bring", answer: "нося, донасям", known: false, hard: true, reviews: 3 },
        { id: "eng-2", question: "choose", answer: "избирам", known: true, hard: false, reviews: 2 }
      ]
    }
  ]
};

const state = loadState();

const elements = {
  deckGrid: document.getElementById("deck-grid"),
  deckCountBadge: document.getElementById("deck-count-badge"),
  deckForm: document.getElementById("deck-form"),
  deckName: document.getElementById("deck-name"),
  deckCategory: document.getElementById("deck-category"),
  deckColor: document.getElementById("deck-color"),
  detailTitle: document.getElementById("detail-title"),
  deckDetail: document.getElementById("deck-detail"),
  deckDetailEmpty: document.getElementById("deck-detail-empty"),
  cardForm: document.getElementById("card-form"),
  cardQuestion: document.getElementById("card-question"),
  cardAnswer: document.getElementById("card-answer"),
  cardList: document.getElementById("card-list"),
  studyEmpty: document.getElementById("study-empty"),
  studyPanel: document.getElementById("study-panel"),
  studyDeckTitle: document.getElementById("study-deck-title"),
  studyDeckMeta: document.getElementById("study-deck-meta"),
  studyQuestion: document.getElementById("study-question"),
  studyAnswer: document.getElementById("study-answer"),
  flashcard: document.getElementById("flashcard"),
  flipCard: document.getElementById("flip-card"),
  markKnown: document.getElementById("mark-known"),
  markHard: document.getElementById("mark-hard"),
  progressMetrics: document.getElementById("progress-metrics"),
  progressBars: document.getElementById("progress-bars"),
  heroStats: document.getElementById("hero-stats"),
  focusDeck: document.getElementById("focus-deck"),
  focusCount: document.getElementById("focus-count"),
  streakValue: document.getElementById("streak-value"),
  hardTotal: document.getElementById("hard-total"),
  studyProgressLabel: document.getElementById("study-progress-label"),
  studySelected: document.getElementById("study-selected"),
  deleteSelected: document.getElementById("delete-selected"),
  resetApp: document.getElementById("reset-app"),
  jumpToCreate: document.getElementById("jump-to-create"),
  jumpToStudy: document.getElementById("jump-to-study")
};

let activeFilter = "all";

bindEvents();
render();

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demoState));
    return structuredClone(demoState);
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demoState));
    return structuredClone(demoState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function bindEvents() {
  elements.deckForm.addEventListener("submit", handleCreateDeck);
  elements.cardForm.addEventListener("submit", handleCreateCard);
  elements.flipCard.addEventListener("click", toggleFlashcard);
  elements.flashcard.addEventListener("click", toggleFlashcard);
  elements.markKnown.addEventListener("click", () => advanceStudy(true));
  elements.markHard.addEventListener("click", () => advanceStudy(false));
  elements.studySelected.addEventListener("click", startStudySession);
  elements.deleteSelected.addEventListener("click", deleteSelectedDeck);
  elements.resetApp.addEventListener("click", resetDemo);
  elements.jumpToCreate.addEventListener("click", () => {
    document.getElementById("create-section").scrollIntoView({ behavior: "smooth", block: "start" });
    elements.deckName.focus();
  });
  elements.jumpToStudy.addEventListener("click", () => {
    document.getElementById("study-section").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  document.querySelectorAll(".filter-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      activeFilter = chip.dataset.filter;
      document.querySelectorAll(".filter-chip").forEach((button) => {
        button.classList.toggle("active", button === chip);
      });
      renderCardList();
    });
  });
}

function render() {
  renderDecks();
  renderSelectedDeck();
  renderStudyPanel();
  renderProgress();
  renderHero();
  saveState();
}

function renderDecks() {
  const template = document.getElementById("deck-card-template");
  elements.deckGrid.innerHTML = "";
  elements.deckCountBadge.textContent = `${state.decks.length} тестета`;

  state.decks.forEach((deck) => {
    const node = template.content.firstElementChild.cloneNode(true);
    const totalCards = deck.cards.length;
    const knownCards = deck.cards.filter((card) => card.known).length;
    const chip = node.querySelector(".deck-chip");
    const icon = node.querySelector(".icon-button");

    chip.style.background = paletteMap[deck.color] || paletteMap.sun;
    node.querySelector(".deck-name").textContent = deck.name;
    node.querySelector(".deck-category").textContent = deck.category;
    node.querySelector(".deck-meta").innerHTML = `
      <span class="meta-pill">${totalCards} карти</span>
      <span class="meta-pill">${knownCards} научени</span>
    `;

    node.classList.toggle("active", deck.id === state.selectedDeckId);
    node.addEventListener("click", () => {
      state.selectedDeckId = deck.id;
      render();
    });
    icon.textContent = deck.id === state.selectedDeckId ? "✓" : "+";
    elements.deckGrid.appendChild(node);
  });
}

function renderSelectedDeck() {
  const deck = getSelectedDeck();
  if (!deck) {
    elements.deckDetail.classList.add("hidden");
    elements.deckDetailEmpty.classList.remove("hidden");
    elements.detailTitle.textContent = "Избери тесте";
    return;
  }

  elements.deckDetail.classList.remove("hidden");
  elements.deckDetailEmpty.classList.add("hidden");
  elements.detailTitle.textContent = deck.name;
  renderCardList();
}

function renderCardList() {
  const deck = getSelectedDeck();
  if (!deck) {
    elements.cardList.innerHTML = "";
    return;
  }

  const template = document.getElementById("card-item-template");
  const filteredCards = deck.cards.filter((card) => {
    if (activeFilter === "hard") {
      return card.hard;
    }
    if (activeFilter === "known") {
      return card.known;
    }
    return true;
  });

  elements.cardList.innerHTML = "";

  if (filteredCards.length === 0) {
    elements.cardList.innerHTML = `<div class="empty-state">Няма карти за текущия филтър.</div>`;
    return;
  }

  filteredCards.forEach((card) => {
    const node = template.content.firstElementChild.cloneNode(true);
    node.querySelector(".card-question").textContent = card.question;
    node.querySelector(".card-answer").textContent = card.answer;
    node.querySelector(".status-pill").textContent = card.known ? "Научена" : card.hard ? "Трудна" : "Нова";
    node.querySelector(".toggle-hard").addEventListener("click", () => {
      card.hard = !card.hard;
      if (card.hard) {
        card.known = false;
      }
      render();
    });
    node.querySelector(".delete-card").addEventListener("click", () => {
      deck.cards = deck.cards.filter((item) => item.id !== card.id);
      syncStudyAfterDeckChange(deck.id);
      render();
    });
    elements.cardList.appendChild(node);
  });
}

function renderStudyPanel() {
  const deck = getStudyDeck();
  if (!deck || deck.cards.length === 0) {
    elements.studyEmpty.classList.remove("hidden");
    elements.studyPanel.classList.add("hidden");
    elements.studyProgressLabel.textContent = "0 / 0";
    return;
  }

  const session = ensureStudySession(deck.id);
  const card = deck.cards[session.index];

  if (!card) {
    session.index = 0;
  }

  const safeCard = deck.cards[session.index] || deck.cards[0];
  elements.studyEmpty.classList.add("hidden");
  elements.studyPanel.classList.remove("hidden");
  elements.studyDeckTitle.textContent = deck.name;
  elements.studyDeckMeta.textContent = `${session.index + 1} от ${deck.cards.length} карти`;
  elements.studyQuestion.textContent = safeCard.question;
  elements.studyAnswer.textContent = safeCard.answer;
  elements.studyProgressLabel.textContent = `${session.completed} / ${deck.cards.length}`;
  elements.flashcard.classList.remove("is-flipped");
}

function renderProgress() {
  const totalDecks = state.decks.length;
  const allCards = state.decks.flatMap((deck) => deck.cards);
  const totalCards = allCards.length;
  const knownCards = allCards.filter((card) => card.known).length;
  const hardCards = allCards.filter((card) => card.hard).length;
  const reviewCount = allCards.reduce((sum, card) => sum + (card.reviews || 0), 0);
  const mastery = totalCards === 0 ? 0 : Math.round((knownCards / totalCards) * 100);
  const challenge = totalCards === 0 ? 0 : Math.round((hardCards / totalCards) * 100);

  elements.progressMetrics.innerHTML = `
    <article class="metric-card">
      <p>Тестета</p>
      <strong>${totalDecks}</strong>
    </article>
    <article class="metric-card">
      <p>Общо карти</p>
      <strong>${totalCards}</strong>
    </article>
    <article class="metric-card">
      <p>Общо преговори</p>
      <strong>${reviewCount}</strong>
    </article>
    <article class="metric-card">
      <p>Mastery</p>
      <strong>${mastery}%</strong>
    </article>
  `;

  elements.progressBars.innerHTML = `
    ${buildProgressBar("Научени карти", mastery, "var(--mint)")}
    ${buildProgressBar("Трудни карти", challenge, "var(--coral)")}
    ${buildProgressBar("Оставащи карти", Math.max(0, 100 - mastery), "var(--sky)")}
  `;
}

function renderHero() {
  const allCards = state.decks.flatMap((deck) => deck.cards);
  const knownCards = allCards.filter((card) => card.known).length;
  const hardCards = allCards.filter((card) => card.hard).length;
  const focusDeck = pickFocusDeck();

  elements.heroStats.innerHTML = `
    <article class="stat-card">
      <p class="progress-label">Тестета</p>
      <strong>${state.decks.length}</strong>
    </article>
    <article class="stat-card">
      <p class="progress-label">Научени карти</p>
      <strong>${knownCards}</strong>
    </article>
    <article class="stat-card">
      <p class="progress-label">Трудни карти</p>
      <strong>${hardCards}</strong>
    </article>
  `;

  elements.focusDeck.textContent = focusDeck ? focusDeck.name : "Няма тесте";
  elements.focusCount.textContent = focusDeck ? `${focusDeck.cards.length} карти за преговор` : "Добави първото си тесте";
  elements.streakValue.textContent = `${state.streak} дни`;
  elements.hardTotal.textContent = String(hardCards);
}

function buildProgressBar(label, percent, fill) {
  return `
    <article class="progress-bar-card">
      <p>${label}</p>
      <strong>${percent}%</strong>
      <div class="progress-track">
        <div class="progress-fill" style="width:${percent}%; background:${fill};"></div>
      </div>
    </article>
  `;
}

function handleCreateDeck(event) {
  event.preventDefault();
  const deck = {
    id: crypto.randomUUID(),
    name: elements.deckName.value.trim(),
    category: elements.deckCategory.value.trim(),
    color: elements.deckColor.value,
    cards: []
  };

  state.decks.unshift(deck);
  state.selectedDeckId = deck.id;
  elements.deckForm.reset();
  render();
}

function handleCreateCard(event) {
  event.preventDefault();
  const deck = getSelectedDeck();
  if (!deck) {
    return;
  }

  deck.cards.unshift({
    id: crypto.randomUUID(),
    question: elements.cardQuestion.value.trim(),
    answer: elements.cardAnswer.value.trim(),
    known: false,
    hard: false,
    reviews: 0
  });

  elements.cardForm.reset();
  syncStudyAfterDeckChange(deck.id);
  render();
}

function startStudySession() {
  const deck = getSelectedDeck();
  if (!deck || deck.cards.length === 0) {
    return;
  }

  state.studySession = {
    deckId: deck.id,
    index: 0,
    completed: 0
  };
  render();
  document.getElementById("study-section").scrollIntoView({ behavior: "smooth", block: "start" });
}

function advanceStudy(knowsAnswer) {
  const deck = getStudyDeck();
  if (!deck || deck.cards.length === 0) {
    return;
  }

  const session = ensureStudySession(deck.id);
  const card = deck.cards[session.index];
  if (!card) {
    return;
  }

  card.known = knowsAnswer;
  card.hard = !knowsAnswer;
  card.reviews = (card.reviews || 0) + 1;
  session.completed += 1;

  if (session.completed >= deck.cards.length) {
    session.completed = deck.cards.length;
    session.index = 0;
    state.streak += 1;
  } else {
    session.index = (session.index + 1) % deck.cards.length;
  }

  render();
}

function toggleFlashcard() {
  elements.flashcard.classList.toggle("is-flipped");
}

function deleteSelectedDeck() {
  const deck = getSelectedDeck();
  if (!deck) {
    return;
  }

  state.decks = state.decks.filter((item) => item.id !== deck.id);
  state.selectedDeckId = state.decks[0]?.id || null;
  if (state.studySession.deckId === deck.id) {
    state.studySession = { deckId: null, index: 0, completed: 0 };
  }
  render();
}

function resetDemo() {
  const fresh = structuredClone(demoState);
  Object.keys(state).forEach((key) => delete state[key]);
  Object.assign(state, fresh);
  activeFilter = "all";
  document.querySelectorAll(".filter-chip").forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === "all");
  });
  render();
}

function getSelectedDeck() {
  return state.decks.find((deck) => deck.id === state.selectedDeckId) || null;
}

function getStudyDeck() {
  const sessionDeck = state.decks.find((deck) => deck.id === state.studySession.deckId);
  return sessionDeck || getSelectedDeck();
}

function pickFocusDeck() {
  return state.decks
    .slice()
    .sort((left, right) => {
      const leftHard = left.cards.filter((card) => card.hard).length;
      const rightHard = right.cards.filter((card) => card.hard).length;
      return rightHard - leftHard;
    })[0] || null;
}

function ensureStudySession(deckId) {
  if (state.studySession.deckId !== deckId) {
    state.studySession = {
      deckId,
      index: 0,
      completed: 0
    };
  }
  return state.studySession;
}

function syncStudyAfterDeckChange(deckId) {
  if (state.studySession.deckId === deckId) {
    const deck = state.decks.find((item) => item.id === deckId);
    const cardCount = deck ? deck.cards.length : 0;
    if (cardCount === 0) {
      state.studySession = { deckId: null, index: 0, completed: 0 };
      return;
    }
    state.studySession.index = Math.min(state.studySession.index, cardCount - 1);
    state.studySession.completed = Math.min(state.studySession.completed, cardCount);
  }
}
