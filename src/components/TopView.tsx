import { useEffect, useRef } from 'react';
import { BoardDesign } from '../types';
import { SvgBuilder, wrapInScrollContainer } from '../lib/svg';
import { formatDimension } from '../utils/format';
import { generatePattern } from '../lib/patterns';

interface TopViewProps {
  design: BoardDesign;
}

export function TopView({ design }: TopViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const svg = generateTopViewSvg(design);
    containerRef.current.innerHTML = svg;

    // Set up scroll cue behavior
    const scrollElement = containerRef.current.querySelector('.figure-scroll') as HTMLElement;
    const cueElement = containerRef.current.querySelector('.scroll-cue') as HTMLElement;

    if (scrollElement && cueElement) {
      const checkScroll = () => {
        const needsScroll = scrollElement.scrollWidth > scrollElement.clientWidth;
        const isAtEnd = scrollElement.scrollLeft + scrollElement.clientWidth >= scrollElement.scrollWidth - 5;

        if (needsScroll && !isAtEnd) {
          cueElement.classList.add('visible');
        } else {
          cueElement.classList.remove('visible');
        }
      };

      checkScroll();
      scrollElement.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);

      return () => {
        scrollElement.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [design]);

  return <div ref={containerRef} />;
}

function generateTopViewSvg(design: BoardDesign): string {
  const { width, length } = design.dimensions;
  const scale = 1; // 1 mm = 1 unit
  
  const svgWidth = width * scale + 220; // room for the length label right of the board
  const svgHeight = length * scale + 100;
  
  const builder = new SvgBuilder(svgWidth, svgHeight);

  // Generate pattern
  const pattern = generatePattern(design);
  
  const boardX = 50;
  const boardY = 50;
  
  // Draw each strip in the pattern
  for (const strip of pattern.strips) {
    const x = boardX + strip.x * scale;
    const y = boardY + strip.z * scale; // z maps to y in top view
    const w = strip.width * scale;
    const h = strip.depth * scale; // depth maps to height in top view
    
    builder.rect(x, y, w, h, {
      fill: strip.species.color,
      stroke: '#666',
      'stroke-width': 0.5,
      transform: strip.rotation !== 0 ? `rotate(${strip.rotation * 180 / Math.PI} ${x + w/2} ${y + h/2})` : undefined,
    });
  }
  
  // Draw board outline
  builder.rect(boardX, boardY, width * scale, length * scale, {
    fill: 'none',
    stroke: '#333',
    'stroke-width': 2,
  });

  // Draw juice groove if enabled
  if (design.juiceGroove.enabled) {
    const { width: grooveWidth, fromEdge, cornerRadius } = design.juiceGroove;
    const grooveX = boardX + fromEdge * scale;
    const grooveY = boardY + fromEdge * scale;
    const grooveW = (width - fromEdge * 2) * scale;
    const grooveH = (length - fromEdge * 2) * scale;
    const radius = cornerRadius * scale;

    builder.rect(grooveX, grooveY, grooveW, grooveH, {
      fill: 'none',
      stroke: '#666',
      'stroke-width': grooveWidth * scale,
      rx: radius,
      ry: radius,
    });
  }

  // Draw rubber feet if enabled
  if (design.rubberFeet.enabled) {
    const { diameter, inset } = design.rubberFeet;
    const radius = diameter * scale / 2;
    const positions = [
      [boardX + inset * scale, boardY + inset * scale],
      [boardX + (width - inset) * scale, boardY + inset * scale],
      [boardX + inset * scale, boardY + (length - inset) * scale],
      [boardX + (width - inset) * scale, boardY + (length - inset) * scale],
    ];

    for (const [x, y] of positions) {
      builder.rect(x - radius, y - radius, diameter * scale, diameter * scale, {
        fill: '#333',
        opacity: 0.3,
        rx: radius,
        ry: radius,
      });
    }
  }

  // Add dimension labels
  const unit = design.unitSystem;
  
  // Width dimension
  builder.dimension({
    x1: boardX,
    y1: boardY - 20,
    x2: boardX + width * scale,
    y2: boardY - 20,
    value: formatDimension(width, unit),
    id: 'dim-width',
  });

  // Length dimension
  builder.dimension({
    x1: boardX + width * scale + 20,
    y1: boardY,
    x2: boardX + width * scale + 20,
    y2: boardY + length * scale,
    value: formatDimension(length, unit),
    id: 'dim-length',
  });

  const svg = builder.toSVG();
  return wrapInScrollContainer(svg);
}
