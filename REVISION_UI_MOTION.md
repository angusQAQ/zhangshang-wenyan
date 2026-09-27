# REVISION — UI Motion（Emil Kowalski + Apple）

**Scope:** CSS/JS chrome motion & press feedback only. No passage content / game scope changes. R2.4 untouched（解釋前原文零色標）.

**Brand:** white edu UI · olive `#7A8F6A` unchanged.

## Audit findings → fixes

| Before | After | Why |
|--------|-------|-----|
| No `--ease-out` / motion tokens | `:root { --ease-out: cubic-bezier(0.23,1,0.32,1); --motion-*: 120–240ms }` in `app.css` + `ui-motion.css` | Shared ease-out; durations &lt;300ms |
| Many chrome `:active` = opacity only (or `scale(0.985)` / `0.99` with **no** transition) | Buttons / `.list-row` / `.tab` / chips / cards → `:active { transform: scale(0.97) }` + `transition: transform, opacity` only | Press feedback; never `scale(0)`; no `transition: all` |
| `.list-row:active` background only | Keep instant bg; add `scale(0.97)` | Layout color can snap; motion stays transform |
| Word sheet open/close = instant `hidden` / `display:none` | JS toggles `.is-open`; panel `scale(0.96)→1` + opacity, `transform-origin: bottom center`, 240ms ease-out; mask opacity | Sheet enter ≤250ms; transform/opacity only |
| Tab selection: color/opacity snap, no transition | `.tab` / `.tab img` ≤180ms color/opacity (+ transform for press) | Selection feedback without layout churn |
| Toast / `slideIn` used generic `ease` | `var(--ease-out)` | Deceleration matches Apple/Emil |
| Knowledge hotspots: `transition` on **box-shadow** / **background** | `transition: none` in `app.css`; motion via transform/opacity in `ui-motion.css` | Avoid non-compositor props |
| No `@media (prefers-reduced-motion: reduce)` | Shorten to ~1–80ms; kill press/sheet/hover **movement**; keep opacity | a11y |
| No hover gate | Hover lifts / opacity only under `(hover: hover) and (pointer: fine)`; touch keeps press scale | Avoid sticky hover on touch |
| `transition: all` / `ease-in` / `scale(0)` / UI &gt;300ms | **Not found** (confirmed) | Already clean; keep that way |

## Files

| File | Change |
|------|--------|
| `css/ui-motion.css` | **New** — motion system + press + sheet + reduced-motion + hover gate |
| `css/app.css` | `--ease-out`; toast/slideIn ease-out; drop box-shadow/background transitions |
| `js/app.js` | `openWordSheet` / `hideWordSheet` `.is-open` + rAF enter / delayed hide |
| `index.html` | Link `css/ui-motion.css?v=r2112`; bump `app.css` cache |

## Verdict

**PASS** — interactive chrome now has press scale, ease-out ≤240ms, transform/opacity-first motion, reduced-motion + hover gating. Word sheet enter anim wired. R2.4 passage color marks untouched.

## Remaining for GIDEON (optional)

- Visual QA on device: sheet close timing vs fast re-open; tabbar during quiz hide.
- Consider unifying leftover instant `:active { opacity }` rules in `app.css` (harmless; overridden by `ui-motion.css`).
- Do **not** animate `.hl` / explain-off passage text.
