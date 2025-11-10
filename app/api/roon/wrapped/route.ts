import { NextResponse } from "next/server";

const ROON_SERVER_PORT = process.env.ROON_SERVER_PORT || "3001";
const ROON_SERVER_HOST = process.env.ROON_SERVER_HOST || "localhost";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const url = `http://${ROON_SERVER_HOST}:${ROON_SERVER_PORT}/api/roon/wrapped`;
    console.log(`Fetching wrapped data from: ${url}`);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // Add a reasonable timeout
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(
        `Failed to fetch wrapped data: ${response.status} ${response.statusText}`,
      );
      const errorText = await response.text();
      console.error("Error response:", errorText);

      return new NextResponse(
        JSON.stringify({
          error: `Failed to fetch wrapped data: ${response.status} ${response.statusText}`,
        }),
        {
          status: response.status,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        },
      );
    }

    const data = await response.json();
    if (!data) {
      console.error("No data received from wrapped endpoint");
      return new NextResponse(
        JSON.stringify({ error: "No data received from wrapped endpoint" }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        },
      );
    }

    return new NextResponse(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("Error fetching wrapped data:", error);
    return new NextResponse(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : undefined,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );
  }
}
