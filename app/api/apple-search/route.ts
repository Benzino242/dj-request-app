import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q || q.trim().length < 2) {
    return NextResponse.json({ tracks: [] });
  }

  const response = await fetch(
    `https://itunes.apple.com/search?term=${encodeURIComponent(
      q
    )}&media=music&entity=song&limit=6`
  );

  const data = await response.json();

  const tracks =
    data.results?.map((track: any) => ({
      id: track.trackId,
      song: track.trackName,
      artist: track.artistName,
      album: track.collectionName,
      image: track.artworkUrl100,
      appleUrl: track.trackViewUrl,
      previewUrl: track.previewUrl,
    })) || [];

  return NextResponse.json({ tracks });
}