/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.
*/
import type { UserGroupInfo } from '@/lib/api'
import { formatBillingCurrencyFromUSD } from '@/lib/currency'

const PRICE_FORMAT_OPTIONS = {
  digitsLarge: 4,
  digitsSmall: 4,
  abbreviate: false,
}

/**
 * Resolve the actual per-request prices shown to the current user.
 * Billing applies the effective user-to-token-group ratio to the configured
 * base price, so the key screens should show that final amount.
 */
export function getGroupPerRequestPrices(
  groupInfo: UserGroupInfo | undefined
): number[] {
  if (!groupInfo?.per_request_prices) return []

  const ratio =
    typeof groupInfo.ratio === 'number' &&
    Number.isFinite(groupInfo.ratio) &&
    groupInfo.ratio >= 0
      ? groupInfo.ratio
      : 1
  const prices = Object.values(groupInfo.per_request_prices)
    .filter(
      (price) =>
        typeof price === 'number' && Number.isFinite(price) && price >= 0
    )
    .map((price) => price * ratio)
    .map((price) => Number(price.toPrecision(12)))
    .filter((price) => Number.isFinite(price) && price >= 0)

  return [
    ...new Map(
      prices.map((price) => [price.toPrecision(12), price] as const)
    ).values(),
  ].sort((left, right) => left - right)
}

export function getGroupPerRequestLabel(
  groupInfo: UserGroupInfo | undefined,
  billingLabel: string
): string | undefined {
  const prices = getGroupPerRequestPrices(groupInfo)
  if (prices.length === 0) return undefined

  const priceText = prices
    .map((price) => formatBillingCurrencyFromUSD(price, PRICE_FORMAT_OPTIONS))
    .join(' / ')
  return `${billingLabel} · ${priceText}`
}
