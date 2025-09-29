// src/shims/useSyncExternalStoreWithSelectorShim.ts
import { useSyncExternalStoreWithSelector } from '#use-sync-external-store-original';

export { useSyncExternalStoreWithSelector };
// Provide a default for code that (incorrectly) default-imports it.
export default useSyncExternalStoreWithSelector;
