import { NextResponse } from 'next/server';

const ROON_SERVER_PORT = process.env.ROON_SERVER_PORT || '3003';
const ROON_SERVER_HOST = process.env.ROON_SERVER_HOST || 'localhost';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const url = `http://${ROON_SERVER_HOST}:${ROON_SERVER_PORT}/api/history/wrapped`;
    console.log(`Fetching wrapped data from: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      console.error(`Failed to fetch wrapped data: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: `Failed to fetch wrapped data: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching wrapped data:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 