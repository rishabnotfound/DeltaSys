interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  color?: 'blue' | 'green' | 'yellow' | 'red';
}

export default function ProgressBar({
  value,
  max = 100,
  label,
  showPercentage = true,
  color = 'blue'
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  const getColor = () => {
    if (color === 'green') return 'bg-success';
    if (color === 'yellow') return 'bg-warning';
    if (color === 'red') return 'bg-danger';
    return 'bg-accent';
  };

  const getAutoColor = () => {
    if (percentage >= 90) return 'bg-danger';
    if (percentage >= 75) return 'bg-warning';
    return 'bg-accent';
  };

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between mb-1.5">
          <span className="text-sm text-gray-400">{label}</span>
          {showPercentage && (
            <span className="text-sm font-medium text-white">
              {percentage.toFixed(1)}%
            </span>
          )}
        </div>
      )}
      <div className="w-full h-2 bg-border rounded-full overflow-hidden">
        <div
          className={`h-full ${color ? getColor() : getAutoColor()} transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
