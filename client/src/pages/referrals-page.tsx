import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Share2, Copy, Users, Gift, AlertCircle, Percent, Info } from "lucide-react";
import { getColorFromString, getUserInitials } from "@/lib/utils";

export default function ReferralsPage() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  // Fetch referral data
  const { data: referralData, isLoading } = useQuery({
    queryKey: ["/api/referrals"],
    queryFn: async () => {
      const res = await fetch("/api/referrals", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch referral data");
      return res.json();
    }
  });

  const copyReferralCode = () => {
    if (referralData?.referralCode) {
      navigator.clipboard.writeText(referralData.referralCode);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Referral code copied to clipboard",
        variant: "default",
      });
      
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyReferralLink = () => {
    const referralLink = `${window.location.origin}/auth?ref=${referralData?.referralCode}`;
    navigator.clipboard.writeText(referralLink);
    toast({
      title: "Copied!",
      description: "Referral link copied to clipboard",
      variant: "default",
    });
  };

  const shareReferral = () => {
    if (navigator.share) {
      navigator.share({
        title: "Join me on EarnPlay",
        text: "Sign up to EarnPlay and earn coins by playing games and AFK activities!",
        url: `${window.location.origin}/auth?ref=${referralData?.referralCode}`
      }).catch(error => {
        console.error("Error sharing:", error);
      });
    } else {
      copyReferralLink();
    }
  };

  return (
    <MainLayout pageTitle="Referrals">
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : (
          <>
            {/* Referral Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Total Referrals</p>
                      <h3 className="text-2xl font-bold mt-1">{referralData?.totalReferrals || 0}</h3>
                    </div>
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 rounded-lg">
                      <Users className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Referral Earnings</p>
                      <h3 className="text-2xl font-bold mt-1">{referralData?.referralEarnings || 0}</h3>
                    </div>
                    <div className="p-2 bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300 rounded-lg">
                      <Gift className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Commission Rate</p>
                      <h3 className="text-2xl font-bold mt-1">{referralData?.referralPercent || 5}%</h3>
                    </div>
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 rounded-lg">
                      <Percent className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Referral Code */}
            <Card>
              <CardHeader>
                <CardTitle>Your Referral Code</CardTitle>
                <CardDescription>
                  Share your code with friends to earn {referralData?.referralBonus} coins for each new signup
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <label className="text-sm text-gray-500 dark:text-gray-400 mb-2 block">
                      Referral Code
                    </label>
                    <div className="flex">
                      <Input 
                        value={referralData?.referralCode || ""}
                        readOnly
                        className="font-medium text-lg"
                      />
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="ml-2" 
                              onClick={copyReferralCode}
                            >
                              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Copy referral code</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <label className="text-sm text-gray-500 dark:text-gray-400 mb-2 block">
                      Referral Link
                    </label>
                    <div className="flex">
                      <Input 
                        value={`${window.location.origin}/auth?ref=${referralData?.referralCode || ""}`}
                        readOnly
                        className="text-xs md:text-sm"
                      />
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="ml-2" 
                              onClick={copyReferralLink}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Copy referral link</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 flex justify-center">
                  <Button className="w-full md:w-auto" onClick={shareReferral}>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share Referral Link
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* How Referrals Work */}
            <Card>
              <CardHeader>
                <CardTitle>How Referrals Work</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-300 mb-4">
                      <Share2 className="h-6 w-6" />
                    </div>
                    <h3 className="font-medium mb-2">Share Your Code</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Share your referral code or link with friends and on social media
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center text-green-600 dark:text-green-300 mb-4">
                      <Users className="h-6 w-6" />
                    </div>
                    <h3 className="font-medium mb-2">Friends Sign Up</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      When someone uses your code during registration, they become your referral
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-300 mb-4">
                      <Gift className="h-6 w-6" />
                    </div>
                    <h3 className="font-medium mb-2">Earn Rewards</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      You get {referralData?.referralBonus} coins immediately + {referralData?.referralPercent}% of their earnings
                    </p>
                  </div>
                </div>
                
                <Alert className="mt-4 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-800">
                  <Info className="h-4 w-4 mr-2" />
                  <AlertDescription>
                    The more active your referrals are, the more you earn! There's no limit to how many people you can refer.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
            
            {/* Referred Users */}
            <Card>
              <CardHeader>
                <CardTitle>Your Referred Users</CardTitle>
                <CardDescription>
                  Users who signed up using your referral code
                </CardDescription>
              </CardHeader>
              <CardContent>
                {referralData?.referredUsers && referralData.referredUsers.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-12 py-2 font-medium text-sm text-gray-500 dark:text-gray-400">
                      <div className="col-span-6 sm:col-span-5">User</div>
                      <div className="col-span-3 sm:col-span-4">Total Earned</div>
                      <div className="col-span-3">Your Commission</div>
                    </div>
                    <Separator />
                    {referralData.referredUsers.map((user: any) => (
                      <div key={user.id} className="grid grid-cols-12 py-3 text-sm items-center">
                        <div className="col-span-6 sm:col-span-5 flex items-center">
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarFallback className={getColorFromString(user.username)}>
                              {getUserInitials(user.username)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{user.username}</span>
                        </div>
                        <div className="col-span-3 sm:col-span-4">{user.totalEarned.toLocaleString()} coins</div>
                        <div className="col-span-3 text-success-500">
                          {Math.floor(user.totalEarned * (referralData.referralPercent / 100)).toLocaleString()} coins
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No referrals yet</h3>
                    <p className="mt-1 text-gray-500 dark:text-gray-400">
                      Share your referral code to start earning commission
                    </p>
                  </div>
                )}
              </CardContent>
              {referralData?.referredUsers && referralData.referredUsers.length > 0 && (
                <CardFooter className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 text-sm">
                  <div className="ml-auto font-medium">
                    Total Commission: {' '}
                    <span className="text-success-500">
                      {referralData.referralEarnings.toLocaleString()} coins
                    </span>
                  </div>
                </CardFooter>
              )}
            </Card>
          </>
        )}
      </div>
    </MainLayout>
  );
}

function Check(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
