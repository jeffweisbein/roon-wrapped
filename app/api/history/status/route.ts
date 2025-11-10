import { NextResponse } from "next/server";

const ROON_SERVER_PORT = process.env.ROON_SERVER_PORT || "3001";

export async function GET() {
  try {
    const response = await fetch(
      `http://localhost:${ROON_SERVER_PORT}/api/history/status`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching history status:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
