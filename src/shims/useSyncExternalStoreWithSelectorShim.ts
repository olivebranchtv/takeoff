// src/shims/useSyncExternalStoreWithSelectorShim.ts
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector';

export { useSyncExternalStoreWithSelector };     // named
export default useSyncExternalStoreWithSelector; // default (for callers expecting default)
