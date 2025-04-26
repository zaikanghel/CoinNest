import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import MainLayout from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, DollarSign, Banknote, AlertCircle } from "lucide-react";

// Define schema for withdrawal form
const withdrawalSchema = z.object({
  amount: z.number().min(1000, "Minimum withdrawal is 1000 coins"),
  method: z.string().min(1, "Please select a withdrawal method"),
  accountDetails: z.string().min(5, "Please enter valid account details")
});

type WithdrawalFormData = z.infer<typeof withdrawalSchema>;

export default function WalletPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);

  // Fetch wallet data
  const { data: wallet, isLoading } = useQuery({
    queryKey: ["/api/wallet"],
    queryFn: async () => {
      const res = await fetch("/api/wallet", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch wallet data");
      return res.json();
    }
  });

  const form = useForm<WithdrawalFormData>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: 1000,
      method: "",
      accountDetails: ""
    }
  });

  // Withdrawal mutation
  const withdrawalMutation = useMutation({
    mutationFn: async (data: WithdrawalFormData) => {
      const res = await apiRequest("POST", "/api/withdrawals", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Withdrawal requested",
        description: "Your withdrawal request has been submitted for approval",
        variant: "default"
      });
      setShowWithdrawalModal(false);
      form.reset();
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Withdrawal failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: WithdrawalFormData) => {
    withdrawalMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-none">Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-none">Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-none">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <MainLayout pageTitle="Wallet">
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : (
          <>
            {/* Balance Card */}
            <Card className="bg-gradient-to-r from-primary to-accent text-white shadow-xl overflow-hidden border-0 relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mt-20 -mr-20"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -mb-16 -ml-16"></div>
              
              <CardContent className="p-8 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-center">
                  <div className="text-center md:text-left">
                    <h3 className="text-lg font-medium text-white/90">Current Balance</h3>
                    <div className="flex items-center justify-center md:justify-start mt-2">
                      <div className="bg-white/20 p-3 rounded-full mr-4">
                        <DollarSign className="h-8 w-8" />
                      </div>
                      <div>
                        <span className="text-5xl font-bold">{wallet?.balance.toLocaleString()}</span>
                        <span className="ml-2 text-white/90 text-xl">coins</span>
                        <p className="mt-1 text-white/80 text-sm">
                          ≈ <span className="font-medium">${((wallet?.balance || 0) / wallet?.conversionRate).toFixed(2)}</span> at rate of {wallet?.conversionRate} coins = $1
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-8 md:mt-0 bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                    <div className="text-center mb-3">
                      <p className="font-medium">Ready to cash out?</p>
                      <p className="text-xs text-white/80">
                        Minimum withdrawal: <span className="font-bold">{wallet?.minWithdrawal}</span> coins
                      </p>
                    </div>
                    <Button 
                      size="lg" 
                      className="w-full bg-white hover:bg-white/90 text-primary hover:text-primary/90 border-0 shadow-lg font-bold transition-all duration-300 hover:shadow-xl hover:translate-y-[-2px]"
                      onClick={() => setShowWithdrawalModal(true)}
                      disabled={!wallet || wallet.balance < wallet.minWithdrawal}
                    >
                      <Banknote className="mr-2 h-5 w-5" />
                      Withdraw Funds
                    </Button>
                    {(!wallet || wallet.balance < wallet.minWithdrawal) && (
                      <p className="text-xs text-white/80 mt-2 text-center">
                        You need {wallet ? (wallet.minWithdrawal - wallet.balance) : "more"} coins to reach minimum withdrawal
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                  <div className="bg-white/10 p-3 rounded-lg text-center">
                    <p className="text-xs text-white/80">Total Withdrawn</p>
                    <p className="text-xl font-bold mt-1">
                      {wallet?.totalWithdrawn || 0} <span className="text-sm font-normal">coins</span>
                    </p>
                  </div>
                  <div className="bg-white/10 p-3 rounded-lg text-center">
                    <p className="text-xs text-white/80">Pending Withdrawals</p>
                    <p className="text-xl font-bold mt-1">
                      {wallet?.pendingWithdrawals || 0} <span className="text-sm font-normal">coins</span>
                    </p>
                  </div>
                  <div className="bg-white/10 p-3 rounded-lg text-center">
                    <p className="text-xs text-white/80">Earnings Rate</p>
                    <p className="text-xl font-bold mt-1">
                      {wallet?.earningsRate || "2-5"} <span className="text-sm font-normal">coins/min</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Withdrawal History */}
            <Card className="border-0 shadow-md overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-xl font-bold">Withdrawal History</CardTitle>
                    <CardDescription className="text-gray-500 dark:text-gray-400">
                      Track the status of your payment requests
                    </CardDescription>
                  </div>
                  <div className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full font-medium">
                    Last 30 days
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {wallet?.withdrawals && wallet.withdrawals.length > 0 ? (
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    <div className="grid grid-cols-12 p-4 font-medium text-sm bg-gray-50 dark:bg-gray-800/50">
                      <div className="col-span-3">Date</div>
                      <div className="col-span-2">Amount</div>
                      <div className="col-span-3">Method</div>
                      <div className="col-span-2">Status</div>
                      <div className="col-span-2">Processed</div>
                    </div>
                    {wallet.withdrawals.map((withdrawal: any) => (
                      <div 
                        key={withdrawal.id} 
                        className="grid grid-cols-12 p-4 text-sm items-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-150"
                      >
                        <div className="col-span-3 flex items-center">
                          <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-full mr-3">
                            <i className={`${withdrawal.method === 'paypal' ? 'ri-paypal-line' : 'ri-bank-card-line'} text-gray-500`}></i>
                          </div>
                          <span>{new Date(withdrawal.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="col-span-2 font-semibold text-gray-900 dark:text-gray-100">
                          {withdrawal.amount.toLocaleString()} coins
                        </div>
                        <div className="col-span-3">
                          <span className="capitalize px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs">
                            {withdrawal.method}
                          </span>
                        </div>
                        <div className="col-span-2">
                          {getStatusBadge(withdrawal.status)}
                        </div>
                        <div className="col-span-2 text-gray-500">
                          {withdrawal.processedAt ? new Date(withdrawal.processedAt).toLocaleDateString() : '-'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 px-4 bg-gray-50/50 dark:bg-gray-800/20">
                    <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-full mb-4">
                      <AlertCircle className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">No withdrawals yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mt-2">
                      Once you reach the minimum withdrawal amount, you can request to cash out your earnings.
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-4 border-dashed"
                      onClick={() => setShowWithdrawalModal(true)}
                      disabled={!wallet || wallet.balance < wallet.minWithdrawal}
                    >
                      <Banknote className="mr-2 h-4 w-4" />
                      Request Withdrawal
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Withdrawal FAQ */}
            <Card className="border-0 shadow-md overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10">
                <CardTitle className="flex items-center text-xl font-bold">
                  <div className="bg-blue-100 dark:bg-blue-900/20 p-2 rounded-full mr-3">
                    <i className="ri-question-line text-blue-600 dark:text-blue-400"></i>
                  </div>
                  Frequently Asked Questions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  <div className="p-5 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <h3 className="font-bold mb-2 flex items-center text-gray-900 dark:text-gray-100">
                      <i className="ri-money-dollar-circle-line mr-2 text-green-500"></i>
                      How do I withdraw my earnings?
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 ml-6">
                      Click the "Withdraw Funds" button above, enter the amount you want to withdraw,
                      select your preferred payment method (PayPal or GCash), and provide your account details.
                      Our team will review your request and process it promptly.
                    </p>
                  </div>
                  
                  <div className="p-5 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <h3 className="font-bold mb-2 flex items-center text-gray-900 dark:text-gray-100">
                      <i className="ri-time-line mr-2 text-amber-500"></i>
                      How long do withdrawals take to process?
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 ml-6">
                      Withdrawals are typically processed within 1-3 business days after approval.
                      You'll receive a notification once your withdrawal has been processed.
                    </p>
                  </div>
                  
                  <div className="p-5 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <h3 className="font-bold mb-2 flex items-center text-gray-900 dark:text-gray-100">
                      <i className="ri-bank-card-line mr-2 text-violet-500"></i>
                      What payment methods are supported?
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 ml-6">
                      We currently support PayPal and GCash as withdrawal methods. Make sure to provide the correct account details 
                      (email for PayPal, mobile number for GCash) to ensure smooth processing.
                    </p>
                  </div>
                  
                  <div className="p-5 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <h3 className="font-bold mb-2 flex items-center text-gray-900 dark:text-gray-100">
                      <i className="ri-coins-line mr-2 text-amber-500"></i>
                      What is the minimum withdrawal amount?
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 ml-6">
                      The minimum withdrawal amount is <span className="font-semibold text-primary">{wallet?.minWithdrawal}</span> coins 
                      (approximately <span className="font-semibold">${((wallet?.minWithdrawal || 0) / wallet?.conversionRate).toFixed(2)}</span>).
                      This helps us minimize processing fees and provide efficient service.
                    </p>
                  </div>
                  
                  <div className="p-5 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <h3 className="font-bold mb-2 flex items-center text-gray-900 dark:text-gray-100">
                      <i className="ri-secure-payment-line mr-2 text-red-500"></i>
                      Are there any fees for withdrawals?
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 ml-6">
                      We don't charge any fees for withdrawals. However, payment processors like PayPal or GCash may charge 
                      their own transaction fees which will be deducted from your withdrawal amount.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Withdrawal Modal */}
      <Dialog open={showWithdrawalModal} onOpenChange={setShowWithdrawalModal}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-0 shadow-xl">
          <div className="bg-gradient-to-r from-primary to-accent p-6 text-white">
            <div className="flex items-center mb-2">
              <div className="bg-white/20 p-2 rounded-full mr-3">
                <Banknote className="h-5 w-5" />
              </div>
              <DialogTitle className="text-xl font-bold text-white">Withdraw Funds</DialogTitle>
            </div>
            <DialogDescription className="text-white/80">
              Enter the amount you want to withdraw and your payment details.
            </DialogDescription>
          </div>
          
          <div className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                {/* Current Balance Display */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Current Balance:</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100">{wallet?.balance.toLocaleString()} coins</span>
                </div>
                
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Amount (coins)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className="absolute left-3 top-2.5 text-gray-400">
                            <i className="ri-coins-line"></i>
                          </div>
                          <Input 
                            type="number" 
                            className="pl-9 pr-24"
                            min={wallet?.minWithdrawal} 
                            max={wallet?.balance}
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value) || wallet?.minWithdrawal || 1000)}
                          />
                          <div className="absolute right-3 top-2.5 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs font-medium">
                            ≈ ${field.value ? (field.value / (wallet?.conversionRate || 100)).toFixed(2) : "0.00"}
                          </div>
                        </div>
                      </FormControl>
                      <div className="flex justify-between items-center text-xs mt-1">
                        <span className="text-gray-500">Min: {wallet?.minWithdrawal} coins</span>
                        <span className="text-gray-500">Max: {wallet?.balance} coins</span>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="method"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">Payment Method</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-white dark:bg-gray-800">
                              <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="paypal" className="flex items-center">
                              <div className="flex items-center">
                                <i className="ri-paypal-line text-blue-500 mr-2"></i> PayPal
                              </div>
                            </SelectItem>
                            <SelectItem value="gcash">
                              <div className="flex items-center">
                                <i className="ri-bank-card-line text-green-500 mr-2"></i> GCash
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="accountDetails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">Account Details</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <div className="absolute left-3 top-2.5 text-gray-400">
                              {form.watch("method") === "paypal" ? (
                                <i className="ri-mail-line"></i>
                              ) : (
                                <i className="ri-smartphone-line"></i>
                              )}
                            </div>
                            <Input 
                              className="pl-9"
                              placeholder={form.watch("method") === "paypal" ? "PayPal email address" : "GCash mobile number"} 
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Info box */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-xs text-blue-600 dark:text-blue-400 flex items-start">
                  <i className="ri-information-line mr-2 mt-0.5"></i>
                  <p>
                    Withdrawals are processed within 1-3 business days. Make sure your account details are correct to avoid delays.
                  </p>
                </div>
                
                <DialogFooter className="pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowWithdrawalModal(false)}
                    className="border-gray-200 dark:border-gray-700"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={withdrawalMutation.isPending}
                    className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white"
                  >
                    {withdrawalMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <div className="flex items-center">
                        <i className="ri-bank-card-line mr-2"></i>
                        Submit Withdrawal
                      </div>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
