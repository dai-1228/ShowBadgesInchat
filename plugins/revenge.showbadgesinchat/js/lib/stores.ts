/**
 * Minimal access to Discord stores used by the settings page.
 */
import { getStore } from '@revenge-mod/discord/flux'

export interface CurrentUserRecord {
	id: string
	username?: string
	globalName?: string | null
	getAvatarURL?: (...args: unknown[]) => string | { uri: string } | number
}

let userStore: Record<string, any> | undefined
let cancelStoreWait: (() => void) | undefined

/** Registers the store waiter — safe to call during `start`. */
export function initStores(): void {
	if (cancelStoreWait) return
	cancelStoreWait = getStore<Record<string, any>>('UserStore', store => {
		userStore = store
	})
}

/** Cancels the store waiter and drops cached state — call during `stop`. */
export function stopStores(): void {
	cancelStoreWait?.()
	cancelStoreWait = undefined
	userStore = undefined
}

export function getCurrentUser(): CurrentUserRecord | null {
	const u = userStore?.getCurrentUser?.()
	return (u ?? null) as CurrentUserRecord | null
}

export function getAvatarUri(user: CurrentUserRecord): string | null {
	try {
		const url = user.getAvatarURL?.()
		if (typeof url === 'string') return url
		if (url && typeof url === 'object' && typeof url.uri === 'string')
			return url.uri
	} catch {
		// fallthrough
	}
	return null
}
