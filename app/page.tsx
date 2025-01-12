'use client';

import {
  useEffect,
  useState,
} from 'react';

import { Button } from '@/components/ui/button';

export default function Home() {
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'loading'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkConnectionStatus();
    // Poll for status every 5 seconds
    const interval = setInterval(checkConnectionStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const checkConnectionStatus = async () => {
    try {
      console.log('Checking Roon connection status...');
      const response = await fetch('/api/roon/status', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        cache: 'no-store',
        next: { revalidate: 0 }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const outerData = await response.json();
      
      if (!outerData.success) {
        throw new Error(outerData.error || 'Server returned error');
      }
      
      // Parse the nested JSON string in data
      const innerData = JSON.parse(outerData.data);
      
      if (!innerData.success) {
        throw new Error(innerData.error || 'Roon server returned error');
      }
      
      setConnectionStatus(innerData.isConnected ? 'connected' : 'disconnected');
      setError(null);
    } catch (error) {
      console.error('Error checking connection status:', error);
      setConnectionStatus('disconnected');
      setError(error instanceof Error ? error.message : 'Could not check connection status');
    }
  };

  const connectToRoon = async () => {
    try {
      const response = await fetch('/api/roon/connect', {
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
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to connect to Roon');
      }
      
      // Trigger an immediate status check
      await checkConnectionStatus();
    } catch (error) {
      console.error('Error connecting to Roon:', error);
      setError(error instanceof Error ? error.message : 'Failed to connect to Roon');
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center">Roon Wrapped</h1>
        
        <div className="bg-white/5 p-8 rounded-lg backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="text-center mb-4">
              <p className="text-lg mb-2">
                Status: {connectionStatus === 'loading' ? 'Checking...' : connectionStatus}
              </p>
              {error && (
                <p className="text-red-500">{error}</p>
              )}
            </div>

            {connectionStatus === 'disconnected' && (
              <Button
                onClick={connectToRoon}
                variant="default"
                size="lg"
                className="w-full max-w-xs"
              >
                Connect to Roon
              </Button>
            )}

            {connectionStatus === 'connected' && (
              <Button
                variant="secondary"
                size="lg"
                className="w-full max-w-xs"
                onClick={() => window.location.href = '/wrapped'}
              >
                View Wrapped
              </Button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
} 