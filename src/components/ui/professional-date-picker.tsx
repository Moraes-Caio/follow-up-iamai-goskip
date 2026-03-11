import * as React from "react";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, CalendarIcon, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  getYear,
  getMonth,
  setYear,
  setMonth,
  isBefore,
  isAfter,
  startOfDay,
  parse,
  isValid,
} from "date-fns";
import { ptBR } from "date-fns/locale";

const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const WEEKDAYS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export interface ProfessionalDatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
  className?: string;
  yearRange?: { from: number; to: number };
  hidePastDates?: boolean;
  error?: boolean;
}

export function ProfessionalDatePicker({
  value,
  onChange,
  placeholder = "Selecione uma data",
  disabled = false,
  minDate,
  maxDate,
  disabledDates = [],
  className,
  yearRange,
  hidePastDates = false,
  error: externalError = false,
}: ProfessionalDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => value || new Date());
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [typedValue, setTypedValue] = useState("");
  const [typingError, setTypingError] = useState("");

  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [isYearOpen, setIsYearOpen] = useState(false);

  const today = startOfDay(new Date());
  const currentYear = getYear(new Date());
  const currentMonthNum = getMonth(new Date());

  const years = useMemo(() => {
    const fromYear = yearRange?.from || new Date().getFullYear() - 100;
    const toYear = yearRange?.to || new Date().getFullYear() + 10;
    const yearList: number[] = [];
    if (hidePastDates) {
      for (let y = fromYear; y <= toYear; y++) yearList.push(y);
    } else {
      for (let y = toYear; y >= fromYear; y--) yearList.push(y);
    }
    return yearList;
  }, [yearRange, hidePastDates]);

  const availableMonths = useMemo(() => {
    const selectedYear = getYear(currentMonth);
    if (!hidePastDates) return MONTHS_PT.map((name, index) => ({ name, index }));
    const months: { name: string; index: number }[] = [];
    for (let i = 0; i < 12; i++) {
      if (selectedYear === currentYear && i < currentMonthNum) continue;
      if (maxDate) {
        const monthDate = new Date(selectedYear, i, 1);
        if (isBefore(maxDate, monthDate)) continue;
      }
      months.push({ name: MONTHS_PT[i], index: i });
    }
    return months;
  }, [currentMonth, hidePastDates, currentYear, currentMonthNum, maxDate]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  const isDateDisabled = useCallback((date: Date) => {
    if (hidePastDates && isBefore(date, today)) return true;
    if (minDate && isBefore(date, startOfDay(minDate))) return true;
    if (maxDate && isAfter(date, startOfDay(maxDate))) return true;
    if (disabledDates.some((d) => isSameDay(d, date))) return true;
    return false;
  }, [hidePastDates, today, minDate, maxDate, disabledDates]);

  const isDateHidden = (date: Date) => {
    if (hidePastDates && isBefore(date, today) && !isSameDay(date, today)) return true;
    return false;
  };

  const handleYearChange = (year: string) => {
    let newMonth = setYear(currentMonth, parseInt(year));
    if (hidePastDates && parseInt(year) === currentYear && getMonth(newMonth) < currentMonthNum) {
      newMonth = setMonth(newMonth, currentMonthNum);
    }
    setCurrentMonth(newMonth);
  };

  const handleMonthChange = (month: string) => {
    setCurrentMonth(setMonth(currentMonth, parseInt(month)));
  };

  const handlePrevMonth = () => {
    const prevMonth = subMonths(currentMonth, 1);
    if (hidePastDates) {
      const py = getYear(prevMonth);
      const pm = getMonth(prevMonth);
      if (py < currentYear || (py === currentYear && pm < currentMonthNum)) return;
    }
    setCurrentMonth(prevMonth);
  };

  const handleNextMonth = () => {
    const nextMonth = addMonths(currentMonth, 1);
    if (maxDate && isBefore(maxDate, startOfMonth(nextMonth))) return;
    setCurrentMonth(nextMonth);
  };

  const handleDateSelect = (date: Date) => {
    if (isDateDisabled(date) || isDateHidden(date)) return;
    onChange?.(date);
    setOpen(false);
    setTypedValue("");
    setTypingError("");
  };

  useEffect(() => {
    if (value) setCurrentMonth(value);
  }, [value]);

  useEffect(() => {
    if (!open) {
      setTypedValue("");
      setTypingError("");
      setIsMonthOpen(false);
      setIsYearOpen(false);
    }
  }, [open]);

  const isPrevDisabled = useMemo(() => {
    if (!hidePastDates) return false;
    const prevMonth = subMonths(currentMonth, 1);
    const py = getYear(prevMonth);
    const pm = getMonth(prevMonth);
    return py < currentYear || (py === currentYear && pm < currentMonthNum);
  }, [currentMonth, hidePastDates, currentYear, currentMonthNum]);

  const isNextDisabled = useMemo(() => {
    if (!maxDate) return false;
    const nextMonth = addMonths(currentMonth, 1);
    return isBefore(maxDate, startOfMonth(nextMonth));
  }, [currentMonth, maxDate]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    let formatted = "";
    if (raw.length >= 1) formatted = raw.slice(0, 2);
    if (raw.length >= 3) formatted += "/" + raw.slice(2, 4);
    if (raw.length >= 5) formatted += "/" + raw.slice(4, 8);
    setTypedValue(formatted);

    if (raw.length >= 4) {
      const month = parseInt(raw.slice(2, 4), 10);
      const year = raw.length >= 6 ? parseInt(raw.slice(4, Math.min(raw.length, 8)), 10) : getYear(currentMonth);
      if (month >= 1 && month <= 12 && year > 1900) {
        setCurrentMonth(new Date(year, month - 1, 1));
      }
    }

    if (formatted.length === 10) {
      const parsed = parse(formatted, "dd/MM/yyyy", new Date());
      if (!isValid(parsed)) { setTypingError("Data inválida"); return; }
      if (isDateDisabled(parsed)) { setTypingError("Data indisponível"); return; }
      setTypingError("");
      setCurrentMonth(parsed);
      onChange?.(parsed);
      setOpen(false);
      setTypedValue("");
    } else {
      setTypingError("");
    }
  }, [currentMonth, onChange, isDateDisabled]);

  const handleInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)) return;
    if (e.key === "Escape") { setOpen(false); return; }
    if (!/^\d$/.test(e.key)) e.preventDefault();
  }, []);

  const hasError = !!typingError || externalError;

  const displayText = value
    ? format(value, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : placeholder;

  return (
    <div className="space-y-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && !typedValue && "text-muted-foreground",
              typedValue && "text-foreground",
              hasError && "border-destructive",
              className
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span>{displayText}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className={cn(
            "w-auto p-0 pointer-events-auto bg-popover rounded-lg border shadow-2xl overflow-visible",
            // AC: Centered, fixed-position modal overriding Radix positioning
            "!fixed !top-1/2 !left-1/2 ![transform:translate(-50%,-50%)] !z-[9999]"
          )}
          style={{
            // AC: constrained to max-width and max-height
            maxWidth: '90vw',
            maxHeight: '90vh',
          }}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
          onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
        >
          <div className="px-4 pt-3 pb-1 relative" style={{ zIndex: 10000 }}>
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              value={typedValue}
              onChange={handleInputChange}
              onKeyDown={handleInputKeyDown}
              placeholder="DD/MM/AAAA"
              maxLength={10}
              className={cn(
                "w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                typingError && "border-destructive focus-visible:ring-destructive"
              )}
            />
            {typingError && <p className="text-xs text-destructive mt-1">{typingError}</p>}
          </div>

          <div ref={containerRef} className="relative" style={{ minWidth: "320px" }}>
            {(isMonthOpen || isYearOpen) && (
              <div
                className="fixed inset-0 bg-transparent"
                style={{ zIndex: 9999 }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsMonthOpen(false);
                  setIsYearOpen(false);
                }}
              />
            )}

            {/* Header */}
            <div className="relative flex items-center justify-between gap-2 p-4 pb-2 border-b border-border" style={{ zIndex: 10000 }}>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={handlePrevMonth} disabled={isPrevDisabled}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-2">
                {/* Month Selector */}
                <div className="relative">
                  <button
                    type="button"
                    className="flex h-8 w-[120px] items-center justify-between rounded-md border border-input bg-muted/50 px-3 py-2 text-sm focus:outline-none hover:bg-muted font-medium"
                    onClick={() => { setIsMonthOpen(!isMonthOpen); setIsYearOpen(false); }}
                  >
                    {availableMonths.find(m => m.index === getMonth(currentMonth))?.name || "Mês"}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </button>
                  {isMonthOpen && (
                    <div
                      className="absolute top-full left-0 mt-1 w-[120px] rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95 !z-[10000]"
                    >
                      <ScrollArea className="h-[200px]">
                        <div className="p-1">
                          {availableMonths.map(({ name, index }) => (
                            <div
                              key={index}
                              className={cn(
                                "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                index === getMonth(currentMonth) && "bg-accent text-accent-foreground font-medium"
                              )}
                              onClick={() => {
                                handleMonthChange(index.toString());
                                setIsMonthOpen(false);
                              }}
                            >
                              {name}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </div>

                {/* Year Selector */}
                <div className="relative">
                  <button
                    type="button"
                    className="flex h-8 w-[90px] items-center justify-between rounded-md border border-input bg-muted/50 px-3 py-2 text-sm focus:outline-none hover:bg-muted font-medium"
                    onClick={() => { setIsYearOpen(!isYearOpen); setIsMonthOpen(false); }}
                  >
                    {getYear(currentMonth)}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </button>
                  {isYearOpen && (
                    <div
                      className="absolute top-full left-0 mt-1 w-[90px] rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95 !z-[10000]"
                    >
                      <ScrollArea className="h-[200px]">
                        <div className="p-1">
                          {years.map((year) => (
                            <div
                              key={year}
                              className={cn(
                                "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                year === getYear(currentMonth) && "bg-accent text-accent-foreground font-medium"
                              )}
                              onClick={() => {
                                handleYearChange(year.toString());
                                setIsYearOpen(false);
                              }}
                            >
                              {year}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </div>
              </div>

              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={handleNextMonth} disabled={isNextDisabled}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-1 px-4 pt-3 pb-2">
              {WEEKDAYS_PT.map((day) => (
                <div key={day} className="h-8 flex items-center justify-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">{day}</div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 px-4 pb-4">
              {calendarDays.map((day, index) => {
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isSelected = value && isSameDay(day, value);
                const isTodayDate = isToday(day);
                const isDisabled = isDateDisabled(day);
                const isHidden = isDateHidden(day);
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                if (isHidden && isCurrentMonth) return <div key={index} className="h-9 w-9" />;

                return (
                  <button
                    key={index}
                    type="button"
                    disabled={isDisabled || !isCurrentMonth}
                    onClick={() => handleDateSelect(day)}
                    className={cn(
                      "h-9 w-9 rounded-lg text-sm font-normal transition-all duration-150 flex items-center justify-center",
                      "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
                      !isCurrentMonth && "text-muted-foreground/30 cursor-default",
                      isCurrentMonth && !isSelected && !isTodayDate && !isDisabled && "hover:bg-muted text-foreground",
                      isCurrentMonth && isWeekend && !isSelected && !isDisabled && "text-muted-foreground",
                      isTodayDate && !isSelected && "border-2 border-primary text-primary font-medium",
                      isSelected && "bg-primary text-primary-foreground hover:bg-primary/90 font-medium",
                      isDisabled && isCurrentMonth && "text-muted-foreground/50 cursor-not-allowed line-through"
                    )}
                  >
                    {format(day, "d")}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="border-t border-border px-4 py-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-primary hover:text-primary hover:bg-primary/10"
                onClick={() => {
                  const todayDate = new Date();
                  if (!isDateDisabled(todayDate)) handleDateSelect(todayDate);
                  else setCurrentMonth(todayDate);
                }}
              >
                Hoje
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function DatePickerField({
  value, onChange, label, required, error, ...props
}: ProfessionalDatePickerProps & { label?: string; required?: boolean; error?: string }) {
  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium text-foreground">{label} {required && "*"}</label>}
      <ProfessionalDatePicker value={value} onChange={onChange} {...props} />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
