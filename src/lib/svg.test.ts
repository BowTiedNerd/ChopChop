import { describe, it, expect } from 'vitest';
import { SvgBuilder } from './svg';

describe('SvgBuilder', () => {
  it('should create basic SVG', () => {
    const builder = new SvgBuilder(800, 600);
    builder.rect(10, 10, 100, 50);
    
    const svg = builder.toSVG();
    expect(svg).toContain('<svg');
    expect(svg).toContain('viewBox');
    expect(svg).toContain('<rect');
  });

  it('should enforce minimum font size', () => {
    const builder = new SvgBuilder();
    
    // Should throw for font size below 11
    expect(() => {
      builder.text(10, 10, 'Test', 10);
    }).toThrow('Font size 10 is below minimum 11');
  });

  it('should allow minimum font size of 11', () => {
    const builder = new SvgBuilder();
    
    // Should not throw for font size 11
    expect(() => {
      builder.text(10, 10, 'Test', 11);
    }).not.toThrow();
  });

  it('should add dimension lines with labels', () => {
    const builder = new SvgBuilder();
    builder.dimension({
      x1: 10,
      y1: 10,
      x2: 100,
      y2: 10,
      value: '90 mm',
      id: 'dim-1',
    });
    
    const svg = builder.toSVG();
    expect(svg).toContain('data-dim-id="dim-1"');
    expect(svg).toContain('90 mm');
  });

  it('should reject invalid panel roles', () => {
    const builder = new SvgBuilder();
    
    // Should throw for depicted parts
    expect(() => {
      builder.panel('board', 0, 0, 100, 50);
    }).toThrow('Cannot use data-panel on depicted parts');
    
    expect(() => {
      builder.panel('strip', 0, 0, 100, 50);
    }).toThrow('Cannot use data-panel on depicted parts');
  });

  it('should accept valid panel roles', () => {
    const builder = new SvgBuilder();
    
    // Should not throw for valid roles
    expect(() => {
      builder.panel('cutlist-header', 0, 0, 100, 50);
    }).not.toThrow();
    
    expect(() => {
      builder.panel('saw-table', 0, 0, 100, 50);
    }).not.toThrow();
  });

  it('should grow viewBox to contain all elements', () => {
    const builder = new SvgBuilder(100, 100);
    builder.rect(200, 200, 50, 50); // Outside initial bounds
    
    const svg = builder.toSVG();
    
    // ViewBox should expand to contain the rect
    expect(svg).toContain('viewBox');
    const viewBoxMatch = svg.match(/viewBox="([^"]+)"/);
    expect(viewBoxMatch).toBeTruthy();
    
    if (viewBoxMatch) {
      const values = viewBoxMatch[1].split(' ').map(Number);
      const width = values[2]; // width is the third value
      const height = values[3]; // height is the fourth value
      expect(width).toBeGreaterThan(200);
      expect(height).toBeGreaterThan(200);
    }
  });

  it('should link dimension labels to dimension lines', () => {
    const builder = new SvgBuilder();
    
    builder.label({
      x: 50,
      y: 50,
      text: 'Test Label',
      dimId: 'dim-1',
    });
    
    const svg = builder.toSVG();
    expect(svg).toContain('data-dim-id="dim-1"');
  });
});
