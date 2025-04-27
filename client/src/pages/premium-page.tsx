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
import { cn } from "@/lib/utils";
import { Crown, CreditCard, AlertCircle, Check, ChevronRight, Upload } from "lucide-react";

// Form schema for premium subscription
const subscriptionSchema = z.object({
  method: z.enum(["paypal", "gcash", "bank_transfer", "crypto"], {
    required_error: "Please select a payment method",
  }),
  amount: z.number({
    required_error: "Amount is required",
    invalid_type_error: "Amount must be a number",
  }),
  durationMonths: z.number({
    required_error: "Duration is required",
    invalid_type_error: "Duration must be a number",
  }),
  proofImage: z.string().min(5, "Please upload proof of payment"),
  notes: z.string().optional(),
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
      method: "paypal",
      amount: premiumPrice,
      durationMonths: 1,
      proofImage: "",
      notes: "",
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
                
                <div className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Priority Withdrawals</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Your withdrawal requests are processed before regular users
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
                  {/* Payment Method */}
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
                              <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="paypal">PayPal</SelectItem>
                            <SelectItem value="gcash">GCash</SelectItem>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            <SelectItem value="crypto">Cryptocurrency</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select the method you used to make the payment
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Duration & Amount Combined */}
                  <FormField
                    control={form.control}
                    name="durationMonths"
                    render={({ field }) => (
                      <FormItem className="space-y-4">
                        <FormLabel>
                          <div className="flex items-center gap-1">
                            <CreditCard className="h-4 w-4" />
                            <span>Subscription Plan</span>
                          </div>
                        </FormLabel>
                        <FormDescription>
                          Select your preferred subscription duration and payment amount
                        </FormDescription>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div 
                            className={cn(
                              "border rounded-lg p-4 cursor-pointer transition-all",
                              field.value === 1 
                                ? "border-primary bg-primary-50 dark:bg-primary-900/20" 
                                : "hover:border-gray-400 dark:hover:border-gray-600"
                            )}
                            onClick={() => {
                              field.onChange(1);
                              form.setValue("amount", 5);
                            }}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <h4 className="font-medium">1 Month</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Basic Plan</p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-primary">$5</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">$5/mo</p>
                              </div>
                            </div>
                            {field.value === 1 && (
                              <div className="mt-2 flex items-center text-xs text-primary">
                                <Check className="h-3 w-3 mr-1" /> Selected
                              </div>
                            )}
                          </div>
                          
                          <div 
                            className={cn(
                              "border rounded-lg p-4 cursor-pointer transition-all",
                              field.value === 3 
                                ? "border-primary bg-primary-50 dark:bg-primary-900/20" 
                                : "hover:border-gray-400 dark:hover:border-gray-600"
                            )}
                            onClick={() => {
                              field.onChange(3);
                              form.setValue("amount", 14);
                            }}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <h4 className="font-medium">3 Months</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Popular</p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-primary">$14</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">$4.67/mo</p>
                              </div>
                            </div>
                            <div className="mt-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs px-1.5 py-0.5 rounded inline-block">
                              Save 7%
                            </div>
                            {field.value === 3 && (
                              <div className="mt-1 flex items-center text-xs text-primary">
                                <Check className="h-3 w-3 mr-1" /> Selected
                              </div>
                            )}
                          </div>
                          
                          <div 
                            className={cn(
                              "border rounded-lg p-4 cursor-pointer transition-all",
                              field.value === 6 
                                ? "border-primary bg-primary-50 dark:bg-primary-900/20" 
                                : "hover:border-gray-400 dark:hover:border-gray-600"
                            )}
                            onClick={() => {
                              field.onChange(6);
                              form.setValue("amount", 25);
                            }}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <h4 className="font-medium">6 Months</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Best Value</p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-primary">$25</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">$4.17/mo</p>
                              </div>
                            </div>
                            <div className="mt-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs px-1.5 py-0.5 rounded inline-block">
                              Save 17%
                            </div>
                            {field.value === 6 && (
                              <div className="mt-1 flex items-center text-xs text-primary">
                                <Check className="h-3 w-3 mr-1" /> Selected
                              </div>
                            )}
                          </div>
                          
                          <div 
                            className={cn(
                              "border rounded-lg p-4 cursor-pointer transition-all",
                              field.value === 12 
                                ? "border-primary bg-primary-50 dark:bg-primary-900/20" 
                                : "hover:border-gray-400 dark:hover:border-gray-600"
                            )}
                            onClick={() => {
                              field.onChange(12);
                              form.setValue("amount", 45);
                            }}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <h4 className="font-medium">12 Months</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Annual</p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-primary">$45</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">$3.75/mo</p>
                              </div>
                            </div>
                            <div className="mt-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs px-1.5 py-0.5 rounded inline-block">
                              Save 25%
                            </div>
                            {field.value === 12 && (
                              <div className="mt-1 flex items-center text-xs text-primary">
                                <Check className="h-3 w-3 mr-1" /> Selected
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Hidden Amount field that gets set based on duration selection */}
                  <input type="hidden" {...form.register("amount", { valueAsNumber: true })} />
                  
                  {/* Payment Proof */}
                  <FormField
                    control={form.control}
                    name="proofImage"
                    render={({ field: { value, onChange, ...fieldProps } }) => (
                      <FormItem>
                        <FormLabel>
                          <div className="flex items-center gap-1">
                            <Upload className="h-4 w-4" />
                            <span>Payment Proof</span>
                          </div>
                        </FormLabel>
                        <FormControl>
                          <div className="flex flex-col space-y-2">
                            <Input
                              type="file"
                              accept="image/*"
                              className="cursor-pointer"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  // Compress and convert the image before uploading
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    const img = new Image();
                                    img.onload = () => {
                                      // Create a canvas to resize the image
                                      const canvas = document.createElement('canvas');
                                      // Max dimensions for the image (reduces file size)
                                      const MAX_WIDTH = 800;
                                      const MAX_HEIGHT = 800;
                                      
                                      let width = img.width;
                                      let height = img.height;
                                      
                                      // Calculate new dimensions while maintaining aspect ratio
                                      if (width > height) {
                                        if (width > MAX_WIDTH) {
                                          height *= MAX_WIDTH / width;
                                          width = MAX_WIDTH;
                                        }
                                      } else {
                                        if (height > MAX_HEIGHT) {
                                          width *= MAX_HEIGHT / height;
                                          height = MAX_HEIGHT;
                                        }
                                      }
                                      
                                      canvas.width = width;
                                      canvas.height = height;
                                      
                                      // Draw the resized image on the canvas
                                      const ctx = canvas.getContext('2d');
                                      ctx?.drawImage(img, 0, 0, width, height);
                                      
                                      // Convert canvas to base64 with reduced quality
                                      const compressedImage = canvas.toDataURL('image/jpeg', 0.7);
                                      onChange(compressedImage);
                                    };
                                    img.src = event.target?.result as string;
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              {...fieldProps}
                            />
                            {value && value.startsWith('data:image') && (
                              <div className="mt-2 border rounded-md overflow-hidden">
                                <img 
                                  src={value} 
                                  alt="Payment proof preview" 
                                  className="max-h-48 object-contain mx-auto"
                                />
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormDescription>
                          Upload a screenshot of your payment confirmation.
                          Images will be automatically compressed to reduce file size.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Notes */}
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Notes</FormLabel>
                        <FormControl>
                          <textarea 
                            className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Any additional information about your payment" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Optional: any details that might help verify your payment
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