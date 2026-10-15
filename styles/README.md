# DRAFT Catalog Data

⚠️ **This folder contains DRAFT placeholder catalog data.**

The domain expert (Board Master) will provide the complete catalog with:
- Full step text per style
- Exact safety-banner wording
- Cut-list allowances (kerf, rough-to-final oversize, planer minimums, flattening allowance)
- Unit-aware catalog strings
- Hardware specifications

## Expected Catalog Format

Each board style should have a JSON file (e.g., `checkerboard.json`) with:

```json
{
  "style": "checkerboard",
  "displayName": "Checkerboard (End Grain)",
  "description": "Classic end-grain checkerboard pattern",
  "angles": null,
  "steps": [
    {
      "stepNumber": 1,
      "title": "Mill rough stock",
      "description": "Joint edges on the jointer, then plane to final thickness.",
      "settings": {
        "Planer depth": "38.1 mm (1.5\")",
        "Feed rate": "Slow"
      },
      "safetyBanners": [
        "WARNING: Keep hands away from cutterhead. Use push blocks."
      ],
      "machineSetup": "table-saw",
      "figureType": "rip-fence"
    }
  ],
  "cutListAllowances": {
    "kerf": 3.175,
    "roughToFinalOversize": 3.0,
    "planerMinimum": 2.0,
    "flatteningAllowance": 1.5
  },
  "notes": "Take ~1/64\" (0.4 mm) passes for final surfacing."
}
```

## Current Status

- ✅ Type definitions in `src/types/`
- ✅ Default configurations in `src/lib/defaults.ts`
- ⏳ Waiting for complete catalog from Board Master

## Known Catalog Strings (Unit-Aware)

These strings should follow the unit system setting:

- `take ~1/64" (0.4 mm) passes`
- `default: 1/8" (3 mm) roundover`
- `core box / round-nose bit 3/8–1/2" (10–12 mm)`

## Hardware Specs (2.5.4 Format)

Format: Nominal inch with exact mm

- Rubber feet: `1" (25.4 mm)` diameter × `3/8" (9.5 mm)` height
- Router bits: `1/2" (12.7 mm) bit`

## Board Master Notes

- Rip-fence captions should not repeat setting name
- Layout distances rounded to 0.5 mm for metric
- "Break edges (180 grit)" exists in catalog but never printed
- Every machine setting appears in full in step text (even with "+ N more settings" tag)
