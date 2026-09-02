/**
 * Injects the badge row into Discord's rendered message-header trees.
 *
 * Strategy mirrors the proven approach used by current mobile plugins
 * (e.g. "Staff Tags"): locate the row container in the returned element tree,
 * then splice our badge row into its children. Falls back gracefully when the
 * tree shape doesn't match expectations, so unknown future layouts degrade to
 * "no badges" instead of crashing chat.
 */
import { isValidElement } from 'react'
import { BADGE_ROW_MARKER, ChatBadges } from '../ui/badgesRow'
import type { SbicUser } from './types'

/** Max traversal depth for locating the row container / duplicates. */
const MAX_DEPTH = 10

interface HostNode {
	node: Record<string, any>
	depth: number
}

/** Breadth-first search over React element trees via `props.children`. */
function bfsLevels(root: unknown): HostNode[] {
	const out: HostNode[] = []
	if (!isValidElement(root)) return out

	let level = 0
	let frontier: unknown[] = [root]

	while (frontier.length > 0 && level < MAX_DEPTH) {
		const next: unknown[] = []

		for (const node of frontier) {
			if (!isValidElement(node)) continue
			out.push({ node: node as unknown as Record<string, any>, depth: level })

			const props = (node as Record<string, any>).props
			if (!props || typeof props !== 'object') continue

			let children = props.children
			if (typeof children === 'function') continue // render-prop; don't invoke it
			if (!Array.isArray(children)) children = [children]
			for (const child of children) next.push(child)
		}

		frontier = next
		level++
	}

	return out
}

/** Checks whether an element subtree already contains one of our badge rows. */
export function containsBadgeRow(root: unknown): boolean {
	return bfsLevels(root).some(({ node }) => {
		const props = node?.props
		if (!props) return false
		if (
			typeof props.testID === 'string' &&
			props.testID.startsWith(BADGE_ROW_MARKER)
		)
			return true
		// React keeps `key` on the element itself, never inside `props`.
		return typeof node.key === 'string' && node.key.startsWith(BADGE_ROW_MARKER)
	})
}

function styleFlexDirection(node: Record<string, any>): string | undefined {
	const style = node?.props?.style
	if (Array.isArray(style)) {
		for (let i = style.length - 1; i >= 0; i--) {
			const s = style[i]
			if (s && typeof s === 'object' && s.flexDirection) return s.flexDirection
		}
		return undefined
	}
	return style && typeof style === 'object' ? style.flexDirection : undefined
}

function hasReactChildHost(children: unknown[]): boolean {
	return children.some(c => isValidElement(c))
}

/**
 * Mutates `root`'s subtree so that `<ChatBadges />` renders beside the name.
 * Returns true when injection succeeded.
 */
export function injectBadgeRow(root: unknown, user: SbicUser): boolean {
	try {
		if (containsBadgeRow(root)) return true // someone (another patch of ours) already injected

		const levels = bfsLevels(root)

		// Preferred host: shallowest element laid out as a row.
		let host =
			levels.find(
				l =>
					styleFlexDirection(l.node) === 'row' &&
					Array.isArray(l.node.props.children),
			) ??
			levels.find(
				l =>
					styleFlexDirection(l.node) === 'row' &&
					hasReactChildHost(
						Array.isArray(l.node.props.children)
							? l.node.props.children
							: [l.node.props.children].filter(Boolean),
					),
			)

		// Fallback: shallowest element with an array of children that includes React children.
		host ??= levels.find(
			l =>
				Array.isArray(l.node.props.children) &&
				l.depth > 0 &&
				hasReactChildHost(l.node.props.children),
		)

		if (!host) return false

		const node = host.node
		let children = node.props.children

		// Copy before mutating: the original array may be shared/frozen by React.
		if (Array.isArray(children)) children = children.slice()
		else children = [children]

		const badgeEl = <ChatBadges key={BADGE_ROW_MARKER} user={user} />

		// Place badges between the display-name text and any trailing tag pill
		// (elements exposing a `.Types` static are Discord's bot/system tags).
		let insertAt = -1
		for (let i = children.length - 1; i >= 0; i--) {
			const type = (children[i] as Record<string, any>)?.type
			if (type && typeof type === 'function' && 'Types' in type) insertAt = i
		}

		if (insertAt >= 0) children.splice(insertAt, 0, badgeEl)
		else children.push(badgeEl)

		node.props.children = children
		return true
	} catch (e) {
		console.log('[ShowBadgesInChat] failed to inject badge row:', e)
		return false
	}
}

interface DisplayNameLikeProps {
	user?: SbicUser
	message?: { author?: SbicUser }
	author?: SbicUser
	channelId?: string | bigint | number
}

/**
 * Extracts the relevant author user record from message-header component props.
 */
export function extractHeaderAuthor(
	props: DisplayNameLikeProps | undefined | null,
): SbicUser | null {
	const u = props?.user ?? props?.message?.author ?? props?.author
	if (!u || typeof u !== 'object') return null
	const id = String((u as SbicUser).id ?? '')
	if (!id || id === '' || id === 'undefined' || id === 'null') return null
	return u as SbicUser
}
