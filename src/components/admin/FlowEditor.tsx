"use client"

import { useState, useCallback, useEffect, useMemo, memo, useRef } from 'react'
import {
    ReactFlow,
    Node,
    Edge,
    Controls,
    Background,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    MarkerType,
    NodeTypes,
    Panel,
    useReactFlow,
    ReactFlowProvider,
    Handle,
    Position,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { TrainingStep, StepType } from '@/types'
import { ThemeIcon } from '@/components/ThemeIcon'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/context/ThemeContext'
import { getTypeColor, getEditorTheme, EditorTheme } from '@/utils/trainingTheme'
import { toast } from 'sonner'

// Memoized custom node component - prevents re-render of unselected nodes
const StepNode = memo(function StepNode({ data, selected }: { data: TrainingStep & { onSelect: (id: string) => void, theme: EditorTheme, isFallout: boolean }, selected: boolean }) {
    const colors = getTypeColor(data.type, data.isFallout)
    const t = data.theme

    return (
        <div
            className="min-w-[160px] max-w-[200px] cursor-pointer relative"
            onClick={() => data.onSelect(data.id)}
            style={{
                backgroundColor: colors.bg,
                border: `${t.nodeBorderWidth} solid ${selected ? t.selectionColor : colors.border}`,
                boxShadow: selected 
                    ? `${t.selectionGlow}${t.bevelShadow !== 'none' ? ', ' + t.bevelShadow : ''}`
                    : t.bevelShadow,
                fontFamily: t.font,
                transform: selected ? 'scale(1.05)' : 'scale(1)',
                transition: 'transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
            }}
        >
            {/* React Flow Handles for connections */}
            <Handle type="target" position={Position.Top} className="!bg-white !border-2 !border-gray-600 !w-3 !h-3" />
            <Handle type="source" position={Position.Bottom} className="!bg-white !border-2 !border-gray-600 !w-3 !h-3" />
            
            <div className="p-3">
                <div className="flex items-center gap-2 mb-2">
                    <ThemeIcon type={data.icon} />
                    <span 
                        className="text-sm font-bold truncate flex-1"
                        style={{ color: t.textColor, textShadow: t.textShadow }}
                    >
                        {data.title}
                    </span>
                </div>
                <div 
                    className="text-xs truncate"
                    style={{ color: t.textDim, textShadow: t.textShadow !== 'none' ? '1px 1px 0 #000' : 'none' }}
                >
                    {data.id}
                </div>
                <div 
                    className="mt-2 text-xs px-2 py-0.5 bg-black/30 inline-block"
                    style={{ color: t.textColor, textShadow: t.textShadow !== 'none' ? '1px 1px 0 #000' : 'none' }}
                >
                    {colors.label}
                </div>
            </div>
        </div>
    )
})

const nodeTypes: NodeTypes = {
    stepNode: StepNode,
}

interface FlowEditorProps {
    steps: Record<string, TrainingStep>
    selectedStepId: string | null
    onStepSelect: (stepId: string) => void
    onStepsChange: (steps: Record<string, TrainingStep>) => void
    onAddStep: (position: { x: number, y: number }) => void
}

function FlowEditorInner({ 
    steps, 
    selectedStepId, 
    onStepSelect, 
    onStepsChange,
    onAddStep 
}: FlowEditorProps) {
    const { screenToFlowPosition, fitView } = useReactFlow()
    const { settings } = useTheme()
    const isFallout = settings.themeMode === 'fallout'
    const theme = getEditorTheme(isFallout)
    const isInitialMount = useRef(true)
    const prevStepsRef = useRef(steps)
    
    // Stable callback ref to avoid recreating nodes when onStepSelect changes
    const onStepSelectRef = useRef(onStepSelect)
    onStepSelectRef.current = onStepSelect
    const stableOnSelect = useCallback((id: string) => {
        onStepSelectRef.current(id)
    }, [])
    
    // Calculate layout ONLY when steps structure changes (not on selection)
    const layoutNodes = useMemo(() => {
        const nodeMap = new Map<string, Node>()
        const incomingCount = new Map<string, number>()
        
        // Initialize incoming count
        Object.values(steps).forEach(step => {
            incomingCount.set(step.id, 0)
        })
        
        // Calculate incoming connections
        Object.values(steps).forEach(step => {
            if (step.nextStep && steps[step.nextStep]) {
                incomingCount.set(step.nextStep, (incomingCount.get(step.nextStep) || 0) + 1)
            }
            step.options?.forEach(opt => {
                if (opt.nextStep && steps[opt.nextStep]) {
                    incomingCount.set(opt.nextStep, (incomingCount.get(opt.nextStep) || 0) + 1)
                }
            })
        })
        
        // Find roots
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
            
            if (step.nextStep && steps[step.nextStep] && !levelMap.has(step.nextStep)) {
                queue.push({ id: step.nextStep, level: level + 1 })
            }
            step.options?.forEach(opt => {
                if (opt.nextStep && steps[opt.nextStep] && !levelMap.has(opt.nextStep)) {
                    queue.push({ id: opt.nextStep, level: level + 1 })
                }
            })
        }
        
        // Group by level
        const levelGroups = new Map<number, string[]>()
        levelMap.forEach((level, id) => {
            if (!levelGroups.has(level)) {
                levelGroups.set(level, [])
            }
            levelGroups.get(level)!.push(id)
        })
        
        // Assign positions
        const nodeSpacing = 250
        const levelSpacing = 200
        
        levelGroups.forEach((ids, level) => {
            const y = level * levelSpacing + 50
            const totalWidth = (ids.length - 1) * nodeSpacing
            const startX = -totalWidth / 2
            
            ids.forEach((id, index) => {
                const x = startX + index * nodeSpacing
                nodeMap.set(id, {
                    id,
                    type: 'stepNode',
                    position: { x, y },
                    data: { ...steps[id], onSelect: stableOnSelect, theme, isFallout },
                    selected: false, // Selection handled separately
                })
            })
        })
        
        // Handle orphaned nodes (not in level map)
        let orphanY = (levelGroups.size) * levelSpacing + 100
        Object.values(steps).forEach(step => {
            if (!nodeMap.has(step.id)) {
                nodeMap.set(step.id, {
                    id: step.id,
                    type: 'stepNode',
                    position: { x: 0, y: orphanY },
                    data: { ...step, onSelect: stableOnSelect, theme, isFallout },
                    selected: false,
                })
                orphanY += 150
            }
        })
        
        return Array.from(nodeMap.values())
    }, [steps, stableOnSelect, theme, isFallout]) // Removed selectedStepId dependency!
    
    // Convert steps to React Flow edges
    const layoutEdges = useMemo(() => {
        const edges: Edge[] = []
        
        Object.values(steps).forEach(step => {
            if (step.nextStep && steps[step.nextStep]) {
                edges.push({
                    id: `${step.id}-${step.nextStep}`,
                    source: step.id,
                    target: step.nextStep,
                    type: 'smoothstep',
                    animated: false, // Disable animation for performance
                    style: { stroke: theme.edgeColor, strokeWidth: 2 },
                    markerEnd: { type: MarkerType.ArrowClosed, color: theme.edgeColor },
                })
            }
            
            step.options?.forEach((opt, idx) => {
                if (opt.nextStep && steps[opt.nextStep]) {
                    edges.push({
                        id: `${step.id}-opt-${idx}-${opt.nextStep}`,
                        source: step.id,
                        target: opt.nextStep,
                        type: 'smoothstep',
                        animated: false,
                        label: opt.label,
                        labelStyle: { 
                            fill: theme.optionEdgeColor, 
                            fontFamily: theme.font,
                            fontSize: 12,
                        },
                        labelBgStyle: { fill: theme.canvasBg, fillOpacity: 0.8 },
                        style: { stroke: theme.optionEdgeColor, strokeWidth: 2 },
                        markerEnd: { type: MarkerType.ArrowClosed, color: theme.optionEdgeColor },
                    })
                }
            })
        })
        
        return edges
    }, [steps])
    
    const [nodes, setNodes, onNodesChange] = useNodesState(layoutNodes)
    const [edges, setEdges, onEdgesChange] = useEdgesState(layoutEdges)
    
    // Update layout only when steps structure changes
    useEffect(() => {
        const stepsChanged = prevStepsRef.current !== steps
        prevStepsRef.current = steps
        
        if (stepsChanged || isInitialMount.current) {
            setNodes(layoutNodes.map(n => ({
                ...n,
                selected: n.id === selectedStepId
            })))
            setEdges(layoutEdges)
            
            // Fit view on initial mount or when steps change significantly
            if (isInitialMount.current) {
                isInitialMount.current = false
                setTimeout(() => fitView({ padding: 0.2 }), 50)
            }
        }
    }, [layoutNodes, layoutEdges, setNodes, setEdges, selectedStepId, fitView])
    
    // FAST selection update - only toggles selected property without recalculating layout
    useEffect(() => {
        if (isInitialMount.current) return
        
        setNodes((currentNodes) => 
            currentNodes.map((node) => ({
                ...node,
                selected: node.id === selectedStepId,
            }))
        )
    }, [selectedStepId, setNodes])
    
    // Memoized minimap color function
    const miniMapNodeColor = useCallback((node: Node) => {
        const step = steps[node.id]
        if (!step) return '#8b8b8b'
        return getTypeColor(step.type, isFallout).bg
    }, [steps, isFallout])
    
    const onConnect = useCallback((params: Connection) => {
        if (!params.source || !params.target) return
        
        // Update the step's nextStep
        const sourceStep = steps[params.source]
        if (sourceStep) {
            const updatedSteps = {
                ...steps,
                [params.source]: {
                    ...sourceStep,
                    nextStep: params.target,
                }
            }
            onStepsChange(updatedSteps)
            toast.success(`Connected ${sourceStep.title} → ${steps[params.target]?.title}`)
        }
    }, [steps, onStepsChange])
    
    const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
        onStepSelect(node.id)
    }, [onStepSelect])
    
    const onPaneClick = useCallback((event: React.MouseEvent) => {
        // Double-click to add new node
        if (event.detail === 2) {
            const position = screenToFlowPosition({ x: event.clientX, y: event.clientY })
            onAddStep(position)
        }
    }, [screenToFlowPosition, onAddStep])
    
    return (
        <div className="w-full h-full" style={{ minHeight: '600px' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onPaneClick={onPaneClick}
                nodeTypes={nodeTypes}
                fitView
                snapToGrid
                snapGrid={[20, 20]}
                style={{ backgroundColor: theme.canvasBg }}
            >
                <Background color={theme.canvasGrid} gap={20} />
                <Controls style={{ backgroundColor: theme.controlBg, border: `2px solid ${theme.controlBorder}` }} />
                <MiniMap 
                    nodeColor={miniMapNodeColor}
                    style={{ backgroundColor: theme.canvasBg, border: `2px solid ${theme.panelBorder}` }}
                    zoomable
                    pannable
                />
                
                <Panel position="top-left" style={{ backgroundColor: theme.panelBg, border: `2px solid ${theme.panelBorder}`, padding: '12px', fontFamily: theme.font }}>
                    <div className="text-sm mb-2" style={{ color: theme.textColor }}>
                        Double-click to add step
                    </div>
                    <div className="text-xs" style={{ color: theme.textDim }}>
                        Drag between nodes to connect
                    </div>
                </Panel>
                
                {/* Legend */}
                <Panel position="bottom-left" style={{ backgroundColor: theme.panelBg, border: `2px solid ${theme.panelBorder}`, padding: '12px', fontFamily: theme.font }}>
                    <div className="text-sm mb-2 font-bold" style={{ color: theme.textColor }}>
                        Step Types
                    </div>
                    <div className="space-y-1 text-xs">
                        {(['info', 'input', 'quiz', 'decision', 'simulation', 'copy_template'] as StepType[]).map(type => {
                            const c = getTypeColor(type, isFallout)
                            return (
                                <div key={type} className="flex items-center gap-2">
                                    <div className="w-4 h-4" style={{ backgroundColor: c.bg, border: `2px solid ${c.border}` }} />
                                    <span style={{ color: theme.textColor }}>{c.label}</span>
                                </div>
                            )
                        })}
                    </div>
                </Panel>
            </ReactFlow>
        </div>
    )
}

export function FlowEditor(props: FlowEditorProps) {
    return (
        <ReactFlowProvider>
            <FlowEditorInner {...props} />
        </ReactFlowProvider>
    )
}
