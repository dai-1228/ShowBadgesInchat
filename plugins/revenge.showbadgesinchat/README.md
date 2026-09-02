# ShowBadgesInChat (Revenge)

A port of the Equicord/Vencord [`showBadgesInChat`](https://github.com/Equicord/Equicord/tree/main/src/equicordplugins/showBadgesInChat) plugin for **Revenge**, targeting both **Android** and **iOS**.

Shows the message author's badges beside their name in chat:

- **Discord profile badges** — Staff, Partner, HypeSquad, Bug Hunter, Early Supporter, Early Verified Bot Developer, etc. (from the user's `flags` / `publicFlags`)
- **Discord Nitro** badge (Classic / Basic / full)
- **Vencord Donor** badges (from `https://badges.vencord.dev/badges.json`)
- **Equicord Donor** badges (from `https://badge.equicord.org/badges.json`)
- **Vencord Contributor** badge (hardcoded contributor ID list)
- **Equicord Contributor** badge (hardcoded contributor ID list)

The plugin settings page lets users toggle each badge group and reorder them.

## Layout

| Path | Purpose |
| --- | --- |
| `manifest.json` | Revenge plugin manifest (format 1, JS-only). |
| `js/index.tsx` | Entry point (`plugin({ ... })`). |
| `js/lib/patch.ts` | Finds + patches `DisplayName` / `HeaderName` chat-header components. |
| `js/lib/inject.tsx` | Injects the badge row into the rendered header tree. |
| `js/lib/compute.ts` | Assembles the ordered badge list for a user. |
| `js/lib/donors.ts` | Fetches + caches Vencord/Equicord donor badges. |
| `js/lib/groups.ts` | Discord profile-badge definitions + group metadata. |
| `js/lib/contributors.ts` | Vencord/Equicord contributor-ID lookups. |
| `js/lib/contributorsData.ts` | Embedded Vencord/Equicord contributor ID lists. |
| `js/lib/settings.ts` | Plugin settings, persisted via Revenge JSON storage. |
| `js/lib/stores.ts` | Minimal access to the Discord stores used by the settings page. |
| `js/lib/types.ts` | Shared types. |
| `js/ui/badgesRow.tsx` | The badge row rendered next to author names. |
| `js/ui/settings.tsx` | Settings page (toggle + reorder badge groups). |
| `js/data/contributors.json` | Contributor ID data (build provenance for `contributorsData.ts`). |

## Building

Requires Node ≥ 22.18 or Bun (the Revenge plugin CLI crashes on older Node). With Bun installed:

```sh
bun i
```

Bundle the JS (from the repository root):

```sh
# On Node ≥ 22.18 (or via Bun on any version):
bun run build
# Or invoke the CLI directly through Bun, e.g. when the system Node is too old:
bun node_modules/@revenge-mod/plugin-cli/bin/revenge-plugin.js build
```

The bundle is written to `plugins/revenge.showbadgesinchat/build/js/index.js`.

Package the distributable ZIP (`manifest.json` + `index.js`), from the repository root:

```sh
mkdir -p build/revenge.showbadgesinchat build/dist
cp plugins/revenge.showbadgesinchat/manifest.json build/revenge.showbadgesinchat/
cp plugins/revenge.showbadgesinchat/build/js/index.js build/revenge.showbadgesinchat/index.js
(cd build/revenge.showbadgesinchat && zip -X ../dist/revenge.showbadgesinchat.zip manifest.json index.js)
```

Regenerate the repository index when publishing. The command scans `--dist`, requires `--base-url` (artifact URLs must be absolute) and writes `index.json` into the repository root by default (`--out <file>` overrides). This repository hosts `build/dist` on GitHub Pages:

```sh
bun node_modules/@revenge-mod/plugin-cli/bin/revenge-plugin.js generate-index --dist build/dist --base-url https://dai-1228.github.io/ShowBadgesInchat
```

To test the full install/update flow on a device, serve the repository locally with `bun --bun run serve` (see the root README).

## License

GPL-3.0-or-later, matching the original Equicord/Vencord work it ports.