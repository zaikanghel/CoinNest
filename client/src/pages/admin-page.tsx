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
    if (setting) {
      form.reset({
        key: setting.key,
        value: setting.value
      });
    } else {
      form.reset({
        key: "",
        value: ""
      });
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
            <TabsList className="grid w-full grid-cols-3 mb-6">
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
                    onClick={() => processWithdrawal("completed")}
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
      <Dialog open={showSettingModal} onOpenChange={setShowSettingModal}>
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
  };
  
  return descriptions[key] || 'System configuration setting';
}