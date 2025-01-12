import { NextResponse } from 'next/server';

const ROON_SERVER_PORT = process.env.ROON_SERVER_PORT || '3003';

export async function GET() {
  try {
    const response = await fetch(`http://localhost:${ROON_SERVER_PORT}/api/roon/status`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in status check:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to check status' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const response = await fetch(`http://localhost:${ROON_SERVER_PORT}/api/roon/connect`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error connecting to Roon:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to connect to Roon' },
      { status: 500 }
    );
  }
} 