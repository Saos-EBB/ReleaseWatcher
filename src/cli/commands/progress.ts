import { getTitle, setProgress } from "../../core/ops";

export function progressCommand(args: string[]): void {
  const [idArg, numberArg] = args;
  const id = Number(idArg);
  const number = Number(numberArg);

  if (!idArg || !numberArg || Number.isNaN(id) || Number.isNaN(number)) {
    console.error("Usage: progress <id> <number>");
    return;
  }
  if (!getTitle(id)) {
    console.error(`Titel ${id} nicht gefunden.`);
    return;
  }

  setProgress(id, number);
  console.log(`Progress von [${id}] auf ${number} gesetzt.`);
}
