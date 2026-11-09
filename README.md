**English** · [简体中文](README.zh-CN.md)

# Wayseeker

A bilingual (English / 中文) field guide to design, code and creative tools, organised by the work you are actually doing. Next.js 16 App Router + React 19 + Tailwind v4. All tool facts and curator notes live in `src/data/tools.ts`; the task paths live in `src/data/workflow.ts`.

Wayseeker is an apothecary cabinet for creative work. The home page opens on 29 habits makers settle for; each one is filed beside a labelled drawer whose label says when to use the tool, what it replaces and what to watch for. Five columns follow the work — find a direction → build a visual language → make it move → study the real thing → finish and share — and the page ends by writing a five-line prescription you can copy as Markdown for your agent.

<p align="center">
  <img src="docs/images/home.png" width="880" alt="Wayseeker: the habit field beside the dispensed drawer label">
</p>

The site opens in English with a header switch to Chinese; the choice persists per
visitor. Strings live in `public/locales/{en,zh}/common.json`.

Production runs at [wayseeker.vercel.app](https://wayseeker.vercel.app). The canonical origin is configured in `src/lib/site.ts` and must match where the site is actually deployed.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Dev server on port 4000 |
| `pnpm build` | Production build |
| `pnpm start` | Production server (`next start`, default port 3000) |
| `pnpm check` | Full gate: biome → tsc → build → node:test, identical to CI |
| `pnpm lint:fix` | Biome autofix |
| `pnpm typecheck` | `tsc --noEmit` |

Tests use Node's built-in runner (`node --experimental-strip-types --test`), colocated with the code they cover. A workflow contract test asserts every tool belongs to exactly one route.

## Explorer state and browser regression

Shared links carry both `seed` and `tool`, restoring the random route and selected tool; unknown tool IDs are ignored. Flipping to the notes removes the hidden preview from keyboard navigation. Closing search restores focus to its opener, and typing does not trigger explorer shortcuts. Clipboard failures have localized feedback.

Install Chromium once with `pnpm exec playwright install chromium`, then run `pnpm test:e2e`. It builds the production site and checks shared paths, flipped faces, keyboard focus and bilingual detail navigation in desktop and mobile viewports. CI runs this separately and retains failure traces.

## Styles

All styles live in `src/app/globals.css`: tokens for the four materials (rice paper, green lacquer, brass, seal red) plus every component. [DESIGN.md](DESIGN.md) is the single source for the visual system.

## Docs

[DESIGN.md](DESIGN.md) and [PRODUCT.md](PRODUCT.md) carry a Chinese edition beside them; the two English / Chinese tables below reflect that.

| English | 中文 | What it covers |
| --- | --- | --- |
| [DESIGN.md](DESIGN.md) | [DESIGN.zh-CN.md](DESIGN.zh-CN.md) | Visual system: colour, type, layout, components |
| [PRODUCT.md](PRODUCT.md) | [PRODUCT.zh-CN.md](PRODUCT.zh-CN.md) | Users, positioning, principles, accessibility |
| [docs/design-constraints.md](docs/design-constraints.md) | — | Constraints that still hold: layout boundaries, theme, language, and what counts as verified |

## Preview pipeline

Tool previews live in `public/previews/{id}.png`:

- `pnpm download-previews` — screenshot each tool's site, then hand off to optimisation.
- `pnpm optimize-previews` — sharp re-encode in place (1600px long edge + palette PNG). It re-encodes **every** preview, so restore the others first when committing only one new image.

## Adding a tool

1. Add a record to `src/data/tools.ts` (minimum lengths for the en/zh description are enforced by tests).
2. Place it on exactly one route in `src/data/workflow.ts`.
3. Drop the preview at `public/previews/{id}.png`.
4. Commit once `pnpm check` is green.

## Environment

- Node: pinned to `24` by `.nvmrc`; CI uses the same version.
- Package manager: pinned by the `packageManager` field in `package.json`. A local pnpm that differs will self-switch; in a fully tunneled or offline environment that signature check can fail — run `biome` / `tsc` / `next` straight from `node_modules/.bin/` and call node by its nvm absolute path for tests.

## License

MIT, see [LICENSE](LICENSE).
