/**
 * Alerts store.
 *
 * Loads alerts from the active provider's getAlerts() method.
 * Falls back to mock-alerts.json if the provider does not implement getAlerts
 * or if the request fails.
 */

import { writable } from 'svelte/store'
import type { Alert } from '../types/alert'
import { activeProvider } from '../providers/index'
import mockAlerts from '../data/mock-alerts.json'

interface AlertsState {
  alerts: Alert[]
  loading: boolean
  error: string | null
}

function createAlertsStore() {
  const { subscribe, set, update } = writable<AlertsState>({
    alerts: [],
    loading: false,
    error: null,
  })

  async function load(): Promise<void> {
    update((s) => ({ ...s, loading: true, error: null }))
    try {
      const data = activeProvider.getAlerts
        ? await activeProvider.getAlerts()
        : (mockAlerts as Alert[])
      set({ alerts: data, loading: false, error: null })
    } catch (err) {
      // Degraded: show mock alerts so the UI always has something to render
      set({
        alerts: mockAlerts as Alert[],
        loading: false,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return { subscribe, load }
}

export const alerts = createAlertsStore()
