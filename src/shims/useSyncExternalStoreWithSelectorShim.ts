// src/shims/useSyncExternalStoreWithSelectorShim.ts

// Import the REAL module with a query so our alias does NOT catch it.
// This prevents alias → shim → alias recursion.
import * as Real from 'use-sync-external-store/shim/with-selector.js?real';

// Re-export the named API and also provide a default for callers that expect it.
export const useSyncExternalStoreWithSelector =
  (Real as any).useSyncExternalStoreWithSelector;

export default (Real as any).useSyncExternalStoreWithSelector;
