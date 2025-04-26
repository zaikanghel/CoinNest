import { Progress } from "@/components/ui/progress";

type StatsCardProps = {
  title: string;
  value: string;
  icon: string;
  iconClass?: string;
  trend?: {
    value: number;
    label?: string;
  };
  progress?: {
    value: number;
    max: number;
    color?: string;
  };
  detail?: {
    label: string;
    value: number | string;
  };
};

export default function StatsCard({
  title,
  value,
  icon,
  iconClass = "bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-300",
  trend,
  progress,
  detail
}: StatsCardProps) {
  return (
    <div className="bg-white dark:bg-dark-900 rounded-xl shadow-sm p-5 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{title}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
        </div>
        <div className={`p-2 rounded-lg ${iconClass}`}>
          <i className={`${icon} text-xl`}></i>
        </div>
      </div>

      {trend && (
        <div className="mt-3 flex items-center text-xs">
          <span className={`flex items-center ${trend.value >= 0 ? 'text-success-500' : 'text-red-500'}`}>
            <i className={`${trend.value >= 0 ? 'ri-arrow-up-line' : 'ri-arrow-down-line'} mr-1`}></i> 
            {Math.abs(trend.value)}%
          </span>
          {trend.label && <span className="text-gray-500 dark:text-gray-400 ml-2">{trend.label}</span>}
        </div>
      )}

      {progress && (
        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1">
            <span>Progress</span>
            <span>{progress.value}/{progress.max}</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-value" 
              style={{ 
                width: `${Math.min(100, Math.round((progress.value / progress.max) * 100))}%`,
                background: progress.color || undefined
              }}
            ></div>
          </div>
        </div>
      )}

      {detail && (
        <div className="mt-3 flex items-center text-xs">
          <span className="text-gray-500 dark:text-gray-400">{detail.label}: </span>
          <span className="ml-1 font-medium">{detail.value}</span>
        </div>
      )}
    </div>
  );
}
