# ChopChop Cutting Board Designer

A web application for designing custom cutting boards with automated cut lists, step-by-step instructions, and 3D visualization.

## Features

- **10 Board Styles**: Checkerboard, chevron, herringbone, brick basketweave, tumbling block 3D, and more
- **Design Editor**: Interactive visual editor with real-time preview
- **SVG Top View**: Dimension-labeled top-view preview with automatic sizing
- **3D Visualization**: Realistic 3D rendering using three.js with wood textures
- **Unit Support**: Toggle between imperial (inches with fractions) and metric (mm)
- **Modifiers**: Juice groove, handles, rubber feet
- **PDF Export**: Generate detailed cut sheets with:
  - Complete cut list
  - Step-by-step instructions
  - Safety banners
  - Machine settings
  - Step diagrams
- **Validation**: Comprehensive design validation with angle constraints and geometry checks
- **Lumber Planner**: Optimize cutting from your own stock

## Installation

```bash
npm install
```

## Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Building

Build for production:

```bash
npm run build
```

## Testing

Run the test suite:

```bash
npm test
```

Run tests once:

```bash
npm run test:run
```

Type checking:

```bash
npm run typecheck
```

## Browser Checking

Check SVG text sizing and placement across multiple viewports:

```bash
npm run check-browser http://localhost:5173
```

This validates:
- Text drawn size (minimum 10.67 px)
- Label placement (no overlaps with geometry)
- Scroll cue behavior
- Multiple viewports (1280x800, 768x1024, 390x844)

## Project Structure

```
chopchop/
├── docs/               # Specification and acceptance criteria
│   ├── SPEC.md
│   ├── ACCEPTANCE.md
│   ├── SHOP-TEST.md
│   └── BACKLOG-2.5.4.md
├── src/
│   ├── components/     # React components
│   ├── lib/           # Core libraries (PDF, SVG, validation)
│   ├── types/         # TypeScript type definitions
│   ├── utils/         # Utility functions (formatting, etc.)
│   ├── App.tsx        # Main application component
│   └── main.tsx       # Entry point
├── styles/            # Board style catalog (DRAFT - pending domain expert)
├── samples/           # Generated sample PDFs
├── scripts/           # Browser check and validation scripts
└── package.json
```

## Unit Formatting

### Imperial (Inches)
- Format: 3 decimals + fraction in brackets
- Approximate symbol (≈) only for inexact fractions
- Examples:
  - `0.750" (3/4")` - exact, no ≈
  - `1.663" (≈1 21/32")` - inexact, with ≈

### Metric (Millimeters)
- Layout distances rounded to 0.5 mm
- Hardware: nominal inch with exact mm
  - Example: `1" (25.4 mm) × 3/8" (9.5 mm)`

## Design Validation

### Angle Constraints
- **Chevron**: 20° - 60°
- **Herringbone**: 30° - 60°

### Stripe Counting
- Includes 2× kerf width
- Does not subtract tolerance

### Output Rules
- Undefined output folder throws error
- Concurrent exports identical except timestamps
- Refused designs exit non-zero with no output

## PDF Generation

### Text Size Requirements
- Minimum PDF text: 8 pt (footers, notes)
- Safety banners: 11 pt font, 14 pt line height
- No text truncation - long text wraps, frame grows

### Safety Banners
- Every banner on its own figure
- No cap on banner count
- Out of space → frame grows or banner moves to next page

### Setting Tags
- Cap at 2 visible + "+ N more settings, see step text"
- All settings appear in full in step description

## Known Labels

The application generates these specific labels as specified:

**Metric Groove:**
```
Perimeter loop, 12.5 mm wide × 5 mm deep, 19 mm from the edge, 
corner radius 25.5 mm, top face.
```

**Metric Feet:**
```
4 rubber feet, 25.5 mm diameter × 9.5 mm high, 
foot centres 32 mm in from the edges (underside).
```

**16×24 Groove:**
```
Perimeter loop, 0.500" (1/2") wide × 0.188" (3/16") deep, 
0.750" (3/4") from the edge, corner radius 1.000" (1"), top face.
```

## Board Styles

1. **Brick Basketweave** - Interlocking brick pattern
2. **Checkerboard (End Grain)** - Classic checkerboard, default 12x? and 16x24
3. **Chevron** - V-shaped pattern (20-60° angles)
4. **Edge Grain** - Edge grain orientation
5. **End Grain** - End grain orientation
6. **Face Grain** - Face grain orientation
7. **Herringbone** - Herringbone pattern (30-60° angles)
8. **Scrap Chaotic** - Random scrap arrangement
9. **Stripe Inlay** - Striped inlay pattern
10. **Tumbling Block 3D** - 3D illusion pattern

## Notes

- **Prices**: The app never invents prices; `pricePerBF` stays `null`
  - Display note: "Prices are your own entries"
- **Catalog Data**: Current catalog in `styles/` is DRAFT, pending domain expert
- **DejaVu Font**: PDF generation uses embedded DejaVu Sans font
- **Validation**: All designs go through full validation before export
- **Figure Sizing**: SVG figures render at exact viewBox size, never scaled down
  - Wide figures scroll sideways with "→ scroll for more" cue

## Documentation

See `docs/` for complete specification and acceptance criteria:
- **SPEC.md** - Full feature specification
- **ACCEPTANCE.md** - QA pass criteria (the bar for this rebuild)
- **SHOP-TEST.md** - Woodworker checklist for manual validation
- **BACKLOG-2.5.4.md** - Features deferred to version 2.5.4

## Version

Current version: 2.5.3.2 (rebuild)

## License

Private project
