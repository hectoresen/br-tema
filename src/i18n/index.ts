import { addMessages, init, getLocaleFromNavigator } from 'svelte-i18n'
import { DEFAULT_LOCALE, MVP_LOCALES, type Locale } from '../types/locale'

import es from './es.json'
import gl from './gl.json'
import en from './en.json'
import pt from './pt.json'

function resolveLocale(): string {
  const nav = getLocaleFromNavigator()
  if (!nav) return DEFAULT_LOCALE
  // Match on base language code (e.g. 'gl-ES' → 'gl')
  const base = nav.split('-')[0] as Locale
  return MVP_LOCALES.includes(base) ? base : DEFAULT_LOCALE
}

export function setupI18n(): void {
  addMessages('es', es)
  addMessages('gl', gl)
  addMessages('en', en)
  addMessages('pt', pt)

  init({
    fallbackLocale: 'es',
    initialLocale: resolveLocale(),
  })
}
