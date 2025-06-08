import {
  NextRequest,
  NextResponse,
} from 'next/server';

const ROON_SERVER_PORT = process.env.ROON_SERVER_PORT || '3003';
const ROON_SERVER_HOST = process.env.ROON_SERVER_HOST || 'localhost';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(_request: NextRequest) {
  try {
    const response = await fetch(`http://${ROON_SERVER_HOST}:${ROON_SERVER_PORT}/api/roon/status`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch status: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[Frontend API] Roon status:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Frontend API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 