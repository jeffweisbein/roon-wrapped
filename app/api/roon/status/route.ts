import http from 'http';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const options = {
            hostname: 'localhost',
            port: 3003,
            path: '/api/roon/status',
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        };

        const response = await new Promise((resolve, reject) => {
            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve({ status: res.statusCode, data }));
            });
            
            req.on('error', reject);
            req.end();
        });

        const { status, data } = response as any;

        // Always return JSON, even for errors
        return NextResponse.json({
            success: status === 200,
            data: data || null,
            error: status !== 200 ? 'Failed to connect to Roon server' : null
        }, { status });
        
    } catch (error) {
        // Handle any errors with JSON response
        return NextResponse.json({
            success: false,
            error: 'Failed to connect to Roon server',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 