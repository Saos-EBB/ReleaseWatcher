// ── Types ──

interface SearchResult {
  external_id: string;
  name: string;
  type: "series" | "movie" | "anime" | "manga";
  url: string | null;
}

interface ReleaseEntry {
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
}

interface TitleEntry {
  id: number;
  name: string;
  type: string;
  status: string;
  added_at: string;
}

interface RatingInfo {
  imdb_rating: string | null;
  rotten_tomatoes: string | null;
  metacritic: string | null;
  poster: string | null;
}

// ── State ──

let searchResults: SearchResult[] = [];
let activeIdx = -1;
let lastQuery = "";
let viewDate = new Date();
let releases: ReleaseEntry[] = [];
let ratings: Record<number, RatingInfo> = {};

// ── DOM ──

const $searchInput = document.getElementById("searchInput") as HTMLInputElement;
const $sourceSelect = document.getElementById("sourceSelect") as HTMLSelectElement;
const $searchResults = document.getElementById("searchResults") as HTMLDivElement;
const $searchSpinner = document.getElementById("searchSpinner") as HTMLDivElement;
const $calendar = document.getElementById("calendar") as HTMLDivElement;
const $monthLabel = document.getElementById("calendarMonth") as HTMLHeadingElement;
const $checkNew = document.getElementById("checkNewBtn") as HTMLButtonElement;
const $prev = document.getElementById("prevMonth") as HTMLButtonElement;
const $next = document.getElementById("nextMonth") as HTMLButtonElement;
const $titleCount = document.getElementById("titleCount") as HTMLSpanElement;
const $lastUpdate = document.getElementById("lastUpdate") as HTMLSpanElement;
const $toast = document.getElementById("toast") as HTMLDivElement;
const $watchlist = document.getElementById("watchlist") as HTMLDivElement;

// ── Search ──

let searchTimeout: ReturnType<typeof setTimeout>;

$searchInput.addEventListener("input", () => {
  clearTimeout(searchTimeout);
  const q = $searchInput.value.trim();
  if (q.length < 2) {
    closeSearch();
    $searchSpinner.classList.remove("active");
    return;
  }
  $searchSpinner.classList.add("active");
  searchTimeout = setTimeout(doSearch, 300);
});

$searchInput.addEventListener("keydown", (e) => {
  if (!$searchResults.classList.contains("visible")) return;

  const items = $searchResults.querySelectorAll(".search-result-item[data-idx]");
  const count = items.length;
  if (count === 0) return;

  if (e.key === "ArrowDown") {
    e.preventDefault();
    activeIdx = activeIdx < count - 1 ? activeIdx + 1 : 0;
    updateActiveItem(items);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    activeIdx = activeIdx > 0 ? activeIdx - 1 : count - 1;
    updateActiveItem(items);
  } else if (e.key === "Enter") {
    e.preventDefault();
    if (activeIdx >= 0 && activeIdx < count) {
      doAddTitle(activeIdx);
    }
  } else if (e.key === "Escape") {
    closeSearch();
    $searchInput.blur();
  }
});

function updateActiveItem(items: NodeListOf<Element>) {
  items.forEach((el, i) => {
    el.classList.toggle("active", i === activeIdx);
  });
  if (activeIdx >= 0 && items[activeIdx]) {
    items[activeIdx].scrollIntoView({ block: "nearest" });
  }
}

function closeSearch() {
  $searchResults.classList.remove("visible");
  activeIdx = -1;
}

document.addEventListener("click", (e) => {
  if (!(e.target as HTMLElement).closest(".search-section")) {
    closeSearch();
  }
});

$sourceSelect.addEventListener("change", () => {
  if ($searchInput.value.trim().length >= 2) doSearch();
});

function highlightMatch(text: string, query: string): string {
  const escaped = escapeHtml(text);
  if (!query) return escaped;
  const words = query.split(/\s+/).filter(Boolean).map(w =>
    w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  );
  if (words.length === 0) return escaped;
  const re = new RegExp(`(${words.join("|")})`, "gi");
  return escaped.replace(re, "<mark>$1</mark>");
}

async function doSearch() {
  const q = $searchInput.value.trim();
  if (q.length < 2) {
    closeSearch();
    $searchSpinner.classList.remove("active");
    return;
  }

  lastQuery = q;
  const source = $sourceSelect.value;

  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&source=${source}`);
    const data = await res.json();

    if (data.error) {
      toast(data.error, true);
      $searchSpinner.classList.remove("active");
      return;
    }

    searchResults = data.results || [];
    activeIdx = -1;

    if (searchResults.length === 0) {
      $searchResults.innerHTML = `<div class="search-result-item"><span class="result-title" style="color:var(--text-muted)">Keine Treffer</span></div>`;
      $searchResults.classList.add("visible");
      $searchSpinner.classList.remove("active");
      return;
    }

    $searchResults.innerHTML = searchResults
      .map(
        (r, i) => `
      <div class="search-result-item" data-idx="${i}">
        <div class="result-title">
          <span class="result-type">${escapeHtml(r.type)}</span>${highlightMatch(r.name, lastQuery)}
        </div>
        <button type="button" class="add-btn" data-idx="${i}">+ Add</button>
      </div>`,
      )
      .join("");

    $searchResults.querySelectorAll(".add-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const idx = Number((btn as HTMLElement).dataset.idx);
        doAddTitle(idx);
      });
    });

    $searchResults.querySelectorAll(".search-result-item[data-idx]").forEach((item) => {
      item.addEventListener("mouseenter", () => {
        activeIdx = Number((item as HTMLElement).dataset.idx);
        const items = $searchResults.querySelectorAll(".search-result-item[data-idx]");
        updateActiveItem(items);
      });
    });

    $searchResults.classList.add("visible");
  } catch (err) {
    console.error("Search error:", err);
    toast("Suche fehlgeschlagen", true);
  } finally {
    $searchSpinner.classList.remove("active");
  }
}

async function doAddTitle(idx: number) {
  const result = searchResults[idx];
  if (!result) return;

  const source = $sourceSelect.value;

  try {
    const res = await fetch("/api/titles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: result.name,
        type: result.type,
        source,
        external_id: result.external_id,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      toast(data.error || "Fehler beim Hinzufügen", true);
      return;
    }

    toast(`${result.name} hinzugefügt`);
    $searchInput.value = "";
    closeSearch();
    searchResults = [];
    await Promise.all([loadReleases(), loadWatchlist()]);
    setTimeout(async () => {
      await loadRatings();
      loadWatchlist();
    }, 2000);
  } catch (err) {
    console.error("Add error:", err);
    toast("Fehler beim Hinzufügen", true);
  }
}

// ── Watchlist ──

async function loadWatchlist() {
  try {
    const res = await fetch("/api/titles");
    const data = await res.json();
    const titles: TitleEntry[] = data.titles || [];
    $titleCount.textContent = String(data.total || 0);
    renderWatchlist(titles);
  } catch {
    $titleCount.textContent = "?";
  }
}

function ratingBadges(titleId: number): string {
  const r = ratings[titleId];
  if (!r) return "";
  const badges: string[] = [];
  if (r.imdb_rating) {
    badges.push(`<span class="rating-badge imdb"><span class="icon">★</span> ${r.imdb_rating}</span>`);
  }
  if (r.rotten_tomatoes) {
    badges.push(`<span class="rating-badge rt"><span class="icon">🍅</span> ${r.rotten_tomatoes}</span>`);
  }
  if (r.metacritic) {
    badges.push(`<span class="rating-badge mc"><span class="icon">M</span> ${r.metacritic}</span>`);
  }
  if (badges.length === 0) return "";
  return `<div class="rating-row">${badges.join("")}</div>`;
}

function renderWatchlist(titles: TitleEntry[]) {
  if (titles.length === 0) {
    $watchlist.innerHTML = `<p style="color:var(--text-muted); font-size:0.875rem;">Noch keine Titel. Nutze die Suche oben!</p>`;
    return;
  }

  $watchlist.innerHTML = titles
    .map(
      (t) => `
    <div class="watchlist-card" data-id="${t.id}">
      <div class="watchlist-card-header">
        <span class="watchlist-card-name" title="${escapeHtml(t.name)}">${escapeHtml(t.name)}</span>
        <div class="watchlist-card-actions">
          <button class="btn-danger" data-delete="${t.id}">×</button>
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:0.5rem;">
        <span class="result-type">${escapeHtml(t.type)}</span>
        <select class="status-select" data-status-id="${t.id}">
          ${["plan", "watching", "done", "dropped"]
            .map((s) => `<option value="${s}"${s === t.status ? " selected" : ""}>${s}</option>`)
            .join("")}
        </select>
      </div>
      ${ratingBadges(t.id)}
    </div>`,
    )
    .join("");

  $watchlist.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = Number((btn as HTMLElement).dataset.delete);
      if (!confirm("Titel wirklich entfernen?")) return;
      try {
        await fetch(`/api/titles/${id}`, { method: "DELETE" });
        toast("Titel entfernt");
        await Promise.all([loadWatchlist(), loadReleases()]);
      } catch {
        toast("Fehler beim Entfernen", true);
      }
    });
  });

  $watchlist.querySelectorAll("[data-status-id]").forEach((sel) => {
    sel.addEventListener("change", async () => {
      const id = Number((sel as HTMLSelectElement).dataset.statusId);
      const status = (sel as HTMLSelectElement).value;
      try {
        await fetch(`/api/titles/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        toast(`Status: ${status}`);
      } catch {
        toast("Fehler beim Aktualisieren", true);
      }
    });
  });
}

// ── Calendar ──

function renderCalendar() {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  $monthLabel.textContent = new Intl.DateTimeFormat("de-DE", {
    month: "long",
    year: "numeric",
  }).format(viewDate);

  const firstOfMonth = new Date(year, month, 1);
  const startDow = (firstOfMonth.getDay() + 6) % 7;

  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(gridStart.getDate() - startDow);

  $calendar.innerHTML = "";

  for (const label of ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]) {
    const el = document.createElement("div");
    el.className = "calendar-weekday";
    el.textContent = label;
    $calendar.appendChild(el);
  }

  const byDate = new Map<string, ReleaseEntry[]>();
  for (const r of releases) {
    if (!r.air_date) continue;
    const list = byDate.get(r.air_date) || [];
    list.push(r);
    byDate.set(r.air_date, list);
  }

  const today = new Date().toISOString().split("T")[0];
  const cursor = new Date(gridStart);

  for (let i = 0; i < 42; i++) {
    const dateStr = toDateStr(cursor);
    const inMonth = cursor.getMonth() === month;

    const cell = document.createElement("div");
    cell.className = `calendar-day${inMonth ? "" : " other-month"}${dateStr === today ? " today" : ""}`;

    const num = document.createElement("div");
    num.className = "calendar-day-number";
    num.textContent = String(cursor.getDate());
    cell.appendChild(num);

    if (inMonth) {
      const dayReleases = byDate.get(dateStr) || [];
      for (const rel of dayReleases) {
        const chip = document.createElement("div");
        chip.className = `release-chip ${rel.type}`;
        const s = rel.season != null ? `S${rel.season}` : "";
        chip.textContent = `${rel.title_name} ${s}E${rel.number}`;
        chip.title = [rel.name, rel.provider].filter(Boolean).join(" · ");
        if (rel.url) {
          chip.addEventListener("click", () => window.open(rel.url!, "_blank"));
        }
        cell.appendChild(chip);
      }
    }

    $calendar.appendChild(cell);
    cursor.setDate(cursor.getDate() + 1);
  }
}

$prev.addEventListener("click", () => {
  viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
  loadReleases();
});

$next.addEventListener("click", () => {
  viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
  loadReleases();
});

// ── Check new ──

$checkNew.addEventListener("click", async () => {
  $checkNew.disabled = true;
  $checkNew.innerHTML = '<span class="loading"></span> Prüfe…';

  try {
    const res = await fetch("/api/check-new", { method: "POST" });
    const data = await res.json();

    if (data.error) {
      toast(data.error, true);
      return;
    }

    const count = data.count || 0;
    const errors: string[] = data.errors || [];

    if (errors.length > 0) {
      toast(`${count} neue Release(s), ${errors.length} Fehler`, count === 0);
    } else {
      toast(count > 0 ? `${count} neue Release(s) gefunden` : "Keine neuen Releases");
    }

    await loadReleases();
  } catch (err) {
    console.error("Check new error:", err);
    toast("Check new fehlgeschlagen", true);
  } finally {
    $checkNew.disabled = false;
    $checkNew.textContent = "↻ Check new";
  }
});

// ── Data loading ──

async function loadRatings() {
  try {
    const res = await fetch("/api/ratings");
    const data = await res.json();
    ratings = data.ratings || {};
  } catch {
    // ratings are optional
  }
}

async function loadReleases() {
  try {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const from = toDateStr(new Date(year, month, 1));
    const to = toDateStr(new Date(year, month + 1, 0));

    const res = await fetch(`/api/releases?from=${from}&to=${to}`);
    const data = await res.json();
    releases = data.releases || [];
    renderCalendar();
  } catch (err) {
    console.error("Load releases error:", err);
  }
}

// ── Helpers ──

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function escapeHtml(s: string): string {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

function toast(msg: string, isError = false) {
  $toast.textContent = msg;
  $toast.className = `toast visible${isError ? " error" : ""}`;
  setTimeout(() => {
    $toast.className = "toast";
  }, 3000);
}

// ── Init ──

async function init() {
  await loadRatings();
  loadWatchlist();
  loadReleases();
  $lastUpdate.textContent = new Date().toLocaleDateString("de-DE");
}

init();
