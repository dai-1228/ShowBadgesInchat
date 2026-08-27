/**
 * Badge group metadata + Discord profile badge definitions.
 *
 * Bit positions and icon hashes mirror the original Vencord/Equicord plugin
 * (`src/equicordplugins/showBadgesInChat/index.tsx`).
 */
import type { BadgeGroupKey, SbicUser } from './types'

export interface GroupMeta {
	key: BadgeGroupKey
	label: string
	sampleIcon: string
}

/** Kept in the same relative order as the original plugin's default positions. */
export const GROUP_ORDER: readonly GroupMeta[] = [
	{
		key: 'equicordDonor',
		label: 'Equicord Donor badges',
		sampleIcon: 'https://badge.equicord.org/donor.webp',
	},
	{
		key: 'equicordContributor',
		label: 'Equicord Contributor',
		sampleIcon: 'https://equicord.org/assets/favicon.png',
	},
	{
		key: 'vencordDonor',
		label: 'Vencord Donor badges',
		sampleIcon: 'https://cdn.discordapp.com/emojis/1026533070955872337.png',
	},
	{
		key: 'vencordContributor',
		label: 'Vencord Contributor',
		sampleIcon: 'https://cdn.discordapp.com/emojis/1092089799109775453.png',
	},
	{
		key: 'discordProfile',
		label: 'Discord profile badges',
		sampleIcon: `https://cdn.discordapp.com/badge-icons/5e74e9b61934fc1f67c65515d1f7e60d.png`,
	},
	{
		key: 'discordNitro',
		label: 'Discord Nitro badge',
		sampleIcon:
			'https://cdn.discordapp.com/badge-icons/2ba85e8026a8614b640c2837bcdfe21b.png',
	},
]

/** [bit, label, icon hash] — order matches the desktop plugin's rendering order. */
const DISCORD_PROFILE_BADGES: ReadonlyArray<readonly [number, string, string]> =
	Object.freeze([
		[0, 'Discord Staff', '5e74e9b61934fc1f67c65515d1f7e60d'],
		[1, 'Partnered Server Owner', '3f9748e53446a137a052f3454e2de41e'],
		[2, 'HypeSquad Events', 'bf01d1073931f921909045f3a39fd264'],
		[6, 'HypeSquad Bravery', '8a88d63823d8a71cd5e390baa45efa02'],
		[7, 'HypeSquad Brilliance', '011940fd013da3f7fb926e4a1cd2e618'],
		[8, 'HypeSquad Balance', '3aa41de486fa12454c3761e8e223442e'],
		[3, 'Discord Bug Hunter', '2717692c7dca7289b35297368a940dd0'],
		[14, 'Discord Bug Hunter', '848f79194d4be5ff5f81505cbd0ce1e6'],
		[17, 'Early Verified Bot Developer', '6df5892e0f35b051f8b61eace34f4967'],
		[9, 'Early Supporter', '7060786766c9c840eb3019e725d2b358'],
		[18, 'Moderator Programs Alumni', 'fee1624003e2fee35cb398e125dc479b'],
	])

export function getDiscordProfileBadgeItems(user: SbicUser) {
	const combined = ((user.flags ?? 0) | (user.publicFlags ?? 0)) >>> 0

	return DISCORD_PROFILE_BADGES.filter(
		def => (combined & (1 << def[0])) !== 0,
	).map(def => ({
		group: 'discordProfile' as const,
		description: def[1],
		uri: `https://cdn.discordapp.com/badge-icons/${def[2]}.png`,
	}))
}

export function getNitroBadgeItem(user: SbicUser) {
	if (!user.premiumType || user.premiumType <= 0) return null

	const name =
		'Discord Nitro' +
		(user.premiumType === 3
			? ' Basic'
			: user.premiumType === 1
				? ' Classic'
				: '')

	return {
		group: 'discordNitro' as const,
		description: name,
		uri: 'https://cdn.discordapp.com/badge-icons/2ba85e8026a8614b640c2837bcdfe21b.png',
	}
}
