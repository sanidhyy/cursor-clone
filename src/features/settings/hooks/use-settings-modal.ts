import { create } from 'zustand';

interface SettingsModalStore {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
}

export const useSettingsModal = create<SettingsModalStore>((set) => ({
  isOpen: false,
  onClose: () => set({ isOpen: false }),
  onOpen: () => set({ isOpen: true }),
}));
