const EASTERN_TIME_ZONE = 'America/New_York'

const easternHourFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: EASTERN_TIME_ZONE,
    hour: 'numeric',
    hour12: false,
})

const easternDateTimeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: EASTERN_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZoneName: 'short',
})

function parseDate(value: string | Date) {
    const parsed = value instanceof Date ? value : new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function getEasternHour(value: string | Date) {
    const parsed = parseDate(value)
    if (!parsed) return null

    const hour = Number.parseInt(easternHourFormatter.format(parsed), 10)
    return Number.isNaN(hour) ? null : hour
}

export function formatEasternDateTime(value: string | Date | null | undefined) {
    if (!value) return 'N/A'
    const parsed = parseDate(value)
    if (!parsed) return 'N/A'
    return easternDateTimeFormatter.format(parsed)
}

