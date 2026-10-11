#!/bin/zsh
set -e
cd "${0:A:h}/.."
runtime_root="/Users/dannyambrose/.cache/codex-runtimes/codex-primary-runtime/dependencies/node"
export PATH="$runtime_root/bin:$PATH"
export XDG_CACHE_HOME=/private/tmp/flavorfinder-eas-cache
node "$runtime_root/node_modules/pnpm/bin/pnpm.cjs" dlx eas-cli@24.12.1 build --platform ios --profile production
