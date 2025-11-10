import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const artists = searchParams.get("artists");
    
    const response = await fetch(
      `http://localhost:3003/api/milestones/compare?artists=${artists}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching milestone comparison:", error);
    return NextResponse.json(
      { error: "Failed to fetch milestone comparison" },
      { status: 500 }
    );
  }
}