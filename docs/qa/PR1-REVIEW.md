# Board QA verifier: PR #1 (head caa6b79), code-level ACCEPTANCE pass
Access: git clone failed (no credentials). I rebuilt the tree from the cursor-github connector (all text files; sample PDFs regenerated locally) and ran it.

## Real run results (contradict PR claims)
- npm ci: OK. Tests: 66 passed, but the 9 browser tests "pass" by skipping (console.warn + return).
- typecheck: FAIL. src/lib/browserCheck.test.ts:56 `page.waitForTimeout` does not exist (puppeteer 23).
- build: FAIL (same error, because build runs tsc).
- lint: FAIL. 16 warnings with --max-warnings 0.
- PDFs: Helvetica Type1, not embedded (all 14 base fonts listed). Smallest text is 8pt (footer, on the last page only, pdf.ts:74).

## Fix-off experiments (scratch copy; 57 non-browser tests)
| Fix turned off | Tests fail? |
|---|---|
| E1 `.slice(0,20)+"…"` on safety banner text | NO, 57 pass |
| E2 print only the first banner | NO |
| E3 figure label at font 10 (stepFigures) | NO (no test renders figures) |
| E4 RIP FENCE label moved onto blade | NO |
| E5 `transform=scale(0.5)` on dim label (5.5 px drawn) | NO |
| E6 remove 11-unit throw in svg.ts:105 | YES, 2 fail (the only rule with a working test) |
| E7 figures scaled to 0.1 in PDF | NO |
| E8 footer at 5pt | NO |
FIX-OFF-EVIDENCE.md claims evidence for all 9 rules. Only rule 1's font throw holds up.

## BLOCKERS (code-level)
1. S9/build: typecheck, build and lint are red (browserCheck.test.ts:56, plus lint warnings). Fix: use `await new Promise(r=>setTimeout(r,ms))` and clear the warnings.
2. S5: browser checks skip without a server and count as passes (browserCheck.test.ts:59,75,94,113). Fix: start vite preview in globalSetup and fail hard if the page doesn't load. Add the 4 designs (checkerboard, chevron, brick, metric) and the 2 scroll-cue cases (natural overflow at 390, forced narrow column).
3. S1: PDF figures are scaled to fit (pdf.ts:346 `Math.min(1, maxWidth/svgWidth)`; maxWidth is mm compared against px). 11-unit text drops far below 8pt. There's no PDF min-size test (E7/E8).
4. S1: there's no drawn-size (CTM) test in the suite. check-svg-text.mjs exists but isn't run by any test (E5).
5. S2: there's no truncation scan test and no exact-match exception list. Live cuts: stepFigures.ts:169/187 (8-strip cap + "... N more strips"), CustomDesigner.tsx:298/304 (`steps.slice(0,3)` + "... and N more steps"). Tests compare hardcoded literals to themselves (acceptance.test.ts:43-66, 227-249), not printed text against sources.
6. S3: the banner "no cap" test is a tautology (acceptance.test.ts:87-100). The setting-cap test only checks a string literal (:70-85). Nothing checks that every setting appears in the step text (sample "Blade height 40 mm" is hidden by the cap and missing from the text).
7. S4: no overlap test using real shapes. data-panel only rejects 7 literal role names (svg.ts:218), so a new role name bypasses it, and 'planer-panel' fills the planer bed. The "Stock" label sits on the stock rect (stepFigures.ts:258).
8. S7: validateStyle angle check is an empty placeholder (validation.ts:68-72), so validateBoard never refuses chevron 19°. There are no tests for refusal (non-zero exit, no files written), gapped chevron, concurrent exports (compareExports unused), low-angle chevron width (PROBE_INSET unused), or sweeps through full validation. The undefined-folder test exists, but nothing calls validateOutputFolder in the export path (generate-samples.ts uses a const).
9. S8: there's no boardviz or agreement.json, and the rule 8 test is `expect(true)`.

## Placeholder tests (expect(true).toBe(true))
acceptance.test.ts:27-32 (no scaling), 145-150 (viewports), 204-209 (boardviz), 212-224 (proof x2).

## Missing-tests list for Board App Dev (before rebuild-rc1)
1. PDF: every text run ≥8pt on every page; figures are never scaled below 1.
2. SVG: drawn size ≥10.67 px via the CTM in jsdom/browser, for every figure generator.
3. Truncation: a source scan (.slice/substring/[:N]/…/"...") with an exact-code allowlist, plus a test that the allowlist has no warning/banner/cutDanger entries; printed PDF text compared against catalog strings.
4. Banners: N banners in, N printed on the same page as their figure.
5. Settings: tags cap at 2 + "+ N more settings, see step text", and every setting value appears in the step text.
6. Other caps: each one prints a "+ N more" note (no "...").
7. Overlap: isPointInFill/isPointInStroke on every label vs geometry; dim-label exemption matched by data-dim-id; viewBox contains all labels.
8. data-panel: allowlist only (reject unknown roles); test that it never sits on depicted parts.
9. Browser: fails when there's no server; 3 viewports × 4 designs; scroll cue (overflow at 390, forced narrow column, hidden at scroll end, hidden in print).
10. Refusal: chevron 19° and gapped chevron exit non-zero and write no files.
11. Concurrent exports are identical apart from timestamps.
12. Export path rejects an undefined output folder (integration, not just the unit).
13. Low-angle chevron is not 1.5" wide (probe-inset regression).
14. Sweeps run through full validation with counts explained.
15. boardviz agreement.json equality; sim errors are fatal.
16. CI: typecheck + build + lint must be green.

## Passed
11-unit throw in SvgBuilder.text (with a working test); inchText ≈-only-on-inexact for 0.75/0.5/1.0/1.663; angle ranges in validateAngle; stripe count uses 2×kerf; footer and prices note at 8pt.

## Not checked
Live browser run (no server/Chrome run); concurrency/refusal behaviour (no code path exists); committed sample PDFs (binary, not fetched).
