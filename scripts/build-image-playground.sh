#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PLAYGROUND_DIR="${IMAGE_PLAYGROUND_DIR:-$HOME/Projects/gpt_image_playground}"
DEST_DIR="${IMAGE_PLAYGROUND_DEST:-$ROOT_DIR/web/public/image-playground}"
PATCH_DIR="$ROOT_DIR/scripts/image-playground-patches"
SOURCE_REPO="https://github.com/CookSleep/gpt_image_playground.git"
SOURCE_COMMIT="b1a73e542056da64cf2335436a551cd7e5879efe"
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

applied_patch_count=0
found_applied_patch=false
for ((index=${#PATCH_FILES[@]} - 1; index >= 0; index--)); do
  patch_file="${PATCH_FILES[$index]}"
  if ! git -C "$PLAYGROUND_DIR" apply --unidiff-zero --reverse --check "$patch_file" >/dev/null 2>&1; then
    if [[ "$found_applied_patch" == "true" ]]; then
      echo "image playground patches are not applied as a continuous prefix" >&2
      exit 1
    fi
    continue
  fi
  found_applied_patch=true
  git -C "$PLAYGROUND_DIR" apply --unidiff-zero --reverse "$patch_file"
  REVERSED_PATCHES+=("$patch_file")
  ((applied_patch_count += 1))
done
restore_reversed_patches

current_commit="$(git -C "$PLAYGROUND_DIR" rev-parse HEAD)"
if [[ $applied_patch_count -eq 0 && "$current_commit" != "$SOURCE_COMMIT" ]]; then
  echo "expected source commit $SOURCE_COMMIT, found $current_commit" >&2
  echo "Check out the pinned commit before applying the hosted integration patches." >&2
  exit 1
fi

for ((index=0; index<${#PATCH_FILES[@]}; index++)); do
  patch_file="${PATCH_FILES[$index]}"
  patch_name="$(basename "$patch_file")"
  if ((index < applied_patch_count)); then
    echo "Already applied: $patch_name"
    continue
  fi

  git -C "$PLAYGROUND_DIR" apply --unidiff-zero --check "$patch_file"
  git -C "$PLAYGROUND_DIR" apply --unidiff-zero "$patch_file"
  APPLIED_PATCHES+=("$patch_file")
  echo "Applied: $patch_name"
done

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

for pattern in "/pg" "token_id" "new-api:image-playground-context" "new-api:image-playground-ready" "gpt-5.6-sol" "images/generations" "responses"; do
  check_asset_contains "$pattern"
done

echo "Image playground synced to: $DEST_DIR"
echo "Source: $SOURCE_REPO@$SOURCE_COMMIT"
