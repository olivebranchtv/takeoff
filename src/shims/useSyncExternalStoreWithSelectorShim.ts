// src/shims/useSyncExternalStoreWithSelectorShim.ts
// Provide both default + named export without alias recursion.
import * as Real from 'use-sync-external-store/shim/with-selector.js?real';

export const useSyncExternalStoreWithSelector =
  (Real as any).useSyncExternalStoreWithSelector;

export default (Real as any).useSyncExternalStoreWithSelector;
