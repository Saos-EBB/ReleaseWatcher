import { checkNew } from "../../core/ops";

export async function checkNewCommand(): Promise<void> {
  const { newReleases, errors } = await checkNew();

  for (const err of errors) {
    console.error(`Fehler: ${err}`);
  }

  if (newReleases.length === 0) {
    console.log("Keine neuen Releases.");
    return;
  }

  for (const item of newReleases) {
    const seasonLabel = item.release.season != null ? `S${item.release.season}` : "";
    const nameLabel = item.release.name ? ` "${item.release.name}"` : "";
    const providerLabel = item.release.provider ? ` auf ${item.release.provider}` : "";
    console.log(
      `[${item.titleId}] ${item.titleName} — ${seasonLabel}E${item.release.number}${nameLabel} ` +
        `(${item.release.air_date ?? "kein Datum"})${providerLabel} — ${item.release.url ?? "kein Link"}`,
    );
  }
}
