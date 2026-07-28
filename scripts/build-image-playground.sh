#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PLAYGROUND_DIR="${IMAGE_PLAYGROUND_DIR:-/tmp/gpt_image_playground}"
DEST_DIR="${IMAGE_PLAYGROUND_DEST:-$ROOT_DIR/web/public/image-playground}"
PATCH_DIR="$ROOT_DIR/scripts/image-playground-patches"
SOURCE_REPO="https://github.com/CookSleep/gpt_image_playground.git"
SOURCE_COMMIT="85af98984d866c574f7007245b3acded250efa6b"
APPLIED_PATCHES=()
REVERSED_PATCHES=()

restore_reversed_patches() {
  while [[ ${#REVERSED_PATCHES[@]} -gt 0 ]]; do
    index=$((${#REVERSED_PATCHES[@]} - 1))
    git -C "$PLAYGROUND_DIR" apply --unidiff-zero "${REVERSED_PATCHES[$index]}"
    unset 'REVERSED_PATCHES[index]'
  done
}

cleanup() {
  restore_reversed_patches
  for ((index=${#APPLIED_PATCHES[@]} - 1; index >= 0; index--)); do
    git -C "$PLAYGROUND_DIR" apply --unidiff-zero --reverse "${APPLIED_PATCHES[$index]}"
  done
}
trap cleanup EXIT

if [[ ! -f "$PLAYGROUND_DIR/package.json" ]]; then
  echo "image playground source not found: $PLAYGROUND_DIR" >&2
  echo "Clone it with: git clone --depth=1 $SOURCE_REPO $PLAYGROUND_DIR" >&2
  exit 1
fi

shopt -s nullglob
PATCH_FILES=("$PATCH_DIR"/*.patch)
shopt -u nullglob
if [[ ${#PATCH_FILES[@]} -eq 0 ]]; then
  echo "New API hosted integration patches not found: $PATCH_DIR" >&2
  exit 1
fi

if ! git -C "$PLAYGROUND_DIR" cat-file -e "$SOURCE_COMMIT^{commit}"; then
  echo "required gpt_image_playground commit is missing: $SOURCE_COMMIT" >&2
  echo "Fetch it from $SOURCE_REPO before building." >&2
  exit 1
fi

patch_stack_applied=true
for ((index=${#PATCH_FILES[@]} - 1; index >= 0; index--)); do
  patch_file="${PATCH_FILES[$index]}"
  if ! git -C "$PLAYGROUND_DIR" apply --unidiff-zero --reverse --check "$patch_file" >/dev/null 2>&1; then
    patch_stack_applied=false
    break
  fi
  git -C "$PLAYGROUND_DIR" apply --unidiff-zero --reverse "$patch_file"
  REVERSED_PATCHES+=("$patch_file")
done
restore_reversed_patches

if [[ "$patch_stack_applied" == "true" ]]; then
  for patch_file in "${PATCH_FILES[@]}"; do
    echo "Already applied: $(basename "$patch_file")"
  done
else
  applied_patch_count=0
  for patch_file in "${PATCH_FILES[@]}"; do
    if git -C "$PLAYGROUND_DIR" apply --unidiff-zero --reverse --check "$patch_file" >/dev/null 2>&1; then
      ((applied_patch_count += 1))
    fi
  done

  current_commit="$(git -C "$PLAYGROUND_DIR" rev-parse HEAD)"
  if [[ $applied_patch_count -eq 0 && "$current_commit" != "$SOURCE_COMMIT" ]]; then
    echo "expected source commit $SOURCE_COMMIT, found $current_commit" >&2
    echo "Check out the pinned commit before applying the hosted integration patches." >&2
    exit 1
  fi

  for patch_file in "${PATCH_FILES[@]}"; do
    patch_name="$(basename "$patch_file")"
    if git -C "$PLAYGROUND_DIR" apply --unidiff-zero --reverse --check "$patch_file" >/dev/null 2>&1; then
      echo "Already applied: $patch_name"
      continue
    fi

    git -C "$PLAYGROUND_DIR" apply --unidiff-zero --check "$patch_file"
    git -C "$PLAYGROUND_DIR" apply --unidiff-zero "$patch_file"
    APPLIED_PATCHES+=("$patch_file")
    echo "Applied: $patch_name"
  done
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
if [[ ! -f "$DEST_DIR/LICENSE.txt" ]]; then
  echo "build output is missing the upstream MIT license notice" >&2
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
