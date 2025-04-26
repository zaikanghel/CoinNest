import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, Bell, VolumeX, Volume2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTheme } from "next-themes";
import { useToast } from "@/hooks/use-toast";
import MainLayout from "@/components/layout/main-layout";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Settings state
  const [notifications, setNotifications] = useState({
    earnings: true,
    system: true,
    marketing: false,
  });
  
  const [soundSettings, setSoundSettings] = useState({
    enabled: true,
    volume: 70,
  });
  
  // Fetch user settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["/api/settings"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/settings");
        return await res.json();
      } catch (error) {
        // Return defaults if settings endpoint doesn't exist
        return {
          notifications: {
            earnings: true,
            system: true,
            marketing: false,
          },
          sound: {
            enabled: true,
            volume: 70,
          },
          theme: "system",
        };
      }
    },
    enabled: !!user,
  });
  
  // Update local state when settings data is loaded
  useEffect(() => {
    if (settings) {
      if (settings.notifications) {
        setNotifications(settings.notifications);
      }
      if (settings.sound) {
        setSoundSettings(settings.sound);
      }
    }
  }, [settings]);

  // Update settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (updatedSettings: any) => {
      const res = await apiRequest("PATCH", "/api/settings", updatedSettings);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings updated",
        description: "Your preferences have been saved",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Save notification settings
  const saveNotificationSettings = () => {
    updateSettingsMutation.mutate({
      notifications,
    });
  };

  // Save sound settings
  const saveSoundSettings = () => {
    updateSettingsMutation.mutate({
      sound: soundSettings,
    });
  };

  // Save theme setting
  const saveThemeSetting = (newTheme: string) => {
    setTheme(newTheme);
    updateSettingsMutation.mutate({
      theme: newTheme,
    });
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setSoundSettings({
      ...soundSettings,
      volume: value,
    });
  };

  return (
    <MainLayout pageTitle="Settings">
      <div className="container max-w-4xl mx-auto space-y-6">
        <Tabs defaultValue="appearance" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="sound">Sound</TabsTrigger>
          </TabsList>
          
          {/* Appearance Tab */}
          <TabsContent value="appearance" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Theme Settings</CardTitle>
                <CardDescription>
                  Choose your preferred theme for the application
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup 
                  defaultValue={theme || "system"} 
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                  onValueChange={saveThemeSetting}
                >
                  <div className="relative">
                    <RadioGroupItem
                      value="light"
                      id="theme-light"
                      className="absolute right-2 top-2"
                    />
                    <Label
                      htmlFor="theme-light"
                      className="block cursor-pointer p-4 border rounded-lg hover:border-primary"
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className="w-full h-24 mb-2 bg-white border border-gray-200 rounded-md shadow-sm flex items-center justify-center">
                          <div className="w-12 h-8 bg-primary-200 rounded"></div>
                        </div>
                        <span className="font-medium mt-1">Light</span>
                        <span className="text-xs text-muted-foreground">
                          Light background with dark text
                        </span>
                      </div>
                    </Label>
                  </div>
                  
                  <div className="relative">
                    <RadioGroupItem
                      value="dark"
                      id="theme-dark"
                      className="absolute right-2 top-2"
                    />
                    <Label
                      htmlFor="theme-dark"
                      className="block cursor-pointer p-4 border rounded-lg hover:border-primary"
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className="w-full h-24 mb-2 bg-gray-900 border border-gray-800 rounded-md shadow-sm flex items-center justify-center">
                          <div className="w-12 h-8 bg-primary-600 rounded"></div>
                        </div>
                        <span className="font-medium mt-1">Dark</span>
                        <span className="text-xs text-muted-foreground">
                          Dark background with light text
                        </span>
                      </div>
                    </Label>
                  </div>
                  
                  <div className="relative">
                    <RadioGroupItem
                      value="system"
                      id="theme-system"
                      className="absolute right-2 top-2"
                    />
                    <Label
                      htmlFor="theme-system"
                      className="block cursor-pointer p-4 border rounded-lg hover:border-primary"
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className="w-full h-24 mb-2 border rounded-md shadow-sm flex items-center justify-center bg-gradient-to-r from-white to-gray-900">
                          <div className="w-12 h-8 bg-gradient-to-r from-primary-200 to-primary-600 rounded"></div>
                        </div>
                        <span className="font-medium mt-1">System</span>
                        <span className="text-xs text-muted-foreground">
                          Follow system theme preference
                        </span>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Notifications Tab */}
          <TabsContent value="notifications" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Manage when and how you want to be notified
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="earnings-notifications" className="text-base font-medium">
                        Earnings Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications about your coin earnings
                      </p>
                    </div>
                    <Switch
                      id="earnings-notifications"
                      checked={notifications.earnings}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, earnings: checked })}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="system-notifications" className="text-base font-medium">
                        System Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Important updates about your account and platform
                      </p>
                    </div>
                    <Switch
                      id="system-notifications"
                      checked={notifications.system}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, system: checked })}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="marketing-notifications" className="text-base font-medium">
                        Marketing Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Promotions, offers, and new features
                      </p>
                    </div>
                    <Switch
                      id="marketing-notifications"
                      checked={notifications.marketing}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, marketing: checked })}
                    />
                  </div>
                </div>
                
                <Button 
                  className="mt-6" 
                  onClick={saveNotificationSettings}
                  disabled={updateSettingsMutation.isPending}
                >
                  {updateSettingsMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Sound Tab */}
          <TabsContent value="sound" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Sound Settings</CardTitle>
                <CardDescription>
                  Customize how the application sounds
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="sound-enabled" className="text-base font-medium">
                      Enable Sounds
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Sounds for game events, notifications, and interactions
                    </p>
                  </div>
                  <Switch
                    id="sound-enabled"
                    checked={soundSettings.enabled}
                    onCheckedChange={(checked) => setSoundSettings({ ...soundSettings, enabled: checked })}
                  />
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label htmlFor="volume-slider" className="text-base font-medium">
                    Volume
                  </Label>
                  <div className="flex items-center">
                    <VolumeX className="mr-2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="volume-slider"
                      type="range"
                      min="0"
                      max="100"
                      value={soundSettings.volume}
                      onChange={handleVolumeChange}
                      disabled={!soundSettings.enabled}
                      className="w-full"
                    />
                    <Volume2 className="ml-2 h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-center mt-2">
                    {soundSettings.volume}%
                  </p>
                </div>
                
                <Button 
                  className="mt-6" 
                  onClick={saveSoundSettings}
                  disabled={updateSettingsMutation.isPending || !soundSettings.enabled}
                >
                  {updateSettingsMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}