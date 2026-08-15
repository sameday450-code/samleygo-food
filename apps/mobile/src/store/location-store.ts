import { create } from 'zustand';

export interface SavedAddress {
  id: string;
  label: 'Home' | 'Work' | 'Other';
  address: string;
  latitude: number | null;
  longitude: number | null;
  icon: string;
}

interface LocationState {
  // Current delivery address
  address: string;
  latitude: number | null;
  longitude: number | null;

  // Saved addresses
  savedAddresses: SavedAddress[];

  setAddress: (address: string, lat?: number, lng?: number) => void;
  clearLocation: () => void;
  addSavedAddress: (address: Omit<SavedAddress, 'id'>) => void;
  updateSavedAddress: (id: string, address: Partial<SavedAddress>) => void;
  removeSavedAddress: (id: string) => void;
  setSavedAddressAsCurrent: (id: string) => void;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  address: '',
  latitude: null,
  longitude: null,
  savedAddresses: [],

  setAddress: (address, latitude, longitude) =>
    set({ address, latitude, longitude }),

  clearLocation: () =>
    set({ address: '', latitude: null, longitude: null }),

  addSavedAddress: (newAddress) =>
    set((state) => ({
      savedAddresses: [
        ...state.savedAddresses,
        { ...newAddress, id: Date.now().toString() },
      ],
    })),

  updateSavedAddress: (id, updates) =>
    set((state) => ({
      savedAddresses: state.savedAddresses.map((addr) =>
        addr.id === id ? { ...addr, ...updates } : addr,
      ),
    })),

  removeSavedAddress: (id) =>
    set((state) => ({
      savedAddresses: state.savedAddresses.filter((addr) => addr.id !== id),
    })),

  setSavedAddressAsCurrent: (id) => {
    const addr = get().savedAddresses.find((a) => a.id === id);
    if (addr) {
      set({
        address: addr.address,
        latitude: addr.latitude,
        longitude: addr.longitude,
      });
    }
  },
}));
