interface PexelsSearchResponse {
  photos: { src: { medium: string } }[];
}

export async function getThemeImageUrl(query: string): Promise<string | null> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=square`,
      {
        headers: { Authorization: apiKey },
        next: { revalidate: 60 * 60 * 24 * 7 },
      },
    );

    if (!response.ok) return null;

    const data = (await response.json()) as PexelsSearchResponse;
    return data.photos[0]?.src.medium ?? null;
  } catch {
    return null;
  }
}
