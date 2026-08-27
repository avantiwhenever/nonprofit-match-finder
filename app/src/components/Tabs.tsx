export type TabKey = 'orgs' | 'opportunities' | 'jobs';

interface TabsProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
  counts: Record<TabKey, number>;
}

const TAB_LABELS: Record<TabKey, string> = {
  orgs: 'Nonprofits',
  opportunities: 'Volunteer Opportunities',
  jobs: 'Paid Jobs',
};

export function Tabs({ active, onChange, counts }: TabsProps) {
  return (
    <div className="tabs" role="tablist">
      {(Object.keys(TAB_LABELS) as TabKey[]).map((key) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={active === key}
          className={`tab ${active === key ? 'active' : ''}`}
          onClick={() => onChange(key)}
        >
          {TAB_LABELS[key]} <span className="count">{counts[key]}</span>
        </button>
      ))}
    </div>
  );
}
