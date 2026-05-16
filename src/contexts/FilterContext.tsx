import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { DEFAULT_GROUPS, GROUPS } from '../constants/kanaGroups';

type FilterContextValue = {
  selectedGroupIds: string[];
  allGroupIds: string[];
  toggleGroup: (groupId: string) => void;
  toggleAllGroups: () => void;
  toggleGroupFamily: (familyGroupIds: string[]) => void;
};

const FilterContext = createContext<FilterContextValue | null>(null);

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(DEFAULT_GROUPS);
  const allGroupIds = useMemo(() => GROUPS.map((g) => g.id), []);

  const toggleGroup = useCallback((groupId: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId],
    );
  }, []);

  const toggleAllGroups = useCallback(() => {
    setSelectedGroupIds((prev) => (prev.length === allGroupIds.length ? [] : allGroupIds));
  }, [allGroupIds]);

  const toggleGroupFamily = useCallback((familyGroupIds: string[]) => {
    setSelectedGroupIds((prev) => {
      const familyFullySelected = familyGroupIds.every((id) => prev.includes(id));
      return familyFullySelected
        ? prev.filter((id) => !familyGroupIds.includes(id))
        : Array.from(new Set([...prev, ...familyGroupIds]));
    });
  }, []);

  return (
    <FilterContext.Provider
      value={{ selectedGroupIds, allGroupIds, toggleGroup, toggleAllGroups, toggleGroupFamily }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilterContext(): FilterContextValue {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilterContext must be used within FilterProvider');
  return ctx;
}
