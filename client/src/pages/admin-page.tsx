import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import MainLayout from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Loader2, Settings, Users, Wallet, CheckCircle, XCircle, Crown, 
  Download, Trash2, AlertCircle
} from "lucide-react";
import { getColorFromString, getUserInitials, getRelativeTime } from "@/lib/utils";
import { useLocation } from "wouter";
import { Setting, User } from "@shared/schema";
import { jsPDF } from "jspdf";

// Form schema for system settings
const settingSchema = z.object({
  key: z.string().min(1, "Setting key is required"),
  value: z.string().min(1, "Setting value is required")
});

type SettingFormData = z.infer<typeof settingSchema>;

// User edit form schema
const userEditSchema = z.object({
  balance: z.string().refine(
    (val) => !isNaN(parseInt(val)), 
    { message: "Balance must be a number" }
  )
});

type UserEditFormData = z.infer<typeof userEditSchema>;

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // State for modals and view controls
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [showSettingModal, setShowSettingModal] = useState(false);
  const [selectedPremiumPayment, setSelectedPremiumPayment] = useState<any>(null);
  const [showPremiumPaymentModal, setShowPremiumPaymentModal] = useState(false);
  const [showAllWithdrawals, setShowAllWithdrawals] = useState(false);
  const [showAllPremiumPayments, setShowAllPremiumPayments] = useState(false);
  const [showProcessedPremiumPayments, setShowProcessedPremiumPayments] = useState(false);
  const [showDeletePremiumPaymentsConfirm, setShowDeletePremiumPaymentsConfirm] = useState(false);
  const [revokePremiumId, setRevokePremiumId] = useState<number | null>(null);
  
  // State for user management
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  // Redirect if not admin
  if (user && !user.isAdmin) {
    navigate("/dashboard");
    return null;
  }
  
  // Handle cleanup of duplicate game scores
  const cleanupDuplicateScores = async () => {
    if (isCleaningUp) return;
    
    try {
      setIsCleaningUp(true);
      
      const res = await fetch("/api/admin/games/cleanup-duplicates", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        }
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to cleanup duplicate scores");
      }
      
      const result = await res.json();
      
      toast({
        title: "Cleanup successful",
        description: `Deleted ${result.deletedCount} duplicate game scores`,
        variant: "default"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cleanup duplicate scores",
        variant: "destructive"
      });
    } finally {
      setIsCleaningUp(false);
    }
  };

  // Fetch users
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    }
  });

  // Fetch withdrawals (pending only or all)
  const { data: withdrawals, isLoading: isLoadingWithdrawals } = useQuery({
    queryKey: ["/api/admin/withdrawals", showAllWithdrawals],
    queryFn: async () => {
      const url = showAllWithdrawals 
        ? "/api/admin/withdrawals?all=true" 
        : "/api/admin/withdrawals";
      const res = await fetch(url, { credentials: "include" });
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

  // Fetch premium payments (pending only or all)
  const { data: premiumPayments, isLoading: isLoadingPremiumPayments } = useQuery({
    queryKey: ["/api/admin/premium/payments", showAllPremiumPayments],
    queryFn: async () => {
      const url = showAllPremiumPayments 
        ? "/api/admin/premium/payments?all=true" 
        : "/api/admin/premium/payments";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch premium payments");
      return res.json();
    }
  });

  const isLoading = isLoadingUsers || isLoadingWithdrawals || isLoadingSettings || isLoadingPremiumPayments;

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

  // Process premium payment mutation
  const processPremiumPaymentMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const res = await apiRequest("POST", `/api/admin/premium/payments/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Premium payment updated",
        description: "The premium payment has been processed",
        variant: "default"
      });
      setShowPremiumPaymentModal(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/premium/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Revoke premium mutation
  const revokePremiumMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("DELETE", `/api/admin/premium/${userId}`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Premium revoked",
        description: "The user's premium subscription has been revoked",
        variant: "default"
      });
      setRevokePremiumId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      setRevokePremiumId(null);
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
      form.setValue("key", setting.key);
      form.setValue("value", setting.value);
    } else {
      form.setValue("key", "");
      form.setValue("value", "");
    }
    
    setShowSettingModal(true);
  };

  const openPremiumPaymentModal = (payment: any) => {
    setSelectedPremiumPayment(payment);
    setShowPremiumPaymentModal(true);
  };

  const processPremiumPayment = (status: string) => {
    if (selectedPremiumPayment) {
      processPremiumPaymentMutation.mutate({
        id: selectedPremiumPayment.id,
        status
      });
    }
  };

  const onSettingSubmit = (data: SettingFormData) => {
    updateSettingMutation.mutate(data);
  };
  
  const handleRevokePremium = (userId: number) => {
    // Set the ID being processed
    setRevokePremiumId(userId);
    
    // Confirm before revoking
    if (window.confirm("Are you sure you want to revoke this user's premium status? This action cannot be undone.")) {
      revokePremiumMutation.mutate(userId);
    } else {
      setRevokePremiumId(null);
    }
  };
  
  // Fetch processed withdrawals for download
  const { data: processedWithdrawals, refetch: refetchProcessedWithdrawals } = useQuery({
    queryKey: ["/api/admin/withdrawals/processed"],
    queryFn: async () => {
      const res = await fetch("/api/admin/withdrawals/processed", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch processed withdrawals");
      return res.json();
    },
    enabled: false // Don't run this query automatically
  });
  
  // Delete all processed withdrawals
  const deleteProcessedWithdrawalsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/admin/withdrawals/processed");
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Withdrawals deleted",
        description: data.message || `Successfully deleted ${data.deletedCount} withdrawal records`,
        variant: "default"
      });
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
  
  // Generate PDF of processed withdrawals
  const generateWithdrawalsPDF = async () => {
    try {
      // Fetch the latest data first
      await refetchProcessedWithdrawals();
      
      if (!processedWithdrawals || processedWithdrawals.length === 0) {
        toast({
          title: "No data",
          description: "There are no processed withdrawals to download",
          variant: "default"
        });
        return;
      }
      
      // Create new PDF document
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(16);
      doc.text("Withdrawal History Report", 14, 15);
      doc.setFontSize(11);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 23);
      
      // Table headers
      const headers = ["ID", "Username", "Email", "Amount", "Method", "Status", "Created", "Processed"];
      
      // Define table data with user information
      const data = processedWithdrawals.map((w: any) => {
        // Find the user for this withdrawal
        const user = users?.find((u: any) => u.id === w.userId);
        
        return [
          w.id,
          user?.username || `User #${w.userId}`,
          user?.email || 'N/A',
          w.amount,
          w.method,
          w.status,
          new Date(w.createdAt).toLocaleDateString(),
          w.processedAt ? new Date(w.processedAt).toLocaleDateString() : 'N/A'
        ];
      });
      
      // Add the table (starting at y position 30)
      let startY = 30;
      doc.setFontSize(8); // Smaller font size to fit more columns
      
      // Calculate column widths
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 14;
      const usableWidth = pageWidth - 2 * margin;
      const colWidths = [
        usableWidth * 0.06, // ID
        usableWidth * 0.14, // Username
        usableWidth * 0.18, // Email
        usableWidth * 0.10, // Amount
        usableWidth * 0.12, // Method
        usableWidth * 0.10, // Status
        usableWidth * 0.15, // Created
        usableWidth * 0.15  // Processed
      ];
      
      // Draw header row
      let xPos = margin;
      doc.setFont('helvetica', 'bold');
      
      headers.forEach((header, i) => {
        doc.text(header, xPos, startY);
        xPos += colWidths[i];
      });
      
      doc.setFont('helvetica', 'normal');
      startY += 6;
      
      // Draw data rows
      data.forEach((row: any[], rowIndex: number) => {
        // If we're going to overflow, add a new page
        if (startY > doc.internal.pageSize.getHeight() - 15) {
          doc.addPage();
          startY = 20;
          
          // Re-add headers on new page
          xPos = margin;
          doc.setFont('helvetica', 'bold');
          headers.forEach((header, i) => {
            doc.text(header, xPos, startY);
            xPos += colWidths[i];
          });
          doc.setFont('helvetica', 'normal');
          startY += 6;
        }
        
        // Draw each cell in row
        xPos = margin;
        row.forEach((cell: any, i: number) => {
          doc.text(String(cell), xPos, startY);
          xPos += colWidths[i];
        });
        
        startY += 6;
      });
      
      // Save the PDF
      doc.save('withdrawal-history.pdf');
      
      toast({
        title: "PDF Generated",
        description: "Withdrawal history has been downloaded as PDF",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Error generating PDF",
        description: (error as Error).message,
        variant: "destructive"
      });
    }
  };
  
  // Handle delete withdrawals action with confirmation
  const handleDeleteWithdrawals = async () => {
    if (window.confirm("Are you sure you want to delete all processed withdrawals? This action cannot be undone. Make sure to download a PDF backup first.")) {
      deleteProcessedWithdrawalsMutation.mutate();
    }
  };
  
  // Fetch processed premium payments for download
  const { data: processedPremiumPayments, refetch: refetchProcessedPremiumPayments } = useQuery({
    queryKey: ["/api/admin/premium/payments/processed"],
    queryFn: async () => {
      const res = await fetch("/api/admin/premium/payments?processed=true", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch processed premium payments");
      return res.json();
    },
    enabled: false // Don't run this query automatically
  });
  
  // Delete all processed premium payments
  const deleteProcessedPremiumPaymentsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/admin/premium/payments/processed");
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Premium payments deleted",
        description: data.message || `Successfully deleted ${data.deletedCount} premium payment records`,
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/premium/payments"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Handle delete premium payments action with confirmation
  const handleDeletePremiumPayments = async () => {
    if (window.confirm("Are you sure you want to delete all processed premium payments? This action cannot be undone. Make sure to download a PDF backup first.")) {
      deleteProcessedPremiumPaymentsMutation.mutate();
    }
  };
  
  // User form for editing
  const userEditForm = useForm<UserEditFormData>({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      balance: ""
    }
  });
  
  // Function to determine if a user is currently active (was active in the last 5 minutes)
  const isUserActive = (lastActiveDate: string | Date): boolean => {
    if (!lastActiveDate) return false;
    const lastActive = new Date(lastActiveDate);
    const now = new Date();
    const diffInMinutes = (now.getTime() - lastActive.getTime()) / (1000 * 60);
    return diffInMinutes < 5; // Consider active if last active within 5 minutes
  };
  
  // Filter users based on search query
  const filteredUsers = users?.filter((user: any) => {
    if (!searchQuery) return true;
    
    const lowercaseQuery = searchQuery.toLowerCase();
    return (
      user.email.toLowerCase().includes(lowercaseQuery) ||
      user.username.toLowerCase().includes(lowercaseQuery)
    );
  });
  
  // Open edit user modal
  const openEditUserModal = (user: any) => {
    setSelectedUser(user);
    userEditForm.setValue("balance", user.balance.toString());
    setShowEditUserModal(true);
  };
  
  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: { id: number, balance: string }) => {
      const res = await apiRequest("POST", `/api/admin/users/${data.id}`, { 
        balance: parseInt(data.balance) 
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "User updated",
        description: "The user has been updated successfully",
        variant: "default"
      });
      setShowEditUserModal(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Handle user edit form submission
  const onUserEditSubmit = (data: UserEditFormData) => {
    if (selectedUser) {
      updateUserMutation.mutate({
        id: selectedUser.id,
        balance: data.balance
      });
    }
  };
  
  // Generate PDF of processed premium payments
  const generatePremiumPaymentsPDF = async () => {
    try {
      // Fetch the latest data first
      await refetchProcessedPremiumPayments();
      
      if (!processedPremiumPayments || processedPremiumPayments.length === 0) {
        toast({
          title: "No data",
          description: "There are no processed premium payments to download",
          variant: "default"
        });
        return;
      }
      
      // Create new PDF document
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(16);
      doc.text("Premium Payment History Report", 14, 15);
      doc.setFontSize(11);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 23);
      
      // Table headers
      const headers = ["ID", "Username", "Email", "Amount", "Duration", "Method", "Status", "Created", "Processed"];
      
      // Define table data with user information
      const data = processedPremiumPayments.map((p: any) => {
        // Find the user for this payment
        const user = users?.find((u: any) => u.id === p.userId);
        
        return [
          p.id,
          user?.username || `User #${p.userId}`,
          user?.email || 'N/A',
          p.amount,
          `${p.durationMonths} month(s)`,
          p.method,
          p.status,
          new Date(p.createdAt).toLocaleDateString(),
          p.processedAt ? new Date(p.processedAt).toLocaleDateString() : 'N/A'
        ];
      });
      
      // Add the table (starting at y position 30)
      let startY = 30;
      doc.setFontSize(8); // Smaller font size to fit more columns
      
      // Calculate column widths
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 14;
      const usableWidth = pageWidth - 2 * margin;
      const colWidths = [
        usableWidth * 0.05, // ID
        usableWidth * 0.13, // Username
        usableWidth * 0.17, // Email
        usableWidth * 0.08, // Amount
        usableWidth * 0.11, // Duration
        usableWidth * 0.10, // Method
        usableWidth * 0.10, // Status
        usableWidth * 0.13, // Created
        usableWidth * 0.13  // Processed
      ];
      
      // Draw header row
      let xPos = margin;
      doc.setFont('helvetica', 'bold');
      
      headers.forEach((header, i) => {
        doc.text(header, xPos, startY);
        xPos += colWidths[i];
      });
      
      doc.setFont('helvetica', 'normal');
      startY += 6;
      
      // Draw data rows
      data.forEach((row: any[], rowIndex: number) => {
        // If we're going to overflow, add a new page
        if (startY > doc.internal.pageSize.getHeight() - 15) {
          doc.addPage();
          startY = 20;
          
          // Re-add headers on new page
          xPos = margin;
          doc.setFont('helvetica', 'bold');
          headers.forEach((header, i) => {
            doc.text(header, xPos, startY);
            xPos += colWidths[i];
          });
          doc.setFont('helvetica', 'normal');
          startY += 6;
        }
        
        // Draw each cell in the row
        xPos = margin;
        row.forEach((cell, i) => {
          doc.text(String(cell), xPos, startY);
          xPos += colWidths[i];
        });
        
        startY += 5;
      });
      
      // Save the PDF
      doc.save(`premium-payments-history-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: "PDF generated",
        description: "Premium payments history has been downloaded",
        variant: "default"
      });
    } catch (error: any) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error generating PDF",
        description: error.message,
        variant: "destructive"
      });
    }
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
              <TabsTrigger value="premium">
                <Crown className="h-4 w-4 mr-2" />
                Premium
              </TabsTrigger>
            </TabsList>

            {/* Withdrawals Tab */}
            <TabsContent value="withdrawals">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>{showAllWithdrawals ? "All Withdrawals" : "Pending Withdrawals"}</CardTitle>
                      <CardDescription>
                        {showAllWithdrawals 
                          ? "View complete withdrawal history with user details" 
                          : "Review and approve or reject withdrawal requests"}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-4">
                      {showAllWithdrawals && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-900 dark:hover:bg-blue-900/20"
                            onClick={generateWithdrawalsPDF}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Export PDF
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-900 dark:hover:bg-red-900/20"
                            onClick={handleDeleteWithdrawals}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete History
                          </Button>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Show All</span>
                        <Switch 
                          checked={showAllWithdrawals}
                          onCheckedChange={setShowAllWithdrawals}
                        />
                      </div>
                    </div>
                  </div>
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
                          {showAllWithdrawals && <TableHead>Status</TableHead>}
                          {showAllWithdrawals && <TableHead>Processed</TableHead>}
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {withdrawals.map((withdrawal: any) => (
                          <TableRow key={withdrawal.id}>
                            <TableCell>
                              <div className="flex items-center">
                                {users?.find((u: any) => u.id === withdrawal.userId) && (
                                  <Avatar className="h-6 w-6 mr-2">
                                    <AvatarFallback className={getColorFromString(users?.find((u: any) => u.id === withdrawal.userId)?.username || '')}>
                                      {getUserInitials(users?.find((u: any) => u.id === withdrawal.userId)?.username || '')}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {users?.find((u: any) => u.id === withdrawal.userId)?.username || `User #${withdrawal.userId}`}
                                  </span>
                                  {withdrawal.isPremiumUser && (
                                    <span className="text-xs px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-sm font-medium">
                                      Premium
                                    </span>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">{withdrawal.amount.toLocaleString()}</span> coins
                            </TableCell>
                            <TableCell className="capitalize">{withdrawal.method}</TableCell>
                            <TableCell>{new Date(withdrawal.createdAt).toLocaleDateString()}</TableCell>
                            
                            {showAllWithdrawals && (
                              <TableCell>
                                {withdrawal.status === 'pending' ? (
                                  <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-none">
                                    Pending
                                  </Badge>
                                ) : withdrawal.status === 'approved' ? (
                                  <Badge variant="outline" className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-none">
                                    Approved
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-none">
                                    Rejected
                                  </Badge>
                                )}
                              </TableCell>
                            )}
                            
                            {showAllWithdrawals && (
                              <TableCell>
                                {withdrawal.processedAt ? new Date(withdrawal.processedAt).toLocaleDateString() : '-'}
                              </TableCell>
                            )}
                            
                            <TableCell>
                              {withdrawal.status === 'pending' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openWithdrawalModal(withdrawal)}
                                >
                                  Process
                                </Button>
                              )}
                              {withdrawal.status !== 'pending' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openWithdrawalModal(withdrawal)}
                                >
                                  View
                                </Button>
                              )}
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
                  <CardTitle>Manage Users</CardTitle>
                  <CardDescription>
                    Overview of all users in the system with their current statistics
                  </CardDescription>
                  
                  {/* Search bar for email */}
                  <div className="mt-4">
                    <Input
                      placeholder="Search by email or username..."
                      className="max-w-sm"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  {users && users.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Balance</TableHead>
                          <TableHead>Total Earned</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead>Last Active</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers?.map((user: any) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="flex items-center">
                                <Avatar className="h-6 w-6 mr-2">
                                  <AvatarFallback className={getColorFromString(user.username)}>
                                    {getUserInitials(user.username)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{user.username}</span>
                              </div>
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{user.balance.toLocaleString()} coins</TableCell>
                            <TableCell>{user.totalEarned.toLocaleString()} coins</TableCell>
                            <TableCell>
                              {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 
                               user.premiumStarted ? new Date(user.premiumStarted).toLocaleDateString() : 
                               'N/A'}
                            </TableCell>
                            <TableCell>
                              {user.lastActive && (
                                <>
                                  {getRelativeTime(user.lastActive)}
                                  {isUserActive(user.lastActive) && (
                                    <Badge className="ml-2 bg-green-500" variant="secondary">Active</Badge>
                                  )}
                                </>
                              )}
                            </TableCell>
                            <TableCell>
                              {user.isAdmin && (
                                <Badge className="bg-blue-500">Admin</Badge>
                              )}
                              {!user.isAdmin && user.isPremium && new Date(user.premiumUntil) > new Date() && (
                                <Badge className="bg-purple-500">Premium</Badge>
                              )}
                              {!user.isAdmin && (!user.isPremium || new Date(user.premiumUntil) <= new Date()) && (
                                <Badge variant="outline">User</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditUserModal(user)}
                              >
                                Edit
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-gray-500">No users found</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>System Settings</CardTitle>
                    <CardDescription>
                      Configure global system settings and parameters
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Setting</TableHead>
                          <TableHead>Value</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {settings && settings.length > 0 ? (
                          settings.map((setting: any) => (
                            <TableRow key={setting.key}>
                              <TableCell>
                                <div className="font-medium">{setting.key}</div>
                                <div className="text-sm text-gray-500">{getSettingDescription(setting.key)}</div>
                              </TableCell>
                              <TableCell>{setting.value}</TableCell>
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
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-4">
                              <p className="text-gray-500">No settings found</p>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                    
                    <Button 
                      className="mt-4" 
                      onClick={() => openSettingModal()}
                    >
                      Add New Setting
                    </Button>
                  </CardContent>
                </Card>
                
                {/* Premium section of the settings tab */}
                <Card>
                  <CardHeader>
                    <CardTitle>Premium Settings</CardTitle>
                    <CardDescription>
                      Configure premium membership settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Card className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">Subscription Price</h3>
                              <span className="text-sm">${settings?.find((s: Setting) => s.key === 'premium_price')?.value || '4.99'}/month</span>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openSettingModal(settings?.find((s: Setting) => s.key === 'premium_price'))}
                            >
                              Edit
                            </Button>
                          </div>
                        </Card>
                        
                        <Card className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">AFK Earnings Multiplier</h3>
                              <span className="text-sm">{settings?.find((s: Setting) => s.key === 'premium_afk_multiplier')?.value || '2'}x earnings</span>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openSettingModal(settings?.find((s: Setting) => s.key === 'premium_afk_multiplier'))}
                            >
                              Edit
                            </Button>
                          </div>
                        </Card>
                        
                        <Card className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">Daily Limit Bonus</h3>
                              <span className="text-sm">+{settings?.find((s: Setting) => s.key === 'premium_daily_limit_bonus')?.value || '200'} coins</span>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openSettingModal(settings?.find((s: Setting) => s.key === 'premium_daily_limit_bonus'))}
                            >
                              Edit
                            </Button>
                          </div>
                        </Card>
                        
                        <Card className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">No Captchas</h3>
                              <span className="text-sm">{settings?.find((s: Setting) => s.key === 'captcha_disabled_premium')?.value === 'true' ? 'Enabled' : 'Disabled'}</span>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openSettingModal(settings?.find((s: Setting) => s.key === 'captcha_disabled_premium'))}
                            >
                              Edit
                            </Button>
                          </div>
                        </Card>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Premium Users</CardTitle>
                    <CardDescription>
                      Manage premium user subscriptions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {users && users.some((user: any) => user.isPremium && new Date(user.premiumUntil) > new Date()) ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Started</TableHead>
                            <TableHead>Expires</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {users.filter((user: any) => user.isPremium && new Date(user.premiumUntil) > new Date()).map((user: any) => (
                            <TableRow key={`premium-${user.id}`}>
                              <TableCell>
                                <div className="flex items-center">
                                  <Avatar className="h-6 w-6 mr-2">
                                    <AvatarFallback className={getColorFromString(user.username)}>
                                      {getUserInitials(user.username)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium">{user.username}</span>
                                </div>
                              </TableCell>
                              <TableCell>{new Date(user.premiumStarted).toLocaleDateString()}</TableCell>
                              <TableCell>{new Date(user.premiumUntil).toLocaleDateString()}</TableCell>
                              <TableCell>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-red-100 hover:bg-red-200 text-red-600 border-red-200"
                                  onClick={() => handleRevokePremium(user.id)}
                                  disabled={revokePremiumMutation.isPending}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  {revokePremiumMutation.isPending && revokePremiumId === user.id ? 'Revoking...' : 'Revoke'}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-500">No premium subscribers</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Premium Tab */}
            <TabsContent value="premium">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>{showAllPremiumPayments ? "All Premium Payments" : "Pending Premium Payments"}</CardTitle>
                      <CardDescription>
                        {showAllPremiumPayments 
                          ? "View complete premium payment history with user details" 
                          : "Review and approve or reject premium payment requests"}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-4">
                      {showAllPremiumPayments && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-900 dark:hover:bg-blue-900/20"
                            onClick={generatePremiumPaymentsPDF}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Export PDF
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-900 dark:hover:bg-red-900/20"
                            onClick={handleDeletePremiumPayments}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete History
                          </Button>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Show All</span>
                        <Switch 
                          checked={showAllPremiumPayments}
                          onCheckedChange={setShowAllPremiumPayments}
                        />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {premiumPayments && premiumPayments.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Requested</TableHead>
                          {showAllPremiumPayments && <TableHead>Status</TableHead>}
                          {showAllPremiumPayments && <TableHead>Processed</TableHead>}
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {premiumPayments.map((payment: any) => (
                          <TableRow key={payment.id}>
                            <TableCell>
                              <div className="flex items-center">
                                {users?.find((u: any) => u.id === payment.userId) && (
                                  <Avatar className="h-6 w-6 mr-2">
                                    <AvatarFallback className={getColorFromString(users?.find((u: any) => u.id === payment.userId)?.username || '')}>
                                      {getUserInitials(users?.find((u: any) => u.id === payment.userId)?.username || '')}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                                <span className="font-medium">
                                  {users?.find((u: any) => u.id === payment.userId)?.username || `User #${payment.userId}`}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              ${payment.amount.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              {payment.durationMonths} {payment.durationMonths === 1 ? 'month' : 'months'}
                            </TableCell>
                            <TableCell className="capitalize">{payment.method}</TableCell>
                            <TableCell>{new Date(payment.createdAt).toLocaleDateString()}</TableCell>
                            
                            {showAllPremiumPayments && (
                              <TableCell>
                                {payment.status === 'pending' ? (
                                  <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-none">
                                    Pending
                                  </Badge>
                                ) : payment.status === 'approved' ? (
                                  <Badge variant="outline" className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-none">
                                    Approved
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-none">
                                    Rejected
                                  </Badge>
                                )}
                              </TableCell>
                            )}
                            
                            {showAllPremiumPayments && (
                              <TableCell>
                                {payment.processedAt ? new Date(payment.processedAt).toLocaleDateString() : '-'}
                              </TableCell>
                            )}
                            
                            <TableCell>
                              {payment.status === 'pending' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openPremiumPaymentModal(payment)}
                                >
                                  Process
                                </Button>
                              )}
                              {payment.status !== 'pending' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openPremiumPaymentModal(payment)}
                                >
                                  View
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-gray-500">No pending premium payments</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Withdrawal Modal */}
      <Dialog open={showWithdrawalModal} onOpenChange={setShowWithdrawalModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Withdrawal Request</DialogTitle>
            <DialogDescription>
              {selectedWithdrawal?.status === 'pending' 
                ? 'Review and process this withdrawal request' 
                : 'View withdrawal details'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedWithdrawal && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">User</p>
                <div className="flex items-center mt-1">
                  {users?.find((u: any) => u.id === selectedWithdrawal.userId) && (
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarFallback className={getColorFromString(users?.find((u: any) => u.id === selectedWithdrawal.userId)?.username || '')}>
                        {getUserInitials(users?.find((u: any) => u.id === selectedWithdrawal.userId)?.username || '')}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <span className="font-medium">
                    {users?.find((u: any) => u.id === selectedWithdrawal.userId)?.username || `User #${selectedWithdrawal.userId}`}
                  </span>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Amount</p>
                <p className="font-medium">{selectedWithdrawal.amount.toLocaleString()} coins</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Payment Method</p>
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
          )}
          
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

      {/* Premium Payment Modal */}
      <Dialog open={showPremiumPaymentModal} onOpenChange={setShowPremiumPaymentModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Premium Payment Details</DialogTitle>
            <DialogDescription>
              {selectedPremiumPayment?.status === 'pending' 
                ? 'Review and process this premium payment request' 
                : 'View premium payment details'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPremiumPayment && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-1">User</h3>
                    <div className="flex items-center">
                      {users?.find((u: any) => u.id === selectedPremiumPayment.userId) && (
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarFallback className={getColorFromString(users?.find((u: any) => u.id === selectedPremiumPayment.userId)?.username || '')}>
                            {getUserInitials(users?.find((u: any) => u.id === selectedPremiumPayment.userId)?.username || '')}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <span className="font-medium">
                        {users?.find((u: any) => u.id === selectedPremiumPayment.userId)?.username || `User #${selectedPremiumPayment.userId}`}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-1">Payment Details</h3>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Amount:</span>
                        <span className="font-medium">${selectedPremiumPayment.amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Method:</span>
                        <span className="font-medium capitalize">{selectedPremiumPayment.method}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Duration:</span>
                        <span className="font-medium">
                          {selectedPremiumPayment.durationMonths} {selectedPremiumPayment.durationMonths === 1 ? 'month' : 'months'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Requested:</span>
                        <span className="font-medium">{new Date(selectedPremiumPayment.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Status:</span>
                        <span className={`font-medium capitalize ${
                          selectedPremiumPayment.status === 'approved' 
                            ? 'text-green-600 dark:text-green-400'
                            : selectedPremiumPayment.status === 'rejected'
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-yellow-600 dark:text-yellow-400'
                        }`}>
                          {selectedPremiumPayment.status}
                        </span>
                      </div>
                      {selectedPremiumPayment.processedAt && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Processed:</span>
                          <span className="font-medium">{new Date(selectedPremiumPayment.processedAt).toLocaleString()}</span>
                        </div>
                      )}
                      {selectedPremiumPayment.notes && (
                        <div className="pt-2">
                          <span className="text-gray-500">Notes:</span>
                          <p className="mt-1 text-sm whitespace-pre-wrap">{selectedPremiumPayment.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-1">Payment Proof</h3>
                    <div className="border rounded-md overflow-hidden">
                      {selectedPremiumPayment.proofImage ? (
                        <img 
                          src={selectedPremiumPayment.proofImage} 
                          alt="Payment Proof" 
                          className="w-full h-auto max-h-64 object-contain"
                        />
                      ) : (
                        <div className="p-8 text-center text-gray-500">No payment proof provided</div>
                      )}
                    </div>
                  </div>
                  
                  {selectedPremiumPayment.status === 'pending' && (
                    <div>
                      <h3 className="text-sm font-medium mb-2">Processing Options</h3>
                      <div className="flex space-x-3">
                        <Button
                          className="w-full bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => processPremiumPayment("approved")}
                          disabled={processPremiumPaymentMutation.isPending}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          className="w-full bg-red-600 hover:bg-red-700 text-white"
                          onClick={() => processPremiumPayment("rejected")}
                          disabled={processPremiumPaymentMutation.isPending}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPremiumPaymentModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* User Edit Modal */}
      <Dialog open={showEditUserModal} onOpenChange={setShowEditUserModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              {selectedUser && `Update ${selectedUser.username}'s account details`}
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <Form {...userEditForm}>
              <form onSubmit={userEditForm.handleSubmit(onUserEditSubmit)} className="space-y-4">
                <div className="flex items-center mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarFallback className={getColorFromString(selectedUser.username)}>
                      {getUserInitials(selectedUser.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{selectedUser.username}</div>
                    <div className="text-sm text-gray-500">{selectedUser.email}</div>
                  </div>
                </div>
                
                <FormField
                  control={userEditForm.control}
                  name="balance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Balance (coins)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex items-center justify-between text-sm text-gray-500 p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <div>Last active: {selectedUser.lastActive ? getRelativeTime(selectedUser.lastActive) : 'Never'}</div>
                  <div>Joined: {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'Unknown'}</div>
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowEditUserModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateUserMutation.isPending}>
                    {updateUserMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Changes
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

function getSettingDescription(key: string): string {
  const descriptions: { [key: string]: string } = {
    'afk_rate': 'Coins earned per minute while AFK',
    'afk_daily_limit': 'Maximum daily coins from AFK earnings',
    'referral_bonus': 'One-time bonus for referring a new user (coins)',
    'referral_percent': 'Percentage of referred user earnings',
    'min_withdrawal': 'Minimum coins required for withdrawal',
    'conversion_rate': 'Number of coins per dollar for withdrawals',
    'captcha_interval': 'Time in seconds between captcha checks',
    'game_memory_reward': 'Base reward for memory game matches',
    'game_clicker_reward': 'Reward per click in clicker game',
    'game_max_earnings': 'Maximum earnings per game session',
    'game_daily_limit': 'Maximum daily earnings from all games',
    'premium_price': 'Monthly subscription price in USD',
    'premium_afk_multiplier': 'Multiplier for AFK earnings for premium users',
    'premium_daily_limit_bonus': 'Additional daily limit for premium users',
    'premium_duration_options': 'Available premium subscription durations in months (comma-separated)',
    'premium_captcha_disabled': 'Whether premium users are exempt from captchas (true/false)',
    'premium_ad_free': 'Whether premium users see ads (true/false)',
    'settings_updated_at': 'Timestamp of last settings update',
    'game_daily_earnings': 'Current daily earnings from games',
    'afk_daily_earnings': 'Current daily earnings from AFK',
    'captcha_disabled_premium': 'Whether captchas are disabled for premium users (true/false)',
  };
  
  return descriptions[key] || 'System configuration parameter';
}