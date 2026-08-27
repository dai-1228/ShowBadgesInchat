/**
 * Shared types for the ShowBadgesInChat plugin.
 */

/** The subset of a Discord user record this plugin relies on. */
export interface SbicUser {
	id: string
	username?: string
	globalName?: string | null
	bot?: boolean
	flags?: number
	publicFlags?: number
	/** Nitro type: 0 = none, 1 = classic, 2 = full, 3 = basic */
	premiumType?: number
}

export type BadgeGroupKey =
	| 'equicordDonor'
	| 'equicordContributor'
	| 'vencordDonor'
	| 'vencordContributor'
	| 'discordProfile'
	| 'discordNitro'

export interface BadgeItem {
	group: BadgeGroupKey
	uri: string
	description: string
}
