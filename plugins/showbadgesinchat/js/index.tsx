/**
 * ShowBadgesInChat — Revenge plugin entry point.
 *
 * Port of the Equicord/Vencord `showBadgesInChat` plugin
 * (https://github.com/Equicord/Equicord) to Revenge, working on both Android
 * and iOS Discord clients.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later (matches the original work).
 */

import { startDonorRefresh, stopDonorRefresh } from './lib/donors'
import { installPatches } from './lib/patch'
import { initStores } from './lib/stores'
import SettingsPage from './ui/settings'

let unpatchPatches: (() => void) | undefined

export default plugin({
	start() {
		initStores()
		startDonorRefresh()
		unpatchPatches = installPatches()
		console.log('[ShowBadgesInChat] started')
	},

	stop() {
		try {
			unpatchPatches?.()
		} catch {}
		unpatchPatches = undefined
		stopDonorRefresh()
		console.log('[ShowBadgesInChat] stopped')
	},

	SettingsComponent: SettingsPage,
})
