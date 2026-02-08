import { FederalHoliday } from '@/types'

export const HOLIDAY_ICONS: Record<string, string> = {
  'New Year\'s Day': 'firework',
  'Martin Luther King Jr. Day': 'book',
  'Washington\'s Birthday': 'feather',
  'Memorial Day': 'poppy',
  'Juneteenth National Independence Day': 'chain',
  'Independence Day': 'firework_star',
  'Labor Day': 'iron_pickaxe',
  'Columbus Day': 'compass',
  'Veterans Day': 'golden_helmet',
  'Thanksgiving Day': 'cooked_chicken',
  'Christmas Day': 'cake'
}

export function isFederalHoliday(date: Date, holidays: FederalHoliday[]): boolean {
  // Use local time for date string comparison to avoid timezone issues
  // padStart ensures '01' instead of '1'
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateString = `${year}-${month}-${day}`;
  
  return holidays.some(h => h.date === dateString)
}

export function isBusinessDay(date: Date, holidays: FederalHoliday[]): boolean {
  const day = date.getDay()
  if (day === 0 || day === 6) return false // Weekend (0=Sun, 6=Sat)
  return !isFederalHoliday(date, holidays)
}

export function getNextBusinessDay(date: Date, holidays: FederalHoliday[]): Date {
  let result = new Date(date)
  while (!isBusinessDay(result, holidays)) {
    result.setDate(result.getDate() + 1)
  }
  return result
}

export function calculateRDD(startDate: Date, transitDays: number, holidays: FederalHoliday[]): Date {
  let rdd = new Date(startDate)
  // Add transit days as calendar days
  rdd.setDate(rdd.getDate() + transitDays)
  // Ensure result is a business day
  return getNextBusinessDay(rdd, holidays)
}

export function calculateLoadSpread(loadDate: Date): { earliest: Date; latest: Date } {
    const latest = new Date(loadDate);
    latest.setDate(loadDate.getDate() + 1);
    const earliest = new Date(latest);
    earliest.setDate(latest.getDate() - 6);
    return { earliest, latest };
}

export function formatDateForDisplay(date: Date): string {
    const options: Intl.DateTimeFormatOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
}

export function formatDateForCopy(date: Date): string {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
}

