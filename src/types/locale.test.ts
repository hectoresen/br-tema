import { describe, it, expect } from 'vitest'
import { SUPPORTED_LOCALES, MVP_LOCALES, DEFAULT_LOCALE } from '../types/locale'
import type { Locale } from '../types/locale'

describe('Locale constants', () => {
  it('DEFAULT_LOCALE is gallego', () => {
    expect(DEFAULT_LOCALE).toBe('gl')
  })

  it('MVP_LOCALES contains es and gl', () => {
    expect(MVP_LOCALES).toContain('es')
    expect(MVP_LOCALES).toContain('gl')
    expect(MVP_LOCALES).toHaveLength(2)
  })

  it('SUPPORTED_LOCALES is a superset of MVP_LOCALES', () => {
    for (const locale of MVP_LOCALES) {
      expect(SUPPORTED_LOCALES).toContain(locale)
    }
  })

  it('all SUPPORTED_LOCALES values are valid Locale type literals', () => {
    const validLocales: Locale[] = ['es', 'gl', 'en', 'pt']
    for (const locale of SUPPORTED_LOCALES) {
      expect(validLocales).toContain(locale)
    }
  })
})
