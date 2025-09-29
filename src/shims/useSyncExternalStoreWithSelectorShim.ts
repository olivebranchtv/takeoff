// src/shims/useSyncExternalStoreWithSelectorShim.ts
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector';

export { useSyncExternalStoreWithSelector };
// Provide a default for code that (incorrectly) default-imports it.
export default useSyncExternalStoreWithSelector;
