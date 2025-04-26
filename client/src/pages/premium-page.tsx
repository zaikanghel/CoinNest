import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import MainLayout from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useSettings } from "@/hooks/use-settings";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Crown, CreditCard, AlertCircle, Check, ChevronRight } from "lucide-react";

// Form schema for premium subscription
const subscriptionSchema = z.object({
  paymentMethod: z.enum(["paypal", "gcash", "bank"], {
    required_error: "Please select a payment method",
  }),
  receiptId: z.string().min(4, "Please enter a valid receipt ID or transaction reference"),
});

type SubscriptionFormData = z.infer<typeof subscriptionSchema>;

export default function PremiumPage() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const { toast } = useToast();
  const [step, setStep] = useState<"info" | "payment" | "confirmation">("info");
  
  // Check if the user is already premium
  const isPremium = user?.isPremium || false;
  const premiumUntil = user?.premiumUntil ? new Date(user.premiumUntil) : null;
  const premiumActive = isPremium && premiumUntil && premiumUntil > new Date();

  // Get premium price from settings
  const premiumPrice = Number(settings.premium_price || 4.99);
  const premiumAfkMultiplier = Number(settings.premium_afk_multiplier || 2);
  const premiumDailyLimitBonus = Number(settings.premium_daily_limit_bonus || 200);
  const captchaDisabled = settings.captcha_disabled_premium === 'true';
  
  // Form for premium subscription
  const form = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      paymentMethod: "paypal",
      receiptId: "",
    },
  });

  // Mutation for submitting premium subscription request
  const subscriptionMutation = useMutation({
    mutationFn: async (data: SubscriptionFormData) => {
      const res = await apiRequest("POST", "/api/premium/subscribe", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Subscription request submitted",
        description: "We will review your payment and activate your premium subscription soon",
        variant: "default",
      });
      setStep("confirmation");
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: SubscriptionFormData) => {
    subscriptionMutation.mutate(data);
  };

  return (
    <MainLayout pageTitle="Premium Subscription">
      <div className="space-y-6">
        {/* Header Card */}
        <Card className="border-0 bg-gradient-to-r from-primary/70 to-accent/70 text-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Crown className="h-8 w-8 text-yellow-300" />
              <div>
                <h2 className="text-2xl font-bold">Premium Membership</h2>
                <p className="text-white/80">
                  Upgrade to premium for enhanced earning capabilities
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {premiumActive ? (
          <Card>
            <CardHeader>
              <CardTitle>Your Premium Status</CardTitle>
              <CardDescription>
                You're currently enjoying premium benefits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-primary-50 dark:bg-primary-900/20 p-4 border border-primary-200 dark:border-primary-800">
                <div className="flex items-center gap-2 text-primary-700 dark:text-primary-300 font-medium">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  <span>Active Premium Membership</span>
                </div>
                {premiumUntil && (
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Valid until: {premiumUntil.toLocaleDateString()}
                  </p>
                )}
              </div>
              
              <div className="space-y-3">
                <h3 className="font-medium">Your Premium Benefits</h3>
                
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">{premiumAfkMultiplier}x AFK Earnings</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Earn coins faster in AFK mode
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Higher Daily Limits</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      +{premiumDailyLimitBonus} bonus to your daily AFK earnings limit
                    </p>
                  </div>
                </div>
                
                {captchaDisabled && (
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">No Captchas</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Enjoy uninterrupted AFK earning without verification
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : step === "info" ? (
          <Card>
            <CardHeader>
              <CardTitle>Upgrade to Premium</CardTitle>
              <CardDescription>
                Enjoy enhanced benefits and maximize your earnings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 p-4 border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-medium">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  <span>${premiumPrice}/month Premium Membership</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-medium">Premium Benefits</h3>
                
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">{premiumAfkMultiplier}x AFK Earnings</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Earn coins faster in AFK mode
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Higher Daily Limits</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      +{premiumDailyLimitBonus} bonus to your daily AFK earnings limit
                    </p>
                  </div>
                </div>
                
                {captchaDisabled && (
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">No Captchas</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Enjoy uninterrupted AFK earning without verification
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Priority Support</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Get faster responses from our support team
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={() => setStep("payment")}
              >
                Get Premium Now
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardFooter>
          </Card>
        ) : step === "payment" ? (
          <Card>
            <CardHeader>
              <CardTitle>Subscribe to Premium</CardTitle>
              <CardDescription>
                Complete your payment to activate premium features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 rounded-lg bg-amber-50 dark:bg-amber-900/20 p-4 border border-amber-200 dark:border-amber-800">
                <p className="text-center text-amber-700 dark:text-amber-300">
                  <span className="text-2xl font-bold">${premiumPrice}</span> / month
                </p>
              </div>
              
              <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-4 mb-6">
                <h3 className="font-medium mb-2">Payment Instructions:</h3>
                <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400 list-decimal list-inside">
                  <li>Make a payment of ${premiumPrice} to one of our supported payment methods</li>
                  <li>Keep your transaction ID or receipt number ready</li>
                  <li>Fill in the form below with your payment details</li>
                  <li>Our team will verify your payment and activate your premium subscription</li>
                </ol>
              </div>
              
              <Separator className="my-6" />
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="paypal">PayPal</SelectItem>
                            <SelectItem value="gcash">GCash</SelectItem>
                            <SelectItem value="bank">Bank Transfer</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select the method you used to make the payment
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="receiptId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Receipt ID / Transaction Reference</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your payment reference" {...field} />
                        </FormControl>
                        <FormDescription>
                          The transaction ID or receipt number from your payment
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Alert className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <AlertTitle>Manual verification</AlertTitle>
                    <AlertDescription>
                      Premium subscriptions are manually verified by our team. Your account will be upgraded within 24 hours after verification.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="flex gap-3 pt-2">
                    <Button 
                      variant="outline" 
                      type="button"
                      onClick={() => setStep("info")}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1"
                      disabled={subscriptionMutation.isPending}
                    >
                      {subscriptionMutation.isPending ? "Submitting..." : "Submit Payment Details"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Subscription Request Received</CardTitle>
              <CardDescription>
                We've received your premium subscription request
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                  <Check className="h-5 w-5" />
                  <span className="font-medium">Payment details submitted successfully</span>
                </div>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400">
                Your payment details have been submitted for verification. Our team will review your payment and activate your premium subscription within 24 hours.
              </p>
              
              <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertTitle>What's next?</AlertTitle>
                <AlertDescription>
                  You'll receive a notification once your premium status is activated. If there are any issues with your payment, we'll contact you via email.
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => setStep("info")}
              >
                Return to Premium Info
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}