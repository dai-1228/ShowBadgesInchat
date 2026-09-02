#!/usr/bin/env bash
# Full release flow: build -> stage -> zip -> publish artifact at the repo root -> regenerate index.
#
# The artifact ZIP is committed at the repository root because the generated
# index.json advertises it at the Pages site root (<base-url>/<plugin>.zip),
# and build/ is gitignored, so a zip that stays inside build/dist is never
# published. Commit ./<plugin>.zip and ./index.json, then push.
set -euo pipefail

BASE_URL="https://dai-1228.github.io/ShowBadgesInchat"
PLUGIN="revenge.showbadgesinchat"

# The plugin CLI needs Node >= 22.18. Prefer Bun's runtime, which is
# version-independent, then fall back to whatever node is installed.
if command -v bun >/dev/null 2>&1; then
	CLI=(bun node_modules/@revenge-mod/plugin-cli/bin/revenge-plugin.js)
elif [[ -x "$HOME/.bun/bin/bun" ]]; then
	CLI=("$HOME/.bun/bin/bun" node_modules/@revenge-mod/plugin-cli/bin/revenge-plugin.js)
else
	CLI=(node node_modules/@revenge-mod/plugin-cli/bin/revenge-plugin.js)
fi

"${CLI[@]}" build

mkdir -p "build/$PLUGIN" build/dist
cp "plugins/$PLUGIN/manifest.json" "build/$PLUGIN/"
cp "plugins/$PLUGIN/build/js/index.js" "build/$PLUGIN/index.js"
(cd "build/$PLUGIN" && zip -q -X "../dist/$PLUGIN.zip" manifest.json index.js)

# Publish the artifact where index.json advertises it: the repository root.
cp "build/dist/$PLUGIN.zip" "./$PLUGIN.zip"

# Fails on a duplicate version — bump the plugin manifest's version first.
"${CLI[@]}" generate-index --dist build/dist --base-url "$BASE_URL"

echo "Release ready: git add ./$PLUGIN.zip index.json && git commit && git push"
