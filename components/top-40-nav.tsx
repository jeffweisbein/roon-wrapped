"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function Top40Nav() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [zones, setZones] = useState<string[]>([]);

  const currentView = searchParams.get("view") || "artists";
  const currentZone = searchParams.get("zone") || "all";

  useEffect(() => {
    async function fetchZones() {
      try {
        const response = await fetch("/api/history/top-40");
        const data = await response.json();
        setZones(data.zones || []);
      } catch (error) {
        console.error("Failed to fetch zones:", error);
      }
    }
    fetchZones();
  }, []);

  const createQueryString = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set(name, value);
    return params.toString();
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
      <div className="flex items-center rounded-lg border border-white/10 p-1 backdrop-blur-sm">
        <Button
          variant={currentView === "artists" ? "secondary" : "ghost"}
          size="sm"
          onClick={() =>
            router.push(`${pathname}?${createQueryString("view", "artists")}`)
          }
        >
          Artists
        </Button>
        <Button
          variant={currentView === "albums" ? "secondary" : "ghost"}
          size="sm"
          onClick={() =>
            router.push(`${pathname}?${createQueryString("view", "albums")}`)
          }
        >
          Albums
        </Button>
        <Button
          variant={currentView === "tracks" ? "secondary" : "ghost"}
          size="sm"
          onClick={() =>
            router.push(`${pathname}?${createQueryString("view", "tracks")}`)
          }
        >
          Tracks
        </Button>
      </div>

      <Select
        value={currentZone}
        onValueChange={(value) => {
          const params = new URLSearchParams(searchParams);
          if (value === "all") {
            params.delete("zone");
          } else {
            params.set("zone", value);
          }
          router.push(`${pathname}?${params.toString()}`);
        }}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Zones" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Zones</SelectItem>
          {zones.map((zone) => (
            <SelectItem key={zone} value={zone}>
              {zone}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
