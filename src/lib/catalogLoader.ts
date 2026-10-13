/**
 * Catalog loader for Board Master catalog 3.0-draft1
 */

import { StyleCatalog, CatalogStyleName, BOARD_STYLES } from '../types/catalog';

// Import all catalog JSON files
import brickBasketweaveData from '../../styles/brick-basketweave_23b0.json';
import checkerboardData from '../../styles/checkerboard_5664.json';
import chevronData from '../../styles/chevron_7d86.json';
import edgeGrainData from '../../styles/edge-grain_12fb.json';
import endGrainData from '../../styles/end-grain_fa5f.json';
import faceGrainData from '../../styles/face-grain_e305.json';
import herringboneData from '../../styles/herringbone_ee60.json';
import scrapChaoticData from '../../styles/scrap-chaotic_d65d.json';
import stripeInlayData from '../../styles/stripe-inlay_939c.json';
import tumblingBlock3dData from '../../styles/tumbling-block-3d_f8f5.json';

const catalogData: Record<string, StyleCatalog> = {
  'brick-basketweave': brickBasketweaveData as unknown as StyleCatalog,
  'checkerboard': checkerboardData as unknown as StyleCatalog,
  'chevron': chevronData as unknown as StyleCatalog,
  'edge-grain': edgeGrainData as unknown as StyleCatalog,
  'end-grain': endGrainData as unknown as StyleCatalog,
  'face-grain': faceGrainData as unknown as StyleCatalog,
  'herringbone': herringboneData as unknown as StyleCatalog,
  'scrap-chaotic': scrapChaoticData as unknown as StyleCatalog,
  'stripe-inlay': stripeInlayData as unknown as StyleCatalog,
  'tumbling-block-3d': tumblingBlock3dData as unknown as StyleCatalog,
};

/**
 * Load catalog for a specific style
 */
export function loadStyleCatalog(style: CatalogStyleName): StyleCatalog {
  const catalog = catalogData[style];
  if (!catalog) {
    throw new Error(`Catalog not found for style: ${style}`);
  }
  return catalog;
}

/**
 * Load all catalogs
 */
export function loadAllCatalogs(): Record<string, StyleCatalog> {
  return catalogData;
}

/**
 * Get kerf value for a style (defaults to shopDefault if available)
 */
export function getKerf(style: CatalogStyleName): number {
  const catalog = loadStyleCatalog(style);
  return catalog.cutListAllowances.kerf_mm;
}

/**
 * Get rough-to-final oversize for a style
 */
export function getRoughOversize(style: CatalogStyleName): {
  thickness: number;
  width: number;
  length: number;
} {
  const catalog = loadStyleCatalog(style);
  return catalog.cutListAllowances.roughToFinalOversize_mm;
}

/**
 * Get planer minimums for a style
 */
export function getPlanerMinimum(style: CatalogStyleName): {
  length: number;
  thickness: number;
} {
  const catalog = loadStyleCatalog(style);
  return catalog.cutListAllowances.planerMinimum_mm;
}

/**
 * Get flattening allowance for a style
 */
export function getFlatteningAllowance(style: CatalogStyleName): number {
  const catalog = loadStyleCatalog(style);
  return catalog.cutListAllowances.flatteningAllowance_mm;
}

/**
 * Get sanding loss for a style
 */
export function getSandingLoss(style: CatalogStyleName): number {
  const catalog = loadStyleCatalog(style);
  return catalog.cutListAllowances.sandingLoss_mm;
}

/**
 * Check if catalog uses shop defaults
 */
export function isShopDefault(style: CatalogStyleName): boolean {
  const catalog = loadStyleCatalog(style);
  return catalog.cutListAllowances.shopDefault;
}

/**
 * Get all available styles
 */
export function getAvailableStyles(): CatalogStyleName[] {
  return [...BOARD_STYLES];
}

/**
 * Validate that all styles have catalogs
 */
export function validateAllCatalogsLoaded(): boolean {
  for (const style of BOARD_STYLES) {
    if (!catalogData[style]) {
      console.error(`Missing catalog for style: ${style}`);
      return false;
    }
  }
  return true;
}
