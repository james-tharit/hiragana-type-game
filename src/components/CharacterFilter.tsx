import { useMemo } from 'react';
import type { Group } from '../constants/kanaGroups';

type CharacterFilterProps = {
  groups: Group[];
  selectedGroupIds: string[];
  targetKanaLength: number;
  onToggleGroup: (groupId: string) => void;
};

function CharacterFilter({ groups, selectedGroupIds, targetKanaLength, onToggleGroup }: CharacterFilterProps) {
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

  return (
    <div className="mb-8 rounded-2xl border border-white/10 bg-black/25 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-500">Filter</h2>
        <span className="text-xs text-ink-500">Kana in set: {targetKanaLength}</span>
      </div>

      <div className="space-y-4">
        {groupedFilters.map(([family, items]) => (
          <div key={family}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-ink-500">{family}</p>
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
        ))}
      </div>
    </div>
  );
}

export default CharacterFilter;