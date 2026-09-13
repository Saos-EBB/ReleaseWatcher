import { addSourceRef, addTitle } from "../../core/ops";
import { getSource } from "../../sources/index";

export async function addCommand(args: string[]): Promise<void> {
  const query = args.join(" ");
  if (!query) {
    console.error("Usage: add <query>");
    return;
  }

  const source = getSource("tmdb");
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
  addSourceRef(title.id, "tmdb", picked.external_id);
  console.log(`Hinzugefügt: [${title.id}] ${title.name} (${title.type})`);
}
