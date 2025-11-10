import fs from "fs";
import { NextResponse } from "next/server";
import path from "path";

interface PlayedItem {
  title: string;
  artist: string;
  album: string;
  image_key?: string;
  timestamp: number;
  zone?: string;
}

export async function GET(request: Request) {
  console.log("Top 40 API endpoint called");

  try {
    const { searchParams } = new URL(request.url);
    const zone = searchParams.get("zone");

    // Read the listening history file
    const historyPath = path.join(
      process.cwd(),
      "data",
      "listening-history.json",
    );
    console.log("Reading history file from:", historyPath);

    if (!fs.existsSync(historyPath)) {
      console.error("History file not found at:", historyPath);
      return NextResponse.json(
        { error: "History file not found" },
        { status: 404 },
      );
    }

    const historyData = JSON.parse(
      fs.readFileSync(historyPath, "utf-8"),
    ) as PlayedItem[];
    console.log("Successfully read history data, entries:", historyData.length);

    // Normalize artist names
    const normalizeArtist = (artist: string): string => {
      if (!artist) return "";
      const normalized = artist.trim().toLowerCase();
      if (normalized.includes("blink") && normalized.includes("182")) {
        return "blink-182";
      }
      // Handle Knox/KNOX case normalization
      if (normalized === "knox") {
        return "Knox";
      }
      return artist.trim();
    };

    // Process artists
    const artistCounts = new Map<
      string,
      { count: number; image_key?: string }
    >();
    historyData.forEach((item) => {
      if (zone && item.zone !== zone) return;

      if (item.artist) {
        const normalizedArtist = normalizeArtist(item.artist);
        const currentCount = artistCounts.get(normalizedArtist)?.count || 0;
        artistCounts.set(normalizedArtist, {
          count: currentCount + 1,
          image_key:
            item.image_key || artistCounts.get(normalizedArtist)?.image_key,
        });
      }
    });

    // Process albums
    const albumCounts = new Map<
      string,
      { count: number; artist: string; image_key?: string }
    >();
    historyData.forEach((item) => {
      if (zone && item.zone !== zone) return;

      if (item.album && item.artist) {
        const normalizedArtist = normalizeArtist(item.artist);
        const key = `${item.album}|${normalizedArtist}`;
        const currentCount = albumCounts.get(key)?.count || 0;
        albumCounts.set(key, {
          count: currentCount + 1,
          artist: normalizedArtist,
          image_key: item.image_key || albumCounts.get(key)?.image_key,
        });
      }
    });

    // Process tracks
    const trackCounts = new Map<
      string,
      { count: number; artist: string; image_key?: string }
    >();
    historyData.forEach((item) => {
      if (zone && item.zone !== zone) return;

      if (item.title) {
        const normalizedArtist = normalizeArtist(item.artist);
        const key = `${item.title}|${normalizedArtist}`;
        const currentCount = trackCounts.get(key)?.count || 0;
        trackCounts.set(key, {
          count: currentCount + 1,
          artist: normalizedArtist,
          image_key: item.image_key || trackCounts.get(key)?.image_key,
        });
      }
    });

    // Get unique zones
    const zones = Array.from(
      new Set(historyData.map((item) => item.zone)),
    ).sort();

    // Convert to arrays and sort
    const topArtists = Array.from(artistCounts.entries())
      .map(([name, { count, image_key }]) => ({
        name: normalizeArtist(name),
        count,
        image_key,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 40);

    const topAlbums = Array.from(albumCounts.entries())
      .map(([key, { count, artist, image_key }]) => ({
        name: key.split("|")[0],
        artist: normalizeArtist(artist),
        count,
        image_key,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 40);

    const topTracks = Array.from(trackCounts.entries())
      .map(([key, { count, artist, image_key }]) => ({
        name: key.split("|")[0],
        artist: normalizeArtist(artist),
        count,
        image_key,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 40);

    console.log("Successfully processed data:");
    console.log("- Artists:", topArtists.length);
    console.log("- Albums:", topAlbums.length);
    console.log("- Tracks:", topTracks.length);
    console.log("- Zones:", zones.length);

    return NextResponse.json({
      artists: topArtists,
      albums: topAlbums,
      tracks: topTracks,
      zones,
    });
  } catch (error) {
    console.error("Error processing top 40:", error);
    return NextResponse.json(
      { error: "Failed to process top 40 data" },
      { status: 500 },
    );
  }
}
