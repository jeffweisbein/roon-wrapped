"use client";

import * as React from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";

export interface TimePeriod {
  value: string;
  label: string;
}

const TIME_PERIODS: TimePeriod[] = [
  { value: "all", label: "All Time" },
  { value: "1", label: "Last 24 Hours" },
  { value: "7", label: "Last 7 Days" },
  { value: "14", label: "Last 14 Days" },
  { value: "30", label: "Last 30 Days" },
  { value: "90", label: "Last 90 Days" },
];

interface TimePeriodSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function TimePeriodSelector({
  value,
  onValueChange,
}: TimePeriodSelectorProps) {
  return (
    <div className="w-[200px]">
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full bg-zinc-800/50 border-zinc-700/50 text-zinc-200">
          <SelectValue placeholder="Select time period" />
        </SelectTrigger>
        <SelectContent className="bg-zinc-800 border-zinc-700 text-zinc-200">
          {TIME_PERIODS.map((period) => (
            <SelectItem
              key={period.value}
              value={period.value}
              className="hover:bg-zinc-700/50 focus:bg-zinc-700/50"
            >
              {period.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
