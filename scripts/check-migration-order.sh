
#!/usr/bin/env bash

set -euo pipefail

echo "Checking Supabase migration filename order..."

MIGRATIONS_DIR="supabase/migrations"

if [[ ! -d "$MIGRATIONS_DIR" ]]; then
    echo "No migrations directory found."
    exit 1
fi

PREVIOUS=""

while IFS= read -r file; do
    filename=$(basename "$file")
    version="${filename%%_*}"

    if [[ ! "$version" =~ ^[0-9]{14}$ ]]; then
        echo "Invalid migration filename: $filename"
        exit 1
    fi

    if [[ -n "$PREVIOUS" && "$version" < "$PREVIOUS" ]]; then
        echo "Migration order error: $filename"
        exit 1
    fi

    PREVIOUS="$version"
done < <(find "$MIGRATIONS_DIR" -maxdepth 1 -type f -name '*.sql' | sort)

echo "Migration filename order verified."

