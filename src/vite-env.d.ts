/// <reference types="vite/client" />

declare global {
  interface Window {
    upgradeInProgress?: Set<string>;
  }
}