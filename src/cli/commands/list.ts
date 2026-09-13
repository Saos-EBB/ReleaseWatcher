import { getProgress, listWatchlist } from "../../core/ops";

export function listCommand(): void {
  const titles = listWatchlist();
  if (titles.length === 0) {
    console.log("Watchlist ist leer.");
    return;
  }
  for (const title of titles) {
    const progress = getProgress(title.id);
    const progressLabel = progress ? `, progress: ${progress.last_number}` : "";
    console.log(`[${title.id}] ${title.name} (${title.type}, ${title.status}${progressLabel})`);
  }
}
