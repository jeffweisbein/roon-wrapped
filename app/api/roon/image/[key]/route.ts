import { NextResponse } from 'next/server';

const ROON_SERVER_PORT = process.env.ROON_SERVER_PORT || '3003';
const ROON_SERVER_HOST = process.env.ROON_SERVER_HOST || 'localhost';

export async function GET(
  request: Request,
  { params }: { params: { key: string } }
) {
  try {
    const { key } = params;
    const url = `http://${ROON_SERVER_HOST}:${ROON_SERVER_PORT}/api/roon/image/${key}`;
    
    const response = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return new NextResponse(null, { status: response.status });
    }

    const imageData = await response.arrayBuffer();
    return new NextResponse(imageData, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('[Roon Image API] Error:', error);
    return new NextResponse(null, { status: 500 });
  }
} 