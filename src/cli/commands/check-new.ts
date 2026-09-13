import { listSourceRefsForTitle, listWatchlist, saveReleaseIfNew } from "../../core/ops";
import { getSource } from "../../sources/index";

export async function checkNewCommand(): Promise<void> {
  const titles = listWatchlist();
  let foundAny = false;

  for (const title of titles) {
    const refs = listSourceRefsForTitle(title.id);
    for (const ref of refs) {
      const source = getSource(ref.source);
      const releases = await source.getReleases(ref);
      for (const release of releases) {
        if (!saveReleaseIfNew(title.id, ref.source, release)) continue;
        foundAny = true;
        const seasonLabel = release.season != null ? `S${release.season}` : "";
        const nameLabel = release.name ? ` "${release.name}"` : "";
        const providerLabel = release.provider ? ` auf ${release.provider}` : "";
        console.log(
          `[${title.id}] ${title.name} — ${seasonLabel}E${release.number}${nameLabel} ` +
            `(${release.air_date ?? "kein Datum"})${providerLabel} — ${release.url ?? "kein Link"}`,
        );
      }
    }
  }

  if (!foundAny) {
    console.log("Keine neuen Releases.");
  }
}
