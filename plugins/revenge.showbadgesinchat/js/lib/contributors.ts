/**
 * Vencord / Equicord contributor lookups.
 *
 * ID lists were generated from `Vencord-main/src/utils/constants.ts` (`Devs`)
 * and `Equicord-main/src/utils/constants.ts` (`EquicordDevs`), excluding devs
 * with `badge: false`. See `../lib/contributorsData.ts`.
 */
import { EQUICORD_CONTRIBUTORS, VENCORD_CONTRIBUTORS } from './contributorsData'

export function isVencordContributor(userId: string): boolean {
	return VENCORD_CONTRIBUTORS.includes(String(userId))
}

export function isEquicordContributor(userId: string): boolean {
	return EQUICORD_CONTRIBUTORS.includes(String(userId))
}
