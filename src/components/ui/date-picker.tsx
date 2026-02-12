"use client"

import * as React from "react"
import { format, isValid } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { useTheme } from "@/context/ThemeContext"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

/**
 * Smart date parser.
 * Accepts:
 *   - "today", "tomorrow"/"tmrw", "yesterday"
 *   - "M/D" or "MM/DD"  → uses current year
 *   - "M/D/YYYY" or "MM/DD/YYYY"
 *   - "M/D/YY" → assumes 2000s
 * Returns a valid Date or null.
 */
function parseSmartDate(val: string): Date | null {
  const trimmed = val.trim()
  if (!trimmed) return null

  const lower = trimmed.toLowerCase()
  const now = new Date()

  // Natural language shortcuts
  if (lower === "today" || lower === "tod") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  }
  if (lower === "tomorrow" || lower === "tmrw" || lower === "tom") {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    d.setDate(d.getDate() + 1)
    return d
  }
  if (lower === "yesterday" || lower === "yest") {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    d.setDate(d.getDate() - 1)
    return d
  }

  // Try date patterns: M/D/YYYY, M/D/YY, or M/D
  const match = trimmed.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/)
  if (match) {
    const month = parseInt(match[1], 10)
    const day = parseInt(match[2], 10)
    let year = now.getFullYear() // default to current year

    if (match[3]) {
      year = parseInt(match[3], 10)
      // 2-digit year → assume 2000s
      if (year < 100) year += 2000
    }

    // Validate ranges
    if (month < 1 || month > 12) return null
    if (day < 1 || day > 31) return null

    const parsed = new Date(year, month - 1, day)
    // Verify the date didn't roll over (e.g. Feb 31 → March)
    if (
      isValid(parsed) &&
      parsed.getMonth() === month - 1 &&
      parsed.getDate() === day
    ) {
      return parsed
    }
  }

  return null
}

export function DatePicker({
  date,
  setDate,
  label,
  disabled,
  fallbackDate,
}: {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
  label?: string
  disabled?: boolean
  fallbackDate?: Date
}) {
  const toMonthStart = React.useCallback((d: Date) => new Date(d.getFullYear(), d.getMonth(), 1), [])
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")
  const [calendarMonth, setCalendarMonth] = React.useState<Date>(() =>
    date ? new Date(date.getFullYear(), date.getMonth(), 1) : new Date()
  )
  const [isFocused, setIsFocused] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const cursorPosRef = React.useRef<{ start: number | null; end: number | null }>({ start: null, end: null })
  const moveCursorToEndRef = React.useRef(false)
  const { settings } = useTheme()
  const isFallout = settings.themeMode === "fallout"
  const isChicago95 = settings.themeMode === "chicago95"

  // Sync display value from external date prop (but not while user is typing)
  React.useEffect(() => {
    if (!isFocused) {
      if (date) {
        setInputValue(format(date, "MM/dd/yyyy"))
      } else {
        setInputValue("")
      }
    }
  }, [date, isFocused])

  // Keep calendar month aligned with committed date when popover is closed.
  React.useEffect(() => {
    if (!open && date) {
      setCalendarMonth(toMonthStart(date))
    }
  }, [date, open, toMonthStart])

  // Restore cursor position after React re-renders the controlled input.
  // useLayoutEffect fires synchronously after DOM update but before paint,
  // so the cursor never visibly jumps.
  React.useLayoutEffect(() => {
    const el = inputRef.current
    if (!el) return

    if (moveCursorToEndRef.current) {
      // After commit/format, move cursor to end
      moveCursorToEndRef.current = false
      const len = el.value.length
      el.setSelectionRange(len, len)
    } else if (cursorPosRef.current.start !== null) {
      // After normal typing, restore saved cursor position
      el.setSelectionRange(cursorPosRef.current.start, cursorPosRef.current.end)
      cursorPosRef.current = { start: null, end: null }
    }
  }, [inputValue])

  // Let the user type freely — no parsing mid-keystroke
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    // Save cursor position BEFORE the state update triggers a re-render
    cursorPosRef.current = {
      start: e.target.selectionStart,
      end: e.target.selectionEnd,
    }
    setInputValue(val)

    // Allow clearing
    if (val === "") {
      setDate(undefined)
      return
    }

    // Keep parent date state in sync once the typed value is valid.
    // This avoids stale calculations when users type a date and click
    // Calculate immediately without an explicit blur/Enter.
    const parsed = parseSmartDate(val)
    if (parsed) {
      setDate(parsed)
    }
  }

  // On blur / Enter: parse, commit, and auto-format
  const commitValue = () => {
    const trimmed = inputValue.trim()

    if (trimmed === "") {
      setDate(undefined)
      setInputValue("")
      return
    }

    const parsed = parseSmartDate(trimmed)
    if (parsed) {
      setDate(parsed)
      moveCursorToEndRef.current = true
      setInputValue(format(parsed, "MM/dd/yyyy"))
    } else {
      // Invalid — revert to last valid date or clear
      if (date) {
        moveCursorToEndRef.current = true
        setInputValue(format(date, "MM/dd/yyyy"))
      } else {
        setInputValue("")
      }
    }
  }

  const handleBlur = () => {
    setIsFocused(false)
    commitValue()
  }

  const handleFocus = () => {
    setIsFocused(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      // Commit the date immediately — keep focus so user sees the result
      commitValue()
    }
    // Escape: revert and blur
    if (e.key === "Escape") {
      if (date) {
        setInputValue(format(date, "MM/dd/yyyy"))
      } else {
        setInputValue("")
      }
      ;(e.target as HTMLInputElement).blur()
    }
  }

  // Calendar selection handler
  const handleCalendarSelect = (d: Date | undefined) => {
    setDate(d)
    if (d) {
      setCalendarMonth(toMonthStart(d))
    }
    setOpen(false)
    // Don't steal focus back to input
  }

  const handlePopoverOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      const parsed = parseSmartDate(inputValue)
      const anchorDate = parsed ?? date ?? fallbackDate ?? new Date()
      setCalendarMonth(toMonthStart(anchorDate))
    }
    setOpen(nextOpen)
  }

  // Shared calendar footer with quick-pick buttons
  const calendarFooter = (
    <div className="px-2 pb-2 pt-1 flex gap-2">
      <Button
        type="button"
        className="h-8 flex-1 text-sm"
        onClick={() => {
          const today = new Date()
          setDate(today)
          setCalendarMonth(toMonthStart(today))
          setOpen(false)
        }}
      >
        Today
      </Button>
      <Button
        type="button"
        className="h-8 flex-1 text-sm"
        onClick={() => {
          const tmrw = new Date()
          tmrw.setDate(tmrw.getDate() + 1)
          setDate(tmrw)
          setCalendarMonth(toMonthStart(tmrw))
          setOpen(false)
        }}
      >
        Tomorrow
      </Button>
    </div>
  )

  // ─── Fallout Theme ───────────────────────────────────────
  if (isFallout) {
    return (
      <div className="relative w-full">
        <div className="relative group">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            placeholder={label || "MM/DD/YYYY"}
            disabled={disabled}
            className={cn(
              "fo-input text-lg pr-10",
              disabled && "opacity-60 cursor-not-allowed"
            )}
            style={{ caretColor: 'var(--fo-primary)' }}
            autoComplete="off"
          />
          <Popover open={disabled ? false : open} onOpenChange={disabled ? undefined : handlePopoverOpenChange}>
            <PopoverTrigger asChild>
              <button
                type="button"
                disabled={disabled}
                className="absolute right-0 top-0 bottom-0 w-10 flex items-center justify-center fo-text opacity-50 hover:opacity-100 transition-opacity"
                aria-label="Open calendar"
                tabIndex={-1}
              >
                <CalendarIcon className="h-5 w-5" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 border-2 border-[var(--fo-primary)] bg-black shadow-none"
              align="start"
              side="bottom"
              sideOffset={4}
            >
              <div className="bg-black p-4">
                <Calendar
                  mode="single"
                  selected={date}
                  month={calendarMonth}
                  onMonthChange={setCalendarMonth}
                  onSelect={handleCalendarSelect}
                  initialFocus
                  className="!border-0 !shadow-none !bg-transparent !m-0"
                  footer={calendarFooter}
                />
              </div>
            </PopoverContent>
          </Popover>
        </div>
        {/* Hint text when focused and empty */}
        <div className="mt-1 min-h-[12px] pl-1">
          {isFocused && !inputValue && (
            <div className="text-[10px] leading-tight fo-text-dim opacity-60">
              type date, &quot;today&quot;, or &quot;tomorrow&quot;
            </div>
          )}
        </div>
      </div>
    )
  }

  // ─── Minecraft / Chicago95 Theme ─────────────────────────
  return (
    <div className="relative w-full">
      <div className="relative group">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={label || "MM/DD/YYYY"}
          disabled={disabled}
          className={cn(
            isChicago95 ? "chi95-input pr-10 text-sm" : "mc-input pr-10 text-xl tracking-wider",
            disabled && "opacity-60 cursor-not-allowed"
          )}
          style={{ caretColor: isChicago95 ? "#000000" : 'var(--mc-input-text, #ffffff)' }}
          autoComplete="off"
        />
        <Popover open={disabled ? false : open} onOpenChange={disabled ? undefined : handlePopoverOpenChange}>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={disabled}
              className={cn(
                "absolute right-0 top-0 bottom-0 w-10 flex items-center justify-center",
                isChicago95 && "chi95-button !h-auto !min-h-0 top-[1px] right-[1px] bottom-[1px] w-9 p-0"
              )}
              aria-label="Open calendar"
              tabIndex={-1}
            >
              <CalendarIcon className={cn("h-5 w-5 transition-colors", isChicago95 ? "text-black hover:text-[#000080]" : "text-[#707070] hover:text-white")} />
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0 border-0"
            align="start"
            side="bottom"
            sideOffset={isChicago95 ? 2 : 8}
            collisionPadding={20}
          >
            <div className={cn(
              isChicago95
                ? "bg-[#c0c0c0] p-2 border-2 border-[#808080] shadow-[inset_1px_1px_0_0_#ffffff,inset_-1px_-1px_0_0_#000000]"
                : "bg-[var(--mc-bg)] p-2 shadow-[inset_2px_2px_0_0_var(--mc-light-border),inset_-2px_-2px_0_0_var(--mc-dark-border),inset_-4px_-4px_0_0_var(--mc-shadow),0_0_0_2px_#000000,4px_4px_0_0_rgba(0,0,0,0.25)]"
            )}>
              <Calendar
                mode="single"
                selected={date}
                month={calendarMonth}
                onMonthChange={setCalendarMonth}
                onSelect={handleCalendarSelect}
                initialFocus
                className="!border-0 !shadow-none !bg-transparent"
                footer={calendarFooter}
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>
      {/* Hint text when focused and empty */}
      <div className="mt-1 min-h-[12px] pl-1">
        {isFocused && !inputValue && (
          <div className={cn("text-[10px] leading-tight", isChicago95 ? "chi95-text opacity-70" : "text-[#707070]")}>
            type date, &quot;today&quot;, or &quot;tomorrow&quot;
          </div>
        )}
      </div>
    </div>
  )
}
