#!/usr/bin/env bash
set -euo pipefail

ADMIN_EMAIL="${1:-${ADMIN_EMAIL:-jaydensaxton.c@outlook.com}}"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required but was not found."
  exit 1
fi

DB_CONTAINER="$(docker ps --format '{{.Names}}' | grep '^supabase_db_' | awk 'NR==1{print; exit}' || true)"
if [[ -z "${DB_CONTAINER}" ]]; then
  echo "could not find a running local supabase database container."
  echo "run 'supabase start' first."
  exit 1
fi

SAFE_EMAIL="${ADMIN_EMAIL//\'/\'\'}"

UPDATED_COUNT="$(docker exec "${DB_CONTAINER}" psql -U postgres -d postgres -tAc \
  "with updated as (
     update public.profiles
     set role = 'admin'
     where id in (select id from auth.users where email = '${SAFE_EMAIL}')
     returning id
   )
   select count(*) from updated;")"

if [[ "${UPDATED_COUNT}" == "0" ]]; then
  echo "no profile was promoted for ${ADMIN_EMAIL}."
  echo "make sure this user has logged in at least once locally, then run this script again."
  exit 0
fi

echo "promoted ${ADMIN_EMAIL} to admin in local supabase (${DB_CONTAINER})."
