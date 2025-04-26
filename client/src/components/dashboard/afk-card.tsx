import { useAfk } from "@/hooks/use-afk";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Loader2 } from "lucide-react";
import { formatTime } from "@/lib/utils";
import VerificationModal from "@/components/verification-modal";

export default function AfkCard() {
  const {
    isAfkActive,
    startAfkEarning,
    stopAfkEarning,
    afkTime,
    afkRate,
    dailyLimit,
    dailyEarned,
    captchaNeeded,
    verifyCaptcha,
    captchaVerificationPending,
    isLoading,
    lastEarning,
    isTabActive,
    lastMouseMovement
  } = useAfk();

  const dailyProgress = (dailyEarned / dailyLimit) * 100;
  const formattedAfkTime = formatTime(afkTime);

  return (
    <Card className="border-0 shadow-md overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 pb-8 relative">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold">AFK Earnings</CardTitle>
          {isAfkActive ? (
            <span className="flex items-center gap-1.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-medium py-1 px-3 rounded-full">
              <span className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full animate-pulse"></span>
              Active
            </span>
          ) : (
            <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium py-1 px-3 rounded-full">
              <span className="w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full"></span>
              Inactive
            </span>
          )}
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-primary/5 dark:bg-primary/10 rounded-full"></div>
        <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-accent/5 dark:bg-accent/10 rounded-full"></div>
      </CardHeader>

      <CardContent className="pt-0 relative z-10">
        <div className="flex flex-col items-center justify-center py-5">
          <div className={`w-36 h-36 rounded-full flex items-center justify-center mb-6 
            ${isAfkActive 
              ? 'bg-gradient-to-br from-primary/10 to-accent/20 shadow-xl shadow-primary/5' 
              : 'bg-gray-100 dark:bg-gray-800'} 
            relative overflow-hidden`}
          >
            {/* Animated rings for active state */}
            {isAfkActive && (
              <>
                <div className="absolute inset-0 w-full h-full rounded-full border-4 border-primary/20 animate-ping-slow"></div>
                <div className="absolute inset-4 w-28 h-28 rounded-full border-2 border-accent/30 animate-ping-slow" style={{animationDelay: '1s'}}></div>
              </>
            )}
            
            <div className="text-center z-10 bg-white/80 dark:bg-gray-800/80 rounded-xl px-3 py-2 backdrop-blur-sm">
              <span className={`block text-3xl font-bold 
                ${isAfkActive 
                  ? 'bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent' 
                  : 'text-gray-400 dark:text-gray-500'}`}
              >
                +{afkRate}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                coins/min
              </span>
            </div>
          </div>
          
          {isAfkActive && (
            <div className="text-center mb-5 bg-gray-50 dark:bg-gray-800/50 px-4 py-2 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">AFK Time</p>
              <p className="text-xl font-bold text-primary dark:text-primary-400">{formattedAfkTime}</p>
              
              {/* Tab status indicator */}
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                  isTabActive 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                }`}>
                  <span className={`w-1.5 h-1.5 mr-1 rounded-full ${
                    isTabActive ? 'bg-green-500' : 'bg-red-500'
                  }`}></span>
                  {isTabActive ? 'Tab Active' : 'Tab Inactive'}
                </span>
              </div>
              
              {lastEarning && (
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Last earned: <span className="text-green-500 dark:text-green-400">+{lastEarning.amount}</span> coins
                </div>
              )}
            </div>
          )}
          
          <div className="w-full">
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium">Daily Limit Progress</span>
              <span className="font-medium">{dailyEarned}/{dailyLimit}</span>
            </div>
            <Progress 
              value={dailyProgress} 
              className={`h-2 ${isAfkActive ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
              {Math.round(dailyProgress)}% of daily limit reached
            </p>
          </div>
        </div>
        
        {!isAfkActive ? (
          <Button 
            className="w-full mt-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-medium transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]" 
            onClick={startAfkEarning}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> 
                Initializing...
              </div>
            ) : (
              <div className="flex items-center">
                <i className="ri-play-circle-line mr-2"></i> Start Earning
              </div>
            )}
          </Button>
        ) : (
          <Button 
            variant="outline" 
            className="w-full mt-2 border-primary/20 text-primary dark:border-primary-400/30 dark:text-primary-400" 
            onClick={stopAfkEarning}
          >
            <div className="flex items-center">
              <i className="ri-pause-circle-line mr-2"></i> Pause Earning
            </div>
          </Button>
        )}
        
        <Alert className="mt-4 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 p-3 rounded-lg text-sm flex items-start">
          <Info className="h-4 w-4 mr-2 mt-0.5" />
          <AlertDescription>
            Keep this tab open to continue earning. Verification checks help prevent automated farming.
          </AlertDescription>
        </Alert>
      </CardContent>

      {/* Verification Modal */}
      {captchaNeeded && (
        <VerificationModal
          open={captchaNeeded}
          onVerify={verifyCaptcha}
          isVerifying={captchaVerificationPending}
        />
      )}
    </Card>
  );
}
