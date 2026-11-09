---
name: Wayseeker
description: A dispensary for creative work — every tool filed in a labelled drawer against the habit it replaces.
colors:
  paper: "#e8ebe3"
  paper-hi: "#f5f5ef"
  ink: "#16201b"
  ink-2: "#4a564f"
  seal: "#b8321d"
  lacquer: "#1b3a31"
  lacquer-deep: "#142d26"
  lacquer-ink: "#e9eadf"
  lacquer-ink-2: "#a9b9ae"
  brass: "#c9a35a"
  dark-paper: "#0d1714"
  dark-paper-hi: "#16201b"
  dark-ink: "#e4e6dc"
  dark-ink-2: "#a3ada5"
  dark-seal: "#e66a4e"
  dark-lacquer: "#163027"
typography:
  display:
    fontFamily: "Archivo (wdth 68), Noto Serif SC, Songti SC, serif"
    fontWeight: 800
    lineHeight: 0.95
    textTransform: uppercase
  body:
    fontFamily: "Archivo, PingFang SC, sans-serif"
    fontSize: "1rem"
    lineHeight: 1.6
  caps:
    fontFamily: "Archivo (wdth 85)"
    fontSize: "0.75rem"
    fontWeight: 600
    letterSpacing: "0.08em"
  code:
    fontFamily: "Fragment Mono"
    fontSize: "0.75rem"
  control:
    fontSize: "0.875rem"
    fontWeight: 650
    letterSpacing: "0.04em"
  body-small:
    fontSize: "0.9375rem"
    lineHeight: 1.5
  lead:
    fontSize: "1.0625rem"
  column-question:
    fontSize: "0.8125rem"
    lineHeight: 1.35
  drawer-code:
    fontSize: "0.6875rem"
  hero:
    fontSize: "clamp(2.9rem, 7vw, 6rem)"
  hero-zh:
    fontSize: "clamp(2.6rem, 6vw, 5rem)"
  cabinet-heading:
    fontSize: "clamp(3rem, 8vw, 7rem)"
  prescription-heading:
    fontSize: "clamp(2.75rem, 6.5vw, 5.5rem)"
  label-heading:
    fontSize: "clamp(3rem, 7vw, 5.5rem)"
rounded:
  slip: "2px"
  control: "3px"
  cabinet: "4px"
  pill: "999px"
  seal: "6px"
  ink-bloom: "12px"
  circle: "50%"
---

**English** · [简体中文](DESIGN.zh-CN.md)

# Design System: Wayseeker

## North star: "The dispensary"

Wayseeker is an apothecary cabinet (百子柜) for creative work. Every tool is a drawer, coded by column and row; every drawer carries a paper label that says when to use it, the habit it replaces, and the caution. The site opens on the habits, not the tools: a visitor recognises what they are settling for, sees it struck out in seal red, and reads the label that answers it.

Content drives every structure:

- **Columns = workflow stages.** A–E are the five stages in `workflow.ts`. A drawer code like `C4` means stage C, fourth on that route. Codes are derived in `src/lib/drawers.ts`, never hand-written.
- **Labels = curator notes.** The three moves parsed by `curator-note.ts` become three ruled rows: For / Replaces / Caution.
- **Habits = the "Replaces" move.** `habitOf()` turns it into a running phrase for the first viewport.
- **Prescription = the plan generator.** One drawer per column, a seal pressed when written, exportable as Markdown.

## Colour

Two materials, one signal.

- **Rice paper** (`paper`, `paper-hi`) carries reading: the habit field, the dispensed slip, the prescription, label pages.
- **Green lacquer** (`lacquer`, `lacquer-deep`) carries the cabinet: the counter tray, the cabinet section, shelves, footer. Lacquer regions own whole bands of the page; they are never a small accent.
- **Brass** (`brass`) marks hardware: label frames, drawer pulls, column letters, the visit button and keyboard focus on lacquer.
- **Seal red** (`seal`) has exactly two jobs: striking a habit out, and the stamp/anchor on the prescription (plus the caution label and keyboard focus on paper). Never decorative fills.

Dark mode keeps the same materials at night: paper becomes deep green-black, the seal brightens to `#e66a4e` for contrast. All text pairs meet WCAG AA (body ≥ 4.5:1; measured in the build).

## Typography

- **Display:** Archivo at width 68, weight 800, uppercase — the voice of stencilled drawer labels. Chinese display falls to Noto Serif SC / Songti at 700, sentence case.
- **Body and controls:** Archivo at normal width.
- **Caps:** Archivo width 85, 600, tracked 0.08em — label row names, stage tabs, buttons.
- **Code:** Fragment Mono — drawer codes, prescription numbers, domains. Data only, never decoration.

### Applied size hierarchy

The values above describe the existing CSS; role names in this document do not imply matching CSS custom properties. The implementation source is [globals.css](src/app/globals.css). This is an optical hierarchy with fluid display sizes, rather than a single mathematical ratio. Reuse the component role before adding a size.

| Role / current selector | Size | Reading purpose |
| --- | --- | --- |
| Body / large label rows | 1rem; body line-height 1.6 | Default continuous reading and detailed curator notes |
| Small prose / slip description, label rows | body-small | Compact explanatory text; prescription basis uses the same size at 1.6 line-height and replacement text at 1.45 |
| Leads / hero, prescription, big-label description | lead | Introduce a section without competing with its heading |
| Buttons / notices, copy status, recovery hints, result count | 0.875rem | Actions and short feedback; buttons use control weight and tracking, explanatory text does not |
| Caps / code / tags | 0.75rem | Label names and metadata; Chinese caps use 0.8125rem and 0.04em tracking |
| Column question | column-question | Short contextual question below a column title |
| Drawer code / narrow stage caps | 0.6875rem | Secondary locator, never the only accessible name of a control |
| Hero / cabinet / prescription / detail heading | hero, cabinet-heading, prescription-heading, label-heading | Distinguish entry, browsing, generation and detailed reading; Chinese hero uses hero-zh |
| Habit list | clamp(1.2rem, 1.9vw, 1.7rem), line-height 1.22 | Scan familiar habits; Chinese uses clamp(1.1rem, 1.6vw, 1.45rem) and 1.5 |
| Counter tool / prescription tool | clamp(1.9rem, 3vw, 2.5rem) / clamp(1.35rem, 2.2vw, 1.75rem) | Keep selected and generated tool names legible within their different available widths |
| Plan title / insert title / related shelf | clamp(1.5rem, 2.6vw, 2.1rem) / clamp(2rem, 4vw, 3rem) / clamp(1.75rem, 3.5vw, 2.5rem) | Subordinate headings within the existing composition |
| Legal / 404 title | clamp(2.5rem, 6vw, 4rem), line-height 1 | Recovery and document titles without the homepage hero scale |

Component-specific lettering stays local: wordmark 1.25rem (footer 2.5rem), drawer name 0.95rem at 1.1 line-height, column letter 3.25rem at 0.85, Rx mark 4rem at 0.8, seal 1.55rem at 1. These are marks or short labels, not paragraph sizes. Habit locator text is 0.42em of its phrase; keyboard-key hints are 0.7rem. Do not promote these exceptions into new body-text variants.

Chinese display uses its 1.12 line-height to fit glyphs; do not apply the English 0.95 line-height to Chinese prose. Use real content, 320px layouts, both languages and enlarged text to judge a new use. A detector's undeclared-size warning alone is not a reason to flatten this hierarchy.

## Elevation & Depth

Depth explains the physical relationship between paper, lacquer, glass and hardware. It is not a general card-elevation scale. Shared shadows are CSS custom properties; inset material edges remain local to their components.

| Existing token / material | Exact value or construction | Use |
| --- | --- | --- |
| --shadow-slip (light) | 0 1px 1px rgb(8 18 14 / 0.1), 0 18px 40px -18px rgb(8 18 14 / 0.45) | Paper emerging from its tray: counter slip, prescription paper and big detail label |
| --shadow-slip (dark override) | 0 1px 1px rgb(0 0 0 / 0.4), 0 18px 40px -18px rgb(0 0 0 / 0.8) | Same paper relationship against night materials |
| --shadow-lift | 0 2px 2px rgb(0 0 0 / 0.18), 0 14px 26px -12px rgb(0 0 0 / 0.55) | Current drawer lifts from the cabinet; shared across themes |
| Counter tray / desktop cabinet frame | Top inset highlight plus 0 24px 48px -28px rgb(8 18 14 / 0.6) / 0 30px 60px -30px rgb(0 0 0 / 0.6) | Support the larger lacquer material, not every content block |
| Counter slot / search recess | inset 0 3px 8px rgb(0 0 0 / 0.35) / inset 0 2px 6px rgb(0 0 0 / 0.3) | Recesses cut into lacquer |
| Drawer glass / label / pull | Local inset bevels; brass label ring 2px; selected label adds seal ring 4px | Identify glazing, label hardware and selection rather than ambient elevation |
| Hover preview | Paper ring 4px, brass ring 6px, 0 30px 50px -20px rgb(8 18 14 / 0.55) | Temporary pointer preview; no extra content or persistent overlay |

The brass button's inset bottom edge and the drawer's top/bottom edges convey hardware. Preserve their state-specific treatment rather than replacing every shadow with one token. Focus remains a distinct 2px outline with 3px offset; decorative depth must not substitute for it. Reduced motion keeps static material and selected states visible.

## Shapes

The base silhouette is nearly square. Rounded values in front matter describe existing uses; they are documentation tokens, while CSS currently declares their values at component level.

| Token | Existing use | Reason |
| --- | --- | --- |
| slip (2px) | Paper slips, big detail label, screenshot windows, drawer label and default focus corners | Crisp cut paper and fine hardware |
| control (3px) | Buttons, preference buttons, stage/search controls, recovery textarea, drawer face, counter slot, hover preview | Small tactile rounding shared by actions and lacquer joinery |
| cabinet (4px) | Counter, desktop cabinet frame, detail screenshot tray, related shelf | Slightly softened outer support material |
| pill (999px) | Tags and brass drawer pull | Tag grouping or narrow hardware; not the default button shape |
| seal (6px) | The stamped two-character seal | Dedicated stamp geometry |
| ink-bloom (12px) | The seal's noninteractive bloom pseudo-element | Animation-only shape, clipped within prescription paper |
| circle (50%) | Circular icon button and prescription stage letter | Circular effect or stage marker; not a new container radius |

Screenshot windows clip their contents; image bevels inherit their parent's radius. The prescription uses a perforated mask rather than a rounded-card silhouette. New controls use the existing control geometry; larger radii need a material or interaction reason. Do not change the seal or bloom just to remove radius advisories.

## Components

- **Habit field** (`Dispensary`): every habit as a button, separated by slashes inside the button so no line starts with one. The current habit gets a seal strike drawn left to right (background-size transition) and its drawer code in seal red. Stage controls filter the list, with an explicit All stages reset. Below 1024px, show the first three habits and the current habit, with a button to expand the full list.
- **Counter**: a lacquer tray, sticky on desktop. The slip slides up out of the slot on every change (`slip-out`, 620ms expo-out). Within the exploration region, keys move ←/→ within a column, ↑/↓ across columns, Home/End; cabinet and prescription controls keep native keyboard behavior. Choosing a cabinet drawer moves focus to its counter. On narrow screens, the tool title and domain stack.
- **Navigation and search**: keep Find a tool and Make a plan visible on phones as a second header row, with 44px targets. Search removes non-matching drawers and empty columns; clearing an empty result restores all drawers and returns focus to search.
- **Drawer front** (`DrawerFront`): lacquer face, mono code, a glazed window showing the real tool screenshot (no tint), paper label framed by a 2px brass ring, brass pull. Current drawer lifts and gains a seal ring. Empty slots keep the cabinet rectangular on desktop and are hidden on phones.
- **Label rows** (`LabelRows`): 1px ink rule on top, hairline rules between rows, Replaces struck through, Caution in seal.
- **Prescription slip**: perforated top edge (CSS mask), Rx mark, plan number = seed, five lettered lines with "instead of ~~habit~~", a two-character seal 寻路 pressed on write.
- **Label page** (`/t/[id]`): the big label (brass inset frame), the screenshot on a lacquer tray, and the same-column shelf. Detail visits carry a validated homepage return address, preserving the selected tool, search, stage, prescription and swapped lines through related tools.
- **Copy feedback**: announce successful copy, image download and errors explicitly. If text copying is denied, show the exact payload in a labelled, selected read-only field. Image feedback follows the actual copied or downloaded result.

## Interaction behavior

- A secondary counter action builds a prescription around the selected tool. Suggestions explain related directions; a pick without shared tags is labelled as independent. Existing seed-only links keep their original choices; explicit starting tools travel in shared links and exported Markdown.
- Rewriting or building over a prescription offers one-level restore, including its number, swaps and starting tool. It remains available until leaving or reloading the page. The generated heading receives focus and scrolls below the sticky navigation.
- Section navigation preserves the live homepage query. Detail-page section links keep the validated return context. Moving between homepage sections or using Back within the same prescription retains its undo.
- The counter has a separate concise live status for tool and stage changes. Interactive links and the full label are outside that live region.
- Missing previews show a localized explanation and retain their accessible image label. Decorative drawer previews remain decorative. Image exports wait for the page's real font families and glyphs before measuring, and fall back if fonts fail.
- Privacy and terms use the same bilingual language preference as the app; their original policy date and facts remain intact. On 404 pages, technical resources sit behind native disclosure after the main recovery action.
- Reduced motion uses explicit static states for labels, strikes, selection and the seal. The hover preview stops requesting frames at rest and when reduced motion is enabled.
- Text and image copying share a busy lock on each surface. A still-pending native copy gets an explanation and an explicit manual-text action after eight seconds; waiting alone never steals focus or reports a false failure. Changed context suppresses stale feedback and downloads.
- Font preparation for image export is bounded to two seconds, then uses a fixed local stack. The selected manual-copy field scrolls fully into view below the sticky header. Ink animations stay within the prescription paper.
- Home navigation and browser history restore the corresponding visible state. Searches use the same 200-character limit in the field and URL; Escape does not clear an active IME composition.

## Motion and material effects

One grammar: exponential ease-out (`cubic-bezier(0.16, 1, 0.3, 1)`). Every effect is a property of a cabinet material, not decoration:

- **Paper:** title words rise out of the page (staggered, blurred in); the slip slides out of the slot, its screenshot develops in from a blur, its rows land in sequence and the habit is struck through live.
- **Lacquer:** a soft specular sheen follows the pointer across the counter tray and cabinet face (`pointer-fx.ts` writes `--mx/--my`; no React renders).
- **Glass and brass:** drawers tilt toward the pointer like hinged fronts, a glint band crosses the window, the brass pull catches light; the chosen drawer's seal ring pulses once.
- **Peek:** hovering a habit floats the remedy's screenshot beside the cursor (eased rAF trail, placed above the phrase so it stays readable).
- **Ink:** below-fold sections settle in once; cabinet drawers open in a diagonal wave; prescription lines are written in order; the seal leaves an ink bloom; ink and brass buttons carry a sweep of light.

Content is visible by default. Pointer effects are off on touch; `prefers-reduced-motion` turns all of it off.

## Don'ts

- Don't put tools in a card grid; every listing of tools is drawers or label rows.
- Don't use seal red for anything but strikes, stamps, caution and focus.
- Don't lay texture or tint over tool screenshots.
- Don't hand-number drawers; codes come from workflow order.
- Don't add eyebrow labels above headings.


## Loading and text reflow

Font variables live on the root element so root typography tokens resolve correctly. Archivo and Fragment Mono load on demand. Noto Serif SC uses one variable face and activates after hydration; Chinese display uses the documented local serif stack until it is available. Without JavaScript, that local fallback remains. Server rendering negotiates English or Chinese from the explicit language cookie and then the request header. A legacy localStorage-only preference migrates once after hydration.

Containers adapt to available inline space as text grows: label rows and prescription actions stack, long names and controls wrap, and inline padding stays bounded by the viewport. The header measures its actual height for sticky offsets; once it exceeds 45% of the viewport height it scrolls with the document. Forced-colors mode uses an underline, a strike and a system-color outline to retain stage, habit and drawer selection. Root-text enlargement and browser zoom are separate checks.
