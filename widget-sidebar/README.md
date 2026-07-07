# Account Comments Widget (Sample Template)

A minimal, working example of a Statflo widget, built with the
`@statflo/widget-sdk` and `@statflo/ui` packages. Use this as a starting
point for building your own widget — copy the folder, rename it, and
replace the "comments" feature with whatever your widget actually does.

## Troubleshooting: "Invalid hook call" / duplicate React

If you see `Invalid hook call` or `Cannot read properties of null (reading
'useState')` coming from inside `@statflo/ui` components, it means two
copies of React ended up in the bundle — usually because `@statflo/ui` has
its own nested `react`/`react-dom` under
`node_modules/@statflo/ui/node_modules/` that didn't get deduped. Check
with:

```bash
find node_modules -path "*/node_modules/react/package.json"
```

If that returns more than one result, that's the cause. `webpack.config.js`
already includes a `resolve.alias` that forces every import of
`react`/`react-dom` — including from inside dependencies — to your
project's single top-level copy, which should fix this. If it still
happens, try deleting `node_modules` and `yarn.lock`/`package-lock.json`
and reinstalling.

## A note on the widget store

`@statflo/widget-sdk`'s default export is a vanilla zustand store (it has
`getState` / `setState` / `subscribe`, but isn't itself callable as a React
hook). To use it in a component, bind it with zustand's `useStore` helper:

```tsx
import { useStore } from "zustand";
import widgetStore from "@statflo/widget-sdk";

const { events, publishEvent, getLatestEvent } = useStore(widgetStore);
```

Don't call the store directly as a hook, and don't re-wrap it with
zustand's `create()` — both of those cause TypeScript errors (`TS2349` and
`TS2769` respectively).

## What this sample demonstrates

- **Receiving context from the host app**: auth token, current account ID,
  and dark-mode preference, via `useWidgetStore` events (`TOKEN_UPDATED`,
  `CURRENT_ACCOUNT_ID`, `DARK_MODE`).
- **Loading data for the widget**: a simple `fetch` call, here pointed at
  a static `public/comments.json` for demo purposes.
- **Rendering inside the standard widget chrome**: `ExpandingCard` and
  `Button` from `@statflo/ui`.
- **Publishing an event back to the host app**: when a user adds a
  comment, the widget calls `publishEvent` with a `COMMENT_ADDED` event
  so the host app can react to it (e.g. persist it).

## Project structure

```
account-comments-widget/
├── public/
│   ├── index.html        # HTML shell, loads Bootstrap for base styles
│   ├── comments.json     # Sample data the widget fetches on load
│   └── manifest.json
├── src/
│   ├── App.tsx            # The widget itself — start here
│   ├── App.css            # Widget-specific styles
│   ├── index.css          # Global resets
│   ├── bootstrap.tsx       # Mounts <App /> into #root
│   └── index.tsx           # Entry point (dynamic import wrapper)
├── package.json
├── tsconfig.json
└── webpack.config.js
```

## How to adapt this for your own widget

1. **Rename the package** in `package.json` and update `public/index.html`'s
   `<title>` and `manifest.json`.
2. **Replace the data model.** Swap the `Comment` interface in `App.tsx`
   for your own type, and point `fetchComments` at your real data source
   instead of the static JSON file.
3. **Replace the UI inside `ExpandingCard`.** Keep the card wrapper (it
   gives you the standard title bar and collapse behavior for free) but
   swap the list/form markup for your feature.
4. **Keep the event-handling scaffolding** in the first `useEffect` — most
   widgets need the token, account ID, and dark-mode listeners, since
   the host app pushes those to every widget on load.
5. **Publish your own events** wherever the user takes an action the host
   app should know about, following the pattern in `handleAddComment`.

## Running locally

```bash
npm install
npm start
```

This starts a webpack dev server on `http://localhost:3000`, matching the
`publicPath` configured in `webpack.config.js` (widgets are typically
loaded into a host app via an iframe pointed at this URL during
development).

## Building

```bash
npm run build
```
