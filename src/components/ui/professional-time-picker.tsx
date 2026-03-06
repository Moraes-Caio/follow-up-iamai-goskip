import * as React from "react";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface ProfessionalTimePickerProps {
  value?: string; // Format: "HH:mm"
  onChange?: (time: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  minTime?: string; // Format: "HH:mm"
  maxTime?: string; // Format: "HH:mm"
  disabledTimes?: string[]; // Array of "HH:mm" strings
  minuteStep?: number; // 1, 5, 10, 15, 30 etc.
  className?: string;
  showNowButton?: boolean;
  error?: boolean;
  selectedDate?: Date; // Used to disable past times when today is selected
}

// Generate hours array (00-23)
const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));

// Generate minutes array based on step
const getMinutes = (step: number = 5) => {
  const minutes: string[] = [];
  for (let i = 0; i < 60; i += step) {
    minutes.push(i.toString().padStart(2, '0'));
  }
  return minutes;
};

export function ProfessionalTimePicker({
  value,
  onChange,
  placeholder = "Selecione o horário",
  disabled = false,
  minTime,
  maxTime,
  disabledTimes = [],
  minuteStep = 5,
  className,
  showNowButton = true,
  error = false,
  selectedDate,
}: ProfessionalTimePickerProps) {
  const [open, setOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState<string | null>(null);
  const [selectedMinute, setSelectedMinute] = useState<string | null>(null);
  const [hourSearch, setHourSearch] = useState('');
  const [minuteSearch, setMinuteSearch] = useState('');
  const hourSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const minuteSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hourScrollRef = useRef<HTMLDivElement>(null);
  const minuteScrollRef = useRef<HTMLDivElement>(null);

  const MINUTES = useMemo(() => getMinutes(minuteStep), [minuteStep]);

  // Parse value into hour and minute
  useEffect(() => {
    if (value) {
      const [hour, minute] = value.split(':');
      setSelectedHour(hour || null);
      setSelectedMinute(minute || null);
    } else {
      setSelectedHour(null);
      setSelectedMinute(null);
    }
  }, [value]);

  // Parse time string to minutes for comparison
  const timeToMinutes = useCallback((time: string): number => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }, []);

  // Check if time is in the past (only relevant when selectedDate is today)
  const isTimeInPast = useCallback((hour: string, minute: string): boolean => {
    if (!selectedDate) return false;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const selected = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    
    // Only check if selected date is today
    if (selected.getTime() !== today.getTime()) return false;
    
    const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
    const timeInMinutes = parseInt(hour) * 60 + parseInt(minute);
    
    return timeInMinutes < currentTimeInMinutes;
  }, [selectedDate]);

  // Check if a time is disabled
  const isTimeDisabled = useCallback((hour: string, minute: string): boolean => {
    const time = `${hour}:${minute}`;
    
    if (disabledTimes.includes(time)) return true;
    
    // Check if time is in the past
    if (isTimeInPast(hour, minute)) return true;
    
    const timeMinutes = timeToMinutes(time);
    
    if (minTime) {
      const minMinutes = timeToMinutes(minTime);
      if (timeMinutes < minMinutes) return true;
    }
    
    if (maxTime) {
      const maxMinutes = timeToMinutes(maxTime);
      if (timeMinutes > maxMinutes) return true;
    }
    
    return false;
  }, [disabledTimes, minTime, maxTime, timeToMinutes, isTimeInPast]);

  // Check if an hour has any valid minutes
  const isHourDisabled = useCallback((hour: string): boolean => {
    return MINUTES.every(minute => isTimeDisabled(hour, minute));
  }, [MINUTES, isTimeDisabled]);

  // Handle selection
  const handleSelect = useCallback((hour: string, minute: string) => {
    if (isTimeDisabled(hour, minute)) return;
    
    onChange?.(`${hour}:${minute}`);
    setOpen(false);
  }, [isTimeDisabled, onChange]);

  // Handle hour selection
  const handleHourSelect = useCallback((hour: string) => {
    if (isHourDisabled(hour)) return;
    setSelectedHour(hour);
    
    // If minute is selected, check if combination is valid
    if (selectedMinute && !isTimeDisabled(hour, selectedMinute)) {
      handleSelect(hour, selectedMinute);
    }
  }, [isHourDisabled, selectedMinute, isTimeDisabled, handleSelect]);

  // Handle minute selection
  const handleMinuteSelect = useCallback((minute: string) => {
    if (!selectedHour) return;
    if (isTimeDisabled(selectedHour, minute)) return;
    
    handleSelect(selectedHour, minute);
  }, [selectedHour, isTimeDisabled, handleSelect]);

  // Handle "Now" button
  const handleNow = useCallback(() => {
    const now = new Date();
    const hour = now.getHours().toString().padStart(2, '0');
    let minute = now.getMinutes();
    
    // Round to nearest step
    minute = Math.round(minute / minuteStep) * minuteStep;
    if (minute >= 60) {
      minute = 0;
    }
    
    const minuteStr = minute.toString().padStart(2, '0');
    
    if (!isTimeDisabled(hour, minuteStr)) {
      handleSelect(hour, minuteStr);
    } else {
      // Find nearest valid time
      setSelectedHour(hour);
      setOpen(true);
    }
  }, [minuteStep, isTimeDisabled, handleSelect]);

  // Keyboard search for hours
  const handleHourKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key >= '0' && e.key <= '9') {
      if (hourSearchTimeoutRef.current) {
        clearTimeout(hourSearchTimeoutRef.current);
      }
      
      const newSearch = hourSearch + e.key;
      setHourSearch(newSearch);
      
      // Find matching hour
      const match = HOURS.find(h => h.startsWith(newSearch));
      if (match) {
        setSelectedHour(match);
        // Scroll to element
        const element = hourScrollRef.current?.querySelector(`[data-hour="${match}"]`);
        element?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
      
      hourSearchTimeoutRef.current = setTimeout(() => {
        setHourSearch('');
      }, 1000);
    }
  }, [hourSearch]);

  // Keyboard search for minutes
  const handleMinuteKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key >= '0' && e.key <= '9') {
      if (minuteSearchTimeoutRef.current) {
        clearTimeout(minuteSearchTimeoutRef.current);
      }
      
      const newSearch = minuteSearch + e.key;
      setMinuteSearch(newSearch);
      
      // Find matching minute
      const match = MINUTES.find(m => m.startsWith(newSearch));
      if (match) {
        setSelectedMinute(match);
        // Scroll to element
        const element = minuteScrollRef.current?.querySelector(`[data-minute="${match}"]`);
        element?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
      
      minuteSearchTimeoutRef.current = setTimeout(() => {
        setMinuteSearch('');
      }, 1000);
    }
  }, [minuteSearch, MINUTES]);

  // Scroll to selected items when popover opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        if (selectedHour) {
          const hourElement = hourScrollRef.current?.querySelector(`[data-hour="${selectedHour}"]`);
          hourElement?.scrollIntoView({ block: 'center', behavior: 'instant' });
        }
        if (selectedMinute) {
          const minuteElement = minuteScrollRef.current?.querySelector(`[data-minute="${selectedMinute}"]`);
          minuteElement?.scrollIntoView({ block: 'center', behavior: 'instant' });
        }
      }, 50);
    }
  }, [open, selectedHour, selectedMinute]);

  return (
    <TooltipProvider>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground",
              error && "border-destructive focus-visible:ring-destructive",
              className
            )}
          >
            <Clock className="mr-2 h-4 w-4" />
            {value || placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-0 pointer-events-auto" 
          align="start"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setOpen(false);
            }
          }}
        >
          <div className="bg-popover rounded-lg border-0 shadow-lg" style={{ minWidth: '200px' }}>
            {/* Dropdowns Container */}
            <div className="flex items-stretch p-2 gap-2">
              {/* Hour Dropdown */}
              <div className="flex-1">
                <div className="text-xs font-medium text-muted-foreground text-center mb-1.5 uppercase tracking-wide">
                  Hora
                </div>
                <div 
                  className="time-picker-dropdown"
                  ref={hourScrollRef}
                  onKeyDown={handleHourKeyDown}
                  tabIndex={0}
                >
                  {HOURS.map((hour) => {
                    const isDisabled = isHourDisabled(hour);
                    const isSelected = selectedHour === hour;
                    
                    return (
                      <button
                        key={hour}
                        type="button"
                        data-hour={hour}
                        disabled={isDisabled}
                        onClick={() => handleHourSelect(hour)}
                        className={cn(
                          "time-option w-full",
                          isSelected && !isDisabled && "selected",
                          isDisabled && "disabled"
                        )}
                      >
                        {hour}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Separator */}
              <div className="flex items-center justify-center pt-5">
                <span className="text-lg font-semibold text-foreground">:</span>
              </div>

              {/* Minute Dropdown */}
              <div className="flex-1">
                <div className="text-xs font-medium text-muted-foreground text-center mb-1.5 uppercase tracking-wide">
                  Min
                </div>
                <div 
                  className="time-picker-dropdown"
                  ref={minuteScrollRef}
                  onKeyDown={handleMinuteKeyDown}
                  tabIndex={0}
                >
                  {MINUTES.map((minute) => {
                    const isDisabled = selectedHour ? isTimeDisabled(selectedHour, minute) : true;
                    const isSelected = selectedMinute === minute;
                    const isPast = selectedHour ? isTimeInPast(selectedHour, minute) : false;
                    
                    const button = (
                      <button
                        key={minute}
                        type="button"
                        data-minute={minute}
                        disabled={isDisabled}
                        onClick={() => handleMinuteSelect(minute)}
                        className={cn(
                          "time-option w-full",
                          isSelected && !isDisabled && "selected",
                          isDisabled && "disabled",
                          !selectedHour && "opacity-50"
                        )}
                      >
                        {minute}
                      </button>
                    );
                    
                    // Add tooltip for past times
                    if (isPast) {
                      return (
                        <Tooltip key={minute}>
                          <TooltipTrigger asChild>
                            {button}
                          </TooltipTrigger>
                          <TooltipContent side="right" className="text-xs">
                            Horário indisponível
                          </TooltipContent>
                        </Tooltip>
                      );
                    }
                    
                    return button;
                  })}
                </div>
              </div>
            </div>

            {/* Footer with shortcuts */}
            {showNowButton && (
              <div className="border-t border-border px-2 py-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-primary hover:text-primary hover:bg-primary/10 h-8 text-xs"
                  onClick={handleNow}
                >
                  <Clock className="h-3 w-3 mr-1" />
                  Agora
                </Button>
              </div>
            )}

            {/* Instructions */}
            <div className="px-2 pb-2 pt-1">
              <p className="text-[10px] text-muted-foreground text-center">
                {!selectedHour 
                  ? "Selecione a hora primeiro"
                  : "Digite para busca rápida"
                }
              </p>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  );
}

// Export a simpler version for forms
export function TimePickerField({
  value,
  onChange,
  label,
  required,
  error,
  errorMessage,
  ...props
}: ProfessionalTimePickerProps & {
  label?: string;
  required?: boolean;
  errorMessage?: string;
}) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label} {required && <span className="text-destructive">*</span>}
        </label>
      )}
      <ProfessionalTimePicker 
        value={value} 
        onChange={onChange} 
        error={!!error || !!errorMessage}
        {...props} 
      />
      {errorMessage && <p className="text-xs text-destructive">{errorMessage}</p>}
    </div>
  );
}
