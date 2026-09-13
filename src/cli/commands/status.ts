import { getTitle, setStatus } from "../../core/ops";
import type { TitleStatus } from "../../core/types";

const VALID_STATUSES: TitleStatus[] = ["watching", "plan", "done", "dropped"];

export function statusCommand(args: string[]): void {
  const [idArg, statusArg] = args;
  const id = Number(idArg);

  if (!idArg || !statusArg || !VALID_STATUSES.includes(statusArg as TitleStatus)) {
    console.error(`Usage: status <id> <${VALID_STATUSES.join("|")}>`);
    return;
  }
  if (!getTitle(id)) {
    console.error(`Titel ${id} nicht gefunden.`);
    return;
  }

  setStatus(id, statusArg as TitleStatus);
  console.log(`Status von [${id}] auf ${statusArg} gesetzt.`);
}
