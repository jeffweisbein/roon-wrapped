"use client";

import * as React from 'react';

import {
  usePathname,
  useRouter,
  useSearchParams,
} from 'next/navigation';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const TIME_PERIODS = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "180", label: "Last 180 days" },
  { value: "365", label: "Last year" },
  { value: "all", label: "All time" },
] as const;

export function TimePeriodSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const period = searchParams.get("period") || "all";

  const createQueryString = React.useCallback(
    (params: { [key: string]: string | null }) => {
      const newSearchParams = new URLSearchParams(searchParams.toString());
      
      Object.entries(params).forEach(([key, value]) => {
        if (value === null) {
          newSearchParams.delete(key);
        } else {
          newSearchParams.set(key, value);
        }
      });
 
      return newSearchParams.toString();
    },
    [searchParams]
  );

  return (
    <Select
      value={period}
      onValueChange={(value) => {
        // Update the URL with the new period
        router.push(
          `${pathname}?${createQueryString({
            period: value,
          })}`
        );
      }}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select time period" />
      </SelectTrigger>
      <SelectContent>
        {TIME_PERIODS.map((timePeriod) => (
          <SelectItem key={timePeriod.value} value={timePeriod.value}>
            {timePeriod.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
} 