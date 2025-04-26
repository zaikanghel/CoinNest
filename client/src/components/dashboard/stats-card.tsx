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
    premium?: {
      baseMax: number;
      bonus: number;
    }
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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-lg hover:transform hover:translate-y-[-2px]">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{title}</p>
          <h3 className="text-2xl font-bold mt-1 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${iconClass} shadow-sm`}>
          <i className={`${icon} text-xl`}></i>
        </div>
      </div>

      {trend && (
        <div className="mt-3 flex items-center text-xs">
          <span className={`flex items-center px-2 py-1 rounded-full ${trend.value >= 0 ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
            <i className={`${trend.value >= 0 ? 'ri-arrow-up-line' : 'ri-arrow-down-line'} mr-1`}></i> 
            {Math.abs(trend.value)}%
          </span>
          {trend.label && <span className="text-gray-500 dark:text-gray-400 ml-2">{trend.label}</span>}
        </div>
      )}

      {progress && (
        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium">Daily Progress</span>
            <span className="font-medium">{progress.value}/{progress.max}</span>
          </div>
          
          {/* Premium progress with bonus indicator */}
          {progress.premium ? (
            <div className="relative">
              <div className="absolute inset-0 flex">
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  {/* Base limit section */}
                  <div 
                    className="h-full bg-gradient-to-r from-gray-400 to-gray-500 dark:from-gray-600 dark:to-gray-700 rounded-full"
                    style={{ width: `${(progress.premium.baseMax / progress.max) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <Progress
                value={Math.min(100, Math.round((progress.value / progress.max) * 100))}
                className={`h-2 ${progress.color || ''} relative z-10`}
              />
              
              <div className="flex justify-between text-xs mt-1">
                <div className="flex items-center">
                  <span className="inline-block w-2 h-2 bg-gray-400 rounded-full mr-1"></span>
                  <span className="text-gray-500 dark:text-gray-400">Base: {progress.premium.baseMax}</span>
                </div>
                <div className="flex items-center">
                  <span className="inline-block w-2 h-2 bg-amber-400 rounded-full mr-1"></span>
                  <span className="text-amber-600 dark:text-amber-400">+Premium: {progress.premium.bonus}</span>
                </div>
              </div>
            </div>
          ) : (
            <>
              <Progress
                value={Math.min(100, Math.round((progress.value / progress.max) * 100))}
                className={`h-2 ${progress.color || ''}`}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {Math.min(100, Math.round((progress.value / progress.max) * 100))}% of daily limit
              </p>
            </>
          )}
        </div>
      )}

      {detail && (
        <div className="mt-3 flex items-center text-xs">
          <div className="flex items-center px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20">
            <span className="text-gray-700 dark:text-gray-300">{detail.label}: </span>
            <span className="ml-1 font-medium text-blue-600 dark:text-blue-400">{detail.value}</span>
          </div>
        </div>
      )}
    </div>
  );
}
