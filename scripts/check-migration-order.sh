
#!/usr/bin/env bash

set -euo pipefail

echo "Checking Supabase migration order..."

supabase migration list --remote > /tmp/mig.txt

# Extract the newest applied remote migration.
NEWEST_APPLIED=$(
    awk -F'|' '
        NR > 2 {
            gsub(/[`[:space:]]/, "", $2)

            if ($2 ~ /^[0-9]{14}$/ && $2 > newest) {
                newest = $2
            }
        }
        END { print newest }
    ' /tmp/mig.txt
)

# Extract migrations that exist locally but not remotely.
PENDING=$(
    awk -F'|' '
        NR > 2 {
            gsub(/[`[:space:]]/, "", $1)
            gsub(/[`[:space:]]/, "", $2)

            if ($1 ~ /^[0-9]{14}$/ && $2 == "") {
                print $1
            }
        }
    ' /tmp/mig.txt
)

if [[ -z "$NEWEST_APPLIED" ]]; then
    echo "❌ Could not detect applied migrations."
    exit 1
fi

echo "Newest applied migration: $NEWEST_APPLIED"

if [[ -z "$PENDING" ]]; then
    echo "No pending migrations."
    echo "✅ Migration order verified."
    exit 0
fi

echo "Checking pending migrations..."

for v in $PENDING; do
    if [[ "$v" < "$NEWEST_APPLIED" ]]; then
        echo "❌ Out-of-order migration detected: $v"
        echo "Newest applied: $NEWEST_APPLIED"
        exit 1
    fi
done

echo "✅ Migration order verified."

