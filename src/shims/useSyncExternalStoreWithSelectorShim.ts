// src/shims/useSyncExternalStoreWithSelectorShim.ts
// Re-export as both named and default so consumers using either style work.
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector';

export { useSyncExternalStoreWithSelector };
export default useSyncExternalStoreWithSelector;
