import { NextRequest } from "next/server";

const ROON_SERVER_PORT = process.env.ROON_SERVER_PORT || "3003";
const ROON_SERVER_HOST = process.env.ROON_SERVER_HOST || "localhost";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await fetch(
          `http://${ROON_SERVER_HOST}:${ROON_SERVER_PORT}/api/roon/now-playing/sse`,
          {
            headers: { Accept: "text/event-stream" },
            cache: "no-store",
            // @ts-ignore - Next.js specific
            signal: request.signal,
          }
        );

        if (!response.ok || !response.body) {
          controller.enqueue(encoder.encode("data: {\"error\": \"SSE connection failed\"}\n\n"));
          controller.close();
          return;
        }

        const reader = response.body.getReader();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
        } catch (err) {
          // Client disconnected, expected
        } finally {
          reader.releaseLock();
          controller.close();
        }
      } catch (err) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: "Connection failed" })}\n\n`)
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
