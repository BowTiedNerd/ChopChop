/**
 * SVG generation utilities for step diagrams
 * Minimum font size: 11 units
 * Labels placed off drawing geometry
 * ViewBox grows to contain all elements
 */

const MIN_FONT_SIZE = 11;

export interface SvgElement {
  tag: string;
  attrs: Record<string, string | number>;
  children?: SvgElement[];
  text?: string;
}

export interface SvgDimension {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  value: string;
  id: string;
}

export interface SvgLabel {
  x: number;
  y: number;
  text: string;
  dimId?: string; // Links label to dimension line
  anchor?: 'start' | 'middle' | 'end';
}

export class SvgBuilder {
  private elements: SvgElement[] = [];
  private minX: number = 0;
  private minY: number = 0;
  private maxX: number = 800;
  private maxY: number = 600;

  constructor(width: number = 800, height: number = 600) {
    this.maxX = width;
    this.maxY = height;
  }

  /**
   * Add a rectangle
   */
  rect(x: number, y: number, width: number, height: number, attrs: Record<string, any> = {}): void {
    this.elements.push({
      tag: 'rect',
      attrs: {
        x,
        y,
        width,
        height,
        ...attrs,
      },
    });
    this.updateBounds(x, y);
    this.updateBounds(x + width, y + height);
  }

  /**
   * Add a line
   */
  line(x1: number, y1: number, x2: number, y2: number, attrs: Record<string, any> = {}): void {
    this.elements.push({
      tag: 'line',
      attrs: {
        x1,
        y1,
        x2,
        y2,
        stroke: 'black',
        'stroke-width': 1,
        ...attrs,
      },
    });
    this.updateBounds(x1, y1);
    this.updateBounds(x2, y2);
  }

  /**
   * Add a path
   */
  path(d: string, attrs: Record<string, any> = {}): void {
    this.elements.push({
      tag: 'path',
      attrs: {
        d,
        fill: 'none',
        stroke: 'black',
        'stroke-width': 1,
        ...attrs,
      },
    });
  }

  /**
   * Add text with minimum font size enforcement
   */
  text(x: number, y: number, text: string, fontSize: number = 12, attrs: Record<string, any> = {}): void {
    // Enforce minimum font size
    if (fontSize < MIN_FONT_SIZE) {
      throw new Error(`Font size ${fontSize} is below minimum ${MIN_FONT_SIZE}`);
    }

    this.elements.push({
      tag: 'text',
      attrs: {
        x,
        y,
        'font-size': fontSize,
        'font-family': 'DejaVu Sans, sans-serif',
        fill: 'black',
        ...attrs,
      },
      text,
    });
    
    // Estimate text bounds (approximate)
    const textWidth = text.length * fontSize * 0.6;
    this.updateBounds(x, y - fontSize);
    this.updateBounds(x + textWidth, y + fontSize * 0.3);
  }

  /**
   * Add dimension line with label
   * Label is linked to dimension line via data-dim-id
   */
  dimension(dim: SvgDimension): void {
    const { x1, y1, x2, y2, value, id } = dim;
    
    // Dimension line
    this.line(x1, y1, x2, y2, {
      'stroke': '#666',
      'stroke-width': 1,
      'data-dim-id': id,
    });
    
    // Extension lines
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const perpX = -dy / len * 10;
    const perpY = dx / len * 10;
    
    this.line(x1, y1, x1 + perpX, y1 + perpY, {
      'stroke': '#666',
      'stroke-width': 0.5,
      'data-dim-id': id,
    });
    this.line(x2, y2, x2 + perpX, y2 + perpY, {
      'stroke': '#666',
      'stroke-width': 0.5,
      'data-dim-id': id,
    });
    
    // Label
    const labelX = (x1 + x2) / 2;
    const labelY = (y1 + y2) / 2 - 5;
    this.text(labelX, labelY, value, 11, {
      'text-anchor': 'middle',
      'data-dim-id': id,
    });
  }

  /**
   * Add a label off drawing geometry
   */
  label(label: SvgLabel): void {
    const { x, y, text, dimId, anchor = 'start' } = label;
    
    const attrs: Record<string, any> = {
      'text-anchor': anchor,
    };
    
    if (dimId) {
      attrs['data-dim-id'] = dimId;
    }
    
    this.text(x, y, text, 11, attrs);
  }

  /**
   * Add a background shape
   * Must be added first to be behind other elements
   */
  background(x: number, y: number, width: number, height: number, fill: string): void {
    this.elements.unshift({
      tag: 'rect',
      attrs: {
        x,
        y,
        width,
        height,
        fill,
        'data-bg': '1',
      },
    });
  }

  /**
   * Add a panel with semantic role
   * Restricted to valid roles/fills
   */
  panel(role: string, x: number, y: number, width: number, height: number): void {
    const validRoles: Record<string, string> = {
      'cutlist-header': '#5B3A29',
      'cutlist-row-1': '#F3E7D3',
      'cutlist-row-2': '#FBF8F2',
      'cutlist-row-3': '#ECECEC',
      'saw-table': '#D9D9D9',
      'planer-panel': '#F1EEE8',
    };

    const invalidRoles = ['board', 'strip', 'blade', 'fence', 'stock', 'bed', 'cutterhead'];
    
    if (invalidRoles.includes(role)) {
      throw new Error(`Invalid panel role: ${role}. Cannot use data-panel on depicted parts.`);
    }
    
    if (!(role in validRoles)) {
      throw new Error(`Unknown panel role: ${role}`);
    }

    this.rect(x, y, width, height, {
      fill: validRoles[role],
      'data-panel': role,
    });
  }

  /**
   * Update bounds to grow viewBox
   */
  private updateBounds(x: number, y: number): void {
    this.minX = Math.min(this.minX, x);
    this.minY = Math.min(this.minY, y);
    this.maxX = Math.max(this.maxX, x);
    this.maxY = Math.max(this.maxY, y);
  }

  /**
   * Render SVG to string
   * ViewBox grows to contain all elements
   */
  toSVG(): string {
    // Add padding
    const padding = 20;
    const viewBoxX = this.minX - padding;
    const viewBoxY = this.minY - padding;
    const viewBoxWidth = this.maxX - this.minX + padding * 2;
    const viewBoxHeight = this.maxY - this.minY + padding * 2;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" `;
    svg += `viewBox="${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}" `;
    svg += `width="${viewBoxWidth}" height="${viewBoxHeight}">`;
    
    for (const element of this.elements) {
      svg += this.renderElement(element);
    }
    
    svg += '</svg>';
    return svg;
  }

  private renderElement(element: SvgElement): string {
    const { tag, attrs, children, text } = element;
    
    let result = `<${tag}`;
    for (const [key, value] of Object.entries(attrs)) {
      result += ` ${key}="${value}"`;
    }
    
    if (text) {
      result += `>${text}</${tag}>`;
    } else if (children && children.length > 0) {
      result += '>';
      for (const child of children) {
        result += this.renderElement(child);
      }
      result += `</${tag}>`;
    } else {
      result += '/>';
    }
    
    return result;
  }
}

/**
 * Create a scroll cue for wide figures
 * Spec: "→ scroll for more" in own strip below figure
 */
export function createScrollCue(): string {
  return `
    <div class="scroll-cue" style="
      text-align: right;
      padding: 8px;
      color: #666;
      font-size: 14px;
      display: none;
    ">
      → scroll for more
    </div>
  `;
}

/**
 * Wrap SVG in scrolling container
 * Figures render at exact viewBox size, never scaled down
 */
export function wrapInScrollContainer(svg: string): string {
  return `
    <div class="figure-container" style="position: relative;">
      <div class="figure-scroll" style="
        overflow-x: auto;
        overflow-y: hidden;
        max-width: 100%;
      ">
        ${svg}
      </div>
      ${createScrollCue()}
    </div>
  `;
}
