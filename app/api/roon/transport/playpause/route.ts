import { NextResponse } from "next/server";

const ROON_SERVER_PORT = process.env.ROON_SERVER_PORT || "3003";
const ROON_SERVER_HOST = process.env.ROON_SERVER_HOST || "localhost";

export async function POST() {
  try {
    const response = await fetch(
      `http://${ROON_SERVER_HOST}:${ROON_SERVER_PORT}/api/roon/transport/playpause`,
      { method: "POST" }
    );
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
