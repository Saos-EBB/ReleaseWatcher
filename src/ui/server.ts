import { getSource } from "../sources/index";
import {
  checkNew,
  listReleasesBetween,
  addTitle,
  addSourceRef,
  listTitles,
  listWatchlist,
} from "../core/ops";
import type { TitleType } from "../core/types";
import indexHtml from "./index.html";

Bun.serve({
  port: 3000,
  routes: {
    "/": indexHtml,
  },
  async fetch(req) {
    const url = new URL(req.url);

    // API: Search
    if (url.pathname === "/api/search" && req.method === "GET") {
      const q = url.searchParams.get("q") || "";
      const sourceName = url.searchParams.get("source") || "tmdb";

      if (!q.trim()) {
        return Response.json({ results: [] });
      }

      try {
        const source = getSource(sourceName as any);
        const results = await source.search(q);
        return Response.json({ results });
      } catch (err) {
        return Response.json(
          { error: err instanceof Error ? err.message : "Unknown error" },
          { status: 500 },
        );
      }
    }

    // API: Add Title
    if (url.pathname === "/api/titles" && req.method === "POST") {
      try {
        const body = (await req.json()) as {
          name: string;
          type: TitleType;
          source: string;
          external_id: string;
        };
        const title = addTitle(body.name, body.type);
        addSourceRef(title.id, body.source as any, body.external_id);

        // Immediately fetch releases for this new title
        const newReleases = await checkNew(title.id);

        return Response.json({ title, newReleases }, { status: 201 });
      } catch (err) {
        return Response.json(
          { error: err instanceof Error ? err.message : "Unknown error" },
          { status: 500 },
        );
      }
    }

    // API: List Titles (for count + watchlist)
    if (url.pathname === "/api/titles" && req.method === "GET") {
      try {
        const all = listTitles();
        const watchlist = listWatchlist();
        return Response.json({ total: all.length, watching: watchlist.length, titles: all });
      } catch (err) {
        return Response.json(
          { error: err instanceof Error ? err.message : "Unknown error" },
          { status: 500 },
        );
      }
    }

    // API: List Releases (by date range)
    if (url.pathname === "/api/releases" && req.method === "GET") {
      const now = new Date();
      const from =
        url.searchParams.get("from") || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      const to =
        url.searchParams.get("to") || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

      try {
        const releases = listReleasesBetween(from, to);
        return Response.json({ releases });
      } catch (err) {
        return Response.json(
          { error: err instanceof Error ? err.message : "Unknown error" },
          { status: 500 },
        );
      }
    }

    // API: Check new releases
    if (url.pathname === "/api/check-new" && req.method === "POST") {
      try {
        const newReleases = await checkNew();
        return Response.json({ newReleases, count: newReleases.length });
      } catch (err) {
        return Response.json(
          { error: err instanceof Error ? err.message : "Unknown error" },
          { status: 500 },
        );
      }
    }

    return new Response("Not found", { status: 404 });
  },
});

console.log("Release Watcher UI → http://localhost:3000");
