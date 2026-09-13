import { addCommand } from "./commands/add";
import { checkNewCommand } from "./commands/check-new";
import { listCommand } from "./commands/list";
import { rmCommand } from "./commands/rm";
import { statusCommand } from "./commands/status";

const HELP = `release-watcher

Usage:
  add <query>              Titel suchen und zur Watchlist hinzufügen
  list                     Watchlist anzeigen
  check-new                Neue Releases für die Watchlist prüfen
  status <id> <status>     Status setzen (watching|plan|done|dropped)
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
