import { addSourceRef, addTitle } from "../../core/ops";
import { getSource } from "../../sources/index";
import type { SourceName } from "../../core/types";

const VALID_SOURCES: SourceName[] = ["tmdb", "anilist", "mangadex", "tvdb"];

export async function addCommand(args: string[]): Promise<void> {
  let sourceName: SourceName = "tmdb";
  let rest = args;

  if (rest[0] === "--source") {
    const candidate = rest[1];
    if (!candidate || !VALID_SOURCES.includes(candidate as SourceName)) {
      console.error(`Usage: add [--source <${VALID_SOURCES.join("|")}>] <query>`);
      return;
    }
    sourceName = candidate as SourceName;
    rest = rest.slice(2);
  }

  const query = rest.join(" ");
  if (!query) {
    console.error("Usage: add <query>");
    return;
  }

  const source = getSource(sourceName);
  const results = await source.search(query);
  if (results.length === 0) {
    console.log("Keine Treffer.");
    return;
  }

  results.forEach((result, index) => {
    console.log(`[${index}] (${result.type}) ${result.name} — ${result.url ?? "kein Link"}`);
  });

  const answer = prompt("Auswahl (Index):");
  const index = Number(answer);
  const picked = results[index];
  if (!picked) {
    console.error("Ungültige Auswahl.");
    return;
  }

  const title = addTitle(picked.name, picked.type);
  addSourceRef(title.id, sourceName, picked.external_id);
  console.log(`Hinzugefügt: [${title.id}] ${title.name} (${title.type})`);
}
