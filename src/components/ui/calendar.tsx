"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"
import { cn } from "@/lib/utils"
import { useTransitData } from "@/hooks/useTransitData"
import { useTheme } from "@/context/ThemeContext"
import { HOLIDAY_ICONS } from "@/utils/dateHelpers"
import { ItemIcon } from "../minecraft/ItemIcon"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

// Generate years from 1990 to 2050
const YEARS = Array.from({ length: 61 }, (_, i) => 1990 + i)

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const { data } = useTransitData()
  const { settings } = useTheme()
  const isFallout = settings.themeMode === 'fallout'
  const isChicago95 = settings.themeMode === 'chicago95'
  const [displayMonth, setDisplayMonth] = React.useState(() => props.defaultMonth || new Date())
  const [monthOpen, setMonthOpen] = React.useState(false)
  const [yearOpen, setYearOpen] = React.useState(false)
  const currentYear = displayMonth.getFullYear()
  const currentMonth = displayMonth.getMonth()

  // Callback ref for month list - scrolls to selected item when mounted
  const monthListRef = React.useCallback((node: HTMLDivElement | null) => {
    if (node && monthOpen) {
      const selectedEl = node.querySelector('[data-selected="true"]') as HTMLElement
      if (selectedEl) {
        const containerHeight = node.clientHeight
        const elementTop = selectedEl.offsetTop
        const elementHeight = selectedEl.offsetHeight
        node.scrollTop = elementTop - (containerHeight / 2) + (elementHeight / 2)
      }
    }
  }, [monthOpen])

  // Callback ref for year list - scrolls to selected item when mounted
  const yearListRef = React.useCallback((node: HTMLDivElement | null) => {
    if (node && yearOpen) {
      const selectedEl = node.querySelector('[data-selected="true"]') as HTMLElement
      if (selectedEl) {
        const containerHeight = node.clientHeight
        const elementTop = selectedEl.offsetTop
        const elementHeight = selectedEl.offsetHeight
        node.scrollTop = elementTop - (containerHeight / 2) + (elementHeight / 2)
      }
    }
  }, [yearOpen])

  // Sync with external month prop if provided
  React.useEffect(() => {
    if (props.month) {
      setDisplayMonth(props.month)
    }
  }, [props.month])

  const handleMonthChange = (month: Date) => {
    setDisplayMonth(month)
    props.onMonthChange?.(month)
  }

  const goToPrevMonth = () => {
    const newDate = new Date(currentYear, currentMonth - 1, 1)
    handleMonthChange(newDate)
  }

  const goToNextMonth = () => {
    const newDate = new Date(currentYear, currentMonth + 1, 1)
    handleMonthChange(newDate)
  }

  const selectMonth = (monthIndex: number) => {
    const newDate = new Date(currentYear, monthIndex, 1)
    handleMonthChange(newDate)
    setMonthOpen(false)
  }

  const selectYear = (year: number) => {
    const newDate = new Date(year, currentMonth, 1)
    handleMonthChange(newDate)
    setYearOpen(false)
  }

  // Theme-specific dropdown styles
  const dropdownContainerClass = isFallout
    ? "bg-black border border-[var(--fo-primary)] p-1 max-h-[180px] overflow-y-auto"
    : isChicago95
      ? "bg-white p-1 border-2 border-[#808080] shadow-[inset_1px_1px_0_0_#ffffff,inset_-1px_-1px_0_0_#000000] max-h-[180px] overflow-y-auto"
      : "bg-[var(--mc-bg)] p-1 shadow-[inset_2px_2px_0_0_var(--mc-light-border),inset_-2px_-2px_0_0_var(--mc-dark-border),0_0_0_2px_#000000] max-h-[180px] overflow-y-auto"

  const dropdownItemClass = (isSelected: boolean) => isFallout
    ? cn(
        "w-full px-2 py-1 text-left text-sm font-mono",
        "text-[var(--fo-primary)] hover:bg-[var(--fo-primary)] hover:text-black",
        isSelected && "bg-[var(--fo-primary)] text-black"
      )
    : isChicago95
      ? cn(
          "w-full px-2 py-1 text-left text-sm text-black",
          "hover:bg-[#000080] hover:text-white",
          isSelected && "bg-[#000080] text-white"
        )
    : cn(
        "w-full px-2 py-0.5 text-left text-xs font-mono",
        "hover:bg-[var(--mc-button-bg)] hover:text-white",
        isSelected && "bg-[var(--mc-primary)] text-[var(--mc-warning-text)]"
      )

  return (
    <div className={cn("p-2", !isChicago95 && "font-mono", className)}>
      {/* Custom Header */}
      <div className="flex items-center justify-center gap-2 mb-2">
        <Button
          type="button"
          onClick={goToPrevMonth}
          className="h-8 w-8 flex items-center justify-center text-sm p-0"
          aria-label="Previous month"
        >
          «
        </Button>
        
        {/* Month Dropdown */}
        <Popover open={monthOpen} onOpenChange={setMonthOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              className="h-8 px-3 flex items-center justify-center gap-1 text-sm min-w-[100px]"
            >
              {MONTHS[currentMonth]} <span className="text-[10px]">▼</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-[120px] p-0 border-0 z-[100]" 
            align="center"
            sideOffset={4}
            onOpenAutoFocus={(e) => e.preventDefault()}
            style={{ animationDuration: '0s' }}
          >
            <div ref={monthListRef} className={dropdownContainerClass}>
              {MONTHS.map((month, index) => (
                <button
                  key={month}
                  type="button"
                  onClick={() => selectMonth(index)}
                  data-selected={index === currentMonth}
                  className={dropdownItemClass(index === currentMonth)}
                >
                  {month}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Year Dropdown */}
        <Popover open={yearOpen} onOpenChange={setYearOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              className="h-8 px-3 flex items-center justify-center gap-1 text-sm min-w-[70px]"
            >
              {currentYear} <span className="text-[10px]">▼</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-[70px] p-0 border-0 z-[100]" 
            align="center"
            sideOffset={4}
            onOpenAutoFocus={(e) => e.preventDefault()}
            style={{ animationDuration: '0s' }}
          >
            <div ref={yearListRef} className={dropdownContainerClass}>
              {YEARS.map((year) => (
                <button
                  key={year}
                  type="button"
                  onClick={() => selectYear(year)}
                  data-selected={year === currentYear}
                  className={dropdownItemClass(year === currentYear)}
                >
                  {year}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Button
          type="button"
          onClick={goToNextMonth}
          className="h-8 w-8 flex items-center justify-center text-sm p-0"
          aria-label="Next month"
        >
          »
        </Button>
      </div>

      <DayPicker
        showOutsideDays={showOutsideDays}
        month={displayMonth}
        onMonthChange={handleMonthChange}
        classNames={{
          months: "flex flex-col",
          month: "space-y-1 relative", 
          month_caption: "hidden", 
          caption_label: "hidden",
          dropdowns: "hidden",
          dropdown: "hidden",
          
          nav: "hidden",
          button_previous: "hidden",
          button_next: "hidden",
          
          month_grid: "w-full border-collapse",
          weekdays: "",
          weekday: isFallout
            ? "fo-text w-8 h-6 font-normal text-[11px] text-center opacity-60"
            : isChicago95
            ? "chi95-text w-8 h-6 font-normal text-[11px] text-center"
            : "mc-text-dark w-8 h-6 font-normal text-[11px] text-center",
          week: "",
          day: "h-8 w-8 text-center p-0.5 relative",
          day_button: isFallout
            ? cn(
                "h-full w-full p-0 font-normal bg-transparent text-[var(--fo-primary)]",
                "border border-transparent",
                "hover:border-[var(--fo-primary)] hover:bg-[var(--fo-primary)] hover:text-black",
                "flex items-center justify-center text-xs relative transition-none"
              )
            : isChicago95
            ? cn(
                "h-full w-full p-0 font-normal bg-[#c0c0c0] text-black border border-[#808080]",
                "hover:bg-[#000080] hover:text-white",
                "flex items-center justify-center text-xs relative transition-none"
              )
            : cn(
                "h-full w-full p-0 font-normal bg-[var(--mc-button-bg)] text-white",
                "shadow-[inset_2px_2px_0_0_var(--mc-dark-border),inset_-2px_-2px_0_0_var(--mc-shadow)]",
                "hover:shadow-[inset_0_0_0_2px_#ffffff]",
                "flex items-center justify-center text-xs relative transition-shadow"
              ),
          selected: isFallout
            ? "!bg-transparent !text-[var(--fo-primary)] !font-bold !outline !outline-1 !outline-[var(--fo-primary)] !shadow-[0_0_8px_var(--fo-primary-glow)]"
            : isChicago95
            ? "!bg-[#000080] !text-white !font-bold"
            : "!bg-[var(--mc-primary)] !text-[var(--mc-warning-text)] !shadow-[inset_0_0_0_2px_#ffffff]",
          today: isFallout
            ? "!border !border-[var(--fo-primary-dim)] !text-[var(--fo-primary)] !bg-[rgba(26,255,128,0.08)]"
            : isChicago95
            ? "!border !border-[#000080] !bg-[#dfe8ff]"
            : "!bg-[var(--mc-destructive)] !text-white !shadow-[inset_2px_2px_0_0_#cc7777,inset_-2px_-2px_0_0_#662222]",
          outside: isFallout
            ? "!text-[var(--fo-primary-dim)] opacity-30"
            : isChicago95
            ? "!text-[#666666] opacity-50"
            : "!text-[var(--mc-text-gray)] !bg-[#4a4a4a] !shadow-[inset_1px_1px_0_0_#333333,inset_-1px_-1px_0_0_#5a5a5a] opacity-50",
          disabled: "text-gray-500 opacity-40 cursor-not-allowed",
          hidden: "invisible",
          ...classNames,
        }}
      components={{
        DayButton: ({ day, modifiers, ...buttonProps }) => {
            const date = day.date
            const dayNumber = date.getDate()
            const isToday = modifiers?.today
            const month = date.getMonth()
            const dayOfMonth = date.getDate()
            
            // Check for peak season dates (May 15 = peak start, Sept 30 = peak end)
            const isPeakStart = month === 4 && dayOfMonth === 15 // May 15
            const isPeakEnd = month === 8 && dayOfMonth === 30 // Sept 30
            
            // Check for holiday
            let holiday = null
            if (data?.holidays) {
                const year = date.getFullYear();
                const m = String(date.getMonth() + 1).padStart(2, '0');
                const d = String(date.getDate()).padStart(2, '0');
                const dateString = `${year}-${m}-${d}`;
                holiday = data.holidays.find(h => h.date === dateString)
            }
            
            // Determine which icon to show (priority: holiday > peak) — Minecraft only
            let iconType = null
            let iconTitle = holiday?.name
            if (!isFallout && !isChicago95) {
                if (holiday) {
                    iconType = HOLIDAY_ICONS[holiday.name] || 'compass'
                } else if (isPeakStart) {
                    iconType = 'torch'
                    iconTitle = 'Peak Season Starts'
                } else if (isPeakEnd) {
                    iconType = 'wheat'
                    iconTitle = 'Peak Season Ends'
                }
            }
            
            // Today styling
            const isSelected = modifiers?.selected
            let extraClasses = ""
            if (isToday && isFallout) {
                if (isSelected) {
                    // Today AND selected: kill inner border, outer outline only, no shadow glow (keeps it clean single-line)
                    extraClasses = "!border-0 !text-[var(--fo-primary)] !font-bold !bg-[rgba(26,255,128,0.08)] !outline !outline-1 !outline-[var(--fo-primary)] !shadow-none hover:!bg-[var(--fo-primary)] hover:!text-black"
                } else {
                    // Today only: subtle indicator + preserve hover
                    extraClasses = "!border !border-[var(--fo-primary-dim)] !text-[var(--fo-primary)] !bg-[rgba(26,255,128,0.08)] hover:!bg-[var(--fo-primary)] hover:!text-black hover:!border-[var(--fo-primary)]"
                }
            } else if (isToday && !isFallout && !isChicago95) {
                extraClasses = "!bg-[var(--mc-destructive)] !shadow-[inset_2px_2px_0_0_#662222,inset_-2px_-2px_0_0_#cc7777] hover:!shadow-[inset_0_0_0_2px_#ffffff]"
            }
            
            return (
                <button 
                    {...buttonProps} 
                    title={iconTitle}
                    className={cn(buttonProps.className, extraClasses)}
                >
                    {iconType && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-50 pointer-events-none">
                            <ItemIcon type={iconType as any} scale={1} />
                        </div>
                    )}
                    <span className={cn("relative z-10", iconType && "font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]")}>
                        {dayNumber}
                    </span>
                </button>
            )
        }
      }}
        {...props}
      />
    </div>
  )
}

export { Calendar }
