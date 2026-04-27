/**
 * Shared SVG string constants for all weather icons.
 * Used by WeatherIcon.svelte (via {@html}) and by Map.svelte marker elements.
 * Content is compile-time constant — never derived from user input.
 */
import type { WeatherIconId } from '../types/weather-icon'

export const ICON_SVGS: Record<WeatherIconId, string> = {
  'sunny': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none">
  <g stroke="currentColor" stroke-width="2" stroke-linecap="round">
    <line x1="24" y1="4" x2="24" y2="8"/>
    <line x1="24" y1="40" x2="24" y2="44"/>
    <line x1="4" y1="24" x2="8" y2="24"/>
    <line x1="40" y1="24" x2="44" y2="24"/>
    <line x1="9.51" y1="9.51" x2="12.34" y2="12.34"/>
    <line x1="35.66" y1="35.66" x2="38.49" y2="38.49"/>
    <line x1="38.49" y1="9.51" x2="35.66" y2="12.34"/>
    <line x1="12.34" y1="35.66" x2="9.51" y2="38.49"/>
  </g>
  <circle cx="24" cy="24" r="9" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.2"/>
</svg>`,

  'partly-cloudy': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none">
  <g stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.85">
    <line x1="32" y1="4" x2="32" y2="7"/>
    <line x1="44" y1="16" x2="41" y2="16"/>
    <line x1="40.24" y1="7.76" x2="38.12" y2="9.88"/>
    <line x1="23.76" y1="7.76" x2="25.88" y2="9.88"/>
    <line x1="40.24" y1="24.24" x2="38.12" y2="22.12"/>
  </g>
  <circle cx="32" cy="16" r="7" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.15"/>
  <path d="M10 34a8 8 0 0 1 0-16 8 8 0 0 1 15.5-3A7 7 0 1 1 34 34H10z"
        stroke="currentColor" stroke-width="2" stroke-linejoin="round" fill="currentColor" fill-opacity="0.25"/>
</svg>`,

  'cloudy': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none">
  <path d="M8 30a7 7 0 0 1 0-14 7 7 0 0 1 13.5-3A6 6 0 1 1 28 30H8z"
        stroke="currentColor" stroke-width="2" stroke-linejoin="round" fill="currentColor" fill-opacity="0.15" opacity="0.6"/>
  <path d="M14 38a8 8 0 0 1 0-16 8 8 0 0 1 15.5-3A7 7 0 1 1 38 38H14z"
        stroke="currentColor" stroke-width="2" stroke-linejoin="round" fill="currentColor" fill-opacity="0.3"/>
</svg>`,

  'fog': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none">
  <g stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.7">
    <line x1="8" y1="16" x2="40" y2="16"/>
    <line x1="12" y1="24" x2="36" y2="24"/>
    <line x1="8" y1="32" x2="40" y2="32"/>
    <line x1="14" y1="40" x2="34" y2="40"/>
  </g>
</svg>`,

  'rain-light': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none">
  <path d="M10 26a8 8 0 0 1 0-16 8 8 0 0 1 15.5-3A7 7 0 1 1 34 26H10z"
        stroke="currentColor" stroke-width="2" stroke-linejoin="round" fill="currentColor" fill-opacity="0.25"/>
  <g stroke="currentColor" stroke-width="2" stroke-linecap="round">
    <line x1="16" y1="33" x2="14" y2="41"/>
    <line x1="26" y1="33" x2="24" y2="41"/>
  </g>
</svg>`,

  'rain-heavy': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none">
  <path d="M10 26a8 8 0 0 1 0-16 8 8 0 0 1 15.5-3A7 7 0 1 1 34 26H10z"
        stroke="currentColor" stroke-width="2" stroke-linejoin="round" fill="currentColor" fill-opacity="0.3"/>
  <g stroke="currentColor" stroke-width="2" stroke-linecap="round">
    <line x1="13" y1="31" x2="10" y2="41"/>
    <line x1="21" y1="31" x2="18" y2="41"/>
    <line x1="29" y1="31" x2="26" y2="41"/>
    <line x1="17" y1="36" x2="14" y2="46"/>
  </g>
</svg>`,

  'snow': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none">
  <path d="M10 26a8 8 0 0 1 0-16 8 8 0 0 1 15.5-3A7 7 0 1 1 34 26H10z"
        stroke="currentColor" stroke-width="2" stroke-linejoin="round" fill="currentColor" fill-opacity="0.25"/>
  <g stroke="currentColor" stroke-width="2" stroke-linecap="round">
    <line x1="15" y1="33" x2="15" y2="41"/>
    <line x1="11" y1="37" x2="19" y2="37"/>
    <line x1="11.93" y1="33.93" x2="18.07" y2="40.07"/>
    <line x1="18.07" y1="33.93" x2="11.93" y2="40.07"/>
    <line x1="28" y1="33" x2="28" y2="41"/>
    <line x1="24" y1="37" x2="32" y2="37"/>
    <line x1="24.93" y1="33.93" x2="31.07" y2="40.07"/>
    <line x1="31.07" y1="33.93" x2="24.93" y2="40.07"/>
  </g>
</svg>`,

  'thunderstorm': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none">
  <path d="M10 26a8 8 0 0 1 0-16 8 8 0 0 1 15.5-3A7 7 0 1 1 34 26H10z"
        stroke="currentColor" stroke-width="2" stroke-linejoin="round" fill="currentColor" fill-opacity="0.35"/>
  <polyline points="22,28 18,38 24,38 20,48"
            stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <line x1="32" y1="31" x2="30" y2="40" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
</svg>`,
}
