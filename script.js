
const STORAGE_KEY = "quaseverse_stories_v1";
const SPARKS_KEY = "quaseverse_sparks_v1";
const MAX_STORIES = 1000;

const initialStories = [
  {
    id: "initial-1",
    title: "A mensagem das 23h47",
    category: "Amor",
    text: "Escrevi um texto inteiro, reli cada palavra e imaginei todas as respostas possíveis. No fim, apaguei tudo. Às vezes ainda me pergunto como aquela conversa teria mudado a minha história.",
    date: "Há 2 dias",
    sparks: 42,
    author: "Alguém por aí"
  },
  {
    id: "initial-2",
    title: "A cidade onde nunca morei",
    category: "Sonhos",
    text: "Eu tinha planos de morar perto do mar, conhecer ruas desconhecidas e começar uma vida nova. A vida me levou para outro lugar, mas ainda existe uma versão minha caminhando por aquela cidade.",
    date: "Há 4 dias",
    sparks: 31,
    author: "Uma possibilidade"
  },
  {
    id: "initial-3",
    title: "O amigo que quase foi",
    category: "Amizade",
    text: "A gente conversava todos os dias e parecia se entender sem esforço. Uma mudança de escola, algumas semanas de silêncio e aquela amizade virou uma lembrança que nunca chegou a ter despedida.",
    date: "Há 1 semana",
    sparks: 28,
    author: "Uma lembrança"
  },
  {
    id: "initial-4",
    title: "O curso que deixei para depois",
    category: "Escolhas",
    text: "Eu queria muito experimentar uma área diferente, mas fiquei esperando a hora perfeita. Hoje percebo que talvez a hora perfeita fosse apenas o dia em que eu tivesse coragem de começar.",
    date: "Há 1 semana",
    sparks: 19,
    author: "Um caminho"
  },
  {
    id: "initial-5",
    title: "A conversa no ponto de ônibus",
    category: "Amor",
    text: "Uma pessoa sorriu para mim e eu quase puxei conversa. O ônibus chegou, cada um seguiu sua direção e nunca descobri o nome dela. Talvez tenha sido só um instante bonito, e tudo bem.",
    date: "Há 2 semanas",
    sparks: 36,
    author: "Desconhecido"
  },
  {
    id: "initial-6",
    title: "O desenho escondido",
    category: "Sonhos",
    text: "Eu desenhava por horas, mas tinha vergonha de mostrar para alguém. Guardei tantas ideias que algumas até esqueci. Agora imagino como teria sido se eu tivesse compartilhado o primeiro desenho.",
    date: "Há 3 semanas",
    sparks: 24,
    author: "Uma ideia"
  }
];

const categorySymbols = {
  Amor: "♡",
  Sonhos: "☁",
  Amizade: "✦",
  Escolhas: "↗",
  Outros: "∞"
};

const grid = document.getElementById("storyGrid");
const searchInput = document.getElementById("searchInput");
const filters = document.getElementById("filters");
const modal = document.getElementById("storyModal");
const form = document.getElementById("storyForm");
const toast = document.getElementById("toast");
const emptyState = document.getElementById("emptyState");
const showAllButton = document.getElementById("showAllButton");

let selectedCategory = "Todos";
let searchText = "";
let showAll = false;
let toastTimeout;

function loadStories() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (error) {
    console.warn("Não foi possível ler as histórias salvas.", error);
  }

  return initialStories.map(story => ({ ...story }));
}

let stories = loadStories();

function saveStories() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stories));
    return true;
  } catch (error) {
    showToast("Não foi possível salvar. Verifique o armazenamento do navegador.");
    return false;
  }
}

function loadSparkedStories() {
  try {
    const saved = JSON.parse(localStorage.getItem(SPARKS_KEY) || "[]");
    return new Set(Array.isArray(saved) ? saved : []);
  } catch {
    return new Set();
  }
}

let sparkedStories = loadSparkedStories();

function saveSparkedStories() {
  try {
    localStorage.setItem(SPARKS_KEY, JSON.stringify([...sparkedStories]));
  } catch {
    showToast("Não foi possível salvar sua identificação.");
  }
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };
    return entities[character];
  });
}

function getFilteredStories() {
  return stories.filter(story => {
    const matchesCategory =
      selectedCategory === "Todos" ||
      story.category === selectedCategory;

    const haystack =
      `${story.title} ${story.text} ${story.category}`.toLowerCase();

    const matchesSearch = haystack.includes(searchText);

    return matchesCategory && matchesSearch;
  });
}

function renderStories() {
  const filtered = getFilteredStories();
  const visible = showAll ? filtered : filtered.slice(0, 6);

  grid.innerHTML = visible.map((story, index) => {
    const safeTitle = escapeHTML(story.title);
    const safeText = escapeHTML(story.text);
    const safeCategory = escapeHTML(story.category);
    const safeDate = escapeHTML(story.date || "Agora");
    const symbol = categorySymbols[story.category] || "✳";
    const isActive = sparkedStories.has(story.id);

    return `
      <article class="story-card" style="animation-delay:${index * 45}ms">
        <div class="card-top">
          <span class="category-tag">${symbol} ${safeCategory}</span>
          <span class="card-number">Q/${String(index + 1).padStart(2, "0")}</span>
        </div>

        <h3>${safeTitle}</h3>
        <p>${safeText}</p>

        <div class="card-footer">
          <span class="card-date">${safeDate}</span>
          <button
            class="spark-button ${isActive ? "is-active" : ""}"
            data-spark="${escapeHTML(story.id)}"
            aria-pressed="${isActive}"
            aria-label="Mostrar identificação com esta história">
            ${isActive ? "✦ Eu também" : "✧ Eu também"}
            · ${Number(story.sparks) || 0}
          </button>
        </div>
      </article>
    `;
  }).join("");

  emptyState.classList.toggle("hidden", filtered.length !== 0);

  if (filtered.length === 0) {
    grid.classList.add("hidden");
  } else {
    grid.classList.remove("hidden");
  }

  showAllButton.classList.toggle(
    "hidden",
    filtered.length <= 6
  );

  showAllButton.innerHTML = showAll
    ? 'Mostrar menos <span>↑</span>'
    : 'Ver todas as histórias <span>↓</span>';

  document.getElementById("storyCount").textContent =
    String(stories.length).padStart(2, "0");

  const totalSparks = stories.reduce(
    (sum, story) => sum + (Number(story.sparks) || 0), 0
  );

  document.getElementById("sparkCount").textContent =
    totalSparks.toLocaleString("pt-BR");

  document.getElementById("resultsText").textContent =
    `${filtered.length} ${filtered.length === 1 ? "HISTÓRIA ENCONTRADA" : "HISTÓRIAS ENCONTRADAS"}`;
}

function openModal() {
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
  setTimeout(() => document.getElementById("storyTitle").focus(), 50);
}

function closeModal() {
  modal.classList.add("hidden");
  document.body.style.overflow = "";
}

function showToast(message) {
  clearTimeout(toastTimeout);
  toast.textContent = message;
  toast.classList.add("show");

  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

function updateCategory(category) {
  selectedCategory = category;
  showAll = false;

  filters.querySelectorAll(".filter").forEach(button => {
    const active = button.dataset.category === category;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  renderStories();
}

document.getElementById("openModalTop").addEventListener("click", openModal);
document.getElementById("openModalHero").addEventListener("click", openModal);
document.getElementById("openModalBanner").addEventListener("click", openModal);
document.getElementById("emptyCreateButton").addEventListener("click", openModal);
document.getElementById("closeModal").addEventListener("click", closeModal);

modal.addEventListener("click", event => {
  if (event.target === modal) closeModal();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !modal.classList.contains("hidden")) {
    closeModal();
  }
});

filters.addEventListener("click", event => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  updateCategory(button.dataset.category);
});

searchInput.addEventListener("input", event => {
  searchText = event.target.value.trim().toLowerCase();
  showAll = false;
  renderStories();
});

showAllButton.addEventListener("click", () => {
  showAll = !showAll;
  renderStories();
});

grid.addEventListener("click", event => {
  const button = event.target.closest("[data-spark]");
  if (!button) return;

  const id = button.dataset.spark;
  const story = stories.find(item => item.id === id);
  if (!story) return;

  if (sparkedStories.has(id)) {
    sparkedStories.delete(id);
    story.sparks = Math.max(0, (Number(story.sparks) || 0) - 1);
    showToast("Você retirou sua identificação.");
  } else {
    sparkedStories.add(id);
    story.sparks = (Number(story.sparks) || 0) + 1;
    showToast("Talvez vocês não sejam tão diferentes. ✦");
  }

  saveSparkedStories();
  saveStories();
  renderStories();
});

form.addEventListener("submit", event => {
  event.preventDefault();

  if (stories.length >= MAX_STORIES) {
    showToast("O limite de histórias deste navegador foi atingido.");
    return;
  }

  const title = document.getElementById("storyTitle").value.trim();
  const category = document.getElementById("storyCategory").value;
  const text = document.getElementById("storyText").value.trim();

  if (!title || !text) {
    showToast("Preencha o título e a história.");
    return;
  }

  const newStory = {
    id: `story-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    category,
    text,
    date: "Agora",
    sparks: 0,
    author: "Alguém por aí"
  };

  stories.unshift(newStory);

  if (!saveStories()) {
    stories.shift();
    return;
  }

  form.reset();
  closeModal();
  updateCategory("Todos");
  searchInput.value = "";
  searchText = "";
  showAll = true;
  renderStories();

  document.getElementById("explorar").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

  showToast("Sua história agora faz parte do QuaseVerse. ✨");
});

renderStories();
