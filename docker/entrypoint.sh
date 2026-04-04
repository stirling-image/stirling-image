#!/bin/sh
set -e

# Fix ownership of mounted volumes so the non-root stirling user can write.
# This runs as root, fixes permissions, then drops to stirling via gosu.
if [ "$(id -u)" = "0" ]; then
  chown -R stirling:stirling /data /tmp/workspace 2>&1 || \
    echo "WARNING: Could not fix volume permissions. If processing fails, check your volume mount permissions." >&2
  exec gosu stirling "$@"
fi

# Already running as stirling (e.g. Kubernetes runAsUser)
exec "$@"
