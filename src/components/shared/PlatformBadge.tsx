type Platform = 'SF' | 'TS' | 'BOTH';

const CONFIG: Record<Platform, { label: string; cls: string }> = {
  SF:   { label: 'SF',    cls: 'bg-green-50 text-green-700 border-green-200' },
  TS:   { label: 'TS',    cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  BOTH: { label: 'SF+TS', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
};

export default function PlatformBadge({ platform }: { platform?: Platform | string | null }) {
  if (!platform) return null;
  const cfg = CONFIG[platform as Platform] ?? { label: platform, cls: 'bg-gray-50 text-gray-600 border-gray-200' };
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}
