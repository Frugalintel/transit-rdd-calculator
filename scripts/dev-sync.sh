#!/usr/bin/env bash
set -euo pipefail

DEFAULT_EMAIL="${ADMIN_EMAIL:-jaydensaxton.c@outlook.com}"

echo "starting local supabase..."
supabase start

echo "resetting local database with latest migrations..."
supabase db reset

echo "promoting local admin user (${DEFAULT_EMAIL})..."
"$(dirname "$0")/make-local-admin.sh" "${DEFAULT_EMAIL}"

echo "done. local dev now matches current branch + admin role bootstrap."
