import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { loginSchema, registerSchema } from "@shared/schema";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [, navigate] = useLocation();
  
  // Get authentication context
  const { user, isLoading, loginMutation, registerMutation } = useAuth();
  
  // Check for tab query parameter and set active tab
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'login' || tabParam === 'register') {
      setActiveTab(tabParam);
    }
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  // Login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      referredBy: "",
    },
  });

  // Handle login submit
  const onLoginSubmit = (values: z.infer<typeof loginSchema>) => {
    setLoginError(null);
    loginMutation.mutate(values, {
      onError: (error) => {
        setLoginError(error.message);
      }
      // No onSuccess handler needed - redirection handled in auth hook
    });
  };

  // Handle register submit
  const onRegisterSubmit = (values: z.infer<typeof registerSchema>) => {
    setRegisterError(null);
    registerMutation.mutate(values, {
      onError: (error) => {
        setRegisterError(error.message);
      }
      // No onSuccess handler needed - redirection handled in auth hook
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary via-accent to-violet-600 text-white p-8 md:w-1/2 flex flex-col justify-center relative overflow-hidden">
        {/* Animated gradient circles in background */}
        <div className="absolute w-64 h-64 rounded-full bg-white/10 -top-10 -left-10 animate-pulse"></div>
        <div className="absolute w-96 h-96 rounded-full bg-white/5 bottom-10 -right-20 animate-pulse" style={{animationDelay: '1s'}}></div>
        
        <div className="max-w-md mx-auto relative z-10">
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
              IdleCash
            </h1>
            <div className="h-1 w-20 bg-white/40 rounded-full mb-6"></div>
          </div>
          
          <h2 className="text-2xl md:text-3xl font-semibold mb-6 leading-tight">
            Earn Money 24/7, Even While<br />
            <span className="text-yellow-300">You Sleep!</span>
          </h2>
          
          <p className="text-lg mb-8 text-white/90 leading-relaxed">
            Keep the tab open and earn money passively with our AFK system. Boost your earnings with fun mini-games and cash out directly to PayPal or GCash.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-start bg-white/10 p-4 rounded-lg backdrop-blur-sm transition-all hover:bg-white/20">
              <div className="bg-gradient-to-br from-blue-500 to-violet-500 p-3 rounded-lg mr-4 shadow-lg">
                <span className="text-xl">💤</span>
              </div>
              <div>
                <h3 className="font-medium text-lg">Passive Income</h3>
                <p className="text-white/80">Earn 24/7 just by keeping the tab open</p>
              </div>
            </div>
            
            <div className="flex items-start bg-white/10 p-4 rounded-lg backdrop-blur-sm transition-all hover:bg-white/20">
              <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-3 rounded-lg mr-4 shadow-lg">
                <span className="text-xl">💰</span>
              </div>
              <div>
                <h3 className="font-medium text-lg">Real Cash Payouts</h3>
                <p className="text-white/80">Withdraw to PayPal or GCash anytime</p>
              </div>
            </div>
            
            <div className="flex items-start bg-white/10 p-4 rounded-lg backdrop-blur-sm transition-all hover:bg-white/20">
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-lg mr-4 shadow-lg">
                <span className="text-xl">🚀</span>
              </div>
              <div>
                <h3 className="font-medium text-lg">Boost Your Earnings</h3>
                <p className="text-white/80">Play mini-games & invite friends for bonuses</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Forms */}
      <div className="p-8 md:w-1/2 flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <Card className="w-full max-w-md shadow-xl border-0 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader className="space-y-2">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-2">
              <span className="text-2xl text-white">{activeTab === "login" ? "🔑" : "✨"}</span>
            </div>
            <CardTitle className="text-2xl font-bold text-center">
              {activeTab === "login" ? "Welcome Back" : "Create an Account"}
            </CardTitle>
            <CardDescription className="text-center">
              {activeTab === "login"
                ? "Enter your credentials to access your account"
                : "Fill out the form below to get started"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2 mb-6 p-1">
                <TabsTrigger value="login" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">Login</TabsTrigger>
                <TabsTrigger value="register" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">Register</TabsTrigger>
              </TabsList>

              {/* Login Form */}
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter your password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {loginError && (
                      <Alert variant="destructive">
                        <AlertDescription>
                          {loginError}
                        </AlertDescription>
                      </Alert>
                    )}
                    <Button 
                      type="submit" 
                      className="w-full mt-6 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-medium" 
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Logging in...
                        </>
                      ) : (
                        "Login Now"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              {/* Register Form */}
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Choose a username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Enter your email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Create a password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="referredBy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Referral Code (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter referral code if you have one" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {registerError && (
                      <Alert variant="destructive">
                        <AlertDescription>
                          {registerError}
                        </AlertDescription>
                      </Alert>
                    )}
                    <Button 
                      type="submit" 
                      className="w-full mt-6 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-medium" 
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        "Join IdleCash Now"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}