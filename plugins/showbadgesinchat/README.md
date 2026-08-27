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
| `js/lib/patch.tsx` | Finds + patches `DisplayName` / `HeaderName` chat-header components. |
| `js/lib/inject.ts` | Injects the badge row into the rendered header tree. |
| `js/lib/compute.ts` | Assembles the ordered badge list for a user. |
| `js/lib/donors.ts` | Fetches + caches Vencord/Equicord donor badges. |
| `js/lib/groups.ts` | Discord profile-badge definitions + group metadata. |
| `js/lib/contributors.ts` | Contributor-ID lookups. |
| `js/ui/*` | Badge row component + settings page. |

## Building

Requires Node ≥ 22.18 (or Bun). With Bun installed:

```sh
bun i
bun run build revenge.showbadgesinchat
```

The bundle is written to `plugins/showbadgesinchat/build/js/index.js`. A distributable ZIP
(`manifest.json` + `index.js`) can be produced from that output.

## License

GPL-3.0-or-later, matching the original Equicord/Vencord work it ports.