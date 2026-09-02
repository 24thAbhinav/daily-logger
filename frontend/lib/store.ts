import { create } from "zustand";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Entry = {
  id: number;
  entry_date: string;
  title: string;
  body: string;
  tag: string;
  created_at: string;
  updated_at?: string;
};

export type User = {
  id: string;
  email: string;
  name: string;
  image?: string | null;
};

type State = {
  // Auth
  user: User | null;
  setUser: (user: User | null) => void;

  // Entries
  entries: Entry[];
  setEntries: (entries: Entry[]) => void;
  addEntry: (entry: Entry) => void;
  updateEntry: (id: number, patch: Partial<Entry>) => void;
  removeEntry: (id: number) => void;

  // UI
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  isLoading: boolean;
  setLoading: (value: boolean) => void;
  error: string | null;
  setError: (value: string | null) => void;
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useLoggerStore = create<State>((set) => ({
  // Auth
  user: null,
  setUser: (user) => set({ user }),

  // Entries
  entries: [],
  setEntries: (entries) => set({ entries, isLoading: false, error: null }),
  addEntry: (entry) =>
    set((state) => ({ entries: [entry, ...state.entries] })),
  updateEntry: (id, patch) =>
    set((state) => ({
      entries: state.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    })),
  removeEntry: (id) =>
    set((state) => ({ entries: state.entries.filter((e) => e.id !== id) })),

  // UI
  selectedDate: new Date().toISOString().slice(0, 10),
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  isLoading: true,
  setLoading: (isLoading) => set({ isLoading }),
  error: null,
  setError: (error) => set({ error, isLoading: false }),
}));
