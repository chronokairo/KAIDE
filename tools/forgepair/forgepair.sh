#!/bin/sh
# Start Forgepair from the repo root. Keeps the current working directory as the
# executor's workspace (*work-dir*); credentials come from this repo's .env.
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
exec sbcl --noinform --disable-debugger --script "$ROOT/src/entrypoint.lisp" "$@"