import { getTitle, removeTitle } from "../../core/ops";

export function rmCommand(args: string[]): void {
  const id = Number(args[0]);

  if (!args[0] || Number.isNaN(id)) {
    console.error("Usage: rm <id>");
    return;
  }
  if (!getTitle(id)) {
    console.error(`Titel ${id} nicht gefunden.`);
    return;
  }

  removeTitle(id);
  console.log(`Titel [${id}] entfernt.`);
}
