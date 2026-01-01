'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { DatePreset } from '@/types/sales-history.types';

interface DateRangeFilterProps {
  onFilterChange: (preset: DatePreset, startDate?: Date, endDate?: Date) => void;
  defaultPreset?: DatePreset;
}

const presetOptions = [
  { value: DatePreset.TODAY, label: 'Today' },
  { value: DatePreset.YESTERDAY, label: 'Yesterday' },
  { value: DatePreset.THIS_WEEK, label: 'This Week' },
  { value: DatePreset.LAST_WEEK, label: 'Last Week' },
  { value: DatePreset.THIS_MONTH, label: 'This Month' },
  { value: DatePreset.LAST_MONTH, label: 'Last Month' },
  { value: DatePreset.LAST_30_DAYS, label: 'Last 30 Days' },
  { value: DatePreset.LAST_60_DAYS, label: 'Last 60 Days' },
  { value: DatePreset.LAST_90_DAYS, label: 'Last 90 Days' },
  { value: DatePreset.THIS_YEAR, label: 'This Year' },
  { value: DatePreset.LAST_YEAR, label: 'Last Year' },
  { value: DatePreset.CUSTOM, label: 'Custom Range' },
];

export function DateRangeFilter({ onFilterChange, defaultPreset = DatePreset.TODAY }: DateRangeFilterProps) {
  const [preset, setPreset] = useState<DatePreset>(defaultPreset);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handlePresetChange = (value: DatePreset) => {
    setPreset(value);
    if (value !== DatePreset.CUSTOM) {
      onFilterChange(value);
    }
  };

  const handleApplyCustomRange = () => {
    if (startDate && endDate) {
      onFilterChange(
        DatePreset.CUSTOM,
        new Date(startDate),
        new Date(endDate)
      );
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="datePreset">Date Range</Label>
            <Select value={preset} onValueChange={handlePresetChange}>
              <SelectTrigger id="datePreset">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                {presetOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {preset === DatePreset.CUSTOM && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
              <Button
                onClick={handleApplyCustomRange}
                disabled={!startDate || !endDate}
                className="w-full"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Apply Custom Range
              </Button>
            </>
          )}

          {/* Quick preset buttons */}
          <div className="pt-2 border-t">
            <Label className="text-xs text-muted-foreground mb-2">Quick Select</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePresetChange(DatePreset.TODAY)}
                className={preset === DatePreset.TODAY ? 'bg-primary text-primary-foreground' : ''}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePresetChange(DatePreset.THIS_WEEK)}
                className={preset === DatePreset.THIS_WEEK ? 'bg-primary text-primary-foreground' : ''}
              >
                This Week
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePresetChange(DatePreset.THIS_MONTH)}
                className={preset === DatePreset.THIS_MONTH ? 'bg-primary text-primary-foreground' : ''}
              >
                This Month
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
