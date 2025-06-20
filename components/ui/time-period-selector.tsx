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

export interface TimePeriod {
  value: string;
  label: string;
}

const TIME_PERIODS: TimePeriod[] = [
  { value: 'all', label: 'All Time' },
  { value: '1', label: 'Last 24 Hours' },
  { value: '7', label: 'Last 7 Days' },
  { value: '14', label: 'Last 14 Days' },
  { value: '30', label: 'Last 30 Days' },
  { value: '90', label: 'Last 90 Days' },
];

interface TimePeriodSelectorProps {
  value?: string;
  onValueChange?: (value: string) => void;
}

export function TimePeriodSelector({ value, onValueChange }: TimePeriodSelectorProps) {
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

  const handleValueChange = (newValue: string) => {
    if (onValueChange) {
      onValueChange(newValue);
    } else {
      // Default behavior: update URL parameters
      router.push(pathname + '?' + createQueryString({ period: newValue }));
    }
  };

  return (
    <div className="w-[200px]">
      <Select value={value || period} onValueChange={handleValueChange}>
        <SelectTrigger className="w-full bg-zinc-900/30 border-zinc-800/30 text-zinc-200 backdrop-blur-sm">
          <SelectValue placeholder="Select time period" />
        </SelectTrigger>
        <SelectContent 
          className="bg-zinc-900/95 border-zinc-800/50 text-zinc-200 backdrop-blur-xl"
          align="end"
          sideOffset={5}
        >
          {TIME_PERIODS.map((period) => (
            <SelectItem
              key={period.value}
              value={period.value}
              className="hover:bg-zinc-800/50 focus:bg-zinc-800/50"
            >
              {period.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
} 