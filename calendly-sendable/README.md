# Calendly Sendable

A Statflo **Sendable** that connects to the agent's personal Calendly
account and lets them either:

1. **Pick one specific open time** from their own calendar — sends a
   message with that day/time and a link pre-filled to it, or
2. **Send their general scheduling link** — the customer opens it and
   picks whichever open time works for them.

Either action publishes the SDK's built-in `APPEND_MESSAGE` event, which
the host app appends to the chat compose box.

**The Calendly account is faked.** `src/calendlyApi.ts` simulates the
connected user, their event types (meeting types), and live availability
with an artificial network delay and randomized slots, so the widget's
loading states and interactions behave like a real integration would.
Every function in that file documents which real Calendly API endpoint it
stands in for — see the comment block at the top of the file.

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

## What this Sendable does

- **Receiving context from the host app**: auth token, current account ID,
  and dark-mode preference, via the widget store events (`TOKEN_UPDATED`,
  `CURRENT_ACCOUNT_ID`, `DARK_MODE`).
- **Connecting to Calendly (faked)**: on load, fetches the "connected"
  agent and their meeting types from `calendlyApi.ts`.
- **Choosing a meeting type**: a dropdown of the agent's event types
  (15/30/60 min in the demo data). Changing it re-fetches availability for
  that duration.
- **Live availability (faked)**: `getAvailableSlots` generates open times
  over the next 4 business days, 9am–4:30pm, stepped by the meeting
  duration, with ~40% randomly dropped to look like a real calendar with
  some times already booked. A "Refresh" button re-runs it.
- **Sending a specific time**: clicking an open slot builds a message with
  that day/time plus a deep link pre-filled to it
  (`getSlotSchedulingLink`), then publishes `APPEND_MESSAGE`.
- **Sending the general link**: the "Send link" button builds a message
  with the agent's plain booking page (`getGeneralSchedulingLink`) and
  publishes the same `APPEND_MESSAGE` event — the customer picks any open
  time themselves when they open it.
- **Rendering inside the standard widget chrome**: `ExpandingCard` and
  `Button` from `@statflo/ui`.

## Project structure

```
calendly-sendable/
├── public/
│   ├── index.html          # HTML shell, loads Bootstrap for base styles
│   └── manifest.json
├── src/
│   ├── App.tsx              # The Sendable itself — start here
│   ├── calendlyApi.ts        # FAKE backend — connected user, event types, availability
│   ├── App.css               # Widget-specific styles
│   ├── index.css              # Global resets
│   ├── bootstrap.tsx           # Mounts <App /> into #root
│   └── index.tsx                # Entry point (dynamic import wrapper)
├── package.json
├── tsconfig.json
└── webpack.config.js
```

## Making the backend real

Everything to swap lives in `src/calendlyApi.ts`; `App.tsx` doesn't need to
change. Each function's comment names the real Calendly endpoint it
stands in for:

1. Run Calendly's OAuth2 flow once per agent and store the resulting
   access/refresh token wherever your host app keeps secrets.
2. Replace `getConnectedUser` with `GET /users/me`.
3. Replace `getEventTypes` with `GET /event_types?user=<uri>`.
4. Replace `getAvailableSlots` with
   `GET /event_type_available_times?event_type=<uri>&start_time=...&end_time=...`.
5. `getGeneralSchedulingLink` and `getSlotSchedulingLink` don't need an API
   call — Calendly's booking page URLs are public and support deep-linking
   via query/path params, so these can stay as simple string builders.

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
