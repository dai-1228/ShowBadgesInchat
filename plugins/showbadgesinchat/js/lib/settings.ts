/**
 * Plugin settings, persisted via Revenge's JSON storage and exposed through a
 * tiny external store so both the chat cells and the settings page can react.
 *
 * NOTE: keep `PLUGIN_ID` in sync with `manifest.json`.
 */
import { getJsonStorage, pluginStoragePathFor } from '@revenge-mod/json-storage'
import { GROUP_ORDER } from './groups'
import type { BadgeGroupKey } from './types'

export const PLUGIN_ID = 'revenge.showbadgesinchat'

export interface SbicSettings {
	enabled: Record<BadgeGroupKey, boolean>
	order: BadgeGroupKey[]
	/** Badge icon size in dp. */
	size: number
}

const defaultOrder = GROUP_ORDER.map(g => g.key) as BadgeGroupKey[]

const DEFAULT_SETTINGS: SbicSettings = {
	enabled: {
		equicordDonor: true,
		equicordContributor: true,
		vencordDonor: true,
		vencordContributor: true,
		discordProfile: true,
		discordNitro: true,
	},
	order: defaultOrder,
	size: 20,
}

const storage = getJsonStorage<SbicSettings>(
	pluginStoragePathFor(PLUGIN_ID, 'settings.json'),
	{ default: DEFAULT_SETTINGS },
)

let current: SbicSettings = JSON.parse(
	JSON.stringify(DEFAULT_SETTINGS),
) as SbicSettings
let version = 0
const subscribers = new Set<() => void>()

function sanitize(raw: Partial<SbicSettings> | undefined | null): SbicSettings {
	const merged: SbicSettings = {
		...JSON.parse(JSON.stringify(DEFAULT_SETTINGS)),
		...(raw ?? {}),
	} as SbicSettings

	if (!merged.enabled || typeof merged.enabled !== 'object')
		merged.enabled = { ...DEFAULT_SETTINGS.enabled }
	for (const key of DEFAULT_SETTINGS.order as string[]) {
		if (typeof (merged.enabled as Record<string, unknown>)[key] !== 'boolean') {
			;(merged.enabled as Record<string, unknown>)[key] = true
		}
	}

	if (!Array.isArray(merged.order)) merged.order = [...defaultOrder]
	// Drop unknown keys, append missing ones, dedupe.
	const seen = new Set<string>()
	const ordered = merged.order.filter(k => DEFAULT_SETTINGS.order.includes(k))
	for (const k of ordered) seen.add(k)
	for (const k of DEFAULT_SETTINGS.order) if (!seen.has(k)) ordered.push(k)
	merged.order = ordered as BadgeGroupKey[]

	if (
		typeof merged.size !== 'number' ||
		!Number.isFinite(merged.size) ||
		merged.size <= 0
	)
		merged.size = 20

	return merged
}

function readFromCache() {
	current = sanitize(storage.cache as Partial<SbicSettings> | undefined)
}

function emit() {
	version++
	for (const cb of subscribers) cb()
}

void storage.get().then(() => {
	readFromCache()
	emit()
})

storage.subscribe(() => {
	readFromCache()
	emit()
})

function subscribe(cb: () => void): () => void {
	subscribers.add(cb)
	return () => {
		subscribers.delete(cb)
	}
}

export function getSettings(): SbicSettings {
	return current
}

export async function updateSettings(
	patch: Partial<SbicSettings>,
): Promise<void> {
	readFromCache()
	current = sanitize({ ...current, ...patch })
	await storage.set(current)
	emit()
}

export const settingsStore = {
	subscribe,
	getVersion: () => version,
}
