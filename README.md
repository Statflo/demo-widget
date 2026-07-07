# Statflo Widget Samples

Sample widgets built with [`@statflo/widget-sdk`](https://github.com/Statflo/widget-sdk)
and [`@statflo/ui`](https://www.npmjs.com/package/@statflo/ui), showing
what's possible with Statflo widgets — small React + TypeScript apps
that run inside the Statflo host app as embedded, account-aware panels.

These are illustrative examples, not documentation. For everything you
need to actually build a widget — installation, the events API, the
official example widgets, and the hosted testing playground — see the
[`@statflo/widget-sdk` repo](https://github.com/Statflo/widget-sdk).

## Samples in this repo

| Folder | Description |
|---|---|
| [`widget-sidebar/`](./widget-sidebar) | A sidebar widget showing a list of account comments, with a form to add new ones. |
| [`calendly-sendable/`](./calendly-sendable) | A Sendable that lets an agent send a specific open time from their (faked) Calendly calendar, or their general scheduling link, into the chat. Uses a plain, borderless layout instead of the standard card chrome. |

## Widgets vs. Sendables

Both are the same kind of artifact under the hood — a small React app the
SDK mounts in an iframe inside the host app — but they're built for
different jobs:

- **Widgets** (`widget-sidebar/`, `offer-widget/`) manage their own state
  and tell the host app about something that happened by publishing a
  **custom event type** — e.g. `COMMENT_ADDED` or `OFFER_APPLIED`. It's up
  to the host app to know what to do with that event (persist a comment,
  attach an offer to the account, etc.).

- **Sendables** (`offer-sendable/`, `calendly-sendable/`) exist to get
  content into the conversation. Instead of a custom event, clicking an
  item publishes the SDK's built-in `APPEND_MESSAGE` event (or its sibling
  `REPLACE_MESSAGE`) with a plain string — the host app appends (or
  replaces) the chat compose box with it directly. No custom event
  handling required on the host side, which is what makes Sendables
  simpler to drop in.

A given widget can freely mix both patterns — e.g. a Sendable that also
publishes a custom event for analytics — but in these samples each one
sticks to a single pattern for clarity.

Visually, most samples use `ExpandingCard` from `@statflo/ui` for the
standard card chrome (bordered box, title bar, collapse arrow).
`calendly-sendable/` opts out of that and renders a plain, borderless
layout with a static title instead — a reminder that the card chrome is a
convenience, not a requirement, if a widget's design calls for something
lighter.

## Running a sample locally

```bash
cd widget-sidebar   # or calendly-sendable
yarn install
yarn start
```

This starts a local dev server at `http://localhost:3000`. Since these
widgets expect context (auth token, account ID, dark mode) from a host
app before they render, use the [widget playground](https://statflo.github.io/widget-sdk/conversations)
to load and test them — see the widget-sdk repo's Getting Started guide
for how.

## Building your own widget

Don't build from these samples directly — start from the
[`@statflo/widget-sdk` repo](https://github.com/Statflo/widget-sdk),
which has the SDK's own example widgets, the full events API, and
installation and testing instructions. Come back to these samples for
inspiration on what a finished widget — or Sendable — can look like.

## License

See [LICENSE](./LICENSE) for details.
