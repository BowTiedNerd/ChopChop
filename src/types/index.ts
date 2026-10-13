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
}

// Step instruction
export interface StepInstruction {
  stepNumber: number;
  title: string;
  description: string;
  settings: Record<string, string>;
  safetyBanners: string[];
  figure?: string; // SVG data
}

// Angle validation
export interface AngleConstraints {
  min: number;
  max: number;
}
