/**
 * The badge row rendered next to message author names.
 */
import { useSyncExternalStore } from 'react'
import { Image, StyleSheet, View } from 'react-native'
import { computeBadges } from '../lib/compute'
import { donorStore } from '../lib/donors'
import { getSettings, settingsStore } from '../lib/settings'
import type { SbicUser } from '../lib/types'

function useExternalValue(
	subscribe: (cb: () => void) => () => void,
	getVersion: () => number,
) {
	return useSyncExternalStore(subscribe, getVersion, getVersion)
}

export const BADGE_ROW_MARKER = 'sbic-badge-row'

export function ChatBadges({ user }: { user: SbicUser }) {
	useExternalValue(settingsStore.subscribe, settingsStore.getVersion)
	useExternalValue(donorStore.subscribe, donorStore.getVersion)

	const items = computeBadges(user)
	if (items.length === 0) return null

	const size = getSettings().size

	return (
		<View
			style={styles.row}
			key={`${BADGE_ROW_MARKER}-${user.id}`}
			testID={BADGE_ROW_MARKER}
		>
			{items.map((item, i) => (
				<Image
					key={`${item.group}:${item.uri}:${i}`}
					source={{ uri: item.uri }}
					style={{ width: size, height: size, marginStart: i === 0 ? 0 : 3 }}
					resizeMode="contain"
					accessible
					accessibilityLabel={item.description}
				/>
			))}
		</View>
	)
}

const styles = StyleSheet.create({
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'flex-start',
		marginStart: -3,
		marginTop: 2,
	},
})
