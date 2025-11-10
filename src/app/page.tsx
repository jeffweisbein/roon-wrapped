"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

export default function Home() {
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "disconnected" | "loading"
  >("loading");
  const [error, setError] = useState<string | null>(null);

  const checkConnectionStatus = async () => {
    console.log("Checking connection status...");
    try {
      console.log("Making request to /api/roon/status");
      const response = await fetch("/api/roon/status", {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      console.log("Status response:", {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
      });

      if (!response.ok) {
        throw new Error(
          `HTTP error! status: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();
      console.log("Status data:", data);

      const isConnected =
        data.detailedState.validation.state.isConnected &&
        !data.detailedState.validation.state.hasError;

      console.log("Connection state:", {
        isConnected,
        validationState: data.detailedState.validation.state,
        error: data.detailedState.connection.lastError,
      });

      setConnectionStatus(isConnected ? "connected" : "disconnected");
      setError(data.detailedState.connection.lastError || null);
    } catch (err) {
      console.error("Status check error:", {
        error: err,
        message: err instanceof Error ? err.message : String(err),
      });
      setConnectionStatus("disconnected");
      setError(
        err instanceof Error
          ? err.message
          : "Could not check connection status",
      );
    }
  };

  useEffect(() => {
    checkConnectionStatus();
    const interval = setInterval(checkConnectionStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const connectToRoon = async () => {
    console.log("Attempting to connect to Roon...");
    try {
      console.log("Making request to /api/roon/debug/force-connect");
      const response = await fetch("/api/roon/debug/force-connect", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      console.log("Connect response:", {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
      });

      if (!response.ok) {
        throw new Error(
          `HTTP error! status: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();
      console.log("Connect data:", data);

      console.log("Waiting for connection to establish...");
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log("Checking final connection status...");
      await checkConnectionStatus();
    } catch (err) {
      console.error("Connection error:", {
        error: err,
        message: err instanceof Error ? err.message : String(err),
      });
      setError(
        err instanceof Error ? err.message : "Failed to connect to Roon",
      );
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
                Status:{" "}
                {connectionStatus === "loading"
                  ? "Checking..."
                  : connectionStatus}
              </p>
              {error && <p className="text-red-500">{error}</p>}
            </div>

            {connectionStatus === "disconnected" && (
              <Button
                onClick={connectToRoon}
                variant="default"
                size="lg"
                className="w-full max-w-xs"
              >
                Connect to Roon
              </Button>
            )}

            {connectionStatus === "connected" && (
              <Button
                variant="secondary"
                size="lg"
                className="w-full max-w-xs"
                onClick={() => (window.location.href = "/wrapped")}
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
