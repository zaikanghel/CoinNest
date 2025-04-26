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
            <Card className="bg-gradient-to-br from-primary-600 to-violet-600 text-white">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium text-white/80">Current Balance</h3>
                    <div className="flex items-center mt-2">
                      <DollarSign className="h-8 w-8 mr-2" />
                      <span className="text-4xl font-bold">{wallet?.balance.toLocaleString()}</span>
                      <span className="ml-2 text-white/80">coins</span>
                    </div>
                    <p className="mt-2 text-white/80">
                      ≈ ${((wallet?.balance || 0) / wallet?.conversionRate).toFixed(2)} at rate of {wallet?.conversionRate} coins = $1
                    </p>
                  </div>
                  <div className="mt-6 md:mt-0">
                    <Button 
                      size="lg" 
                      className="bg-white/20 hover:bg-white/30 text-white border-white/20"
                      onClick={() => setShowWithdrawalModal(true)}
                      disabled={!wallet || wallet.balance < wallet.minWithdrawal}
                    >
                      <Banknote className="mr-2 h-5 w-5" />
                      Withdraw Funds
                    </Button>
                    <p className="text-xs text-white/80 mt-2 text-center">
                      Minimum withdrawal: {wallet?.minWithdrawal} coins
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Withdrawal History */}
            <Card>
              <CardHeader>
                <CardTitle>Withdrawal History</CardTitle>
                <CardDescription>
                  Track the status of your withdrawal requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                {wallet?.withdrawals && wallet.withdrawals.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-12 py-2 font-medium text-sm">
                      <div className="col-span-3">Date</div>
                      <div className="col-span-2">Amount</div>
                      <div className="col-span-3">Method</div>
                      <div className="col-span-2">Status</div>
                      <div className="col-span-2">Processed</div>
                    </div>
                    <Separator />
                    {wallet.withdrawals.map((withdrawal: any) => (
                      <div key={withdrawal.id} className="grid grid-cols-12 py-3 text-sm items-center">
                        <div className="col-span-3">
                          {new Date(withdrawal.createdAt).toLocaleDateString()}
                        </div>
                        <div className="col-span-2 font-medium">
                          {withdrawal.amount.toLocaleString()} coins
                        </div>
                        <div className="col-span-3 capitalize">
                          {withdrawal.method}
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
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No withdrawals yet</h3>
                    <p className="mt-1">Your withdrawal history will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Withdrawal FAQ */}
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium mb-1">How do I withdraw my earnings?</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Click the "Withdraw Funds" button above, enter the amount you want to withdraw,
                    select your preferred payment method, and provide your account details.
                  </p>
                </div>
                <Separator />
                <div>
                  <h3 className="font-medium mb-1">How long do withdrawals take to process?</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Withdrawals are typically processed within 1-3 business days after approval.
                  </p>
                </div>
                <Separator />
                <div>
                  <h3 className="font-medium mb-1">What payment methods are supported?</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    We currently support PayPal and GCash as withdrawal methods.
                  </p>
                </div>
                <Separator />
                <div>
                  <h3 className="font-medium mb-1">What is the minimum withdrawal amount?</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    The minimum withdrawal amount is {wallet?.minWithdrawal} coins (${((wallet?.minWithdrawal || 0) / wallet?.conversionRate).toFixed(2)}).
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Withdrawal Modal */}
      <Dialog open={showWithdrawalModal} onOpenChange={setShowWithdrawalModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw Funds</DialogTitle>
            <DialogDescription>
              Enter the amount you want to withdraw and your payment details.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (coins)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type="number" 
                          min={wallet?.minWithdrawal} 
                          max={user?.balance}
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value))}
                        />
                        <div className="absolute right-3 top-2.5 text-gray-500 text-sm">
                          ≈ ${field.value ? (field.value / (wallet?.conversionRate || 100)).toFixed(2) : "0.00"}
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a payment method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="paypal">PayPal</SelectItem>
                        <SelectItem value="gcash">GCash</SelectItem>
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
                    <FormLabel>Account Details</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={form.watch("method") === "paypal" ? "PayPal email address" : "GCash mobile number"} 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowWithdrawalModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={withdrawalMutation.isPending}>
                  {withdrawalMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Submit Withdrawal"
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
