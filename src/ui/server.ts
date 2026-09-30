import { getSource } from "../sources/index";
import { checkNew, listReleasesBetween, addTitle, addSourceRef, getTitle } from "../core/ops";
import type { SearchResult, TitleType } from "../core/types";
import indexHtml from "./index.html";

interface SearchQuery {
  q: string;
  source?: string;
}

interface AddTitleRequest {
  name: string;
  type: TitleType;
  source: string;
  external_id: string;
}

interface ReleasesQuery {
  from?: string;
  to?: string;
}

Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

    // Serve HTML
    if (url.pathname === "/") {
      return new Response(indexHtml, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

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
        const body = (await req.json()) as AddTitleRequest;
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

    // API: List Releases (by date range)
    if (url.pathname === "/api/releases" && req.method === "GET") {
      const from = url.searchParams.get("from") || new Date().toISOString().split("T")[0];
      const to = url.searchParams.get("to") || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

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
        return Response.json({ newReleases });
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

console.log("Release Watcher UI running at http://localhost:3000");
