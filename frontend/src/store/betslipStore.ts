// Re-exporting from the central betting store to fix build paths cleanly
import { useBettingStore } from './bettingStore';

export const useBetslipStore = useBettingStore;