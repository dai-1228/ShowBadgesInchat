/**
 * Computes the list of badges to display for a user, honoring the user's
 * configured group order and visibility settings.
 */
import { isEquicordContributor, isVencordContributor } from './contributors'
import { getEquicordDonorBadges, getVencordDonorBadges } from './donors'
import { getDiscordProfileBadgeItems, getNitroBadgeItem } from './groups'
import { getSettings } from './settings'
import type { BadgeGroupKey, BadgeItem, SbicUser } from './types'

const contributorBadgeCache = new Map<string, string>([
	['vencord', 'https://cdn.discordapp.com/emojis/1092089799109775453.png'],
	['equicord', 'https://equicord.org/assets/favicon.png'],
])

function contributorItem(
	vendor: 'vencord' | 'equicord',
	user: SbicUser,
): BadgeItem | null {
	const id = String(user.id)
	const isDev =
		vendor === 'vencord' ? isVencordContributor(id) : isEquicordContributor(id)
	if (!isDev) return null

	return {
		group: (vendor === 'vencord'
			? 'vencordContributor'
			: 'equicordContributor') as BadgeGroupKey,
		description:
			vendor === 'vencord' ? 'Vencord Contributor' : 'Equicord Contributor',
		uri: contributorBadgeCache.get(vendor)!,
	}
}

/** All badges for a user in display order. React-free so it can be used anywhere. */
export function computeBadges(user: SbicUser): BadgeItem[] {
	const { enabled, order } = getSettings()

	const byGroup = new Map<BadgeGroupKey, BadgeItem[]>()

	const push = (key: BadgeGroupKey, item: BadgeItem | BadgeItem[] | null) => {
		if (!item) return
		const list = Array.isArray(item) ? item : [item]
		if (list.length === 0) return
		const existing = byGroup.get(key) ?? []
		existing.push(...list)
		byGroup.set(key, existing)
	}

	push('equicordDonor', getEquicordDonorBadges(user.id))
	push('equicordContributor', contributorItem('equicord', user))
	push('vencordDonor', getVencordDonorBadges(user.id))
	push('vencordContributor', contributorItem('vencord', user))
	push('discordProfile', getDiscordProfileBadgeItems(user))
	push('discordNitro', getNitroBadgeItem(user))

	const out: BadgeItem[] = []
	for (const key of order) {
		if (!enabled[key]) continue
		out.push(...(byGroup.get(key) ?? []))
	}
	return out
}
