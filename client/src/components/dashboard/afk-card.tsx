import { useAfk } from "@/hooks/use-afk";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
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
    isLoading
  } = useAfk();

  const dailyProgress = (dailyEarned / dailyLimit) * 100;
  const formattedAfkTime = formatTime(afkTime);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>AFK Earnings</CardTitle>
          {isAfkActive ? (
            <span className="bg-success-500/10 text-success-500 text-xs font-medium py-1 px-2 rounded">
              Active
            </span>
          ) : (
            <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-medium py-1 px-2 rounded">
              Inactive
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col items-center justify-center py-5">
          <div className={`w-32 h-32 rounded-full ${isAfkActive ? 'bg-primary-50 dark:bg-primary-900/30 afk-pulse' : 'bg-gray-100 dark:bg-gray-800'} flex items-center justify-center mb-4`}>
            <div className="text-center">
              <span className={`block text-3xl font-bold ${isAfkActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'}`}>
                +{afkRate}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                coins/min
              </span>
            </div>
          </div>
          
          {isAfkActive && (
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">AFK Time</p>
              <p className="text-xl font-semibold">{formattedAfkTime}</p>
            </div>
          )}
          
          <div className="w-full">
            <div className="flex justify-between text-xs mb-1">
              <span>Daily limit</span>
              <span>{dailyEarned}/{dailyLimit}</span>
            </div>
            <Progress value={dailyProgress} />
          </div>
        </div>
        
        {!isAfkActive ? (
          <Button 
            className="w-full mt-4" 
            onClick={startAfkEarning}
            disabled={isLoading}
          >
            Start Earning
          </Button>
        ) : (
          <Button 
            variant="outline" 
            className="w-full mt-4" 
            onClick={stopAfkEarning}
          >
            Stop Earning
          </Button>
        )}
        
        <Alert className="mt-4 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 p-3 rounded-lg text-sm flex items-start">
          <Info className="h-4 w-4 mr-2 mt-0.5" />
          <AlertDescription>
            Stay active to earn coins. Verification may be required every 20 minutes.
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
