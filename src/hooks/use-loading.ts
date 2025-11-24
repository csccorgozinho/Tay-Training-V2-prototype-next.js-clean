import { create } from 'zustand';

interface LoadingStore {
  isLoading: boolean;
  loadingCount: number;
  startLoading: () => void;
  stopLoading: () => void;
}

export const useLoading = create<LoadingStore>(set => ({
  isLoading: false,
  loadingCount: 0,
  startLoading: () =>
    set(state => {
      const newCount = state.loadingCount + 1;
      return { loadingCount: newCount, isLoading: true };
    }),
  stopLoading: () =>
    set(state => {
      const newCount = Math.max(0, state.loadingCount - 1);
      return { loadingCount: newCount, isLoading: newCount > 0 };
    }),
}));
