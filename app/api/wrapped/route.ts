import { NextResponse } from "next/server";

export async function GET() {
  const serverUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const response = await fetch(`${serverUrl}/api/wrapped`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "Failed to fetch wrapped data" },
      { status: response.status },
    );
  }

  const data = await response.json();
  return NextResponse.json(data);
}
