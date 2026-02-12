"use client"
import { useState } from 'react'
import { DataTable } from './DataTable'
import { Button } from '@/components/ui/button'
import { ThemeIcon } from '@/components/ThemeIcon'
import { useTheme } from '@/context/ThemeContext'

interface DataManagerProps {
    holidays: any[]
    seasons: any[]
    weights: any[]
}

export function DataManager({ holidays, seasons, weights }: DataManagerProps) {
    const [activeTab, setActiveTab] = useState<'holidays' | 'seasons' | 'weights'>('holidays')
    const { settings } = useTheme()
    const isFallout = settings.themeMode === 'fallout'
    const isChicago95 = settings.themeMode === 'chicago95'

    return (
        <div className="space-y-6">
            <div className={`
                flex gap-2 pb-3
                ${isFallout 
                    ? 'border-b border-[var(--fo-primary-dim)]' 
                    : isChicago95
                        ? 'border-b border-[#808080]'
                    : 'border-b-4 border-[var(--mc-dark-border)]'
                }
            `}>
                <Button 
                    variant={activeTab === 'holidays' ? (isFallout ? 'default' : 'primary') : 'ghost'}
                    onClick={() => setActiveTab('holidays')}
                    className={`px-6 ${isFallout && activeTab === 'holidays' ? 'fo-button fo-button-primary' : (isFallout ? 'fo-button fo-button-ghost' : '')} ${isChicago95 ? 'chi95-button' : ''}`}
                >
                    <ThemeIcon type="cake" className="mr-2" />
                    Holidays
                </Button>
                <Button 
                    variant={activeTab === 'seasons' ? (isFallout ? 'default' : 'primary') : 'ghost'}
                    onClick={() => setActiveTab('seasons')}
                    className={`px-6 ${isFallout && activeTab === 'seasons' ? 'fo-button fo-button-primary' : (isFallout ? 'fo-button fo-button-ghost' : '')} ${isChicago95 ? 'chi95-button' : ''}`}
                >
                    <ThemeIcon type="snowball" className="mr-2" />
                    Peak Seasons
                </Button>
                <Button 
                    variant={activeTab === 'weights' ? (isFallout ? 'default' : 'primary') : 'ghost'}
                    onClick={() => setActiveTab('weights')}
                    className={`px-6 ${isFallout && activeTab === 'weights' ? 'fo-button fo-button-primary' : (isFallout ? 'fo-button fo-button-ghost' : '')} ${isChicago95 ? 'chi95-button' : ''}`}
                >
                    <ThemeIcon className="mr-2" type="iron_pickaxe" />
                    Weights
                </Button>
            </div>

            <div className="min-h-[400px]">
                {activeTab === 'holidays' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className={`text-xl ${isFallout ? 'fo-heading border-none' : isChicago95 ? 'chi95-text font-bold' : 'mc-admin-heading'}`}>Federal Holidays</h3>
                            <Button variant="primary" className={isFallout ? "fo-button" : ""}>
                                <ThemeIcon type="firework" className="mr-2" />
                                Add Holiday
                            </Button>
                        </div>
                        <DataTable 
                            data={holidays}
                            columns={[
                                { header: 'Holiday Name', accessor: 'name', width: '60%' },
                                { header: 'Date', accessor: 'date', width: '30%' },
                            ]}
                            actions={() => (
                                <Button size="sm" variant="ghost" title="Edit" className={isFallout ? "fo-button-ghost" : ""}>
                                    <ThemeIcon type="pickaxe" />
                                </Button>
                            )}
                        />
                    </div>
                )}

                {activeTab === 'seasons' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className={`text-xl ${isFallout ? 'fo-heading border-none' : isChicago95 ? 'chi95-text font-bold' : 'mc-admin-heading'}`}>Peak Seasons</h3>
                            <Button variant="primary" className={isFallout ? "fo-button" : ""}>
                                <ThemeIcon type="firework" className="mr-2" />
                                Add Season
                            </Button>
                        </div>
                        <DataTable 
                            data={seasons}
                            columns={[
                                { header: 'Season Name', accessor: 'name', width: '40%' },
                                { header: 'Start Date', accessor: 'start_date', width: '25%' },
                                { header: 'End Date', accessor: 'end_date', width: '25%' },
                            ]}
                            actions={() => (
                                <Button size="sm" variant="ghost" title="Edit" className={isFallout ? "fo-button-ghost" : ""}>
                                    <ThemeIcon type="pickaxe" />
                                </Button>
                            )}
                        />
                    </div>
                )}

                {activeTab === 'weights' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className={`text-xl ${isFallout ? 'fo-heading border-none' : isChicago95 ? 'chi95-text font-bold' : 'mc-admin-heading'}`}>Transit Weight Ranges</h3>
                            <Button variant="primary" className={isFallout ? "fo-button" : ""}>
                                <ThemeIcon type="firework" className="mr-2" />
                                Add Range
                            </Button>
                        </div>
                        <DataTable 
                            data={weights}
                            columns={[
                                { header: 'Min Weight (lbs)', accessor: 'min_weight', width: '40%' },
                                { header: 'Max Weight (lbs)', accessor: 'max_weight', width: '40%' },
                            ]}
                            actions={() => (
                                <Button size="sm" variant="ghost" title="Edit" className={isFallout ? "fo-button-ghost" : ""}>
                                    <ThemeIcon type="pickaxe" />
                                </Button>
                            )}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}