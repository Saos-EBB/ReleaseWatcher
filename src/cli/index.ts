import { addCommand } from "./commands/add";
import { checkNewCommand } from "./commands/check-new";
import { listCommand } from "./commands/list";
import { progressCommand } from "./commands/progress";
import { rmCommand } from "./commands/rm";
import { statusCommand } from "./commands/status";

const HELP = `release-watcher

Usage:
  add [--source <tmdb|anilist|mangadex|tvdb>] <query>
                           Titel suchen (default tmdb) und zur Watchlist hinzufügen
  list                     Watchlist anzeigen (inkl. Progress)
  check-new                Neue Releases für die Watchlist prüfen
  status <id> <status>     Status setzen (watching|plan|done|dropped)
  progress <id> <number>   Fortschritt manuell setzen
  rm <id>                  Titel entfernen
  --help                   Diese Hilfe anzeigen
`;

async function main(): Promise<void> {
  const [command, ...args] = process.argv.slice(2);

  switch (command) {
    case "add":
      await addCommand(args);
      break;
    case "list":
      listCommand();
      break;
    case "check-new":
      await checkNewCommand();
      break;
    case "status":
      statusCommand(args);
      break;
    case "progress":
      progressCommand(args);
      break;
    case "rm":
      rmCommand(args);
      break;
    case "--help":
    case undefined:
      console.log(HELP);
      break;
    default:
      console.error(`Unbekanntes Kommando: ${command}`);
      console.log(HELP);
  }
}

main();
