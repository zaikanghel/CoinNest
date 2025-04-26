import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useSettings } from "@/hooks/use-settings";
import ExoClickAd from "./exoclick-ad";

// Fallback ads that promote premium features when external ads aren't available
const fallbackAds = [
  {
    id: 1,
    title: "Premium Membership",
    description: "Upgrade to earn 2x coins in AFK mode!",
    bgColor: "bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40",
    textColor: "text-blue-600 dark:text-blue-400"
  },
  {
    id: 2,
    title: "Daily Bonus",
    description: "Complete tasks to earn special rewards!",
    bgColor: "bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40",
    textColor: "text-green-600 dark:text-green-400"
  },
  {
    id: 3,
    title: "Weekend Challenge",
    description: "Join the tournament for bonus rewards!",
    bgColor: "bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/40",
    textColor: "text-orange-600 dark:text-orange-400"
  }
];

interface BannerAdProps {
  className?: string;
  rotationInterval?: number; // in milliseconds
}

export default function BannerAd({ className = "", rotationInterval = 10000 }: BannerAdProps) {
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [showBanner, setShowBanner] = useState(true);
  const [useExternalAd, setUseExternalAd] = useState(true);
  const timer = useRef<NodeJS.Timeout | null>(null);
  const { settings } = useSettings();
  
  // Check if external ads are configured and enabled
  const exoclickSiteId = settings.exoclick_site_id;
  const bannerAdsEnabled = settings.ad_banner_enabled === 'true';
  const zoneId = "4916254"; // Example zone ID for banner ads (should come from settings)
  
  // Determine if we should use external ads or fallback to internal promotions
  useEffect(() => {
    // If we have a site ID and ads are enabled, use external ads
    // Otherwise use our internal promotional ads
    setUseExternalAd(!!exoclickSiteId && bannerAdsEnabled);
  }, [exoclickSiteId, bannerAdsEnabled]);
  
  // Rotate through fallback ads if we're not using external ads
  useEffect(() => {
    if (showBanner && !useExternalAd) {
      timer.current = setInterval(() => {
        setCurrentAdIndex((prevIndex) => (prevIndex + 1) % fallbackAds.length);
      }, rotationInterval);
    }

    return () => {
      if (timer.current) {
        clearInterval(timer.current);
      }
    };
  }, [showBanner, rotationInterval, useExternalAd]);

  const currentAd = fallbackAds[currentAdIndex];

  if (!showBanner) {
    return null;
  }
  
  // If using external ads, render the ExoClick component
  if (useExternalAd) {
    return (
      <Card className={`overflow-hidden ${className}`}>
        <CardContent className="p-0 relative">
          <button 
            className="absolute top-1 right-1 p-1 rounded-full bg-white/80 dark:bg-gray-800/80 z-10 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            onClick={() => setShowBanner(false)}
            aria-label="Close advertisement"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          
          <div className="text-xs uppercase font-bold tracking-wider p-1 flex items-center text-gray-500 bg-gray-100 dark:bg-gray-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            Advertisement
          </div>
          
          <ExoClickAd 
            adType="banner" 
            zoneId={zoneId} 
            className="w-full min-h-[90px]"
          />
        </CardContent>
      </Card>
    );
  }

  // Fallback to internal promotional ads
  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className={`p-0 relative ${currentAd.bgColor}`}>
        <button 
          className="absolute top-1 right-1 p-1 rounded-full bg-white/80 dark:bg-gray-800/80 z-10 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          onClick={() => setShowBanner(false)}
          aria-label="Close advertisement"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        
        <div className="flex items-center p-4">
          <div className="flex-1">
            <div className={`text-xs uppercase font-bold tracking-wider mb-1 flex items-center ${currentAd.textColor}`}>
              <AlertCircle className="h-3 w-3 mr-1" />
              Advertisement
            </div>
            <h3 className="font-semibold text-base">{currentAd.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {currentAd.description}
            </p>
          </div>
        </div>
        
        {/* Progress bar for ad rotation */}
        <div className="h-1 w-full bg-gray-200 dark:bg-gray-700">
          <div 
            className="h-full bg-primary-500 transition-all duration-300 ease-linear"
            style={{ 
              width: `${(currentAdIndex / (fallbackAds.length - 1)) * 100}%`,
              animation: `progress ${rotationInterval}ms linear infinite` 
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}