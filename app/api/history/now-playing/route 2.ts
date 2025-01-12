import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const response = await fetch('http://localhost:3002/api/history/now-playing', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            console.error(`Backend responded with status: ${response.status}`);
            return NextResponse.json({ error: `Backend error: ${response.status}` }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error proxying now-playing request:', error);
        return NextResponse.json({ error: 'Failed to fetch now playing data' }, { status: 500 });
    }
} 