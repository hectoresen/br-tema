import { describe, it, expect, vi, beforeEach } from 'vitest'

// Stub svelte-i18n before importing index
vi.mock('svelte-i18n', () => ({
  addMessages: vi.fn(),
  init: vi.fn(),
  getLocaleFromNavigator: vi.fn(),
}))

import { addMessages, init, getLocaleFromNavigator } from 'svelte-i18n'
import { setupI18n } from './index'

const mockAddMessages = vi.mocked(addMessages)
const mockInit = vi.mocked(init)
const mockGetLocale = vi.mocked(getLocaleFromNavigator)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('setupI18n', () => {
  it('registers all four locale message sets', () => {
    mockGetLocale.mockReturnValue('gl')
    setupI18n()
    const registeredLocales = mockAddMessages.mock.calls.map(([lang]) => lang)
    expect(registeredLocales).toEqual(expect.arrayContaining(['es', 'gl', 'en', 'pt']))
    expect(mockAddMessages).toHaveBeenCalledTimes(4)
  })

  it('uses gl as initial locale when navigator returns gl', () => {
    mockGetLocale.mockReturnValue('gl')
    setupI18n()
    expect(mockInit).toHaveBeenCalledWith(
      expect.objectContaining({ initialLocale: 'gl' })
    )
  })

  it('uses gl as initial locale when navigator returns gl-ES', () => {
    mockGetLocale.mockReturnValue('gl-ES')
    setupI18n()
    expect(mockInit).toHaveBeenCalledWith(
      expect.objectContaining({ initialLocale: 'gl' })
    )
  })

  it('falls back to gl (DEFAULT_LOCALE) when navigator returns unsupported locale', () => {
    mockGetLocale.mockReturnValue('fr')
    setupI18n()
    expect(mockInit).toHaveBeenCalledWith(
      expect.objectContaining({ initialLocale: 'gl' })
    )
  })

  it('falls back to gl when getLocaleFromNavigator returns null', () => {
    mockGetLocale.mockReturnValue(null)
    setupI18n()
    expect(mockInit).toHaveBeenCalledWith(
      expect.objectContaining({ initialLocale: 'gl' })
    )
  })

  it('uses es as initial locale when navigator returns es', () => {
    mockGetLocale.mockReturnValue('es')
    setupI18n()
    expect(mockInit).toHaveBeenCalledWith(
      expect.objectContaining({ initialLocale: 'es' })
    )
  })

  it('sets es as fallbackLocale', () => {
    mockGetLocale.mockReturnValue('gl')
    setupI18n()
    expect(mockInit).toHaveBeenCalledWith(
      expect.objectContaining({ fallbackLocale: 'es' })
    )
  })
})
