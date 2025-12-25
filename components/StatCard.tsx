import ProgressBar from './ProgressBar';

interface StatCardProps {
  label: string;
  value: number;
  unit?: string;
  showProgress?: boolean;
}

export default function StatCard({ label, value, unit = '%', showProgress = true }: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-400">{label}</span>
        <span className="text-2xl font-bold text-white">
          {value.toFixed(1)}{unit}
        </span>
      </div>
      {showProgress && <ProgressBar value={value} showPercentage={false} />}
    </div>
  );
}
