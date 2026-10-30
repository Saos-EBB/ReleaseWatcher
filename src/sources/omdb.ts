const BASE_URL = "https://www.omdbapi.com";

export interface OmdbRating {
  imdb_rating: string | null;
  rotten_tomatoes: string | null;
  metacritic: string | null;
  poster: string | null;
}

function apiKey(): string | null {
  return process.env.OMDB_API_KEY || null;
}

export async function fetchOmdbByImdbId(imdbId: string): Promise<OmdbRating | null> {
  const key = apiKey();
  if (!key) return null;

  const res = await fetch(`${BASE_URL}/?apikey=${key}&i=${imdbId}`);
  if (!res.ok) return null;

  const data = await res.json();
  if (data.Response === "False") return null;

  const rt = data.Ratings?.find((r: any) => r.Source === "Rotten Tomatoes");

  return {
    imdb_rating: data.imdbRating !== "N/A" ? data.imdbRating : null,
    rotten_tomatoes: rt?.Value ?? null,
    metacritic: data.Metascore !== "N/A" ? data.Metascore : null,
    poster: data.Poster !== "N/A" ? data.Poster : null,
  };
}

export async function fetchOmdbByTitle(title: string, type?: "movie" | "series"): Promise<OmdbRating | null> {
  const key = apiKey();
  if (!key) return null;

  const params = new URLSearchParams({ apikey: key, t: title });
  if (type) params.set("type", type);

  const res = await fetch(`${BASE_URL}/?${params}`);
  if (!res.ok) return null;

  const data = await res.json();
  if (data.Response === "False") return null;

  const rt = data.Ratings?.find((r: any) => r.Source === "Rotten Tomatoes");

  return {
    imdb_rating: data.imdbRating !== "N/A" ? data.imdbRating : null,
    rotten_tomatoes: rt?.Value ?? null,
    metacritic: data.Metascore !== "N/A" ? data.Metascore : null,
    poster: data.Poster !== "N/A" ? data.Poster : null,
  };
}
