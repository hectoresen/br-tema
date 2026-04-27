/**
 * Forecast data store with in-memory cache.
 *
 * Cache key format: `${type}:${id}:${days}`
 *   type  — "province" | "concello" | "latlon"
 *   id    — provinceId, concelloId, or "${lat},${lon}"
 *   days  — number of days requested
 *
 * Entries never expire in this MVP (app lifetime = single session).
 * Future iterations can add TTL or invalidation on provider change.
 */

import { writable } from 'svelte/store'
import type { DayForecast } from '../types/forecast'
import { activeProvider } from '../providers/index'

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

const forecastCache = new Map<string, DayForecast[]>()

function cacheKey(type: string, id: string, days: number): string {
  return `${type}:${id}:${days}`
}

// ---------------------------------------------------------------------------
// Loading / error state per cache key
// ---------------------------------------------------------------------------

interface ForecastState {
  data: Map<string, DayForecast[]>
  loading: Set<string>
  errors: Map<string, string>
}

function createForecastStore() {
  const { subscribe, update } = writable<ForecastState>({
    data: forecastCache,
    loading: new Set(),
    errors: new Map(),
  })

  function setLoading(key: string, isLoading: boolean) {
    update((s) => {
      const loading = new Set(s.loading)
      if (isLoading) loading.add(key)
      else loading.delete(key)
      return { ...s, loading }
    })
  }

  function setError(key: string, message: string | null) {
    update((s) => {
      const errors = new Map(s.errors)
      if (message) errors.set(key, message)
      else errors.delete(key)
      return { ...s, errors }
    })
  }

  function setData(key: string, data: DayForecast[]) {
    forecastCache.set(key, data)
    update((s) => ({ ...s, data: forecastCache }))
  }

  async function loadProvince(provinceId: string, days = 4): Promise<void> {
    const key = cacheKey('province', provinceId, days)
    if (forecastCache.has(key)) return
    setLoading(key, true)
    setError(key, null)
    try {
      const data = await activeProvider.getProvinceForecast(provinceId, days)
      setData(key, data)
    } catch (err) {
      setError(key, err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(key, false)
    }
  }

  async function loadConcello(concelloId: string, days = 4): Promise<void> {
    const key = cacheKey('concello', concelloId, days)
    if (forecastCache.has(key)) return
    setLoading(key, true)
    setError(key, null)
    try {
      const data = await activeProvider.getConcelloForecast(concelloId, days)
      setData(key, data)
    } catch (err) {
      setError(key, err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(key, false)
    }
  }

  function getProvince(provinceId: string, days = 4): DayForecast[] | undefined {
    return forecastCache.get(cacheKey('province', provinceId, days))
  }

  function getConcello(concelloId: string, days = 4): DayForecast[] | undefined {
    return forecastCache.get(cacheKey('concello', concelloId, days))
  }

  function isLoading(key: string): boolean {
    // Read current state synchronously
    let result = false
    const unsub = subscribe((s) => { result = s.loading.has(key) })
    unsub()
    return result
  }

  function getError(key: string): string | undefined {
    let result: string | undefined
    const unsub = subscribe((s) => { result = s.errors.get(key) })
    unsub()
    return result
  }

  return {
    subscribe,
    loadProvince,
    loadConcello,
    getProvince,
    getConcello,
    isLoading,
    getError,
    /** Exposed for testing only */
    _cacheKey: cacheKey,
  }
}

export const forecastData = createForecastStore()
