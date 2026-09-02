/**
 * Plugin settings page.
 *
 * Lets users toggle badge groups and reorder them (mirroring the desktop
 * plugin's drag-and-drop layout editor, adapted to touch).
 */

import FormSwitch from '@revenge-mod/components/FormSwitch'
import Page from '@revenge-mod/components/Page'
import { useSyncExternalStore } from 'react'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { GROUP_ORDER } from '../lib/groups'
import { getSettings, settingsStore, updateSettings } from '../lib/settings'
import { getAvatarUri, getCurrentUser } from '../lib/stores'
import { ChatBadges } from './badgesRow'
import type { BadgeGroupKey } from '../lib/types'

function useSettingsVersion(): number {
	return useSyncExternalStore(
		settingsStore.subscribe,
		settingsStore.getVersion,
		settingsStore.getVersion,
	)
}

function Preview() {
	useSettingsVersion()

	const user = getCurrentUser()
	if (!user) return null

	const name = user.globalName ?? user.username ?? user.id
	const avatar = getAvatarUri(user)

	return (
		<View style={styles.preview}>
			{avatar ? (
				<Image source={{ uri: avatar }} style={styles.previewAvatar} />
			) : null}
			<Text style={styles.previewName} numberOfLines={1}>
				{name}
			</Text>
			<ChatBadges
				user={{
					id: user.id,
					username: user.username,
					globalName: user.globalName ?? undefined,
					premiumType: 2,
					flags: 131072 | 4,
				}}
			/>
		</View>
	)
}

function GroupRow({ group, index }: { group: BadgeGroupKey; index: number }) {
	useSettingsVersion()

	const settings = getSettings()
	const meta = GROUP_ORDER.find(g => g.key === group)
	if (!meta) return null

	const shown = settings.enabled[group]

	return (
		<View style={styles.row}>
			<Image
				source={{ uri: meta.sampleIcon }}
				style={styles.sampleIcon}
				resizeMode="contain"
			/>
			<Text
				style={[styles.label, !shown && styles.labelDisabled]}
				numberOfLines={1}
			>
				{meta.label}
			</Text>

			<Pressable
				hitSlop={8}
				disabled={index === 0}
				onPress={() => void reorder(group, -1)}
				style={() => [styles.moveBtn, (!shown || index === 0) && styles.dim]}
			>
				<Text style={styles.arrow}>{'▲'}</Text>
			</Pressable>
			<Pressable
				hitSlop={8}
				disabled={index === settings.order.length - 1}
				onPress={() => void reorder(group, +1)}
				style={() => [
					styles.moveBtn,
					{ marginStart: 6 },
					(!shown || index === settings.order.length - 1) && styles.dim,
				]}
			>
				<Text style={styles.arrow}>{'▼'}</Text>
			</Pressable>

			<FormSwitch
				style={styles.switch}
				value={shown}
				onValueChange={(value: boolean) =>
					void updateSettings({
						enabled: { ...settings.enabled, [group]: value },
					})
				}
			/>
		</View>
	)
}

async function reorder(group: BadgeGroupKey, delta: -1 | 1): Promise<void> {
	const order = [...getSettings().order]
	const i = order.indexOf(group)
	const j = i + delta
	if (i < 0 || j < 0 || j >= order.length) return
	;[order[i], order[j]] = [order[j], order[i]]
	await updateSettings({ order })
}

function moveInstruction(index: number): string {
	return index % 2 === 0
		? 'Tap ▲▼ to change position'
		: 'Shown next to usernames in chat'
}

export default function SettingsPage(_props: { api: unknown }) {
	useSettingsVersion()
	const settings = getSettings()

	return (
		<Page style={styles.page} spacing={16} direction="vertical">
			<Text style={styles.header}>ShowBadgesInChat</Text>
			<Text style={styles.description}>
				Badges of the message author will appear next to their name in chat.
				Toggle groups and rearrange them below ({moveInstruction(0)}).
			</Text>

			<Preview />

			{settings.order.map((group, index) => (
				<GroupRow key={group} group={group} index={index} />
			))}
		</Page>
	)
}

const styles = StyleSheet.create({
	page: {
		paddingVertical: 24,
		paddingHorizontal: 12,
	},
	header: {
		fontSize: 22,
		fontWeight: '700',
	},
	description: {
		marginTop: 4,
		opacity: 0.7,
	},
	preview: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		paddingVertical: 10,
	},
	previewAvatar: {
		width: 40,
		height: 40,
		borderRadius: 20,
	},
	previewName: {
		fontSize: 16,
		fontWeight: '600',
		maxWidth: 120,
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 10,
		borderTopWidth: StyleSheet.hairlineWidth,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderColor: '#8883',
	},
	sampleIcon: {
		width: 22,
		height: 22,
		marginEnd: 10,
	},
	label: {
		flex: 1,
		fontSize: 15,
	},
	labelDisabled: {
		opacity: 0.45,
		textDecorationLine: 'line-through',
	},
	moveBtn: {
		width: 28,
		height: 28,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 14,
		backgroundColor: '#8883',
	},
	dim: {
		opacity: 0.35,
	},
	arrow: {
		fontSize: 12,
		lineHeight: 14,
	},
	switch: {
		marginStart: 12,
	},
})
