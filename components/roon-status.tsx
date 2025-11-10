"use client";

import { useEffect, useState } from "react";

import { CheckCircle2, XCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface RoonStatus {
  isConnected: boolean;
  lastError: string | null;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
}

export function RoonStatus() {
  const [status, setStatus] = useState<RoonStatus | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch("/api/roon/status");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setStatus(data);
      } catch (error) {
        console.error("Error fetching Roon status:", error);
        setStatus({
          isConnected: false,
          lastError:
            error instanceof Error
              ? error.message
              : "Failed to connect to Roon server",
          reconnectAttempts: 0,
          maxReconnectAttempts: 10,
        });
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!status) {
    return null;
  }

  return (
    <Alert
      className={status.isConnected ? "border-green-500" : "border-red-500"}
    >
      {status.isConnected ? (
        <CheckCircle2 className="h-4 w-4 text-green-500" />
      ) : (
        <XCircle className="h-4 w-4 text-red-500" />
      )}
      <AlertTitle>
        {status.isConnected ? "Connected to Roon" : "Connection Error"}
      </AlertTitle>
      <AlertDescription>
        {status.isConnected
          ? "Connected to Roon Core"
          : status.lastError || "Unable to connect to Roon"}
      </AlertDescription>
    </Alert>
  );
}
