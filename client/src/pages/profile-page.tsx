import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { getUserInitials, getColorFromString, formatDate } from "@/lib/utils";
import { Loader2, Check, Save, Edit2 } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import MainLayout from "@/components/layout/main-layout";

const profileSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  email: z.string().email({ message: "Please enter a valid email" }),
  name: z.string().optional(),
  bio: z.string().max(160).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  // Fetch user profile data
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/profile"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/profile");
        return await res.json();
      } catch (error) {
        // If profile endpoint doesn't exist, use user data
        return user;
      }
    },
    enabled: !!user,
  });

  // Fetch user activities
  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ["/api/activities"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/activities");
      return await res.json();
    },
    enabled: !!user,
  });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user?.username || "",
      email: user?.email || "",
      name: profile?.name || "",
      bio: profile?.bio || "",
    },
    mode: "onChange",
  });

  // Update profile when user data changes
  useState(() => {
    if (user && !isEditing) {
      form.reset({
        username: user.username,
        email: user.email,
        name: profile?.name || "",
        bio: profile?.bio || "",
      });
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      const res = await apiRequest("PATCH", "/api/profile", values);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: ProfileFormValues) {
    updateProfileMutation.mutate(values);
  }

  return (
    <MainLayout pageTitle="Profile">
      <div className="container max-w-6xl mx-auto space-y-6">
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Profile Avatar */}
              <div className="flex flex-col items-center gap-2">
                <Avatar className="h-24 w-24 text-2xl">
                  <AvatarFallback className={getColorFromString(user?.username || "U")}>
                    {getUserInitials(user?.username || "User")}
                  </AvatarFallback>
                </Avatar>
                {user?.isAdmin && (
                  <Badge variant="secondary" className="px-2 py-1 text-xs font-medium">
                    Admin
                  </Badge>
                )}
              </div>

              {/* Profile Details */}
              <div className="flex-1 space-y-4">
                <div>
                  <h2 className="text-2xl font-bold">{user?.username}</h2>
                  <p className="text-muted-foreground">{user?.email}</p>
                </div>
                
                <div className="flex flex-wrap gap-4">
                  <div className="bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300 px-3 py-1.5 rounded-full flex items-center">
                    <i className="ri-coin-line mr-1.5"></i>
                    <span className="font-medium">{user?.balance?.toLocaleString() || 0}</span>
                    <span className="text-xs ml-1">coins</span>
                  </div>
                  
                  <div className="px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-800 flex items-center">
                    <i className="ri-time-line mr-1.5"></i>
                    <span className="text-sm">Member since {formatDate(new Date())}</span>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4">
                  {isEditing ? (
                    <>
                      <Button variant="ghost" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={form.handleSubmit(onSubmit)}
                        disabled={updateProfileMutation.isPending || !form.formState.isDirty}
                      >
                        {updateProfileMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        Save changes
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => setIsEditing(true)}>
                      <Edit2 className="mr-2 h-4 w-4" />
                      Edit Profile
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="details">Profile Details</TabsTrigger>
            <TabsTrigger value="activity">Activity History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your profile information here
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Form {...form}>
                    <form className="space-y-6">
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="username" {...field} />
                            </FormControl>
                            <FormDescription>
                              This is your public display name
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="your@email.com" {...field} />
                            </FormControl>
                            <FormDescription>
                              Your email address for communications
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Your full name" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bio (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="A short bio about yourself" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormDescription>
                              Maximum 160 characters
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </form>
                  </Form>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground text-sm">Username</Label>
                        <p className="font-medium mt-1">{user?.username}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm">Email</Label>
                        <p className="font-medium mt-1">{user?.email}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm">Full Name</Label>
                        <p className="font-medium mt-1">{profile?.name || "—"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm">Bio</Label>
                        <p className="font-medium mt-1">{profile?.bio || "—"}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your account security and password
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-muted-foreground text-sm">Password</Label>
                  <div className="flex items-center justify-between mt-1">
                    <p className="font-medium">••••••••</p>
                    <Button size="sm">Change Password</Button>
                  </div>
                </div>
                <Separator />
                <div>
                  <Label className="text-muted-foreground text-sm">Two-Factor Authentication</Label>
                  <div className="flex items-center justify-between mt-1">
                    <p className="font-medium">Not Enabled</p>
                    <Button size="sm" variant="outline">Enable 2FA</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="activity" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Your recent earnings and actions in the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activitiesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                  </div>
                ) : activities && activities.length > 0 ? (
                  <div className="space-y-4">
                    {activities.map((activity: any) => (
                      <div key={activity.id} className="flex items-start gap-3 pb-4 border-b border-gray-100 dark:border-gray-800">
                        <div className={`p-2 rounded-full ${activity.type === 'afk' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'}`}>
                          <i className={`${activity.type === 'afk' ? 'ri-time-line' : 'ri-gamepad-line'} text-xl`}></i>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <h4 className="font-medium">{activity.description}</h4>
                            <p className="text-sm text-muted-foreground">{formatDate(activity.createdAt)}</p>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-primary-600 dark:text-primary-400">
                            <i className="ri-coin-line"></i>
                            <span>+{activity.amount.toLocaleString()} coins</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <i className="ri-history-line text-4xl mb-2"></i>
                    <p>No activity recorded yet</p>
                    <p className="text-sm mt-1">Start earning by playing games or AFK farming</p>
                  </div>
                )}
              </CardContent>
              {activities && activities.length > 0 && (
                <CardFooter className="flex justify-center">
                  <Button variant="outline" className="w-full">View Complete History</Button>
                </CardFooter>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}