import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: { artist: string } }
) {
  try {
    const response = await fetch(
      `http://localhost:3003/api/milestones/trajectory/${encodeURIComponent(params.artist)}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching trajectory:", error);
    return NextResponse.json(
      { error: "Failed to fetch trajectory" },
      { status: 500 }
    );
  }
}