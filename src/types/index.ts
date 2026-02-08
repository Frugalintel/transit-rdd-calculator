export interface TransitWeight {
  id: number
  min_weight: number
  max_weight: number
}

export interface TransitDistance {
  id: number
  min_dist: number
  max_dist: number
}

export interface TransitTime {
  id: number
  weight_id: number
  distance_id: number
  days: number
}

export interface FederalHoliday {
  id: string
  date: string // YYYY-MM-DD
  name: string
}

export interface PeakSeason {
  id: string
  start_date: string // YYYY-MM-DD
  end_date: string // YYYY-MM-DD
  name: string
}

export interface TransitGuideData {
  weights: TransitWeight[]
  distances: TransitDistance[]
  times: TransitTime[]
  holidays: FederalHoliday[]
  peakSeasons: PeakSeason[]
}

export interface CalculationRecord {
  id: string
  user_id: string
  name: string | null
  input_data: any
  result_data: any
  created_at: string
}

// Training System Types
export type StepType = 'info' | 'input' | 'quiz' | 'decision' | 'simulation' | 'copy_template'
export type ComplexityLevel = 'simple' | 'intermediate' | 'complex'

export interface RichContentBlock {
  type: 'text' | 'image' | 'callout' | 'list'
  content: string
  style?: 'info' | 'warning' | 'tip'
  items?: string[] // for list type
}

export interface RichContent {
  blocks: RichContentBlock[]
}

export interface SimulationConfig {
  prefilledData: {
    pickupDate?: string
    packDate?: string
    weight?: number
    distance?: number
    origin?: string
    destination?: string
  }
  expectedOutput?: string
  hints?: string[]
  requiredFields?: string[]
}

export interface CopyTemplateConfig {
  template: string // with {{placeholders}}
  placeholders: Record<string, string>
  description?: string
}

export interface TrainingStepOption {
  label: string
  nextStep: string
  isCorrect?: boolean
}

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

export interface TrainingScenario {
  id: string
  moduleId: string
  title: string
  description?: string
  icon: string
  complexityLevel: ComplexityLevel
  tags: string[]
  displayOrder: number
  isPublished: boolean
  steps?: TrainingStep[]
}

export interface TrainingModule {
  id: string
  title: string
  description?: string
  icon: string
  displayOrder: number
  isPublished: boolean
  scenarios?: TrainingScenario[]
}

