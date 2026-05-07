#!/usr/bin/env bash
# Uploads all creature sprites to Supabase Storage bucket 'creature-sprites'.
# Requires: supabase CLI logged in, SUPABASE_PROJECT_REF set or passed as arg.
#
# Usage: ./scripts/upload_sprites.sh <project-ref>

set -e

PROJECT_REF="${1:-$SUPABASE_PROJECT_REF}"
if [ -z "$PROJECT_REF" ]; then
  echo "Error: Supabase project ref required."
  echo "Usage: $0 <project-ref>"
  exit 1
fi

SPRITES_DIR="$(dirname "$0")/../public/creature_sprites"
BUCKET="creature-sprites"

echo "Uploading sprites to bucket: $BUCKET"

find "$SPRITES_DIR" -name "*.png" | sort | while read -r filepath; do
  filename=$(basename "$filepath")
  # e.g. lumoth_adult.png — already in the right format
  echo "  Uploading $filename..."
  supabase storage cp "$filepath" "ss:///$BUCKET/$filename" \
    --project-ref "$PROJECT_REF" \
    --overwrite
done

echo "Done — $(find "$SPRITES_DIR" -name "*.png" | wc -l | tr -d ' ') sprites uploaded."
