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

## Running a sample locally

```bash
cd widget-sidebar
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
inspiration on what a finished widget can look like.

## License

See [LICENSE](./LICENSE) for details.
