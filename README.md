# ShowBadgesInChat for Revenge

This repository builds and distributes **ShowBadgesInChat**, a plugin for [Revenge](https://github.com/revenge-mod) (the Discord client mod). It shows the message author's badges next to their name in chat, and is a port of the Equicord/Vencord [`showBadgesInChat`](https://github.com/Equicord/Equicord/tree/main/src/equicordplugins/showBadgesInChat) plugin targeting Android and iOS.

The plugin renders a row of badges beside the author's name:

- **Discord profile badges** — Staff, Partner, HypeSquad, Bug Hunter, Early Supporter, Early Verified Bot Developer, etc. (from the user's `flags` / `publicFlags`)
- **Discord Nitro** badge (Classic / Basic / full Nitro)
- **Vencord Donor** badges, fetched from `https://badges.vencord.dev/badges.json`
- **Equicord Donor** badges, fetched from `https://badge.equicord.org/badges.json`
- **Vencord Contributor** and **Equicord Contributor** badges (hardcoded contributor ID lists)

Every badge group can be toggled and reordered in the plugin's settings page. See the [plugin README](plugins/revenge.showbadgesinchat/README.md) for the file-by-file layout of the plugin.

The repository is the Revenge plugin template with that one plugin in it. It is **JS-only**: there is no native Kotlin part.

## Repository layout

```
├── plugins/
│   └── revenge.showbadgesinchat/       # the plugin: manifest.json + js/ sources
├── build/
│   ├── revenge.showbadgesinchat/       # staging: manifest.json + index.js
│   └── dist/
│       └── revenge.showbadgesinchat.zip   # the distributable artifact
├── index.json                          # repository index (generated, committed)
└── repo.config.json                    # repository display metadata + channel overrides
```

- `plugins/revenge.showbadgesinchat/manifest.json` is a format 1 manifest with id `revenge.showbadgesinchat` and `dist.script: "index.js"`. It declares only the JS part.
- One ZIP per plugin: `build/dist/<id>.zip` holds `manifest.json` and the bundled `index.js`.
- `index.json` sits at the repository root — the plugin CLI's default output location — and describes the published plugins: channels, versions, absolute artifact URLs and SHA-256 digests.
- `repo.config.json` feeds `generate-index` the repository name/description and optional channel overrides.

Each folder under `plugins/` is one plugin. A plugin is **native** when it has a `src/main` folder (Kotlin). A plugin is **JS-only** when it has only a JS entry file; a plugin can have both. The bundler looks for the JS entry in this order: `js/index.*`, then `src/index.*`, then `index.*` in the plugin folder. Each step accepts `.ts`, `.tsx`, `.js` and `.jsx`.

## Prerequisites

- **A JS runtime for the build:** [Node](https://nodejs.org/) **22.18 or later** (the CLI's `engines` requirement), [Deno](https://deno.com/) 2, or [Bun](https://bun.com/).
  On an older Node the plugin CLI crashes with a `styleText` error. Run it through Bun instead — via the package scripts (`bun run build`, which Bun executes with its own runtime) or by invoking the CLI directly:

  ```sh
  ~/.bun/bin/bun node_modules/@revenge-mod/plugin-cli/bin/revenge-plugin.js <command>
  ```

- **JDK, the Android SDK and the Revenge API Maven artifact are not needed here.** They only matter for native plugins (a `src/main` folder), and ShowBadgesInChat has none.

## Build, package, publish

From the repository root. Commands are shown with Bun so they work regardless of the installed Node version; on Node ≥ 22.18 the npm-script forms work identically. The `--bun` flag matters: plain `bun run build` executes the CLI's bin shim with system Node and crashes when that Node is older than 22.18, while `--bun` forces Bun's runtime.

`scripts/release.sh` performs all four steps below in one command.

```sh
bun i   # install dependencies

# 1. Bundle the JS -> plugins/revenge.showbadgesinchat/build/js/index.js
bun --bun run build
#   append the plugin name to build only that one:
#     bun --bun run build revenge.showbadgesinchat
#   or invoke the CLI directly (same effect):
#     ~/.bun/bin/bun node_modules/@revenge-mod/plugin-cli/bin/revenge-plugin.js build

# 2. Stage and zip the artifact -> build/dist/revenge.showbadgesinchat.zip
mkdir -p build/revenge.showbadgesinchat build/dist
cp plugins/revenge.showbadgesinchat/manifest.json build/revenge.showbadgesinchat/
cp plugins/revenge.showbadgesinchat/build/js/index.js build/revenge.showbadgesinchat/index.js
(cd build/revenge.showbadgesinchat && zip -X ../dist/revenge.showbadgesinchat.zip manifest.json index.js)

# 3. Publish the artifact where index.json advertises it -> ./revenge.showbadgesinchat.zip
cp build/dist/revenge.showbadgesinchat.zip ./revenge.showbadgesinchat.zip

# 4. Regenerate the repository index -> ./index.json
~/.bun/bin/bun node_modules/@revenge-mod/plugin-cli/bin/revenge-plugin.js generate-index \
    --dist build/dist --base-url https://dai-1228.github.io/ShowBadgesInchat
```

Notes:

- `generate-index` needs `--dist` together with `--base-url` (artifact URLs in the index must be absolute) and writes `index.json` into the current directory by default; `--out <file>` overrides. It writes one commit per ZIP's `manifest.json`: the absolute URL, SHA-256 digest, size and dependency map under that manifest's `version`.
- This repository points `--base-url` at the GitHub Pages URL of `origin`: `https://dai-1228.github.io/ShowBadgesInchat`. Adjust it if you publish the contents of `build/dist` (plus the generated `index.json`) somewhere else.
- **The artifact ZIP must be committed at the repository root.** `build/` is gitignored, and `index.json` advertises the ZIP at the Pages site root (`https://dai-1228.github.io/ShowBadgesInchat/revenge.showbadgesinchat.zip`) — a ZIP that stays inside `build/dist` is never published, and the client fails with a fetch error when installing. Step 3 puts the ZIP where the index points; commit the root ZIP together with `index.json` so their digest and size always agree. The bundle is not byte-deterministic across rebuilds, so always regenerate the index in the same run as the ZIP (`scripts/release.sh` does).
- Bump `version` in the plugin manifest before republishing a build — the generator fails on a duplicate version — and re-run `generate-index` after every rebuild so digests and sizes stay correct.
- `bun run build:dev` produces a development bundle.
- The template's Gradle packaging (`./gradlew packageAllPlugins`) compiles and packages native plugins and requires JDK 25+, the Android SDK and the Revenge API in your local Maven repository (`./gradlew :api:publishToMavenLocal` in the `revenge-xposed` repo). This repository is JS-only, so the manual stage-and-zip steps above are what produce its artifact.

## Serve a repository on your machine

Test the full repository flow — add the repository, browse, install, update — against local builds. Build the ZIP first, then start the dev server. The server regenerates the index in memory from the dist folder and serves it beside the artifacts; it does not read the committed `index.json`.

```sh
bun --bun run serve                              # LAN mode: http://<your-lan-ip>:8080
bun --bun run serve -- --base-url http://127.0.0.1:8080
adb reverse tcp:8080 tcp:8080                    # if the device cannot reach your IP, or blocks cleartext
```

Add the printed URL on the device as a repository. The server rescans `build/dist` (its default `--dist`) on every index request, so updates show up without restarting: bump the manifest version, rebuild, re-zip, and check for updates on the device.

---

# Template reference

The remainder of this README documents the underlying plugin template: the manifest format and the distribution model. It describes the tooling in this repository generally, including parts this single-plugin, JS-only repository does not use.

## `manifest.json`

```jsonc
{
  "format": 1,                      // manifest format version. Required. Always 1 today.
  "id": "com.example.plugin",       // also the folder name on disk
  "name": "Example Plugin",
  "description": "...",
  "author": "Your Name",
  "version": "1.0.0",               // the version of this plugin. Required.
  "dependencies": {                 // keyed by plugin id
    "revenge.api": { "version": ">=1" },
    "discord": { "version": "*" }
  },
  "dist": {
    "script": "index.js",           // JS bundle, relative to the plugin folder
    "android": {                    // native part (not used by this repository)
      "path": "plugin.jar",         // relative to the plugin folder
      "class": "com.example.plugin.MyPlugin"  // the class that exposes the `plugin {}` val
    }
  }
}
```

A plugin's `dist.android` is native Kotlin code: the build compiles it to a DEXed JAR and the plugin loader loads it with `DexClassLoader`. This code runs early, before the JS bundle. `dist.script` is the JavaScript bundle, which the Revenge JS side runs.

### `version`

Revenge uses its own version scheme. A version is one or more integer segments.
One lowercase alphanumeric prerelease label can follow. `1.0.0`, `2026.7` and `1.2.0-beta2` are all valid.

Two rules control the order:

- A short version compares as right-padded. `1.2` equals `1.2.0`.
- A labeled version always sorts before its bare version. `1.2.0-rc` is lower than `1.2.0`.

This scheme looks like SemVer, but it is not SemVer. A CalVer-shaped version works equally well.

### `dependencies`

`dependencies` is a map, and each key is a plugin id:

```jsonc
"dependencies": {
  "com.example.library": { "version": ">=1.0 <2", "optional": false }
}
```

Every field inside the value is optional. `{}` means `{ "version": "*" }`, which accepts any version.
The key itself must still exist. The host never assumes a dependency that you do not declare.

A version range uses explicit bounds only: `<`, `<=`, `=`, `>=` and `>`, separated by spaces.
The range syntax has no `^` and no `~`. The `"*"` wildcard accepts every version.

Ranges are checked at install time, at every boot, and when the user enables the plugin.
Plugins don't load when required dependencies fail or don't satisfy the version requirements.

Dependencies are resolved **by ID** against the repositories that the user enabled.
When a dependency lives in another repository, the user must add that repository before installing the plugin.

For example, a plugin that declares `"com.example.library": { "version": ">=1" }` pulls in the library at install time. The library always loads and starts first.

If the library is missing or out of range, the dependent never loads.

### Optional dependencies

`"optional": true` marks a dependency that never blocks your plugin.
Your plugin still loads when that dependency is missing, out of range, or broken.

When the dependency is present, it loads before your plugin, and its code are linked and made available to your plugin.

To detect the dependency, probe for one of its classes:

```kotlin
val themesAvailable = runCatching {
    Class.forName("com.example.themes.ThemeApi", false, javaClass.classLoader)
}.isSuccess
```

Keep all code that touches the optional API in a separate adapter class. Reference that class only after the probe succeeds.
A reference to a missing class stays safe until a code path runs it.

In JS, check if your plugin API is decorated:

```ts
start({ themes }) {
    const themesAvailable = !!themes
}
```

### Reserved IDs

Two dependency IDs are reserved.

- **`revenge.api`** resolves to the Revenge release version, which is the plugin API version.
  This dependency is **mandatory**. Constrain it to the API versions you tested, for example `">=1 <2"`.
- **`discord`** resolves to the Discord app version, for example `>=355.0`.

## Native plugins

Not used by this repository — ShowBadgesInChat is JS-only. For reference, this is how the template handles a native part.

A native plugin is a **top-level `val`** that you build with the `plugin {}` DSL. You implement no
interface, and you subclass nothing. The host reads the class that `dist.android.class` names, and
takes the first `PluginBuilder` value it exposes. You import and use a Ktor plugin value the same
way.

```kotlin
@file:JvmName("MyPlugin") // makes dist.android.class read as com.example.plugin.MyPlugin

package com.example.plugin

import io.github.revenge.plugins.plugin
import io.github.revenge.xposed.api.registerMethod

val myPlugin = plugin {
    start {
        log.i("Loaded ${manifest.id} in ${appInfo.packageName}")
        registerMethod("${manifest.id}.ping") { "pong" }
    }
    stop {
        log.i("Unloaded ${manifest.id}")
    }
}
```

A Kotlin top-level `val` compiles into a file-facade class. `MyPlugin.kt` becomes `MyPluginKt`.
The `@file:JvmName("MyPlugin")` annotation renames that facade. `dist.android.class` can then use the clean name `com.example.plugin.MyPlugin`.

If you omit the annotation, point `dist.android.class` at `...MyPluginKt`.
Declare exactly one `plugin {}` val in the file that the manifest names.

The host provides the Revenge API, the Xposed API, coroutines and the Kotlin standard library. The
build marks them `compileOnly`. The host class loader supplies them at runtime, so the JAR must not
contain them.

> **Note:** `d8` can print a `malformed kotlin.Metadata` warning. This warning is not fatal.
> The SDK metadata library is older than the Kotlin compiler. `d8` still writes a correct DEX, and the DEX loads.
> Only the rewrite of Kotlin reflection metadata stops.

## Distribution

This repository is also a **plugin repository**. A repository is a static host that serves `index.json`
describing every published plugin's channels, versions, absolute artifact URLs, and SHA-256 digests.

A user can add the repository URL in Revenge. Browsing, dependency resolution and updates all run on the client.

For this repository that means hosting the contents of `build/dist` together with the generated root `index.json` — for example on GitHub Pages at `https://dai-1228.github.io/ShowBadgesInchat`, which is the base URL baked into the committed `index.json`.

### Channels

A **channel is a named pointer into the published versions of one plugin**. In `index.json` each plugin carries both maps:

```jsonc
"channels": { "latest": "1.2.0", "testing": "1.3.0-beta" },
"versions": { "1.2.0": { /* … */ }, "1.3.0-beta": { /* … */ } }
```

`versions` holds the artifact data. `channels` only states which published version an audience gets.

The client picks a channel at install time, and it follows that pointer for update checks.
A stable user never sees a beta, because the `latest` pointer never points at one.

**Automatic pointers**:

- `latest` is the newest version with **no label**. `1.2.0` qualifies. `1.3.0-beta` never does.
- `beta` is the newest version **overall**. The generator emits it only when it differs from `latest`.
  When your newest release is stable, no `beta` pointer exists.

**Manual overrides**: Use the `channels` key in `repo.config.json`, keyed by plugin ID:

```jsonc
{
    "name": "My Plugin Repository",
    "channels": {
        "revenge.showbadgesinchat": {
            "latest": "1.0.0" // keep latest on 1.0.0, for example when 1.1.0 shipped broken
        }
    }
}
```

These rules apply:

- The generator computes `latest` and `beta` first. It then applies your overrides.
- An override must point at a published version of that plugin. Otherwise the generator fails.
- A channel name carries no version semantics. An `lts` version is the same artifact as its plain version.
  You only point at it for longer. To promote `beta` to `latest`, edit the pointer. No rebuilds or republishes.
- **A dependency never references a channel.** A dependency constrains versions only, so a mixed-channel install can resolve.
