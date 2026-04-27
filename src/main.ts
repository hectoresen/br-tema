import './app.css'
import { setupI18n } from './i18n'
import { bootstrapApp } from './lib/bootstrap'
import App from './App.svelte'

setupI18n()
bootstrapApp()

const app = new App({
  target: document.getElementById('app')!,
})

export default app
