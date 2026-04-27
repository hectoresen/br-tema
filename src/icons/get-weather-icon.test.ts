import { describe, it, expect } from 'vitest'
import { getWeatherIcon } from './get-weather-icon'
import type { SlotForecast } from '../types/forecast'

function makeSlot(overrides: Partial<SlotForecast> = {}): SlotForecast {
  return {
    slot: 'morning',
    weatherCode: 0,
    temperature: { min: 10, max: 20, current: 15 },
    precipitation: { value: 0, probability: 0 },
    wind: { speed: 10, direction: 180 },
    humidity: 60,
    cloudCover: 0,
    ...overrides,
  }
}

describe('getWeatherIcon', () => {
  it('returns sunny for clear sky', () => {
    expect(getWeatherIcon(makeSlot({ cloudCover: 5 }))).toBe('sunny')
  })

  it('returns partly-cloudy at 50% cloudCover', () => {
    expect(getWeatherIcon(makeSlot({ cloudCover: 50 }))).toBe('partly-cloudy')
  })

  it('returns cloudy at 80% cloudCover', () => {
    expect(getWeatherIcon(makeSlot({ cloudCover: 80 }))).toBe('cloudy')
  })

  it('returns fog for WMO code 45', () => {
    expect(getWeatherIcon(makeSlot({ weatherCode: 45 }))).toBe('fog')
  })

  it('returns fog for WMO code 48', () => {
    expect(getWeatherIcon(makeSlot({ weatherCode: 48 }))).toBe('fog')
  })

  it('returns rain-light when probability ≥ 40%', () => {
    expect(
      getWeatherIcon(makeSlot({ precipitation: { value: 0, probability: 45 } }))
    ).toBe('rain-light')
  })

  it('returns rain-light for WMO drizzle code 51', () => {
    expect(getWeatherIcon(makeSlot({ weatherCode: 51 }))).toBe('rain-light')
  })

  it('returns rain-heavy when precip value ≥ 4 mm', () => {
    expect(
      getWeatherIcon(makeSlot({ precipitation: { value: 5, probability: 0 } }))
    ).toBe('rain-heavy')
  })

  it('returns rain-heavy for high probability + heavy cloudCover', () => {
    expect(
      getWeatherIcon(
        makeSlot({ cloudCover: 80, precipitation: { value: 0, probability: 75 } })
      )
    ).toBe('rain-heavy')
  })

  it('returns rain-heavy for WMO heavy rain code 65', () => {
    expect(getWeatherIcon(makeSlot({ weatherCode: 65 }))).toBe('rain-heavy')
  })

  it('returns snow for WMO snow code 73', () => {
    expect(getWeatherIcon(makeSlot({ weatherCode: 73 }))).toBe('snow')
  })

  it('returns snow when below-freezing + precipitation', () => {
    expect(
      getWeatherIcon(
        makeSlot({
          temperature: { min: 0, max: 3, current: 1 },
          precipitation: { value: 1, probability: 50 },
        })
      )
    ).toBe('snow')
  })

  it('returns thunderstorm for WMO code 95', () => {
    expect(getWeatherIcon(makeSlot({ weatherCode: 95 }))).toBe('thunderstorm')
  })

  it('returns thunderstorm for WMO code 99', () => {
    expect(getWeatherIcon(makeSlot({ weatherCode: 99 }))).toBe('thunderstorm')
  })

  it('thunderstorm takes priority over rain', () => {
    expect(
      getWeatherIcon(
        makeSlot({
          weatherCode: 95,
          precipitation: { value: 10, probability: 90 },
        })
      )
    ).toBe('thunderstorm')
  })

  it('snow takes priority over rain', () => {
    expect(
      getWeatherIcon(
        makeSlot({
          weatherCode: 73,
          precipitation: { value: 5, probability: 80 },
        })
      )
    ).toBe('snow')
  })

  it('all 8 WeatherIconId values are reachable', () => {
    const results = new Set([
      getWeatherIcon(makeSlot({ cloudCover: 5 })),
      getWeatherIcon(makeSlot({ cloudCover: 50 })),
      getWeatherIcon(makeSlot({ cloudCover: 80 })),
      getWeatherIcon(makeSlot({ weatherCode: 45 })),
      getWeatherIcon(makeSlot({ precipitation: { value: 0, probability: 45 } })),
      getWeatherIcon(makeSlot({ precipitation: { value: 5, probability: 0 } })),
      getWeatherIcon(makeSlot({ weatherCode: 73 })),
      getWeatherIcon(makeSlot({ weatherCode: 95 })),
    ])
    expect(results.size).toBe(8)
  })
})
