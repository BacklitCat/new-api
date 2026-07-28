# Embedded Image Playground

The embedded image workspace is built from
[`CookSleep/gpt_image_playground`](https://github.com/CookSleep/gpt_image_playground)
and published under `web/public/image-playground/`.

The reproducible source baseline is pinned to:

```text
85af98984d866c574f7007245b3acded250efa6b
```

New API-specific behavior is stored as ordered patches under
`scripts/image-playground-patches/`. The patches keep upstream source separate
while preserving the hosted integration and subsequent fixes in this repository.

## Source Checkout

The build script uses `~/Projects/gpt_image_playground` by default:

```bash
git clone https://github.com/CookSleep/gpt_image_playground.git ~/Projects/gpt_image_playground
git -C ~/Projects/gpt_image_playground checkout 85af98984d866c574f7007245b3acded250efa6b
```

Set `IMAGE_PLAYGROUND_DIR` to use another checkout.

## Build And Sync

From the new-api repository root:

```bash
make build-image-playground
```

The script applies the tracked hosted patches in filename order when necessary,
builds with `VITE_NEW_API_HOSTED=true`, syncs `dist/` into the dashboard public
assets, verifies the runtime markers, and restores a clean pinned source checkout.

## Runtime Contract

- Gallery image generation and editing use `/pg/images/generations` and
  `/pg/images/edits`.
- Agent mode uses `/pg/responses` and defaults new or legacy `gpt-5.5`
  Responses profiles to `gpt-5.6-sol`.
- The parent dashboard sends its short-lived dashboard access token to the
  same-origin iframe. The iframe never receives a real API token key.
- API token selection is optional. Without a selected token, the backend uses
  the signed-in account's default group and quota through a temporary request
  context, so users do not need to create a token before using the playground.
- A selected API token is represented only by `token_id`; the backend verifies
  ownership, status, IP restrictions, group access, and quota before relaying.
- Agent mode receives a managed Responses profile automatically and does not
  require users to switch the gallery profile away from Images API.
- The dashboard keeps the iframe mounted after the first visit so navigation
  does not interrupt an in-flight image request.

Do not deploy the standalone upstream build without the hosted patch: it lacks
the New API authentication bridge and `/pg` routing contract.
