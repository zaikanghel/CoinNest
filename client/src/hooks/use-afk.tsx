import { createContext, ReactNode, useState, useEffect, useContext, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AfkContextType {
  isAfkActive: boolean;
  startAfkEarning: () => void;
  stopAfkEarning: () => void;
  afkTime: number;
  afkRate: number;
  dailyLimit: number;
  dailyEarned: number;
  captchaNeeded: boolean;
  verifyCaptcha: (answer: string, expected: string) => void;
  captchaVerificationPending: boolean;
  isLoading: boolean;
  lastEarning: {
    amount: number;
    timestamp: number;
  } | null;
  isTabActive: boolean;
  lastMouseMovement: number;
  isPaused: boolean;
}

export const AfkContext = createContext<AfkContextType | null>(null);

export function AfkProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [isAfkActive, setIsAfkActive] = useState(false);
  const [afkTime, setAfkTime] = useState(0);
  const [afkRate, setAfkRate] = useState(2);
  const [dailyLimit, setDailyLimit] = useState(200);
  const [dailyEarned, setDailyEarned] = useState(0);
  const [captchaInterval, setCaptchaInterval] = useState(1200);
  const [lastCaptchaTime, setLastCaptchaTime] = useState(0);
  const [captchaNeeded, setCaptchaNeeded] = useState(false);
  const [lastEarningSubmit, setLastEarningSubmit] = useState(0);
  const [afkStartTime, setAfkStartTime] = useState(0);
  const [lastEarning, setLastEarning] = useState<{amount: number, timestamp: number} | null>(null);
  const [isTabActive, setIsTabActive] = useState(true);
  const [lastMouseMovement, setLastMouseMovement] = useState(Date.now());
  
  // Anti-cheat and timer pausing
  const [isPaused, setIsPaused] = useState(false);
  const [pauseStartTime, setPauseStartTime] = useState(0);
  const [totalPausedTime, setTotalPausedTime] = useState(0);
  
  // Toast notification debounce
  const lastResumeToastRef = useRef(0);
  
  // Constants for anti-cheat
  const MOUSE_MOVEMENT_TIMEOUT = 120000; // 2 minutes
  const RESUME_TOAST_COOLDOWN = 3000; // 3 seconds cooldown between resume notifications
  
  // Start AFK session
  const { isLoading, refetch: refetchAfkSettings } = useQuery({
    queryKey: ['/api/afk/start'],
    queryFn: async () => {
      const res = await apiRequest('POST', '/api/afk/start');
      return res.json();
    },
    enabled: false,
    staleTime: Infinity
  });

  // Submit earned coins
  const earnMutation = useMutation({
    mutationFn: async (minutes: number) => {
      // Multiple safety checks to prevent earning during pause
      if (isPaused || !isTabActive || Date.now() - lastMouseMovement > MOUSE_MOVEMENT_TIMEOUT) {
        console.log("Prevented earning during paused state");
        return { earned: 0, dailyEarned: dailyEarned, dailyLimit, captchaRequired: false };
      }
      
      // Normalize minutes to prevent exploits (just in case)
      const cappedMinutes = Math.min(minutes, 1.2); // Cap at slightly more than 1 minute
      
      const res = await apiRequest('POST', '/api/afk/earn', { minutes: cappedMinutes });
      return res.json();
    },
    onSuccess: (data) => {
      setDailyEarned(data.dailyEarned);
      
      // Only set last earning if we actually earned something
      if (data.earned > 0) {
        setLastEarning({
          amount: data.earned,
          timestamp: Date.now()
        });
        toast({
          title: "Coins earned",
          description: `You earned ${data.earned} coins!`,
          variant: "default"
        });
        
        // Refresh user data and stats
        queryClient.invalidateQueries({ queryKey: ['/api/user'] });
        queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
        queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to submit earnings: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Verify captcha
  const captchaMutation = useMutation({
    mutationFn: async ({ answer, expected }: { answer: string, expected: string }) => {
      const res = await apiRequest('POST', '/api/afk/verify', { answer, expected });
      return res.json();
    },
    onSuccess: () => {
      setCaptchaNeeded(false);
      setLastCaptchaTime(Date.now());
      toast({
        title: "Verification successful",
        description: "You can continue earning coins.",
        variant: "default"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Interval to increment AFK time and check for captcha
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isAfkActive && !captchaNeeded) {
      interval = setInterval(() => {
        const now = Date.now();
        
        // Check for active conditions (tab active + recent mouse movement)
        const timeSinceLastMovement = now - lastMouseMovement;
        const isUserActive = timeSinceLastMovement < MOUSE_MOVEMENT_TIMEOUT;
        const shouldBePaused = !isTabActive || !isUserActive;
        
        // Check if captcha should be shown based on time
        if (captchaInterval > 0 && now - lastCaptchaTime > captchaInterval * 1000) {
          setCaptchaNeeded(true);
        }
        
        // Handle pausing and resuming - this is a backup to the direct handling in visibility and mouse events
        // Only enter pause state if not already paused
        if (shouldBePaused && !isPaused) {
          // Just entered paused state
          setIsPaused(true);
          setPauseStartTime(now);
          
          // Show appropriate warning (only if not already shown by direct handlers)
          // Check cooldown to avoid duplicate messages
          if (now - lastResumeToastRef.current > RESUME_TOAST_COOLDOWN) {
            if (!isTabActive) {
              toast({
                title: "Tab inactive",
                description: "AFK timer paused. Keep this tab active to earn coins",
                variant: "destructive"
              });
            } else if (!isUserActive) {
              toast({
                title: "Inactivity detected",
                description: "AFK timer paused. Move your mouse to continue earning",
                variant: "destructive"
              });
            }
            lastResumeToastRef.current = now;
          }
        } 
        // Only resume if conditions are met and we're paused
        else if (!shouldBePaused && isPaused) {
          // Only update state if conditions actually match - prevents race conditions
          if (isTabActive && isUserActive) {
            // Just resumed from paused state
            setIsPaused(false);
            const pauseDuration = now - pauseStartTime;
            setTotalPausedTime(prev => prev + pauseDuration);
            
            // Show resume toast with cooldown to prevent spam
            if (now - lastResumeToastRef.current > RESUME_TOAST_COOLDOWN) {
              toast({
                title: "Activity resumed",
                description: "AFK timer and earnings have resumed",
                variant: "default"
              });
              lastResumeToastRef.current = now;
            }
          }
        }
        
        // IMPORTANT: Only update time if NOT paused - critical fix for tab inactive issue
        if (!isPaused) {
          const effectiveElapsed = Math.floor((now - afkStartTime - totalPausedTime) / 1000);
          setAfkTime(effectiveElapsed);
          
          // Only submit earnings if active and it's time AND not paused
          if (now - lastEarningSubmit >= 60000) {
            const minutesElapsed = (now - lastEarningSubmit) / 60000;
            earnMutation.mutate(minutesElapsed);
            setLastEarningSubmit(now);
          }
        }
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAfkActive, captchaNeeded, afkStartTime, lastCaptchaTime, lastEarningSubmit, captchaInterval, isTabActive, lastMouseMovement]);

  // Function to start AFK earning
  const startAfkEarning = async () => {
    const now = Date.now();
    setAfkStartTime(now);
    setLastEarningSubmit(now);
    setLastCaptchaTime(now);
    setAfkTime(0);
    
    try {
      const data = await refetchAfkSettings();
      if (data.data) {
        setAfkRate(data.data.afkRate);
        setDailyLimit(data.data.dailyLimit);
        setDailyEarned(data.data.dailyEarned);
        setCaptchaInterval(data.data.captchaInterval);
      }
      setIsAfkActive(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to start AFK earnings: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  // Function to stop AFK earning
  const stopAfkEarning = () => {
    if (isAfkActive) {
      setIsAfkActive(false);
      
      // Submit final earnings if needed and not paused
      if (!isPaused) {
        const now = Date.now();
        const minutesElapsed = (now - lastEarningSubmit) / 60000;
        if (minutesElapsed > 0.2) { // Only submit if more than 12 seconds have passed
          earnMutation.mutate(minutesElapsed);
        }
      }
    }
  };

  // Function to verify captcha
  const verifyCaptcha = (answer: string, expected: string) => {
    captchaMutation.mutate({ answer, expected });
  };

  // Tab visibility change detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      
      // Important: Only update if the visibility actually changed
      if (isVisible !== isTabActive) {
        setIsTabActive(isVisible);
        
        // If the tab becomes inactive, trigger a warning and pause immediately
        if (!isVisible && isAfkActive) {
          setIsPaused(true);
          setPauseStartTime(Date.now());
          
          // Immediately sync the pause state to prevent any earnings
          // This ensures consistency between dashboard and AFK page
          const now = Date.now();
          const effectiveElapsed = Math.floor((now - afkStartTime - totalPausedTime) / 1000);
          setAfkTime(effectiveElapsed); // Freeze time at current value
          
          toast({
            title: "Tab inactive",
            description: "AFK earnings will be paused until you return to this tab",
            variant: "destructive"
          });
        } 
        // When tab becomes active again
        else if (isVisible && isAfkActive && isPaused) {
          // Calculate duration of pause
          const now = Date.now();
          const pauseDuration = now - pauseStartTime;
          
          // Add pause time to total (ensures timer jumps ahead correctly)
          if (pauseDuration > 0) {
            setTotalPausedTime(prev => prev + pauseDuration);
          }
          
          // If we were paused because of tab inactivity (not mouse), resume
          const timeSinceLastMovement = now - lastMouseMovement;
          if (timeSinceLastMovement < MOUSE_MOVEMENT_TIMEOUT) {
            setIsPaused(false);
            
            // Only show resume toast if cooldown has passed
            if (now - lastResumeToastRef.current > RESUME_TOAST_COOLDOWN) {
              toast({
                title: "Tab active",
                description: "AFK timer and earnings have resumed",
                variant: "default"
              });
              lastResumeToastRef.current = now;
            }
          }
        }
      }
    };
    
    // Run once on component mount to ensure proper initial state
    handleVisibilityChange();
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAfkActive, isTabActive, isPaused, afkStartTime, totalPausedTime, lastMouseMovement, pauseStartTime]);
  
  // Mouse movement detection - debounced to prevent excessive updates
  useEffect(() => {
    let moveTimeout: NodeJS.Timeout | null = null;
    let lastProcessedTime = 0;
    
    const handleMouseMove = () => {
      const now = Date.now();
      
      // Debounce mouse movements to avoid excessive state updates
      // Only process if 200ms have passed since last processed movement
      if (now - lastProcessedTime > 200) {
        // Clear any pending timeout
        if (moveTimeout) {
          clearTimeout(moveTimeout);
        }
        
        // Set a timeout to process this movement
        moveTimeout = setTimeout(() => {
          const currentTime = Date.now();
          setLastMouseMovement(currentTime);
          lastProcessedTime = currentTime;
          
          // If we're paused due to mouse inactivity and user moves mouse, resume
          if (isPaused && isTabActive && isAfkActive && !captchaNeeded) {
            // Calculate how long we've been paused
            const pauseDuration = currentTime - pauseStartTime;
            
            // Only resume if we were paused for less than the full timeout
            // (if it's beyond the full timeout, a captcha is required)
            if (pauseDuration < MOUSE_MOVEMENT_TIMEOUT) {
              setIsPaused(false);
              setTotalPausedTime(prev => prev + pauseDuration);
              
              // Only show toast if cooldown has passed
              if (currentTime - lastResumeToastRef.current > RESUME_TOAST_COOLDOWN) {
                toast({
                  title: "Activity detected",
                  description: "AFK timer and earnings have resumed",
                  variant: "default"
                });
                lastResumeToastRef.current = currentTime;
              }
            }
          }
        }, 50); // Small delay to batch movements
      }
    };
    
    // Adding both mousemove and mousedown for better activity detection
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseMove);
      if (moveTimeout) {
        clearTimeout(moveTimeout);
      }
    };
  }, [isPaused, isTabActive, isAfkActive, captchaNeeded, pauseStartTime]);
  
  // Check for mouse inactivity
  useEffect(() => {
    let inactivityCheck: NodeJS.Timeout;
    
    if (isAfkActive && !captchaNeeded && isTabActive) { // Only check if tab is active
      inactivityCheck = setInterval(() => {
        const now = Date.now();
        const timeSinceLastMovement = now - lastMouseMovement;
        
        // If mouse hasn't moved in a while, pause earnings first
        if (timeSinceLastMovement > MOUSE_MOVEMENT_TIMEOUT / 2 && !isPaused) {
          // Immediately pause and freeze time
          setIsPaused(true);
          setPauseStartTime(now);
          
          // Set time at current value (ensures immediate visual feedback)
          const effectiveElapsed = Math.floor((now - afkStartTime - totalPausedTime) / 1000);
          setAfkTime(effectiveElapsed);
          
          // Only show toast if cooldown has passed
          if (now - lastResumeToastRef.current > RESUME_TOAST_COOLDOWN) {
            toast({
              title: "Mouse inactivity detected",
              description: "AFK earnings paused. Move your mouse to continue earning",
              variant: "destructive"
            });
            lastResumeToastRef.current = now;
          }
        }
        
        // If mouse hasn't moved for the full timeout period, prompt captcha
        if (timeSinceLastMovement > MOUSE_MOVEMENT_TIMEOUT) {
          setCaptchaNeeded(true);
          
          // Only show toast if cooldown has passed
          if (now - lastResumeToastRef.current > RESUME_TOAST_COOLDOWN) {
            toast({
              title: "Verification required",
              description: "Please verify you're still active",
              variant: "destructive"
            });
            lastResumeToastRef.current = now;
          }
        }
      }, 10000); // Check more frequently (every 10 seconds)
    }
    
    return () => {
      if (inactivityCheck) clearInterval(inactivityCheck);
    };
  }, [isAfkActive, captchaNeeded, lastMouseMovement, isPaused, isTabActive, afkStartTime, totalPausedTime]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (isAfkActive) {
        stopAfkEarning();
      }
    };
  }, []);

  return (
    <AfkContext.Provider
      value={{
        isAfkActive,
        startAfkEarning,
        stopAfkEarning,
        afkTime,
        afkRate,
        dailyLimit,
        dailyEarned,
        captchaNeeded,
        verifyCaptcha,
        captchaVerificationPending: captchaMutation.isPending,
        isLoading,
        lastEarning,
        isTabActive,
        lastMouseMovement,
        isPaused
      }}
    >
      {children}
    </AfkContext.Provider>
  );
}

export function useAfk() {
  const context = useContext(AfkContext);
  if (!context) {
    throw new Error("useAfk must be used within an AfkProvider");
  }
  return context;
}
