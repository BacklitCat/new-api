#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PLAYGROUND_DIR="${IMAGE_PLAYGROUND_DIR:-/tmp/gpt_image_playground}"
DEST_DIR="${IMAGE_PLAYGROUND_DEST:-$ROOT_DIR/web/public/image-playground}"
PATCH_FILE="$ROOT_DIR/scripts/image-playground-patches/0001-feat-add-New-API-hosted-integration.patch"
SOURCE_REPO="https://github.com/CookSleep/gpt_image_playground.git"
SOURCE_COMMIT="85af98984d866c574f7007245b3acded250efa6b"
PATCH_APPLIED=false

cleanup() {
  if [[ "$PATCH_APPLIED" == "true" ]]; then
    git -C "$PLAYGROUND_DIR" apply --reverse "$PATCH_FILE"
  fi
}
trap cleanup EXIT

if [[ ! -f "$PLAYGROUND_DIR/package.json" ]]; then
  echo "image playground source not found: $PLAYGROUND_DIR" >&2
  echo "Clone it with: git clone --depth=1 $SOURCE_REPO $PLAYGROUND_DIR" >&2
  exit 1
fi

if [[ ! -f "$PATCH_FILE" ]]; then
  echo "New API hosted integration patch not found: $PATCH_FILE" >&2
  exit 1
fi

if ! git -C "$PLAYGROUND_DIR" cat-file -e "$SOURCE_COMMIT^{commit}"; then
  echo "required gpt_image_playground commit is missing: $SOURCE_COMMIT" >&2
  echo "Fetch it from $SOURCE_REPO before building." >&2
  exit 1
fi

if git -C "$PLAYGROUND_DIR" apply --reverse --check "$PATCH_FILE" >/dev/null 2>&1; then
  echo "New API hosted integration is already applied."
else
  current_commit="$(git -C "$PLAYGROUND_DIR" rev-parse HEAD)"
  if [[ "$current_commit" != "$SOURCE_COMMIT" ]]; then
    echo "expected source commit $SOURCE_COMMIT, found $current_commit" >&2
    echo "Check out the pinned commit before applying the hosted integration patch." >&2
    exit 1
  fi
  git -C "$PLAYGROUND_DIR" apply --check "$PATCH_FILE"
  git -C "$PLAYGROUND_DIR" apply "$PATCH_FILE"
  PATCH_APPLIED=true
fi

if [[ ! -d "$PLAYGROUND_DIR/node_modules" ]]; then
  npm --prefix "$PLAYGROUND_DIR" ci
fi

echo "Building image playground from: $PLAYGROUND_DIR"
VITE_NEW_API_HOSTED=true npm --prefix "$PLAYGROUND_DIR" run build

mkdir -p "$DEST_DIR"
rsync -a --delete "$PLAYGROUND_DIR/dist/" "$DEST_DIR/"

INDEX_FILE="$DEST_DIR/index.html"
if [[ ! -f "$INDEX_FILE" ]]; then
  echo "build output is missing index.html: $INDEX_FILE" >&2
  exit 1
fi

check_asset_contains() {
  local pattern="$1"
  if ! rg -q --fixed-strings "$pattern" "$DEST_DIR/assets"; then
    echo "built image playground assets do not contain required marker: $pattern" >&2
    exit 1
  fi
}

for pattern in "/pg" "token_id" "new-api:image-playground-context" "gpt-5.6-sol" "images/generations" "responses"; do
  check_asset_contains "$pattern"
done

echo "Image playground synced to: $DEST_DIR"
echo "Source: $SOURCE_REPO@$SOURCE_COMMIT"
