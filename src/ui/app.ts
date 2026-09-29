interface SearchResult {
  external_id: string;
  name: string;
  type: "series" | "movie" | "anime" | "manga";
  url: string | null;
}

interface ReleaseWithTitle {
  id: number;
  title_id: number;
  title_name: string;
  type: string;
  source: string;
  season: number | null;
  number: number;
  name: string | null;
  air_date: string | null;
  provider: string | null;
  url: string | null;
  fetched_at: string;
}

let currentSearchResults: SearchResult[] = [];
let currentMonth = new Date();
let allReleases: ReleaseWithTitle[] = [];

// DOM Elements
const searchInput = document.getElementById("searchInput") as HTMLInputElement;
const searchResults = document.getElementById("searchResults") as HTMLDivElement;
const calendar = document.getElementById("calendar") as HTMLDivElement;
const calendarMonth = document.getElementById("calendarMonth") as HTMLHeadingElement;
const checkNewBtn = document.getElementById("checkNewBtn") as HTMLButtonElement;
const prevMonthBtn = document.getElementById("prevMonth") as HTMLButtonElement;
const nextMonthBtn = document.getElementById("nextMonth") as HTMLButtonElement;
const titleCount = document.getElementById("titleCount") as HTMLSpanElement;
const lastUpdate = document.getElementById("lastUpdate") as HTMLSpanElement;

// Search
searchInput.addEventListener("input", debounce(handleSearch, 300));

async function handleSearch() {
  const query = searchInput.value.trim();
  if (query.length < 2) {
    searchResults.classList.remove("visible");
    return;
  }

  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&source=tmdb`);
    const data = (await response.json()) as { results: SearchResult[] };
    currentSearchResults = data.results || [];
    renderSearchResults();
  } catch (err) {
    console.error("Search error:", err);
  }
}

function renderSearchResults() {
  if (currentSearchResults.length === 0) {
    searchResults.classList.remove("visible");
    return;
  }

  searchResults.innerHTML = currentSearchResults
    .map(
      (result, idx) => `
    <div class="search-result-item" data-index="${idx}">
      <div class="result-title">
        <span class="result-type">${result.type}</span>${result.name}
      </div>
      <button onclick="addTitle(${idx})" style="padding: 0.25rem 0.75rem; font-size: 0.875rem;">+ Add</button>
    </div>
  `,
    )
    .join("");

  searchResults.classList.add("visible");
}

async function addTitle(idx: number) {
  const result = currentSearchResults[idx];
  if (!result) return;

  checkNewBtn.disabled = true;
  checkNewBtn.textContent = "Adding…";

  try {
    const response = await fetch("/api/titles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: result.name,
        type: result.type,
        source: "tmdb",
        external_id: result.external_id,
      }),
    });

    if (response.ok) {
      searchInput.value = "";
      searchResults.classList.remove("visible");
      currentSearchResults = [];
      await loadReleases();
      await updateTitleCount();
    }
  } catch (err) {
    console.error("Add title error:", err);
    alert("Error adding title");
  } finally {
    checkNewBtn.disabled = false;
    checkNewBtn.textContent = "↻ Check new";
  }
}

// Calendar
function renderCalendar() {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  calendarMonth.textContent = new Intl.DateTimeFormat("de-DE", {
    month: "long",
    year: "numeric",
  }).format(currentMonth);

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  calendar.innerHTML = "";

  // Weekday headers
  const weekdays = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
  for (const day of weekdays) {
    const dayEl = document.createElement("div");
    dayEl.className = "calendar-weekday";
    dayEl.textContent = day;
    calendar.appendChild(dayEl);
  }

  // Days
  let current = new Date(startDate);
  while (current <= lastDay || current.getDay() !== 1) {
    const dayEl = document.createElement("div");
    const dateStr = current.toISOString().split("T")[0];
    const isOtherMonth = current.getMonth() !== month;

    dayEl.className = `calendar-day${isOtherMonth ? " other-month" : ""}`;

    if (!isOtherMonth) {
      dayEl.innerHTML = `<div class="calendar-day-number">${current.getDate()}</div>`;

      // Add releases for this date
      const dayReleases = allReleases.filter((r) => r.air_date === dateStr);
      for (const release of dayReleases) {
        const chip = document.createElement("div");
        chip.className = `release-chip ${release.type}`;
        const seasonLabel = release.season != null ? `S${release.season}` : "";
        chip.textContent = `${release.title_name} ${seasonLabel}E${release.number}`;
        chip.title = release.name || "";
        if (release.url) {
          chip.style.cursor = "pointer";
          chip.onclick = () => window.open(release.url, "_blank");
        }
        dayEl.appendChild(chip);
      }
    } else {
      dayEl.textContent = current.getDate().toString();
    }

    calendar.appendChild(dayEl);
    current.setDate(current.getDate() + 1);
  }
}

prevMonthBtn.addEventListener("click", () => {
  currentMonth.setMonth(currentMonth.getMonth() - 1);
  renderCalendar();
});

nextMonthBtn.addEventListener("click", () => {
  currentMonth.setMonth(currentMonth.getMonth() + 1);
  renderCalendar();
});

// Check new
checkNewBtn.addEventListener("click", async () => {
  checkNewBtn.disabled = true;
  checkNewBtn.innerHTML = '<span class="loading"></span>';

  try {
    await fetch("/api/check-new", { method: "POST" });
    await loadReleases();
  } catch (err) {
    console.error("Check new error:", err);
    alert("Error checking for new releases");
  } finally {
    checkNewBtn.disabled = false;
    checkNewBtn.textContent = "↻ Check new";
  }
});

// Load releases
async function loadReleases() {
  try {
    // Get current month range
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const from = new Date(year, month, 1).toISOString().split("T")[0];
    const to = new Date(year, month + 1, 0).toISOString().split("T")[0];

    const response = await fetch(`/api/releases?from=${from}&to=${to}`);
    const data = (await response.json()) as { releases: ReleaseWithTitle[] };
    allReleases = data.releases || [];
    renderCalendar();
  } catch (err) {
    console.error("Load releases error:", err);
  }
}

async function updateTitleCount() {
  // For now, just show 0 (would need a /api/titles endpoint)
  titleCount.textContent = "~";
}

function updateLastUpdate() {
  lastUpdate.textContent = new Date().toLocaleDateString("de-DE");
}

// Utility
function debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number): T {
  let timeout: ReturnType<typeof setTimeout>;
  return ((...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  }) as T;
}

// Make addTitle globally available
declare global {
  function addTitle(idx: number): void;
}
(window as unknown as Record<string, unknown>).addTitle = addTitle;

// Init
async function init() {
  await loadReleases();
  updateLastUpdate();
}

init();
