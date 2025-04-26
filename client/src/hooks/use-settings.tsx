import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";

// Define the Settings type
export type SystemSettings = {
  afk_rate: number;
  afk_daily_limit: number;
  referral_bonus: number;
  referral_percent: number;
  min_withdrawal: number;
  conversion_rate: number;
  captcha_interval: number;
  [key: string]: any;
};

// Settings context type
interface SettingsContextType {
  settings: SystemSettings;
  isLoading: boolean;
  refetchSettings: () => Promise<void>;
}

// Default settings
const defaultSettings: SystemSettings = {
  afk_rate: 2,
  afk_daily_limit: 200,
  referral_bonus: 75,
  referral_percent: 5,
  min_withdrawal: 1000,
  conversion_rate: 100,
  captcha_interval: 1200
};

// Create settings context
export const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  isLoading: true,
  refetchSettings: async () => {}
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);

  // Fetch settings from API
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['/api/settings/global'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/settings/global');
        return res.json();
      } catch (error) {
        console.error('Failed to fetch settings:', error);
        return defaultSettings;
      }
    },
    refetchInterval: 60000, // Refetch every minute to catch admin changes
  });

  // Update settings when data changes
  useEffect(() => {
    if (data) {
      // Convert settings array to object
      if (Array.isArray(data)) {
        const settingsObj: SystemSettings = { ...defaultSettings };
        data.forEach((setting: any) => {
          // Convert numeric values to numbers
          if (!isNaN(Number(setting.value))) {
            settingsObj[setting.key] = Number(setting.value);
          } else {
            settingsObj[setting.key] = setting.value;
          }
        });
        setSettings(settingsObj);
      } else if (typeof data === 'object') {
        setSettings({ ...defaultSettings, ...data });
      }
    }
  }, [data]);

  // Function to refetch settings
  const refetchSettings = async () => {
    await refetch();
  };

  return (
    <SettingsContext.Provider value={{ settings, isLoading, refetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

// Hook to use settings
export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}