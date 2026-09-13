import { listWatchlist } from "../../core/ops";

export function listCommand(): void {
  const titles = listWatchlist();
  if (titles.length === 0) {
    console.log("Watchlist ist leer.");
    return;
  }
  for (const title of titles) {
    console.log(`[${title.id}] ${title.name} (${title.type}, ${title.status})`);
  }
}
