import * as React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { parse, isValid, isBefore, isAfter, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MaskedDateInputProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  error?: boolean;
  className?: string;
}

export function MaskedDateInput({
  value,
  onChange,
  placeholder = "DD/MM/AAAA",
  disabled = false,
  minDate,
  maxDate,
  error: externalError = false,
  className,
}: MaskedDateInputProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [calendarMonth, setCalendarMonth] = useState<Date>(value || new Date());

  // Sync input value from prop
  useEffect(() => {
    if (value && isValid(value)) {
      const d = String(value.getDate()).padStart(2, "0");
      const m = String(value.getMonth() + 1).padStart(2, "0");
      const y = String(value.getFullYear());
      setInputValue(`${d}/${m}/${y}`);
      setCalendarMonth(value);
      setErrorMessage("");
    } else if (!value) {
      setInputValue("");
      setErrorMessage("");
    }
  }, [value]);

  const validateAndSetDate = useCallback(
    (dateStr: string) => {
      if (dateStr.length < 10) {
        setErrorMessage("");
        return;
      }

      const parsed = parse(dateStr, "dd/MM/yyyy", new Date());
      if (!isValid(parsed)) {
        setErrorMessage("Data inválida");
        return;
      }

      const day = startOfDay(parsed);
      if (minDate && isBefore(day, startOfDay(minDate))) {
        setErrorMessage("Data indisponível");
        return;
      }
      if (maxDate && isAfter(day, startOfDay(maxDate))) {
        setErrorMessage("Data indisponível");
        return;
      }

      setErrorMessage("");
      setCalendarMonth(parsed);
      onChange?.(parsed);
    },
    [minDate, maxDate, onChange]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    let formatted = "";

    if (raw.length >= 1) formatted = raw.slice(0, 2);
    if (raw.length >= 3) formatted += "/" + raw.slice(2, 4);
    if (raw.length >= 5) formatted += "/" + raw.slice(4, 8);

    setInputValue(formatted);

    // Update calendar month as user types
    if (raw.length >= 4) {
      const month = parseInt(raw.slice(2, 4), 10);
      const year = raw.length >= 6 ? parseInt(raw.slice(4, Math.min(raw.length, 8)), 10) : new Date().getFullYear();
      if (month >= 1 && month <= 12 && year > 1900) {
        setCalendarMonth(new Date(year, month - 1, 1));
      }
    }

    if (formatted.length === 10) {
      validateAndSetDate(formatted);
    } else {
      setErrorMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow navigation keys
    if (["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)) return;
    // Only allow digits
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      onChange?.(date);
      setOpen(false);
    }
  };

  const hasError = !!errorMessage || externalError;

  return (
    <div className="space-y-1">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={10}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            hasError && "border-destructive focus-visible:ring-destructive",
            className
          )}
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              disabled={disabled}
              className="absolute right-0 top-0 h-10 w-10 text-muted-foreground hover:text-foreground"
              type="button"
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 pointer-events-auto" align="end">
            <Calendar
              mode="single"
              selected={value}
              onSelect={handleCalendarSelect}
              month={calendarMonth}
              onMonthChange={setCalendarMonth}
              locale={ptBR}
              disabled={(date) => {
                if (minDate && isBefore(startOfDay(date), startOfDay(minDate))) return true;
                if (maxDate && isAfter(startOfDay(date), startOfDay(maxDate))) return true;
                return false;
              }}
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>
      {errorMessage && (
        <p className="text-xs text-destructive">{errorMessage}</p>
      )}
    </div>
  );
}
