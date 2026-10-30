import { existsSync, copyFileSync } from "fs";
import { $ } from "bun";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "../../..");

function check(label: string, ok: boolean): boolean {
  console.log(`  ${ok ? "✓" : "✗"} ${label}`);
  return ok;
}

export async function setupCommand(args: string[]): Promise<void> {
  const seed = args.includes("--seed");

  console.log("🚀 Release Watcher — Setup\n");

  // 1. Bun
  let bunVersion = "";
  try {
    bunVersion = (await $`bun --version`.text()).trim();
  } catch {}
  check(`Bun installiert (${bunVersion || "FEHLT"})`, !!bunVersion);
  if (!bunVersion) {
    console.log("    → Installiere Bun mit: curl -fsSL https://bun.sh/install | bash\n");
    return;
  }

  // 2. Dependencies
  const hasNodeModules = existsSync(path.join(ROOT, "node_modules"));
  if (!hasNodeModules) {
    console.log("  … bun install läuft…");
    await $`bun install`.cwd(ROOT).quiet();
  }
  check("Dependencies installiert", true);

  // 3. .env
  const envPath = path.join(ROOT, ".env");
  const envExamplePath = path.join(ROOT, ".env.example");
  if (!existsSync(envPath) && existsSync(envExamplePath)) {
    copyFileSync(envExamplePath, envPath);
    console.log("  … .env aus .env.example erstellt");
  }
  check(".env vorhanden", existsSync(envPath));

  // 4. API Keys
  const env = Bun.file(envPath);
  const envContent = await env.text();
  const tmdbKey = envContent.match(/TMDB_API_KEY=(.+)/)?.[1]?.trim();
  const tvdbKey = envContent.match(/TVDB_API_KEY=(.+)/)?.[1]?.trim();
  check(`TMDB_API_KEY gesetzt`, !!tmdbKey);
  check(`TVDB_API_KEY gesetzt`, !!tvdbKey);
  if (!tmdbKey || !tvdbKey) {
    console.log("    → Keys in .env eintragen (AniList & MangaDex brauchen keinen Key)");
  }

  // 5. SQLite DB
  const dbPath = path.join(ROOT, "release-watcher.sqlite");
  const dbExists = existsSync(dbPath);
  check(`Datenbank vorhanden`, dbExists);

  // 6. Seed (optional)
  if (seed) {
    console.log("\n🌱 Seede Testdaten…");
    await $`bun ${path.join(ROOT, "scripts/seed-test-data.ts")}`.cwd(ROOT);
  } else if (!dbExists) {
    console.log("    → Für Testdaten: bun run start setup --seed");
  }

  // Summary
  console.log("\n──────────────────────────────");
  console.log("CLI:  bun run start --help");
  console.log("UI:   bun run ui → http://localhost:3000");
  console.log("Tests: bun test");
  console.log("──────────────────────────────\n");
}
