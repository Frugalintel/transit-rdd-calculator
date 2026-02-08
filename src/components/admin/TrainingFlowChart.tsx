"use client"

import { TrainingStep } from '@/config/trainingSteps'
import { ThemeIcon } from '@/components/ThemeIcon'
import { useTheme } from '@/context/ThemeContext'
import { getTypeColor, getEditorTheme } from '@/utils/trainingTheme'
import { StepType } from '@/types'
import { useMemo } from 'react'

interface TrainingFlowChartProps {
    steps: Record<string, TrainingStep>
    selectedStepId?: string
    onStepClick?: (stepId: string) => void
}

interface Node {
    id: string
    step: TrainingStep
    x: number
    y: number
    level: number
}

export function TrainingFlowChart({ steps, selectedStepId, onStepClick }: TrainingFlowChartProps) {
    const { settings } = useTheme()
    const isFallout = settings.themeMode === 'fallout'
    const theme = getEditorTheme(isFallout)

    // Build graph structure and calculate layout
    const { nodes, edges } = useMemo(() => {
        const nodeMap = new Map<string, Node>()
        const edges: Array<{ from: string; to: string; label?: string }> = []
        
        // Find root nodes (nodes with no incoming edges)
        const incomingCount = new Map<string, number>()
        Object.values(steps).forEach(step => {
            incomingCount.set(step.id, 0)
        })
        
        Object.values(steps).forEach(step => {
            if (step.nextStep) {
                incomingCount.set(step.nextStep, (incomingCount.get(step.nextStep) || 0) + 1)
                edges.push({ from: step.id, to: step.nextStep })
            }
            if (step.options) {
                step.options.forEach(option => {
                    if (option.nextStep) {
                        incomingCount.set(option.nextStep, (incomingCount.get(option.nextStep) || 0) + 1)
                        edges.push({ from: step.id, to: option.nextStep, label: option.label })
                    }
                })
            }
        })
        
        // Find root nodes (no incoming edges)
        const roots = Array.from(incomingCount.entries())
            .filter(([_, count]) => count === 0)
            .map(([id]) => id)
        
        // BFS to assign levels
        const levelMap = new Map<string, number>()
        const queue: Array<{ id: string; level: number }> = roots.map(id => ({ id, level: 0 }))
        
        while (queue.length > 0) {
            const { id, level } = queue.shift()!
            if (levelMap.has(id)) continue
            
            levelMap.set(id, level)
            const step = steps[id]
            if (!step) continue
            
            if (step.nextStep && !levelMap.has(step.nextStep)) {
                queue.push({ id: step.nextStep, level: level + 1 })
            }
            if (step.options) {
                step.options.forEach(option => {
                    if (option.nextStep && !levelMap.has(option.nextStep)) {
                        queue.push({ id: option.nextStep, level: level + 1 })
                    }
                })
            }
        }
        
        // Group by level and calculate positions
        const levelGroups = new Map<number, string[]>()
        levelMap.forEach((level, id) => {
            if (!levelGroups.has(level)) {
                levelGroups.set(level, [])
            }
            levelGroups.get(level)!.push(id)
        })
        
        const maxLevel = Math.max(...Array.from(levelGroups.keys()), 0)
        const nodeSpacing = 140
        const levelSpacing = 180
        const baseWidth = 800
        
        levelGroups.forEach((ids, level) => {
            const y = level * levelSpacing + 100
            const totalInLevel = ids.length
            const totalWidth = (totalInLevel - 1) * nodeSpacing
            const startX = (baseWidth - totalWidth) / 2
            
            ids.forEach((id, index) => {
                const x = startX + index * nodeSpacing
                
                nodeMap.set(id, {
                    id,
                    step: steps[id],
                    x,
                    y,
                    level
                })
            })
        })
        
        return { nodes: Array.from(nodeMap.values()), edges }
    }, [steps])
    
    const getStepTypeColor = (type: string) => getTypeColor(type as StepType, isFallout)
    
    const maxY = nodes.length > 0 ? Math.max(...nodes.map(n => n.y)) + 100 : 600
    const svgWidth = 800
    const svgHeight = Math.max(maxY, 600)
    
    return (
        <div className="relative w-full h-full min-h-[600px] overflow-auto" style={{ backgroundColor: theme.canvasBg, border: `4px solid ${theme.panelBorder}` }}>
            <svg 
                width={svgWidth}
                height={svgHeight}
                className="absolute inset-0"
                style={{ minWidth: `${svgWidth}px`, minHeight: `${svgHeight}px` }}
            >
                {/* Draw edges */}
                {edges.map((edge, idx) => {
                    const fromNode = nodes.find(n => n.id === edge.from)
                    const toNode = nodes.find(n => n.id === edge.to)
                    if (!fromNode || !toNode) return null
                    
                    const isOption = edge.label !== undefined
                    const color = isOption ? theme.optionEdgeColor : theme.edgeColor
                    
                    return (
                        <g key={`edge-${idx}`}>
                            <line
                                x1={fromNode.x}
                                y1={fromNode.y + 40}
                                x2={toNode.x}
                                y2={toNode.y - 40}
                                stroke={color}
                                strokeWidth={isOption ? 3 : 2}
                                markerEnd="url(#arrowhead)"
                            />
                            {edge.label && (
                                <text
                                    x={(fromNode.x + toNode.x) / 2}
                                    y={(fromNode.y + toNode.y) / 2 - 5}
                                    fill={theme.optionEdgeColor}
                                    fontSize="12"
                                    fontFamily={theme.font}
                                    textAnchor="middle"
                                    className="pointer-events-none"
                                >
                                    {edge.label}
                                </text>
                            )}
                        </g>
                    )
                })}
                
                {/* Arrow marker definition */}
                <defs>
                    <marker
                        id="arrowhead"
                        markerWidth="10"
                        markerHeight="10"
                        refX="9"
                        refY="3"
                        orient="auto"
                    >
                        <polygon
                            points="0 0, 10 3, 0 6"
                            fill={theme.edgeColor}
                        />
                    </marker>
                </defs>
            </svg>
            
            {/* Draw nodes */}
            <div className="relative z-10">
                {nodes.map((node) => {
                    const colors = getStepTypeColor(node.step.type)
                    const isSelected = node.id === selectedStepId
                    
                    return (
                        <div
                            key={node.id}
                            className="absolute cursor-pointer transition-transform hover:scale-110"
                            style={{
                                left: `${node.x - 40}px`,
                                top: `${node.y - 40}px`,
                                transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                            }}
                            onClick={() => onStepClick?.(node.id)}
                        >
                            <div
                                className="w-20 h-20 flex flex-col items-center justify-center"
                                style={{
                                    backgroundColor: colors.bg,
                                    border: `${theme.nodeBorderWidth} solid ${isSelected ? theme.selectionColor : colors.border}`,
                                    boxShadow: isSelected 
                                        ? `${theme.selectionGlow}${theme.bevelShadow !== 'none' ? ', ' + theme.bevelShadow : ''}`
                                        : theme.bevelShadow !== 'none' ? theme.bevelShadow : 'none',
                                    fontFamily: theme.font,
                                }}
                            >
                                <ThemeIcon type={node.step.icon} scale={1.5} />
                                <div 
                                    className="text-[10px] mt-1 text-center px-1 truncate w-full"
                                    style={{ color: theme.textColor, textShadow: theme.textShadow }}
                                >
                                    {node.step.title}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
            
            {/* Legend */}
            <div className="absolute bottom-4 left-4 p-3" style={{ backgroundColor: theme.panelBg, border: `2px solid ${theme.panelBorder}`, fontFamily: theme.font }}>
                <div className="text-lg mb-2 font-bold" style={{ color: theme.textColor }}>Step Types</div>
                <div className="space-y-1 text-sm">
                    {(['info', 'input', 'quiz', 'decision'] as StepType[]).map(type => {
                        const c = getTypeColor(type, isFallout)
                        return (
                            <div key={type} className="flex items-center gap-2">
                                <div className="w-4 h-4" style={{ backgroundColor: c.bg, border: `2px solid ${c.border}` }}></div>
                                <span style={{ color: theme.textColor }}>{c.label}</span>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

