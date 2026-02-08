import { 
    StepType, 
    TrainingStep as TrainingStepType,
    RichContent,
    SimulationConfig,
    CopyTemplateConfig,
    TrainingStepOption
} from '@/types'

// Re-export types for backwards compatibility
export type { StepType }

export interface TrainingStep {
    id: string
    title: string
    content: string
    type: StepType
    icon: string
    nextStep?: string
    options?: TrainingStepOption[]
    scenarioId?: string
    richContent?: RichContent
    simulationConfig?: SimulationConfig
    copyTemplate?: CopyTemplateConfig
    displayOrder?: number
}

export const TRAINING_STEPS: Record<string, TrainingStep> = {
    'start': {
        id: 'start',
        title: 'Welcome to Transit Training',
        content: 'This interactive guide covers the RDD Calculator and the full Date Change Process.\n\nYou will learn:\n• How to use the calculator (dates, weight, distance)\n• The complete date change flowchart\n• Member-requested vs agent-requested changes\n• Spread checks, GBL rules, and update checklists\n\nClick "Start" to begin with the basics.',
        type: 'info',
        icon: 'book',
        nextStep: 'calc_basics'
    },
    'calc_basics': {
        id: 'calc_basics',
        title: 'Calculator Basics',
        content: 'The RDD Calculator determines the Required Delivery Date based on:\n\n1. Pack Date — when goods are packed\n2. Pickup/Load Date — when the carrier picks up\n3. Shipment Weight — affects transit time brackets\n4. Distance — driving miles between origin and destination\n\nThe calculator accounts for weekends, federal holidays, and peak seasons automatically.',
        type: 'info',
        icon: 'compass',
        nextStep: 'date_change_intro'
    },
    'date_change_intro': {
        id: 'date_change_intro',
        title: 'Date Change Process',
        content: 'When a date change is requested, the first question is always: WHO requested it?\n\n• Member-requested — The service member needs different dates\n• Agent-requested — A Delivery Agent (DA) or Hauler Agent (HA) needs different dates\n\nEach path has different decision points and approval requirements. Open the Training Center for the full interactive walkthroughs.',
        type: 'decision',
        icon: 'sign',
        options: [
            { label: 'Learn about Member-Requested changes', nextStep: 'member_overview' },
            { label: 'Learn about Agent-Requested changes', nextStep: 'agent_overview' },
            { label: 'Finish for now', nextStep: 'result' }
        ]
    },
    'member_overview': {
        id: 'member_overview',
        title: 'Member-Requested: Key Steps',
        content: 'When a member requests a date change:\n\n1. Check if both O/A/HA can accommodate\n2. Determine if it\'s a self-haul\n3. Identify which dates are changing\n4. Check if the new dates are within spread\n5. Handle GBL and survey requirements\n6. Get member signature\n7. Complete the update checklist\n\nFor the full interactive walkthrough, visit the Training Center.',
        type: 'info',
        icon: 'clock',
        nextStep: 'result'
    },
    'agent_overview': {
        id: 'agent_overview',
        title: 'Agent-Requested: Key Steps',
        content: 'When an agent requests a date change:\n\n1. Identify if it\'s DA or HA requesting\n2. Check if packing days are affected\n3. Verify both agents can accommodate\n4. Check hauler assignment status\n5. Get member confirmation (accept/deny)\n6. Perform spread and GBL checks\n7. Complete the update checklist\n\nFor the full interactive walkthrough, visit the Training Center.',
        type: 'info',
        icon: 'sign',
        nextStep: 'result'
    },
    'result': {
        id: 'result',
        title: 'Training Complete!',
        content: 'You have completed the basic training overview.\n\nFor detailed interactive walkthroughs of the full Date Change Process, visit the Training Center where you can practice each scenario step by step.',
        type: 'info',
        icon: 'firework',
        nextStep: undefined
    }
}

