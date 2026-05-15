import { useEffect, useMemo, useState } from 'react';
import type { Group } from '../constants/kanaGroups';

type CharacterFilterProps = {
  groups: Group[];
  selectedGroupIds: string[];
  targetKanaLength: number;
  onToggleGroup: (groupId: string) => void;
  onToggleAllGroups: () => void;
  onToggleGroupFamily: (groupIds: string[]) => void;
};

function CharacterFilter({
  groups,
  selectedGroupIds,
  targetKanaLength,
  onToggleGroup,
  onToggleAllGroups,
  onToggleGroupFamily,
}: CharacterFilterProps) {
  const [isFolded, setIsFolded] = useState(true);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.code === 'Space' &&
        !event.ctrlKey && !event.metaKey && !event.altKey &&
        (document.activeElement as HTMLElement | null)?.dataset?.testid !== 'input-zone'
      ) {
        setIsFolded((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const groupedFilters = useMemo(() => {
    const map = new Map<string, Group[]>();

    groups.forEach((group) => {
      const familyGroups = map.get(group.family);
      if (familyGroups) {
        familyGroups.push(group);
        return;
      }

      map.set(group.family, [group]);
    });

    return Array.from(map.entries());
  }, [groups]);

  const allSelected = selectedGroupIds.length === groups.length;
  const selectedGroupLabels = useMemo(() => {
    if (selectedGroupIds.length === 0) {
      return 'None selected';
    }

    if (selectedGroupIds.length === groups.length) {
      return 'All selected';
    }

    return groups
      .filter((group) => selectedGroupIds.includes(group.id))
      .map((group) => group.label)
      .join(', ');
  }, [groups, selectedGroupIds]);

  return (
    <div className="mb-8 rounded-2xl border border-white/10 bg-black/25 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-500">Filter</h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-ink-500">Kana in set: {targetKanaLength}</span>
          <div className="group relative">
            <button
              type="button"
              onClick={() => setIsFolded((prev) => !prev)}
              aria-expanded={!isFolded}
              className="rounded-md border border-white/20 bg-white/5 px-2.5 py-1 text-xs font-medium text-ink-500 transition hover:bg-white/10 hover:text-ink-100"
            >
              {isFolded ? 'Show filters' : 'Hide filters'}
            </button>
            <span className="pointer-events-none absolute -bottom-2 left-1/2 -translate-x-1/2 rounded bg-black/80 px-1.5 py-0.5 text-[10px] text-ink-400">
              Space
            </span>
          </div>
        </div>
      </div>

      {isFolded && (
        <p className="text-xs text-ink-500">
          Selected: <span className="text-ink-100">{selectedGroupLabels}</span>
        </p>
      )}

      {!isFolded && (
        <>
          <div className="mb-4">
            <button
              type="button"
              onClick={onToggleAllGroups}
              className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                allSelected
                  ? 'border-ink-100 bg-ink-100 text-ink-950'
                  : 'border-white/20 bg-white/5 text-ink-500 hover:bg-white/10 hover:text-ink-100'
              }`}
            >
              {allSelected ? 'De-select all' : 'Select all'}
            </button>
          </div>

          <div className="space-y-4">
            {groupedFilters.map(([family, items]) => {
              const familyIds = items.map((item) => item.id);
              const familySelected = familyIds.every((groupId) => selectedGroupIds.includes(groupId));

              return (
                <div key={family}>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-500">{family}</p>
                    <button
                      type="button"
                      onClick={() => onToggleGroupFamily(familyIds)}
                      className={`rounded-md border px-2.5 py-1 text-xs transition ${
                        familySelected
                          ? 'border-ink-100 bg-ink-100 text-ink-950'
                          : 'border-white/20 bg-white/5 text-ink-500 hover:bg-white/10 hover:text-ink-100'
                      }`}
                    >
                      {familySelected ? 'De-select family' : 'Select family'}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {items.map((group) => {
                      const active = selectedGroupIds.includes(group.id);
                      return (
                        <button
                          key={group.id}
                          type="button"
                          onClick={() => onToggleGroup(group.id)}
                          className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                            active
                              ? 'border-ink-100 bg-ink-100 text-ink-950'
                              : 'border-white/20 bg-white/5 text-ink-500 hover:bg-white/10 hover:text-ink-100'
                          }`}
                        >
                          {group.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default CharacterFilter;