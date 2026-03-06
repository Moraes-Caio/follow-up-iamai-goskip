import * as React from "react";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Clock, ChevronDown } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface OccupiedSlot {
  time: string;
  endTime: string;
  patientName?: string;
}

export interface ClinicHoursConfig {
  openTime?: string;
  closeTime?: string;
  breaks?: { startTime: string; endTime: string }[];
  isOpen?: boolean;
}

interface AppointmentTimePickerProps {
  value?: string;
  onChange?: (time: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  selectedDate?: Date;
  error?: boolean;
  className?: string;
  occupiedSlots?: OccupiedSlot[];
  minTime?: string;
  clinicHours?: ClinicHoursConfig;
}

const generateTimeSlots = (): string[] => {
  const slots: string[] = [];
  for (let hour = 5; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      if (hour === 22 && minute > 0) break;
      slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    }
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

export function AppointmentTimePicker({
  value,
  onChange,
  placeholder = "Selecione o horário",
  disabled = false,
  selectedDate,
  error: externalError = false,
  className,
  occupiedSlots = [],
  minTime,
  clinicHours,
}: AppointmentTimePickerProps) {
  const [open, setOpen] = useState(false);
  const [typedValue, setTypedValue] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [customTimeConfirm, setCustomTimeConfirm] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isWithinClinicHours = useCallback((timeStr: string): boolean => {
    if (!clinicHours) return true;
    if (clinicHours.isOpen === false) return false;
    if (clinicHours.openTime && timeStr < clinicHours.openTime) return false;
    if (clinicHours.closeTime && timeStr >= clinicHours.closeTime) return false;
    if (clinicHours.breaks) {
      for (const brk of clinicHours.breaks) {
        if (timeStr >= brk.startTime && timeStr < brk.endTime) return false;
      }
    }
    return true;
  }, [clinicHours]);

  const isTimeOccupied = useCallback((timeStr: string): OccupiedSlot | null => {
    for (const slot of occupiedSlots) {
      if (timeStr >= slot.time && timeStr < slot.endTime) return slot;
    }
    return null;
  }, [occupiedSlots]);

  const isTimeBeforeMin = useCallback((timeStr: string): boolean => {
    if (!minTime) return false;
    return timeStr <= minTime;
  }, [minTime]);

  const isTimeAvailable = useCallback((timeStr: string): boolean => {
    if (!selectedDate) return false;
    if (!isWithinClinicHours(timeStr)) return false;
    const [hour, minute] = timeStr.split(':').map(Number);
    const now = new Date();
    const isToday = selectedDate.toDateString() === now.toDateString();
    if (!isToday) return !isTimeBeforeMin(timeStr);
    const timeInMinutes = hour * 60 + minute;
    const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
    if (timeInMinutes <= currentTimeInMinutes) return false;
    return !isTimeBeforeMin(timeStr);
  }, [selectedDate, isTimeBeforeMin, isWithinClinicHours]);

  const isSlotAvailable = useCallback((timeStr: string): boolean => {
    if (!isTimeAvailable(timeStr)) return false;
    if (isTimeOccupied(timeStr)) return false;
    return true;
  }, [isTimeAvailable, isTimeOccupied]);

  const currentTimeSlot = useMemo((): string => {
    const now = new Date();
    const hour = now.getHours();
    const minute = Math.floor(now.getMinutes() / 15) * 15;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }, []);

  const getScrollTarget = useCallback((): string => {
    if (!selectedDate) return '08:00';
    const now = new Date();
    const isToday = selectedDate.toDateString() === now.toDateString();

    // Find first available slot starting from a reference point
    const startRef = isToday ? currentTimeSlot : '08:00';
    const startIdx = TIME_SLOTS.findIndex(s => s >= startRef);
    if (startIdx >= 0) {
      for (let i = startIdx; i < TIME_SLOTS.length; i++) {
        if (isSlotAvailable(TIME_SLOTS[i])) return TIME_SLOTS[i];
      }
    }
    // Fallback
    return isToday ? currentTimeSlot : '08:00';
  }, [selectedDate, currentTimeSlot, isSlotAvailable]);

  // Filter visible slots based on clinic hours
  const visibleSlots = useMemo(() => {
    if (!clinicHours || (!clinicHours.openTime && !clinicHours.closeTime)) return TIME_SLOTS;
    return TIME_SLOTS.filter(slot => isWithinClinicHours(slot));
  }, [clinicHours, isWithinClinicHours]);

  // Filter slots based on typed value
  const filteredSlots = useMemo(() => {
    const base = visibleSlots;
    if (!typedValue) return base;
    const raw = typedValue.replace(":", "");
    return base.filter((slot) => slot.replace(":", "").startsWith(raw));
  }, [typedValue, visibleSlots]);

  // Scroll to next available slot ONLY when popover first opens
  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (open && !prevOpenRef.current && scrollContainerRef.current) {
      setTimeout(() => {
        const targetTime = value || getScrollTarget();
        const el = scrollContainerRef.current?.querySelector(`[data-time="${targetTime}"]`);
        if (el) el.scrollIntoView({ block: 'center', behavior: 'auto' });
      }, 50);
    }
    prevOpenRef.current = open;
  }, [open]);

  const handleSelectTime = useCallback((time: string) => {
    if (!isSlotAvailable(time)) return;
    onChange?.(time);
    setOpen(false);
    setTypedValue("");
    setErrorMessage("");
  }, [isSlotAvailable, onChange]);

  // Clear typing state when popover closes
  useEffect(() => {
    if (!open) {
      setTypedValue("");
      setErrorMessage("");
    }
  }, [open]);

  const validateAndSetTime = useCallback((timeStr: string) => {
    if (!/^\d{2}:\d{2}$/.test(timeStr)) {
      setErrorMessage("Horário inválido");
      return;
    }
    const [h, m] = timeStr.split(":").map(Number);
    if (h < 0 || h > 23 || m < 0 || m > 59) {
      setErrorMessage("Horário inválido");
      return;
    }

    // Check if within clinic hours
    if (!isWithinClinicHours(timeStr)) {
      setErrorMessage("Fora do horário da clínica");
      return;
    }

    // If it's a standard slot, check availability normally
    if (TIME_SLOTS.includes(timeStr)) {
      if (!isSlotAvailable(timeStr)) {
        if (isTimeOccupied(timeStr)) setErrorMessage("Horário ocupado");
        else setErrorMessage("Horário indisponível");
        return;
      }
      setErrorMessage("");
      onChange?.(timeStr);
      setOpen(false);
      setTypedValue("");
      return;
    }

    // Custom time (not in 15-min slots) — check basic availability
    if (!isTimeAvailable(timeStr)) {
      setErrorMessage("Horário indisponível");
      return;
    }
    if (isTimeOccupied(timeStr)) {
      setErrorMessage("Horário ocupado");
      return;
    }

    // Show confirmation dialog for custom time
    setCustomTimeConfirm(timeStr);
  }, [isSlotAvailable, isTimeOccupied, isTimeAvailable, isWithinClinicHours, onChange]);

  const handleConfirmCustomTime = useCallback(() => {
    if (customTimeConfirm) {
      onChange?.(customTimeConfirm);
      setOpen(false);
      setTypedValue("");
      setErrorMessage("");
      setCustomTimeConfirm(null);
    }
  }, [customTimeConfirm, onChange]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    let formatted = "";
    if (raw.length >= 1) formatted = raw.slice(0, 2);
    if (raw.length >= 3) formatted += ":" + raw.slice(2, 4);
    setTypedValue(formatted);

    if (formatted.length === 5) {
      validateAndSetTime(formatted);
    } else {
      setErrorMessage("");
    }
  }, [validateAndSetTime]);

  const handleInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)) return;
    if (e.key === "Enter" && typedValue.length === 5) {
      e.preventDefault();
      validateAndSetTime(typedValue);
      return;
    }
    if (e.key === "Escape") { setOpen(false); return; }
    if (!/^\d$/.test(e.key)) e.preventDefault();
  }, [typedValue, validateAndSetTime]);

  const hasError = !!errorMessage || externalError;

  const displayText = value || placeholder;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-1">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={disabled}
              className={cn(
                "w-full justify-between text-left font-normal h-10",
                !value && !typedValue && "text-muted-foreground",
                hasError && "border-destructive focus-visible:ring-destructive",
                className
              )}
            >
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{displayText}</span>
              </div>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[160px] p-0 pointer-events-auto"
            align="start"
            onOpenAutoFocus={(e) => {
              e.preventDefault();
              setTimeout(() => inputRef.current?.focus(), 0);
            }}
          >
            {/* Always visible typing input */}
            <div className="p-2 border-b border-border">
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                value={typedValue}
                onChange={handleInputChange}
                onKeyDown={handleInputKeyDown}
                placeholder="HH:MM"
                maxLength={5}
                className={cn(
                  "w-full h-8 rounded-md border border-input bg-background px-2 py-1 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  errorMessage && "border-destructive focus-visible:ring-destructive"
                )}
              />
              {errorMessage && <p className="text-xs text-destructive mt-1">{errorMessage}</p>}
            </div>
            <div
              ref={scrollContainerRef}
              className="max-h-[280px] md:max-h-[320px] overflow-y-auto overscroll-contain p-2"
              style={{ WebkitOverflowScrolling: 'touch' }}
              onWheelCapture={(e) => e.stopPropagation()}
              onTouchMoveCapture={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col gap-1">
                {filteredSlots.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-2">Nenhum horário</p>
                ) : (
                  filteredSlots.map((time) => {
                    const isAvailable = isSlotAvailable(time);
                    const occupied = isTimeOccupied(time);
                    const past = !isTimeAvailable(time) && !occupied;
                    const isSelected = value === time;
                    const isCurrent = time === currentTimeSlot;
                    const isDisabled = !isAvailable || !!occupied;

                    const button = (
                      <button
                        key={time}
                        type="button"
                        data-time={time}
                        disabled={isDisabled}
                        onClick={() => handleSelectTime(time)}
                        className={cn(
                          "px-2.5 py-2 text-sm font-medium rounded-lg transition-all duration-150 w-full text-left",
                          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                          isAvailable && !isSelected && [
                            "bg-muted/50 text-foreground",
                            "hover:bg-primary/10 hover:text-primary",
                            "cursor-pointer",
                          ],
                          isSelected && [
                            "bg-primary text-primary-foreground font-semibold",
                            "shadow-sm",
                          ],
                          past && !occupied && [
                            "bg-muted/30 text-muted-foreground/60",
                            "cursor-not-allowed opacity-60",
                            "line-through decoration-muted-foreground/40",
                          ],
                          occupied && [
                            "bg-destructive/10 text-muted-foreground/60",
                            "cursor-not-allowed opacity-70",
                          ],
                          isCurrent && !isSelected && isAvailable && !occupied && [
                            "ring-1 ring-primary/50",
                          ]
                        )}
                      >
                        <span className="flex items-center justify-between">
                          <span>{time}</span>
                          {occupied && <span className="text-[10px] text-destructive font-medium">Ocupado</span>}
                        </span>
                      </button>
                    );

                    if (occupied && occupied.patientName) {
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
        {errorMessage && !open && <p className="text-xs text-destructive">{errorMessage}</p>}
      </div>

      {/* Custom time confirmation dialog */}
      <AlertDialog open={!!customTimeConfirm} onOpenChange={(v) => { if (!v) setCustomTimeConfirm(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Horário personalizado</AlertDialogTitle>
            <AlertDialogDescription>
              O horário <strong>{customTimeConfirm}</strong> não está nos intervalos padrão de 15 minutos. Deseja agendar nesse horário mesmo assim?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCustomTime}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
