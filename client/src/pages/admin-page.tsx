import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import MainLayout from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Settings, Users, Wallet, CheckCircle, XCircle } from "lucide-react";
import { getColorFromString, getUserInitials } from "@/lib/utils";
import { useLocation } from "wouter";
import { Setting } from "../../shared/schema";

// Form schema for system settings
const settingSchema = z.object({
  key: z.string().min(1, "Setting key is required"),
  value: z.string().min(1, "Setting value is required")
});

type SettingFormData = z.infer<typeof settingSchema>;

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [showSettingModal, setShowSettingModal] = useState(false);

  // Redirect if not admin
  if (user && !user.isAdmin) {
    navigate("/dashboard");
    return null;
  }

  // Fetch users
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    }
  });

  // Fetch pending withdrawals
  const { data: withdrawals, isLoading: isLoadingWithdrawals } = useQuery({
    queryKey: ["/api/admin/withdrawals"],
    queryFn: async () => {
      const res = await fetch("/api/admin/withdrawals", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch withdrawals");
      return res.json();
    }
  });

  // Fetch settings
  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["/api/admin/settings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/settings", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch settings");
      return res.json();
    }
  });

  const isLoading = isLoadingUsers || isLoadingWithdrawals || isLoadingSettings;

  // Process withdrawal mutation
  const processWithdrawalMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const res = await apiRequest("POST", `/api/admin/withdrawals/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Withdrawal updated",
        description: "The withdrawal has been processed",
        variant: "default"
      });
      setShowWithdrawalModal(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Update setting mutation
  const updateSettingMutation = useMutation({
    mutationFn: async (data: SettingFormData) => {
      const res = await apiRequest("POST", "/api/admin/settings", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Setting updated",
        description: "The system setting has been updated",
        variant: "default"
      });
      setShowSettingModal(false);
      // Invalidate both admin settings and global settings
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/global"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const form = useForm<SettingFormData>({
    resolver: zodResolver(settingSchema),
    defaultValues: {
      key: "",
      value: ""
    }
  });

  const openWithdrawalModal = (withdrawal: any) => {
    setSelectedWithdrawal(withdrawal);
    setShowWithdrawalModal(true);
  };

  const processWithdrawal = (status: string) => {
    if (selectedWithdrawal) {
      processWithdrawalMutation.mutate({
        id: selectedWithdrawal.id,
        status
      });
    }
  };

  const openSettingModal = (setting?: any) => {
    console.log("Opening setting modal with:", setting);
    
    if (setting) {
      form.setValue("key", setting.key);
      form.setValue("value", setting.value);
    } else {
      form.setValue("key", "");
      form.setValue("value", "");
    }
    
    setShowSettingModal(true);
  };

  const onSettingSubmit = (data: SettingFormData) => {
    updateSettingMutation.mutate(data);
  };

  return (
    <MainLayout pageTitle="Admin Dashboard">
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : (
          <Tabs defaultValue="withdrawals">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="withdrawals">
                <Wallet className="h-4 w-4 mr-2" />
                Withdrawals
              </TabsTrigger>
              <TabsTrigger value="users">
                <Users className="h-4 w-4 mr-2" />
                Users
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
              <TabsTrigger value="monetization">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="h-4 w-4 mr-2"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 6v6l4 2"></path>
                  <path d="M8.5 9.5h.01"></path>
                  <path d="M15.5 9.5h.01"></path>
                </svg>
                Monetization
              </TabsTrigger>
            </TabsList>

            {/* Withdrawals Tab */}
            <TabsContent value="withdrawals">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Withdrawals</CardTitle>
                  <CardDescription>
                    Review and approve or reject withdrawal requests
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {withdrawals && withdrawals.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Requested</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {withdrawals.map((withdrawal: any) => (
                          <TableRow key={withdrawal.id}>
                            <TableCell>
                              {users?.find((u: any) => u.id === withdrawal.userId)?.username || `User #${withdrawal.userId}`}
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">{withdrawal.amount.toLocaleString()}</span> coins
                            </TableCell>
                            <TableCell className="capitalize">{withdrawal.method}</TableCell>
                            <TableCell>{new Date(withdrawal.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openWithdrawalModal(withdrawal)}
                              >
                                Process
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-gray-500">No pending withdrawals</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>
                    View and manage registered users
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Total Earned</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users?.map((user: any) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8 mr-2">
                                <AvatarFallback className={getColorFromString(user.username)}>
                                  {getUserInitials(user.username)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{user.username}</span>
                              {user.isAdmin && (
                                <Badge variant="outline" className="ml-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border-none">
                                  Admin
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.balance.toLocaleString()} coins</TableCell>
                          <TableCell>{user.totalEarned.toLocaleString()} coins</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-none">
                              Active
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>System Settings</CardTitle>
                      <CardDescription>
                        Configure platform settings and rates
                      </CardDescription>
                    </div>
                    <Button onClick={() => openSettingModal()}>
                      Add Setting
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Setting</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {settings?.map((setting: any) => (
                        <TableRow key={setting.id}>
                          <TableCell className="font-medium">{setting.key}</TableCell>
                          <TableCell>{setting.value}</TableCell>
                          <TableCell>
                            {getSettingDescription(setting.key)}
                          </TableCell>
                          <TableCell>{new Date(setting.updatedAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openSettingModal(setting)}
                            >
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Monetization Tab */}
            <TabsContent value="monetization">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Ad Network Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>Ad Network Settings</CardTitle>
                    <CardDescription>
                      Configure ExoClick ad network integration
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Ad Network ID */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium">ExoClick Site ID</h3>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openSettingModal(settings?.find(s => s.key === 'exoclick_site_id'))}
                        >
                          Configure
                        </Button>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <code className="text-sm">
                          {settings?.find(s => s.key === 'exoclick_site_id')?.value || 'Not configured'}
                        </code>
                      </div>
                    </div>

                    {/* Ad Types */}
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Ad Types</h3>
                      <div className="grid grid-cols-3 gap-3">
                        <div 
                          className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md flex flex-col items-center text-center cursor-pointer"
                          onClick={() => openSettingModal(settings?.find(s => s.key === 'ad_banner_enabled'))}
                        >
                          <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                          <span className="text-xs font-medium">Banner Ads</span>
                          <span className="text-xs mt-1 text-gray-500">
                            {settings?.find(s => s.key === 'ad_banner_enabled')?.value === 'true' ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                        <div 
                          className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md flex flex-col items-center text-center cursor-pointer"
                          onClick={() => openSettingModal(settings?.find(s => s.key === 'ad_video_enabled'))}
                        >
                          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polygon points="5 3 19 12 5 21 5 3"></polygon>
                            </svg>
                          </div>
                          <span className="text-xs font-medium">Video Ads</span>
                          <span className="text-xs mt-1 text-gray-500">
                            {settings?.find(s => s.key === 'ad_video_enabled')?.value === 'true' ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                        <div 
                          className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md flex flex-col items-center text-center cursor-pointer"
                          onClick={() => openSettingModal(settings?.find(s => s.key === 'ad_interstitial_enabled'))}
                        >
                          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            </svg>
                          </div>
                          <span className="text-xs font-medium">Interstitial</span>
                          <span className="text-xs mt-1 text-gray-500">
                            {settings?.find(s => s.key === 'ad_interstitial_enabled')?.value === 'true' ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Ad Refresh Rate */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium">Ad Refresh Rate</h3>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openSettingModal(settings?.find(s => s.key === 'ad_refresh_rate'))}
                        >
                          Configure
                        </Button>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Every {settings?.find(s => s.key === 'ad_refresh_rate')?.value || '60'} seconds</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Premium Subscription Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>Premium Subscription</CardTitle>
                    <CardDescription>
                      Configure premium membership settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium">Monthly Price</h3>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openSettingModal(settings?.find(s => s.key === 'premium_price'))}
                        >
                          Configure
                        </Button>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">${settings?.find(s => s.key === 'premium_price')?.value || '4.99'}/month</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium">AFK Earnings Multiplier</h3>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openSettingModal(settings?.find(s => s.key === 'premium_afk_multiplier'))}
                        >
                          Configure
                        </Button>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">{settings?.find(s => s.key === 'premium_afk_multiplier')?.value || '2'}x earnings</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium">Daily Limit Bonus</h3>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openSettingModal(settings?.find(s => s.key === 'premium_daily_limit_bonus'))}
                        >
                          Configure
                        </Button>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">+{settings?.find(s => s.key === 'premium_daily_limit_bonus')?.value || '200'} coins</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium">Disable Captchas</h3>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openSettingModal(settings?.find(s => s.key === 'captcha_disabled_premium'))}
                        >
                          Configure
                        </Button>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">{settings?.find(s => s.key === 'captcha_disabled_premium')?.value === 'true' ? 'Enabled' : 'Disabled'}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Game Rewards Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>Game Rewards</CardTitle>
                    <CardDescription>
                      Configure in-game coin rewards
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium">Clicker Game Reward</h3>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openSettingModal(settings?.find(s => s.key === 'game_clicker_reward'))}
                        >
                          Configure
                        </Button>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Base: {settings?.find(s => s.key === 'game_clicker_reward')?.value || '5'} coins per click</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium">Memory Game Reward</h3>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openSettingModal(settings?.find(s => s.key === 'game_memory_reward'))}
                        >
                          Configure
                        </Button>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Base: {settings?.find(s => s.key === 'game_memory_reward')?.value || '10'} coins per match</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium">Max Game Earnings</h3>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openSettingModal(settings?.find(s => s.key === 'game_max_earnings'))}
                        >
                          Configure
                        </Button>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Cap: {settings?.find(s => s.key === 'game_max_earnings')?.value || '200'} coins per game</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium">Daily Game Earnings Limit</h3>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openSettingModal(settings?.find(s => s.key === 'game_daily_limit'))}
                        >
                          Configure
                        </Button>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Limit: {settings?.find(s => s.key === 'game_daily_limit')?.value || '1000'} coins per day</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Premium Subscriptions Management */}
                <Card>
                  <CardHeader>
                    <CardTitle>Premium Subscriptions</CardTitle>
                    <CardDescription>
                      Manage premium user subscriptions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Expiry</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users?.filter((u: any) => u.isPremium)?.length > 0 ? (
                          users?.filter((u: any) => u.isPremium).map((user: any) => (
                            <TableRow key={`premium-${user.id}`}>
                              <TableCell className="font-medium">{user.username}</TableCell>
                              <TableCell>
                                {new Date(user.premiumUntil) > new Date() ? (
                                  <Badge variant="outline" className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-none">
                                    Active
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-none">
                                    Expired
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>{new Date(user.premiumUntil).toLocaleDateString()}</TableCell>
                              <TableCell>
                                <Button
                                  variant="outline"
                                  size="sm"
                                >
                                  Extend
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                              No premium subscribers
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Withdrawal Processing Dialog */}
      <Dialog open={showWithdrawalModal} onOpenChange={setShowWithdrawalModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Withdrawal Request</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">User</p>
                  <p className="font-medium">
                    {users?.find((u: any) => u.id === selectedWithdrawal?.userId)?.username || `User #${selectedWithdrawal?.userId}`}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Amount</p>
                  <p className="font-medium">{selectedWithdrawal?.amount?.toLocaleString()} coins</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Withdrawal Method</p>
                <p className="font-medium capitalize">{selectedWithdrawal?.method}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Account Details</p>
                <p className="font-medium break-all">{selectedWithdrawal?.accountDetails}</p>
              </div>
              
              <Separator className="my-4" />
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Processing Options</p>
                <div className="flex space-x-2 mt-2">
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => processWithdrawal("approved")}
                    disabled={processWithdrawalMutation.isPending}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => processWithdrawal("rejected")}
                    disabled={processWithdrawalMutation.isPending}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWithdrawalModal(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Setting Edit Dialog */}
      <Dialog 
        open={showSettingModal} 
        onOpenChange={(open) => {
          if (!open) {
            setShowSettingModal(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit System Setting</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSettingSubmit)} className="space-y-4 py-2">
              <FormField
                control={form.control}
                name="key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Key</FormLabel>
                    <FormControl>
                      <Input placeholder="Setting key" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Value</FormLabel>
                    <FormControl>
                      <Input placeholder="Setting value" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSettingModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateSettingMutation.isPending}>
                  {updateSettingMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

function getSettingDescription(key: string): string {
  const descriptions: Record<string, string> = {
    'afk_rate': 'Rate of earning coins in AFK mode (coins per minute)',
    'afk_daily_limit': 'Maximum daily earnings from AFK mode (in coins)',
    'coin_value': 'Value of 1000 coins in real currency (USD)',
    'withdrawal_min': 'Minimum amount of coins required for withdrawal',
    'referral_bonus': 'Percentage of referral earnings given to referrer',
    'new_user_bonus': 'Bonus coins given to new users upon registration',
    'premium_price': 'Monthly subscription price in USD',
    'premium_afk_multiplier': 'Multiplier for AFK earnings for premium users',
    'premium_daily_limit_bonus': 'Additional daily limit for premium users',
    'ad_refresh_rate': 'How often ads should refresh (in seconds)',
    'ad_banner_enabled': 'Whether banner ads are enabled (true/false)',
    'ad_video_enabled': 'Whether video ads are enabled (true/false)',
    'ad_interstitial_enabled': 'Whether interstitial ads are enabled (true/false)',
    'game_clicker_reward': 'Base reward for Clicker game',
    'game_memory_reward': 'Base reward for Memory game',
    'game_max_earnings': 'Maximum coins that can be earned from a single game session',
    'game_daily_limit': 'Maximum coins that can be earned from games per day',
    'exoclick_site_id': 'ExoClick site ID for ad integration',
    'captcha_disabled_premium': 'Whether captchas are disabled for premium users (true/false)',
  };
  
  return descriptions[key] || 'System configuration setting';
}