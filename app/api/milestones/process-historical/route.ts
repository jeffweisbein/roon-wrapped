import { NextRequest, NextResponse } from "next/server";

export async function POST(_request: NextRequest) {
  try {
    const response = await fetch(
      "http://localhost:3003/api/milestones/process-historical",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error processing historical data:", error);
    return NextResponse.json(
      { error: "Failed to process historical data" },
      { status: 500 }
    );
  }
}