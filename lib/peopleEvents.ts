type Listener = () => void;
const listeners = new Set<Listener>();

export const peopleEvents = {
  onRefresh: (fn: Listener) => {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  },
  refresh: () => listeners.forEach(fn => fn()),
};
