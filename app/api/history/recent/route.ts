import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");

    // Read the history file (single file, not year-specific)
    const historyPath = path.join(
      process.cwd(),
      "data",
      "listening-history.json",
    );

    try {
      const fileContent = await readFile(historyPath, "utf-8");
      const history = JSON.parse(fileContent);

      // Sort by timestamp (most recent first) and limit
      const recentTracks = history
        .sort((a: any, b: any) => b.timestamp - a.timestamp)
        .slice(0, limit)
        .map((track: any) => ({
          title: track.title,
          artist: track.artist,
          album: track.album,
          timestamp: track.timestamp,
          image_key: track.image_key,
          zone_name: track.zone_name,
        }));

      return NextResponse.json(recentTracks);
    } catch (fileError) {
      console.error("Error reading history file:", fileError);
      // Return empty array if file doesn't exist
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error("Error in recent history endpoint:", error);
    return NextResponse.json(
      { error: "Failed to fetch recent history" },
      { status: 500 },
    );
  }
}
