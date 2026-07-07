# Statflo Widget Samples

Sample widgets for the Statflo platform, built with [`@statflo/widget-sdk`](https://www.npmjs.com/package/@statflo/widget-sdk)
and [`@statflo/ui`](https://www.npmjs.com/package/@statflo/ui). Each sample
is a small, self-contained React + TypeScript app that runs inside the
Statflo host app as an embedded widget.

Use this repo as a reference for building your own widgets — clone a
sample, adapt it, ship it.

## What's a Statflo widget?

A widget is a standalone web app, loaded into the Statflo host app via an
iframe, that shows account-specific context or lets a rep take an action
without leaving their workflow. Widgets communicate with the host app
through a small event protocol provided by `@statflo/widget-sdk`:

- The host app pushes context to the widget — the current auth token,
  the account being viewed, and the user's dark/light mode preference.
- The widget can push events back — for example, to notify the host app
  that a rep took an action inside the widget.

Everything else is just a normal React app.

## Samples in this repo

| Folder | Description |
|---|---|
| [`widget-sidebar/`](./widget-sidebar) | A sidebar widget showing a list of account comments, with a form to add new ones. |

## Prerequisites

- Node.js 18+
- Yarn (or npm)

## Getting started

Each sample is self-contained with its own dependencies. To run one:

```bash
cd widget-sidebar
yarn install
yarn start
```

This starts a local dev server at `http://localhost:3000`.

Widgets are designed to run inside the Statflo host app, which supplies
the account context and auth token they need. Point your Statflo
development environment at the local dev server URL to load and preview
the widget in context.

To build a sample for production:

```bash
yarn build
```

This outputs a static bundle that can be deployed to any static hosting
provider.

## How the samples are structured

```
widget-sidebar/
├── public/
│   ├── index.html
│   ├── comments.json      # sample data
│   └── manifest.json
├── src/
│   ├── App.tsx             # widget implementation
│   ├── App.css
│   ├── index.css
│   ├── bootstrap.tsx
│   └── index.tsx
├── package.json
├── tsconfig.json
└── webpack.config.js
```

`App.tsx` is the place to start reading — it shows the full pattern:
listening for context from the host app, loading data, rendering inside
`@statflo/ui`'s `ExpandingCard` component, and publishing an event back
to the host app.

## Building your own widget

The fastest way to start a new widget is to copy one of the samples and
adapt it:

1. Copy a sample folder and give it a new name.
2. Update `package.json`, `public/manifest.json`, and the `<title>` in
   `public/index.html`.
3. Replace the data model and data-loading logic in `App.tsx` with
   whatever your widget needs.
4. Replace the markup inside `ExpandingCard` with your widget's UI,
   keeping `ExpandingCard`/`Button` from `@statflo/ui` for consistent
   styling with the rest of the host app.
5. Update or remove the `publishEvent` call depending on what, if
   anything, your widget needs to report back to the host app.

## Notes on the toolchain

- The widget store from `@statflo/widget-sdk` is a vanilla store, not a
  React hook — bind it in your component with zustand's `useStore`:

  ```tsx
  import { useStore } from "zustand";
  import widgetStore from "@statflo/widget-sdk";

  const { events, publishEvent, getLatestEvent } = useStore(widgetStore);
  ```

- Each sample's `webpack.config.js` aliases `react`/`react-dom` to a
  single resolved copy. This keeps a single instance of React in the
  bundle even if a dependency ships its own nested copy, which avoids
  hook-related errors at runtime.

## License

See [LICENSE](./LICENSE) for details.
