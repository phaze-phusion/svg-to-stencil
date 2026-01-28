import { initializePreview } from './app/svg-preview.controller'
import { initializeInterface } from './app/user-interface.controller'

window.addEventListener('DOMContentLoaded', () => {
  initializeInterface();
  initializePreview();
})
