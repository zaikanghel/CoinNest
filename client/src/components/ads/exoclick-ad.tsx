import { useEffect, useRef } from "react";
import { useSettings } from "@/hooks/use-settings";

interface ExoClickAdProps {
  adType: "banner" | "native" | "interstitial" | "video";
  zoneId: string;
  className?: string;
}

export default function ExoClickAd({ adType, zoneId, className = "" }: ExoClickAdProps) {
  const adContainerRef = useRef<HTMLDivElement>(null);
  const { settings } = useSettings();
  
  const siteId = settings.exoclick_site_id;
  const adRefreshRate = Number(settings.ad_refresh_rate || 60);
  
  // Check if ads are enabled
  const bannerEnabled = settings.ad_banner_enabled === 'true';
  const videoEnabled = settings.ad_video_enabled === 'true';
  const interstitialEnabled = settings.ad_interstitial_enabled === 'true';
  
  // Determine if this specific ad type is enabled
  const isEnabled = 
    (adType === 'banner' && bannerEnabled) ||
    (adType === 'video' && videoEnabled) ||
    (adType === 'interstitial' && interstitialEnabled) ||
    (adType === 'native'); // Native ads are always allowed if specifically placed
  
  useEffect(() => {
    if (!isEnabled || !siteId || !zoneId) {
      return;
    }
    
    // Load ExoClick script
    const loadExoClick = () => {
      // Check if the ExoClick script is already loaded
      if (window.AdProvider) {
        loadAd();
        return;
      }
      
      const script = document.createElement('script');
      script.src = `https://syndication.exoclick.com/ads-iframe-display.js`;
      script.async = true;
      script.onload = loadAd;
      document.head.appendChild(script);
    };
    
    // Initialize the ad
    const loadAd = () => {
      if (!adContainerRef.current || !window.AdProvider) return;
      
      // Clear any existing ad content
      while (adContainerRef.current.firstChild) {
        adContainerRef.current.removeChild(adContainerRef.current.firstChild);
      }
      
      try {
        // Create ad container
        const adElement = document.createElement('div');
        adContainerRef.current.appendChild(adElement);
        
        // ExoClick ad initialization
        new window.AdProvider(adElement, {
          siteid: siteId,
          zoneid: zoneId,
          type: adType,
          refresh: adRefreshRate
        });
      } catch (error) {
        console.error('Error loading ExoClick ad:', error);
      }
    };
    
    loadExoClick();
    
    // Refresh ad at the specified interval
    const refreshInterval = setInterval(() => {
      loadAd();
    }, adRefreshRate * 1000);
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, [siteId, zoneId, adType, adRefreshRate, isEnabled]);
  
  if (!isEnabled || !siteId || !zoneId) {
    return null;
  }
  
  return (
    <div 
      ref={adContainerRef} 
      className={`exoclick-ad ${className}`}
      data-ad-type={adType}
    />
  );
}

// Add TypeScript declaration for the ExoClick AdProvider
declare global {
  interface Window {
    AdProvider: any;
  }
}