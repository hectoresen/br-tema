import { describe, it, expect, vi } from 'vitest'
import { get } from 'svelte/store'

vi.mock('../providers/index', () => ({
  activeProvider: {
    getAlerts: vi.fn().mockResolvedValue([
      {
        id: 'test-001',
        severity: 'yellow',
        phenomenon: 'wind',
        provinceIds: ['corunha'],
        startTime: '2024-06-01T08:00:00Z',
        endTime: '2024-06-01T20:00:00Z',
        description: 'Viento fuerte',
      },
    ]),
  },
}))

const { alerts } = await import('./alerts')

describe('alerts store', () => {
  it('starts with empty alerts, not loading', () => {
    const state = get(alerts)
    expect(state.loading).toBe(false)
    expect(Array.isArray(state.alerts)).toBe(true)
  })

  it('load() populates alerts from provider', async () => {
    await alerts.load()
    const state = get(alerts)
    expect(state.alerts).toHaveLength(1)
    expect(state.alerts[0].id).toBe('test-001')
    expect(state.loading).toBe(false)
    expect(state.error).toBeNull()
  })

  it('falls back to mock-alerts on provider error', async () => {
    const { activeProvider } = await import('../providers/index')
    vi.spyOn(activeProvider, 'getAlerts').mockRejectedValueOnce(
      new Error('API down')
    )
    await alerts.load()
    const state = get(alerts)
    // Should still have alerts (fallback), and error should be recorded
    expect(Array.isArray(state.alerts)).toBe(true)
    expect(state.alerts.length).toBeGreaterThan(0)
    expect(state.error).toMatch('API down')
  })
})
