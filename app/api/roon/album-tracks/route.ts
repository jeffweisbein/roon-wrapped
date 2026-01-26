import { NextResponse } from "next/server";

const ROON_SERVER_PORT = process.env.ROON_SERVER_PORT || "3003";
const ROON_SERVER_HOST = process.env.ROON_SERVER_HOST || "localhost";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const album = searchParams.get("album");
    const artist = searchParams.get("artist");

    if (!album) {
      return NextResponse.json(
        { error: "Album parameter required" },
        { status: 400 }
      );
    }

    const params = new URLSearchParams();
    params.set("album", album);
    if (artist) params.set("artist", artist);

    const response = await fetch(
      `http://${ROON_SERVER_HOST}:${ROON_SERVER_PORT}/api/roon/album-tracks?${params.toString()}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch album tracks: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("[Frontend API] Error fetching album tracks:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error", tracks: [] },
      { status: 500 }
    );
  }
}
