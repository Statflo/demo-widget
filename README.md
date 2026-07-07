# Statflo Widget Samples

Sample widgets for the Statflo host app, built on `@statflo/widget-sdk`
and `@statflo/ui`. Each widget lives in its own folder with its own
`package.json`, and can be installed/run independently.

## Widgets in this repo

| Folder | What it demonstrates |
|---|---|
| [`widget-sidebar/`](./widget-sidebar) | A comments list + add-comment form. Shows the full widget lifecycle: receiving context from the host app, loading data, and publishing an event back. |

More sample widgets will be added here over time, each in its own
top-level folder alongside `widget-sidebar/`.

## Running a widget locally

All widgets follow the same pattern. From the repo root:

```bash
cd widget-sidebar        # or whichever widget folder you want to run
yarn install
yarn start
```

This runs a webpack dev server on **`http://localhost:3000`**, matching
the `publicPath` configured in that widget's `webpack.config.js`.

Opening `http://localhost:3000` directly in a browser will just show
"Loading…" — each widget waits to receive events (auth token, account ID,
dark mode) from a host app before it renders anything past that. To
actually see a widget render, it needs to be loaded inside an iframe by
something that speaks the widget SDK's event protocol — normally the real
Statflo host app, pointed at your local dev server. If you just want to
sanity-check that the UI renders and compiles, you can temporarily
hardcode `initialized` to `true` in that widget's `App.tsx` and comment
out the loading gate — just revert before committing.

**Build for production**, from inside the widget's folder:

```bash
yarn build
```

Outputs a static bundle you can deploy anywhere static files are served
from.

## What each widget demonstrates (general pattern)

Every widget in this repo follows the same shape:

- **Receiving context from the host app.** The host app pushes the auth
  token, the currently-viewed account ID, and dark-mode preference to
  every widget on load. Widgets listen for those and wait until they've
  heard from the host before rendering.
- **Loading data for the widget.** Usually a `fetch` call — pointed at a
  static JSON file in `public/` for these samples, but a real API call
  in production.
- **Rendering inside the standard widget chrome.** `ExpandingCard` and
  `Button` from `@statflo/ui` give every widget its title bar and
  collapse/expand behavior for free.
- **Publishing events back to the host app**, where relevant, via
  `publishEvent`, so the host app can react to user actions (e.g.
  persist a new comment).

## Troubleshooting

These apply to any widget in this repo, since they all share the same
underlying stack.

**"Invalid hook call" / "Cannot read properties of null (reading
'useState')" coming from `@statflo/ui` components**

This means two copies of React ended up in the bundle — usually because
`@statflo/ui` has its own nested `react`/`react-dom` under
`node_modules/@statflo/ui/node_modules/` that didn't get deduped by
yarn/npm. Check with (from inside the widget's folder):

```bash
find node_modules -path "*/node_modules/react/package.json"
```

More than one result confirms it. Each widget's `webpack.config.js`
includes a `resolve.alias` that forces every `react`/`react-dom` import —
including from inside dependencies — to that project's single top-level
copy, which should prevent this. If it still happens, delete
`node_modules` and `yarn.lock` inside that widget's folder and reinstall
from scratch.

**TypeScript errors on the widget store import**

`@statflo/widget-sdk`'s default export is a vanilla zustand store (it has
`getState` / `setState` / `subscribe`, but isn't itself callable as a
React hook). Use zustand's `useStore` helper to bind it:

```tsx
import { useStore } from "zustand";
import widgetStore from "@statflo/widget-sdk";

const { events, publishEvent, getLatestEvent } = useStore(widgetStore);
```

Calling it directly as a hook, or re-wrapping it with zustand's own
`create()`, both produce TypeScript errors (`TS2349` and `TS2769`
respectively).

## Known-good dependency versions

If a fresh install pulls different versions and something breaks, these
are confirmed to work together:

| Package | Version |
|---|---|
| `@statflo/ui` | `0.0.25` |
| `@statflo/widget-sdk` | `0.4.10` |
| `zustand` | `4.5.7` |
| `react` / `react-dom` | `18.2.0` |

## Adding a new widget

The easiest way to start a new one is to copy an existing folder (e.g.
`widget-sidebar/`) as a starting point rather than building from scratch:

1. Copy the folder, rename it, and update its `package.json`,
   `public/manifest.json`, and the `<title>` in `public/index.html`.
2. Replace the data model and `fetch` call in `App.tsx` with your own
   data shape and source.
3. Replace the JSX inside `<ExpandingCard>` with your own list/form
   markup, keeping `ExpandingCard`/`Button` as the wrapper.
4. Rename or remove the `publishEvent` call depending on whether your
   widget has a user action to report back to the host app.
5. Leave the token/account-ID/dark-mode listener and the webpack
   `resolve.alias` alone — every widget needs both.
6. Add a row for it to the table at the top of this README.
