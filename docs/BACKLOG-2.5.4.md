# Backlog for Version 2.5.4

Items deferred to version 2.5.4; not required for the initial rebuild.

## High Priority

### Editor UI
- **Editor tables overflow at 390** - First priority fix; browser check should then fail on overflowing tables

### Unit System Improvements
- **Metric part names** follow unit setting
- **Hardware nominal inch + exact mm** - Format: `1" (25.4 mm)`, `3/8" (9.5 mm)`, `1/2" (12.7 mm) bit`
- **Catalog strings per unit** - Examples:
  - `take ~1/64" (0.4 mm) passes`
  - `default: 1/8" (3 mm) roundover`
  - `core box / round-nose bit 3/8–1/2" (10–12 mm)`

### Layout and Measurement
- **Layout distances rounded 0.5 mm** - Already specified but needs verification
- **Rounding by `becomes`** - Rounding by finished value logic

## Caption and Label Improvements
- **Rip-fence captions not repeating setting name** - Cleaner wording
- **Break-edges label** - "Break edges (180 grit)" exists in catalog but never printed
- **Mill plan `2C` label** - Specific labeling requirement

## New Features

### Lumber Planning
- **roughThickness** - Rough stock thickness specification
- **Board feet calculation** - Display board feet in lumber plan
- **Tight-rough-stock warning** - Alert when stock is undersized

### Board Styles
- **Face lamination** - New construction method
- **Stripe-inlay button** - UI control for stripe inlay style

### Figures and Diagrams
- **Stop-block figures** - Machine setup diagrams
- **Figures landing on page after their step** - Layout improvement to keep step text and diagrams together

## Tips and Help
- **Chevron beginner tip** - Guidance for first-time chevron builders

## Testing and Validation
- **Page-fill test gap** - Coverage gap in page layout tests
- **noTruncation test improvements:**
  - Code search for .slice/[:N]/ellipsis on display text
  - Exact-match exception list
  - None warning-related
  - Printed-text test to verify

## Code Quality
- **Lint warnings** - Clean up remaining linter warnings

## Board Visuals (visuals/ Rebuild)

When boardviz is rebuilt as `visuals/` by Board Visuals team:

- **Lamination figure** - Show lamination construction
- **Before/after previews** - Design modification comparison
- **Stop blocks** - Machine setup diagrams
- **Warning figures** - Visual representation of safety warnings
- **24" stripe counts** - Extended stripe pattern calculations
- **Scrap minimum** - Minimum usable scrap dimensions
- **Exact-match allowlist** for text-cutting rule plus printed-text test
- **Fence-label crowding check** - Prevent overlapping fence labels
- **3D renders** - Deferred 3D visualization in boardviz
- **Board feet** - Display in diagrams

## Catalog Updates

Awaiting from Board Master:
- Full step text per style
- Exact safety-banner wording
- Cut-list allowances:
  - Kerf allowances
  - Rough-to-final oversize
  - Planer minimums
  - Flattening allowance

## Notes

- Items marked "(unsure)" in source documents need clarification from domain experts
- Old test counts and hashes cannot be matched; new implementation may have different counts
- Board Master will supply fresh catalog draft labeled **new** (not 2.5.3.2) for `styles/`
