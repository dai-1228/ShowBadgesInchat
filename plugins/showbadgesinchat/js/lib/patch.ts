/**
 * Finds the Discord components that render message-header names and patches
 * them so our badge row is injected.
 *
 * Uses multiple strategies for resilience across app updates:
 *  1. `DisplayName` — the display-name component in chat headers (primary).
 *  2. `HeaderName`  — wrapper used by some surfaces (extra surface coverage).
 *
 * Only instances that carry a resolvable author user record receive badges,
 * keeping other usages (member lists, profile sheets, …) clean.
 */

import { getModules, lookupModule } from '@revenge-mod/modules/finders'
import { withName } from '@revenge-mod/modules/finders/filters'
import { instead } from '@revenge-mod/patcher'
import { extractHeaderAuthor, injectBadgeRow } from './inject'

const TARGET_NAMES = ['DisplayName', 'HeaderName'] as const

const patchedTargets = new Set<unknown>()
const unpatches: Array<() => void> = []
let loggedSkipOnce = false

interface NamedLike {
	name?: string
	displayName?: string
	type?: NamedLike
}

type ModuleRecord = Record<string, any>
type PatchableModule = Record<string, (...args: any[]) => any>

/** True when an export looks like the named component. */
function isNamedComponent(value: unknown, name: string): boolean {
	if (value == null) return false
	if (typeof value !== 'function' && typeof value !== 'object') return false

	const v = value as NamedLike
	if (v.name === name || v.displayName === name) return true
	// memo()/forwardRef() wrappers keep identity on `.type`
	return v.type != null && (v.type.name === name || v.type.displayName === name)
}

/**
 * Resolve which export key inside the (namespaced) module holds the target
 * component. Falls back to `default` when the bundle minified names away.
 */
function resolveExport(mod: ModuleRecord, name: string): string | null {
	for (const key of Object.keys(mod)) {
		if (isNamedComponent(mod[key], name)) return key
	}
	const def = mod.default
	if (typeof def === 'function') return 'default'
	return null
}

function applyInstead(componentName: string, mod: ModuleRecord, key: string) {
	const target = mod[key]
	if (typeof target !== 'function') return
	if (patchedTargets.has(target)) return
	patchedTargets.add(target)

	const patchable = mod as PatchableModule

	const unpatch = instead(
		patchable,
		key,
		function (
			this: unknown,
			args: [props?: Record<string, unknown>, ...rest: unknown[]],
			orig: (...a: unknown[]) => unknown,
		) {
			const props = args[0] as Parameters<typeof extractHeaderAuthor>[0]
			const result = orig.apply(this, args)

			try {
				const user = extractHeaderAuthor(props)
				if (!user) {
					if (!loggedSkipOnce) {
						loggedSkipOnce = true
						console.log(
							'[ShowBadgesInChat] header without resolvable author; skipping silently',
						)
					}
				} else if (result != null && typeof result === 'object') {
					injectBadgeRow(result, user)
				}
			} catch (e) {
				console.log('[ShowBadgesInChat] hook error:', e)
			}

			return result
		},
	)

	console.log(`[ShowBadgesInChat] patched ${componentName}.${key}`)
	unpatches.push(unpatch)
}

function patchCandidate(name: (typeof TARGET_NAMES)[number]) {
	let found = false

	try {
		// `returnNamespace: true` guarantees we always receive the whole module
		// (so we can patch the specific export key inside it).
		const [mod] =
			(lookupModule as any)(withName(name), {
				returnNamespace: true,
			}) || []
		if (mod) {
			const key = resolveExport(mod, name)
			if (key !== null) {
				found = true
				applyInstead(name, mod, key)
			}
		}
	} catch (e) {
		console.log(`[ShowBadgesInChat] lookup failed for ${name}:`, e)
	}

	if (!found) {
		try {
			const unsub = (getModules as any)(
				withName(name),
				(mod: ModuleRecord) => {
					const key = resolveExport(mod, name)
					if (key !== null) {
						if (!found) {
							applyInstead(name, mod, key)
							found = true
							unsub()
						}
					}
				},
				{ returnNamespace: true, max: 1, initialize: true },
			)
		} catch (e) {
			console.log(`[ShowBadgesInChat] getModules failed for ${name}:`, e)
		}
	}
}

export function installPatches(): () => void {
	loggedSkipOnce = false
	for (const name of TARGET_NAMES) patchCandidate(name)

	return () => {
		while (unpatches.length > 0) {
			try {
				unpatches.pop()?.()
			} catch {}
		}
		patchedTargets.clear()
	}
}
