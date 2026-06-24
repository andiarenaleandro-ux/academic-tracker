export function Tabs({ value, onChange, tabs }: {
  value: string;
  onChange: (v: string) => void;
  tabs: { key: string; label: string }[];
}) {
  return (
    <div className="flex gap-1 border-b border-zinc-800 mb-4">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            value === tab.key
              ? "border-zinc-100 text-zinc-100"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
