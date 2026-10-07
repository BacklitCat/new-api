# Embedded Image Playground

The embedded image workspace is built from
[`CookSleep/gpt_image_playground`](https://github.com/CookSleep/gpt_image_playground)
and published under `web/public/image-playground/`.

The reproducible source baseline is pinned to:

```text
b1a73e542056da64cf2335436a551cd7e5879efe
```

That commit is upstream `v0.7.16`. New API-specific behavior is stored as ordered
patches under `scripts/image-playground-patches/`. The patches keep upstream
source separate while preserving the hosted integration and subsequent fixes in
this repository.

## Hosted Integration Principles

These are the invariants of the hosted integration. When the pinned baseline
moves, re-apply the principles instead of replaying the old diffs: upstream
rename and refactor files constantly, but these contracts do not change.

1. **The parent dashboard is the only credential holder.** The iframe never
   receives a real API token key. The dashboard posts a short-lived dashboard
   access token over `new-api:image-playground-context`, the iframe announces
   `new-api:image-playground-ready`, and both sides verify `event.origin` and
   `event.source`. Every message publishes a new context snapshot
   (`accessToken` plus a monotonic `revision`) so React re-syncs even when a
   refresh carries the same token value.
   → `src/lib/newApiHosted.ts`, `src/App.tsx`
2. **All hosted traffic is same-origin and relative.** Requests go to `/pg` on
   the dashboard origin, so a relative base path must be joined verbatim: no
   `/v1` suffix logic, no development proxy prefix.
   → `src/lib/devProxy.ts`, and every `buildApiUrl()` call site in
   `src/lib/agentApi.ts` / `src/lib/openaiCompatibleImageApi.ts`
3. **The dashboard token is the Authorization header.** Hosted API calls send
   `Authorization: Bearer <dashboard access token>`; the user-entered API key is
   never used in hosted mode.
   → `getNewApiHostedRequestHeaders()`
4. **API tokens are referenced by id only.** A user may select one of their own
   tokens, but it travels as `token_id` in the JSON body or multipart form, never
   as a key. `0` or an absent field means "use the signed-in account's default
   group and quota". The option list comes from the dashboard-authenticated
   `/api/playground/image/tokens`, is filtered to enabled tokens, and is
   refreshed whenever the dropdown opens. The selection lives in the hosted
   context snapshot, so the header selector and the settings panel stay in sync.
   → `src/components/NewApiHostedTokenSelect.tsx`, `withNewApiHostedToken()`,
   `appendNewApiHostedToken()`
5. **Hosted mode is zero-config, and the user only chooses a token and a
   model.** An empty API URL and API key are valid: the default OpenAI profile
   uses `baseUrl: '/pg'`, and Agent mode receives a managed Responses profile
   automatically. The hosted settings panel exposes exactly two things — which
   API token to bill (optional) and which model to use — with the models the
   account can actually call (dashboard `GET /api/user/models`) offered as
   suggestions while free text stays possible. Everything else stays managed and
   hidden. One image-model setting drives both gallery generation and the Agent
   image tool (`imageGenerationModel`); a separate field sets the Agent text
   model. Submission is gated by profile validity, not by the presence of an API
   key.
   → `src/lib/apiProfiles.ts`, `src/components/InputBar.tsx`,
   `src/components/NewApiHostedModelField.tsx`,
   `src/components/settings/AgentSettingsTab.tsx`, `SettingsModal.tsx`
6. **Theme follows the dashboard, not the OS.** The dashboard posts
   `theme: 'light' | 'dark'`, the iframe toggles the `light`/`dark` class on
   `<html>`, Tailwind runs in `darkMode: 'class'`, and CSS dark rules are keyed
   on `html.dark`.
   → `applyTheme()`, `tailwind.config.js`, `src/index.css`
7. **No upstream chrome or outbound links.** The repository link, open-source
   footer, About tab, support/feedback links, and the release update check are
   hidden in hosted mode, while the upstream MIT notice still ships as
   `public/LICENSE.txt`.
   → `Header.tsx`, `HelpModal.tsx`, `SupportPromptModal.tsx`,
   `SettingsModal.tsx`, `useVersionCheck.ts`
8. **The service worker owns only its own assets.** It must never intercept or
   cache same-origin `/api/*` traffic, otherwise token and polling requests keep
   returning stale responses. Upstream scopes the worker itself; the regression
   test asserts that a request to `/api/playground/image/tokens` is not handled.
   → `src/lib/serviceWorker.test.js`
9. **Settings from older hosted builds keep working.** Stored settings are
   normalized on load, so a `gpt-5.5` Responses profile saved by an earlier
   hosted bundle migrates to the current default Responses model.
   → `normalizeApiProfile()` in `src/lib/apiProfiles.ts`

## Patch Set

| Patch | Scope |
| --- | --- |
| `0001-feat-add-New-API-hosted-bridge` | postMessage bridge and context snapshot |
| `0002-feat-route-hosted-requests-through-pg` | relative `/pg` base URL plus hosted headers and `token_id` on every call |
| `0003-feat-let-users-choose-the-hosted-token-and-model` | hosted profile defaults and validation, managed Agent profile, token picker, model fields |
| `0004-feat-replace-the-hosted-API-settings-panel` | 连接状态 panel instead of the upstream API config UI |
| `0005-fix-follow-the-dashboard-theme` | `dark` class theming driven by the dashboard |
| `0006-fix-remove-hosted-external-links` | hide upstream links and update checks, keep the MIT notice |
| `0007-test-cover-the-service-worker-asset-scope` | service worker scope regression test |

## Source Checkout

The build script uses `~/Projects/gpt_image_playground` by default:

```bash
git clone https://github.com/CookSleep/gpt_image_playground.git ~/Projects/gpt_image_playground
git -C ~/Projects/gpt_image_playground fetch origin b1a73e542056da64cf2335436a551cd7e5879efe
git -C ~/Projects/gpt_image_playground checkout b1a73e542056da64cf2335436a551cd7e5879efe
```

Set `IMAGE_PLAYGROUND_DIR` to use another checkout.

## Build And Sync

From the new-api repository root:

```bash
make build-image-playground
```

The script applies the tracked hosted patches in filename order when necessary,
builds with `VITE_NEW_API_HOSTED=true`, syncs `dist/` into the dashboard public
assets, verifies the runtime markers, and restores a clean pinned source
checkout.

To move the pin to a newer upstream release, check out the new commit, apply the
existing patches, resolve conflicts by re-applying the principles above, and
regenerate the patch set from a scratch clone that has upstream as its first
commit:

```bash
git init /tmp/pg-patches && cp -a ~/Projects/gpt_image_playground/. /tmp/pg-patches/
git -C /tmp/pg-patches checkout -- . && git -C /tmp/pg-patches add -A
git -C /tmp/pg-patches commit -m "upstream <new-commit>"
# copy the finished sources back, commit them in the same order as the patch list,
# then export the new patches:
git -C /tmp/pg-patches format-patch --no-signature -o scripts/image-playground-patches <upstream-commit>..HEAD
```

## Runtime Contract

- Gallery image generation and editing use `/pg/images/generations` and
  `/pg/images/edits`; Agent mode uses `/pg/responses`.
- Agent mode defaults new or legacy `gpt-5.5` Responses profiles to `gpt-5.6-sol`.
- The parent dashboard sends its short-lived dashboard access token to the
  same-origin iframe. The iframe never receives a real API token key.
- API token selection is optional. Without a selected token, the backend uses
  the signed-in account's default group and quota through a temporary request
  context, so users do not need to create a token before using the playground.
- Users choose their own model in the settings panel's 连接状态 tab; the choices
  come from the account's available models (`GET /api/user/models`) and can also
  be typed. Multiple models (comma separated) can be configured and switched from
  the model chip in the input bar.
- The image model applies to gallery generation and to the Agent image tool; the
  Agent text model has its own field in the Agent tab.
- A selected API token is represented only by `token_id`; the backend verifies
  ownership, status, IP restrictions, group access, and quota before relaying.
- Agent mode receives a managed Responses profile automatically and does not
  require users to switch the gallery profile away from Images API.
- The iframe follows the dashboard light/dark theme and never links back to the
  upstream project or checks for upstream releases.
- The dashboard keeps the iframe mounted after the first visit so navigation
  does not interrupt an in-flight image request.

Do not deploy the standalone upstream build without the hosted patch: it lacks
the New API authentication bridge and `/pg` routing contract.
