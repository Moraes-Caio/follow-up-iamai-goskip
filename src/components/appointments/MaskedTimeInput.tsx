import * as React from "react";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
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

interface OccupiedSlot {
  time: string;
  endTime: string;
  patientName?: string;
}

interface MaskedTimeInputProps {
  value?: string;
  onChange?: (time: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  selectedDate?: Date;
  error?: boolean;
  className?: string;
  occupiedSlots?: OccupiedSlot[];
  minTime?: string; // HH:mm - times before this are disabled
  label?: string;
}

const generateTimeSlots = (): string[] => {
  const slots: string[] = [];
  for (let hour = 5; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      if (hour === 22 && minute > 0) break;
      slots.push(`${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`);
    }
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

export function MaskedTimeInput({
  value,
  onChange,
  placeholder = "HH:MM",
  disabled = false,
  selectedDate,
  error: externalError = false,
  className,
  occupiedSlots = [],
  minTime,
}: MaskedTimeInputProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Sync input from prop
  useEffect(() => {
    if (value) {
      setInputValue(value);
      setErrorMessage("");
    } else {
      setInputValue("");
      setErrorMessage("");
    }
  }, [value]);

  const isTimeOccupied = useCallback(
    (timeStr: string): OccupiedSlot | null => {
      for (const slot of occupiedSlots) {
        if (timeStr >= slot.time && timeStr < slot.endTime) return slot;
      }
      return null;
    },
    [occupiedSlots]
  );

  const isTimePast = useCallback(
    (timeStr: string): boolean => {
      if (!selectedDate) return false;
      const now = new Date();
      if (selectedDate.toDateString() !== now.toDateString()) return false;
      const [h, m] = timeStr.split(":").map(Number);
      return h * 60 + m <= now.getHours() * 60 + now.getMinutes();
    },
    [selectedDate]
  );

  const isTimeBeforeMin = useCallback(
    (timeStr: string): boolean => {
      if (!minTime) return false;
      return timeStr <= minTime;
    },
    [minTime]
  );

  const isSlotAvailable = useCallback(
    (timeStr: string): boolean => {
      if (!selectedDate) return false;
      if (isTimePast(timeStr)) return false;
      if (isTimeOccupied(timeStr)) return false;
      if (isTimeBeforeMin(timeStr)) return false;
      return true;
    },
    [selectedDate, isTimePast, isTimeOccupied, isTimeBeforeMin]
  );

  // Filtered slots based on input
  const filteredSlots = useMemo(() => {
    const raw = inputValue.replace(":", "");
    if (!raw) return TIME_SLOTS;
    return TIME_SLOTS.filter((slot) => slot.replace(":", "").startsWith(raw));
  }, [inputValue]);

  const validateTime = useCallback(
    (timeStr: string) => {
      // Format check
      if (!/^\d{2}:\d{2}$/.test(timeStr)) {
        setErrorMessage("Horário inválido");
        return false;
      }
      const [h, m] = timeStr.split(":").map(Number);
      if (h < 0 || h > 23 || m < 0 || m > 59) {
        setErrorMessage("Horário inválido");
        return false;
      }
      // Check if it's a valid slot
      if (!TIME_SLOTS.includes(timeStr)) {
        setErrorMessage("Horário indisponível");
        return false;
      }
      if (!isSlotAvailable(timeStr)) {
        if (isTimeOccupied(timeStr)) setErrorMessage("Horário ocupado");
        else if (isTimePast(timeStr)) setErrorMessage("Horário passado");
        else if (isTimeBeforeMin(timeStr)) setErrorMessage("Horário indisponível");
        else setErrorMessage("Horário indisponível");
        return false;
      }
      setErrorMessage("");
      return true;
    },
    [isSlotAvailable, isTimeOccupied, isTimePast, isTimeBeforeMin]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    let formatted = "";

    if (raw.length >= 1) formatted = raw.slice(0, 2);
    if (raw.length >= 3) formatted += ":" + raw.slice(2, 4);

    setInputValue(formatted);
    setOpen(true);

    if (formatted.length === 5) {
      if (validateTime(formatted)) {
        onChange?.(formatted);
        setOpen(false);
      }
    } else {
      setErrorMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)) return;
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handleSelectSlot = (time: string) => {
    if (!isSlotAvailable(time)) return;
    onChange?.(time);
    setErrorMessage("");
    setOpen(false);
  };

  const handleFocus = () => {
    if (!disabled) setOpen(true);
  };

  // Scroll to value or current time when opened
  useEffect(() => {
    if (open && scrollContainerRef.current) {
      setTimeout(() => {
        const target = value || "08:00";
        const el = scrollContainerRef.current?.querySelector(`[data-time="${target}"]`);
        if (el) el.scrollIntoView({ block: "center", behavior: "smooth" });
      }, 50);
    }
  }, [open, value]);

  const hasError = !!errorMessage || externalError;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-1">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={handleFocus}
                placeholder={placeholder}
                disabled={disabled}
                maxLength={5}
                className={cn(
                  "flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                  hasError && "border-destructive focus-visible:ring-destructive",
                  className
                )}
              />
            </div>
          </PopoverTrigger>
          <PopoverContent
            className="w-[140px] p-0 pointer-events-auto"
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <div
              ref={scrollContainerRef}
              className="max-h-[280px] overflow-y-auto overscroll-contain p-2"
              style={{ WebkitOverflowScrolling: "touch" }}
              onWheelCapture={(e) => e.stopPropagation()}
              onTouchMoveCapture={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col gap-1">
                {filteredSlots.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-2">Nenhum horário</p>
                ) : (
                  filteredSlots.map((time) => {
                    const available = isSlotAvailable(time);
                    const occupied = isTimeOccupied(time);
                    const past = isTimePast(time);
                    const beforeMin = isTimeBeforeMin(time);
                    const isSelected = value === time;
                    const isDisabled = !available;

                    const button = (
                      <button
                        key={time}
                        type="button"
                        data-time={time}
                        disabled={isDisabled}
                        onClick={() => handleSelectSlot(time)}
                        className={cn(
                          "px-2.5 py-2 text-sm font-medium rounded-lg transition-all duration-150 w-full text-left",
                          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                          available && !isSelected && "bg-muted/50 text-foreground hover:bg-primary/10 hover:text-primary cursor-pointer",
                          isSelected && "bg-primary text-primary-foreground font-semibold shadow-sm",
                          (past || beforeMin) && !occupied && "bg-muted/30 text-muted-foreground/60 cursor-not-allowed opacity-60 line-through",
                          occupied && "bg-destructive/10 text-muted-foreground/60 cursor-not-allowed opacity-70"
                        )}
                      >
                        <span className="flex items-center justify-between">
                          <span>{time}</span>
                          {occupied && <span className="text-[10px] text-destructive font-medium">Ocupado</span>}
                        </span>
                      </button>
                    );

                    if (occupied?.patientName) {
                      return (
                        <Tooltip key={time}>
                          <TooltipTrigger asChild>{button}</TooltipTrigger>
                          <TooltipContent side="left" className="text-xs">
                            <p>Ocupado: {occupied.patientName}</p>
                            <p>{occupied.time} - {occupied.endTime}</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    }
                    return button;
                  })
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
        {errorMessage && <p className="text-xs text-destructive">{errorMessage}</p>}
      </div>
    </TooltipProvider>
  );
}
