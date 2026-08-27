/**
 * Fetches and caches Vencord / Equicord donor badge lists.
 *
 * Endpoints mirror the desktop plugin (`@plugins/_api/badges`):
 *   https://badges.vencord.dev/badges.json
 *   https://badge.equicord.org/badges.json
 */
import type { BadgeItem } from './types'

const VENCORD_BADGES_URL = 'https://badges.vencord.dev/badges.json'
const EQUICORD_BADGES_URL = 'https://badge.equicord.org/badges.json'
const REFRESH_INTERVAL = 30 * 60 * 1000 // 30 minutes, like the desktop plugin

interface DonorBadge {
	tooltip?: string
	badge?: string
}

type DonorMap = Record<string, DonorBadge[]>

const donors: { vencord: DonorMap; equicord: DonorMap } = {
	vencord: {},
	equicord: {},
}

let version = 0
let refreshTimer: ReturnType<typeof setInterval> | undefined
let refreshPromise: Promise<void> | undefined

const subscribers = new Set<() => void>()

function notify() {
	version++
	for (const cb of subscribers) cb()
}

function subscribe(cb: () => void): () => void {
	subscribers.add(cb)
	return () => {
		subscribers.delete(cb)
	}
}

async function fetchDonors(url: string, map: DonorMap) {
	try {
		const res = await fetch(url, { headers: { accept: 'application/json' } })
		if (!res.ok) throw new Error(`HTTP ${res.status}`)
		const json = (await res.json()) as DonorMap
		if (json && typeof json === 'object') {
			// Mutate in place so existing references stay valid.
			for (const key of Object.keys(map)) delete map[key]
			Object.assign(map, json)
		}
	} catch (e) {
		console.log('[ShowBadgesInChat] failed to load donor badges from', url, e)
	}
}

async function refresh() {
	if (refreshPromise) return refreshPromise

	refreshPromise = (async () => {
		await Promise.all([
			fetchDonors(VENCORD_BADGES_URL, donors.vencord),
			fetchDonors(EQUICORD_BADGES_URL, donors.equicord),
		])
		notify()
	})().finally(() => {
		refreshPromise = undefined
	})

	return refreshPromise
}

export function startDonorRefresh() {
	void refresh()
	if (refreshTimer !== undefined) return
	refreshTimer = setInterval(() => void refresh(), REFRESH_INTERVAL)
}

export function stopDonorRefresh() {
	if (refreshTimer !== undefined) {
		clearInterval(refreshTimer)
		refreshTimer = undefined
	}
}

function badgesFor(map: DonorMap, userId: string): BadgeItem[] {
	const list = map[String(userId)]
	if (!Array.isArray(list)) return []

	return list
		.filter(b => typeof b?.badge === 'string')
		.map(b => ({
			group: 'vencordDonor' as const,
			description: typeof b.tooltip === 'string' ? b.tooltip : 'Donor badge',
			uri: b.badge!,
		}))
}

export function getVencordDonorBadges(userId: string): BadgeItem[] {
	return badgesFor(donors.vencord, userId).map(b => ({
		...b,
		group: 'vencordDonor' as const,
	}))
}

export function getEquicordDonorBadges(userId: string): BadgeItem[] {
	return badgesFor(donors.equicord, userId).map(b => ({
		...b,
		group: 'equicordDonor' as const,
	}))
}

export const donorStore = {
	subscribe,
	getVersion: () => version,
}
