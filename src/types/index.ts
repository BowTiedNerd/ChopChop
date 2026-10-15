// Board style types
export type BoardStyle =
  | 'brick-basketweave'
  | 'checkerboard'
  | 'chevron'
  | 'edge-grain'
  | 'end-grain'
  | 'face-grain'
  | 'herringbone'
  | 'scrap-chaotic'
  | 'stripe-inlay'
  | 'tumbling-block-3d';

// Unit system
export type UnitSystem = 'imperial' | 'metric';

// Wood species
export interface WoodSpecies {
  name: string;
  color: string;
  texture?: string;
  grainDirection?: 'vertical' | 'horizontal';
}

// Board dimensions
export interface BoardDimensions {
  width: number;  // in mm
  length: number; // in mm
  thickness: number; // in mm
}

// Modifiers
export interface JuiceGroove {
  enabled: boolean;
  width: number;      // mm
  depth: number;      // mm
  fromEdge: number;   // mm
  cornerRadius: number; // mm
}

export interface Handles {
  enabled: boolean;
  type: 'handle' | 'hand-hole' | 'hand-hole-slot';
}

export interface RubberFeet {
  enabled: boolean;
  diameter: number;   // mm
  height: number;     // mm
  inset: number;      // mm from edges
}

// Board design
export interface BoardDesign {
  style: BoardStyle;
  dimensions: BoardDimensions;
  species: WoodSpecies[];
  angle?: number;     // degrees, for chevron/herringbone
  juiceGroove: JuiceGroove;
  handles: Handles;
  rubberFeet: RubberFeet;
  unitSystem: UnitSystem;
}

// Strip for cutting
export interface Strip {
  width: number;      // mm
  thickness: number;  // mm
  length: number;     // mm
  species: WoodSpecies;
  count: number;
}

// Validation result
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// Cut list item
export interface CutListItem {
  part: string;
  quantity: number;
  width: number;
  thickness: number;
  length: number;
  species: string;
  notes?: string;
  /** slices (or angled pieces) crosscut from this blank/panel/log */
  slices?: number;
  /** tumbling block numbers (catalog tumblingBlockMethod) */
  tumbling?: { tiles: number; cols: number; tileRows: number; hexPerSlice: number; spare: number; offset_mm: number; diamondSide_mm: number; stripThickness_mm: number; stripsPerTone: number; logCount: number; logLength_mm: number; slicesPerLog: number; tones: { light: string; mid: string; dark: string } };
}

// Step instruction
export interface StepInstruction {
  stepNumber: number;  // Display order only
  stepId: string;      // Stable identifier for figures
  title: string;
  description: string;
  settings: Record<string, string>;
  safetyBanners: string[];
  figure?: string; // SVG data
  figureType?: string | null; // Type of figure from catalog
}

// Angle validation
export interface AngleConstraints {
  min: number;
  max: number;
}
