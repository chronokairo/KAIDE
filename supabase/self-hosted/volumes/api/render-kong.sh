#!/bin/sh
# Kong does not interpolate environment variables in declarative YAML.
set -eu
: "${ANON_KEY:?ANON_KEY is required}"
: "${SERVICE_ROLE_KEY:?SERVICE_ROLE_KEY is required}"
for key in "$ANON_KEY" "$SERVICE_ROLE_KEY"; do
  case "$key" in
    *[!a-zA-Z0-9_.-]*) echo "Invalid gateway credential encoding" >&2; exit 1 ;;
  esac
done
if [ "$ANON_KEY" = "$SERVICE_ROLE_KEY" ]; then
  echo "Gateway credentials must have separate roles" >&2
  exit 1
fi
umask 077
awk '{
  gsub(/\$\{ANON_KEY\}/, ENVIRON["ANON_KEY"])
  gsub(/\$\{SERVICE_ROLE_KEY\}/, ENVIRON["SERVICE_ROLE_KEY"])
  print
}' "${KONG_TEMPLATE_PATH:-/var/lib/kong/kong.template.yml}" > "${KONG_DECLARATIVE_CONFIG:-/tmp/kong.yml}"
