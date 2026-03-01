export interface CurrencyConfig {
  code: string
  symbol: string
  locale: string
  symbolPosition: 'after' | 'before'
}

export const CURRENCY_PRESETS = [
  {
    code: 'RUB',
    label: 'Рубль (₽)',
    symbol: '₽',
    locale: 'ru-RU',
    symbolPosition: 'after' as const,
  },
  {
    code: 'USD',
    label: 'Доллар ($)',
    symbol: '$',
    locale: 'en-US',
    symbolPosition: 'before' as const,
  },
  {
    code: 'EUR',
    label: 'Евро (€)',
    symbol: '€',
    locale: 'de-DE',
    symbolPosition: 'before' as const,
  },
  {
    code: 'GBP',
    label: 'Фунт (£)',
    symbol: '£',
    locale: 'en-GB',
    symbolPosition: 'before' as const,
  },
  {
    code: 'KZT',
    label: 'Тенге (₸)',
    symbol: '₸',
    locale: 'ru-KZ',
    symbolPosition: 'after' as const,
  },
] as const

export const DEFAULT_CURRENCY: CurrencyConfig = {
  code: 'RUB',
  symbol: '₽',
  locale: 'ru-RU',
  symbolPosition: 'after',
}

export function formatCurrencyValue(amount: number, currency: CurrencyConfig): string {
  const formatter = new Intl.NumberFormat(currency.locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })

  const formatted = formatter.format(Math.round(amount))

  if (currency.symbolPosition === 'before') {
    return `${currency.symbol}${formatted}`
  }
  return `${formatted} ${currency.symbol}`
}
