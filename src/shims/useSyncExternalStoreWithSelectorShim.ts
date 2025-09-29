// src/shims/useSyncExternalStoreWithSelectorShim.ts
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector';

// Re-export so both styles work:
export { useSyncExternalStoreWithSelector };
export default useSyncExternalStoreWithSelector;
