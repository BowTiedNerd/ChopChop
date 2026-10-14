import { describe, it, expect } from 'vitest';
import {
  loadStyleCatalog,
  loadAllCatalogs,
  getKerf,
  getRoughOversize,
  getPlanerMinimum,
  getFlatteningAllowance,
  getSandingLoss,
  isShopDefault,
  getAvailableStyles,
  validateAllCatalogsLoaded,
} from './catalogLoader';
import { BOARD_STYLES } from '../types/catalog';

describe('Catalog Loader', () => {
  it('should load all 10 style catalogs', () => {
    const allCatalogs = loadAllCatalogs();
    expect(Object.keys(allCatalogs)).toHaveLength(10);
    
    for (const style of BOARD_STYLES) {
      expect(allCatalogs[style]).toBeDefined();
      expect(allCatalogs[style].style).toBe(style);
    }
  });

  it('should validate all catalogs are loaded', () => {
    expect(validateAllCatalogsLoaded()).toBe(true);
  });

  describe('Individual Style Loading', () => {
    for (const style of BOARD_STYLES) {
      it(`should load ${style} catalog`, () => {
        const catalog = loadStyleCatalog(style);
        
        expect(catalog.style).toBe(style);
        expect(catalog.displayName).toBeTruthy();
        expect(catalog.description).toBeTruthy();
        expect(catalog.steps).toBeInstanceOf(Array);
        expect(catalog.steps.length).toBeGreaterThan(0);
        expect(catalog.cutListAllowances).toBeDefined();
        
        // pricePerBF may be null (per spec)
        expect(catalog.pricePerBF === null || typeof catalog.pricePerBF === 'number').toBe(true);
      });
    }
  });

  describe('Cut List Allowances', () => {
    it('should have valid allowances schema for all styles', () => {
      for (const style of BOARD_STYLES) {
        const catalog = loadStyleCatalog(style);
        const allowances = catalog.cutListAllowances;
        
        // Check new schema structure
        expect(allowances.kerf_mm).toBeGreaterThan(0);
        expect(allowances.kerf_text).toBeTruthy();
        
        // roughToFinalOversize_mm split into named fields
        expect(allowances.roughToFinalOversize_mm.thickness).toBeGreaterThan(0);
        expect(allowances.roughToFinalOversize_mm.width).toBeGreaterThan(0);
        expect(allowances.roughToFinalOversize_mm.length).toBeGreaterThan(0);
        
        // planerMinimum_mm split into named fields
        expect(allowances.planerMinimum_mm.length).toBeGreaterThan(0);
        expect(allowances.planerMinimum_mm.thickness).toBeGreaterThan(0);
        
        expect(allowances.flatteningAllowance_mm).toBeGreaterThan(0);
        expect(allowances.sandingLoss_mm).toBeGreaterThan(0);
        
        // shopDefault flag
        expect(typeof allowances.shopDefault).toBe('boolean');
      }
    });

    it('should get kerf for checkerboard', () => {
      const kerf = getKerf('checkerboard');
      expect(kerf).toBe(3.175);
    });

    it('should get rough oversize dimensions', () => {
      const oversize = getRoughOversize('checkerboard');
      expect(oversize.thickness).toBe(3.0);
      expect(oversize.width).toBe(6.0);
      expect(oversize.length).toBe(50.0);
    });

    it('should get planer minimums', () => {
      const minimum = getPlanerMinimum('checkerboard');
      expect(minimum.length).toBe(305.0);
      expect(minimum.thickness).toBe(6.5);
    });

    it('should get flattening allowance', () => {
      const allowance = getFlatteningAllowance('checkerboard');
      expect(allowance).toBe(5.0); // draft3: increased for end-grain
    });

    it('should get sanding loss', () => {
      const loss = getSandingLoss('checkerboard');
      expect(loss).toBe(0.5);
    });

    it('should check if using shop defaults', () => {
      const isDefault = isShopDefault('checkerboard');
      expect(typeof isDefault).toBe('boolean');
      expect(isDefault).toBe(true); // Checkerboard uses shop defaults
    });
  });

  describe('Steps Validation', () => {
    it('should have valid steps for all styles', () => {
      for (const style of BOARD_STYLES) {
        const catalog = loadStyleCatalog(style);
        
        expect(catalog.steps.length).toBeGreaterThan(0);
        
        for (const step of catalog.steps) {
          expect(step.stepNumber).toBeGreaterThan(0);
          expect(step.title).toBeTruthy();
          expect(step.description).toBeTruthy();
          expect(step.settings).toBeTypeOf('object');
          expect(step.safetyBanners).toBeInstanceOf(Array);
          
          // machineSetup and figureType may be null
          expect(
            step.machineSetup === null || typeof step.machineSetup === 'string'
          ).toBe(true);
          expect(
            step.figureType === null || typeof step.figureType === 'string'
          ).toBe(true);
        }
      }
    });
  });

  describe('Safety Banners', () => {
    it('should have safety banners in catalogs', () => {
      let totalBanners = 0;
      
      for (const style of BOARD_STYLES) {
        const catalog = loadStyleCatalog(style);
        
        for (const step of catalog.steps) {
          totalBanners += step.safetyBanners.length;
          
          // Each banner should be non-empty
          for (const banner of step.safetyBanners) {
            expect(banner).toBeTruthy();
            expect(banner.length).toBeGreaterThan(0);
          }
        }
      }
      
      // Should have many safety banners across all styles
      expect(totalBanners).toBeGreaterThan(50);
    });
  });

  describe('Angle Constraints', () => {
    it('should have angle constraints for chevron', () => {
      const catalog = loadStyleCatalog('chevron');
      expect(catalog.angles).not.toBeNull();
      expect(catalog.angles?.min_deg).toBe(20);
      expect(catalog.angles?.max_deg).toBe(60);
    });

    it('should have angle constraints for herringbone', () => {
      const catalog = loadStyleCatalog('herringbone');
      expect(catalog.angles).not.toBeNull();
      expect(catalog.angles?.min_deg).toBe(30);
      expect(catalog.angles?.max_deg).toBe(60);
    });

    it('should have null angles for styles without angle constraints', () => {
      const catalog = loadStyleCatalog('checkerboard');
      expect(catalog.angles).toBeNull();
    });
  });

  describe('Draft Information', () => {
    it('should indicate NEW DRAFT 3.0-draft3 for all styles', () => {
      for (const style of BOARD_STYLES) {
        const catalog = loadStyleCatalog(style);
        expect(catalog.draft).toContain('3.0-draft3');
        expect(catalog.draft).toContain('Board Master');
      }
    });
  });

  describe('Available Styles', () => {
    it('should return all 10 available styles', () => {
      const styles = getAvailableStyles();
      expect(styles).toHaveLength(10);
      expect(styles).toEqual(BOARD_STYLES);
    });
  });
});
