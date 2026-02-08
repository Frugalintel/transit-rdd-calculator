"use client"

import { useCallback } from 'react'
import { TransitGuideData } from '@/types'
import { calculateRDD, calculateLoadSpread, formatDateForDisplay } from '@/utils/dateHelpers'

export interface CalculationResult {
  transitDays: number
  rdd: Date
  rddDisplay: string
  loadSpread: { earliest: Date; latest: Date }
  seasonStatus: 'Peak Season' | 'Non-Peak'
  error?: string
}

export function useCalculator(data: TransitGuideData | null) {
  const calculate = useCallback((weight: number, distance: number, loadDate: Date): CalculationResult | null => {
    if (!data) return { 
        transitDays: 0, 
        rdd: new Date(), 
        rddDisplay: '', 
        loadSpread: {earliest: new Date(), latest: new Date()}, 
        seasonStatus: 'Non-Peak', 
        error: "Data not loaded" 
    }

    // 1. Find Weight Range
    // Note: Use find instead of findIndex because we need the ID
    const weightRange = data.weights.find(w => weight >= w.min_weight && weight <= w.max_weight)
    
    // 2. Find Distance Range
    const distRange = data.distances.find(d => distance >= d.min_dist && distance <= d.max_dist)

    if (!weightRange || !distRange) {
        return { 
            transitDays: 0, 
            rdd: new Date(), 
            rddDisplay: '', 
            loadSpread: {earliest: new Date(), latest: new Date()}, 
            seasonStatus: 'Non-Peak', 
            error: "Out of range" 
        }
    }

    // 3. Get Transit Time
    const timeRecord = data.times.find(t => t.weight_id === weightRange.id && t.distance_id === distRange.id)
    
    if (!timeRecord) {
        return { 
            transitDays: 0, 
            rdd: new Date(), 
            rddDisplay: '', 
            loadSpread: {earliest: new Date(), latest: new Date()}, 
            seasonStatus: 'Non-Peak', 
            error: "Transit time configuration missing" 
        }
    }

    const transitDays = timeRecord.days

    // 4. Calculate RDD
    const rdd = calculateRDD(loadDate, transitDays, data.holidays)
    
    // 5. Calculate Spread
    const loadSpread = calculateLoadSpread(loadDate)

    // 6. Check Season
    // Convert strings to dates for comparison
    const isPeak = data.peakSeasons.some(season => {
       // Append T00:00:00 to ensure local time comparison if needed, 
       // but strictly speaking these are dates. 
       // Let's rely on string comparison or Date object comparison.
       // The DB returns YYYY-MM-DD strings. 
       // loadDate is a Date object (usually set to midnight local).
       
       // Construct start/end dates from strings, assuming UTC/Local consistency
       // Actually, easiest is to compare YYYY-MM-DD strings.
       const loadDateStr = loadDate.toISOString().split('T')[0]
       return loadDateStr >= season.start_date && loadDateStr <= season.end_date
    })

    return {
      transitDays,
      rdd,
      rddDisplay: formatDateForDisplay(rdd),
      loadSpread,
      seasonStatus: isPeak ? 'Peak Season' : 'Non-Peak'
    }
  }, [data])

  return { calculate }
}

