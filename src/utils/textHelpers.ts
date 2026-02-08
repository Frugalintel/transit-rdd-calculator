import { formatDateForCopy } from './dateHelpers'

export type CopyFormat = 'simple' | 'osnp' | 'osp' | 'isp' | 'isnp' | 'dpsr'

export const FORMAT_ACRONYMS: Record<CopyFormat, string> = {
    simple: 'Basic',
    osnp: 'OSNP',
    osp: 'OSP',
    isp: 'ISP',
    isnp: 'ISNP',
    dpsr: 'DPSR'
}

export const FORMAT_LABELS: Record<CopyFormat, string> = {
    simple: 'Basic - Just the dates',
    osnp: 'OSNP - Dates are out of spread and survey has not been entered',
    osp: 'OSP - Dates are out of spread and survey has been entered',
    isp: 'ISP - Dates are within spread and survey dates have been entered',
    isnp: 'ISNP - Dates are within spread and survey has not been entered',
    dpsr: 'DPSR - DPS remarks'
}

export const DEFAULT_TEMPLATES: Record<CopyFormat, string> = {
    simple: `Pack: {{pack_date}}\nPickup: {{load_date}}\nRDD: {{rdd_date}}`,
    osnp: `Hello,\n\nThe agent(s) can accommodate your requested date change. Your new dates are as follows-\n\nPack: {{pack_date}}\nPickup: {{load_date}}\nRDD: {{rdd_date}}\n\nJPPSO, please update DPS to reflect the Earliest Pickup Date of {{earliest_load_date}} and Latest Pickup Date of {{latest_load_date}}`,
    osp: `Hello,\n\nThe agent(s) can accommodate your requested date change. Your new dates are as follows-\n\nPack: {{pack_date}}\nPickup: {{load_date}}\nRDD: {{rdd_date}}\n\nJPPSO, please update the planned dates in DPS and on GBL as well as issue the spread override due to member/base convenience.`,
    isp: `Hello,\n\nThe agent(s) can accommodate your requested date change. Your new dates are as follows-\n\nPack: {{pack_date}}\nPickup: {{load_date}}\nRDD: {{rdd_date}}\n\nJPPSO, please update the planned dates in DPS and on GBL.`,
    isnp: `Hello,\n\nThe agent(s) can accommodate your requested date change. Your new dates are as follows-\n\nPack: {{pack_date}}\nPickup: {{load_date}}\nRDD: {{rdd_date}}`,
    dpsr: `This shipment will now Pack {{pack_date}} and Pickup {{load_date}}, per member request.`
}

export function generateCopyText(
    template: string,
    packDate: Date | null,
    loadDate: Date,
    rdd: Date,
    earliestLoad: Date,
    latestLoad: Date
): string {
    const packDateFormatted = packDate ? formatDateForCopy(packDate) : 'N/A'
    const loadDateFormatted = formatDateForCopy(loadDate)
    const rddDateFormatted = formatDateForCopy(rdd)
    const earliestLoadDate = formatDateForCopy(earliestLoad)
    const latestLoadDate = formatDateForCopy(latestLoad)

    let text = template
        .replace(/{{pack_date}}/g, packDateFormatted)
        .replace(/{{load_date}}/g, loadDateFormatted)
        .replace(/{{rdd_date}}/g, rddDateFormatted)
        .replace(/{{earliest_load_date}}/g, earliestLoadDate)
        .replace(/{{latest_load_date}}/g, latestLoadDate)

    return text
}
