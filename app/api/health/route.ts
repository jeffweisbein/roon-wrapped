import { NextResponse } from 'next/server';

import { log } from '@/server/utils/logger';

export async function GET() {
    try {
        // Check Node server status
        const nodeServerResponse = await fetch('http://localhost:3003/api/health', {
            signal: AbortSignal.timeout(5000)
        });

        if (!nodeServerResponse.ok) {
            log('error', 'Node server health check failed', {
                status: nodeServerResponse.status,
                statusText: nodeServerResponse.statusText
            });
            
            return NextResponse.json({
                status: 'error',
                message: 'Node server is not responding',
                timestamp: new Date().toISOString()
            }, { status: 503 });
        }

        // Check Roon connection status
        const roonStatusResponse = await fetch('http://localhost:3003/api/roon/status', {
            signal: AbortSignal.timeout(5000)
        });

        if (!roonStatusResponse.ok) {
            log('error', 'Roon status check failed', {
                status: roonStatusResponse.status,
                statusText: roonStatusResponse.statusText
            });
            
            return NextResponse.json({
                status: 'degraded',
                message: 'Roon connection is not available',
                timestamp: new Date().toISOString()
            }, { status: 200 });
        }

        const roonStatus = await roonStatusResponse.json();

        return NextResponse.json({
            status: 'healthy',
            roonStatus,
            timestamp: new Date().toISOString()
        }, { status: 200 });

    } catch (error) {
        log('error', 'Health check failed', {
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });

        return NextResponse.json({
            status: 'error',
            message: error.message,
            timestamp: new Date().toISOString()
        }, { status: 503 });
    }
} 