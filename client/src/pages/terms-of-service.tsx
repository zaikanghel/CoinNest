import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header with back button */}
      <header className="bg-white dark:bg-gray-900 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center">
            <Button asChild variant="ghost" size="icon" className="mr-2">
              <Link to="/">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Back to Home</span>
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">Terms of Service</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-10">
        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 md:p-8">
          <div className="prose dark:prose-invert max-w-none">
            <h2>Terms of Service Agreement</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Last updated: April 27, 2025</p>
            
            <h3>1. Acceptance of Terms</h3>
            <p>
              By accessing or using IdleCash services, you agree to be bound by these Terms of Service. If you do not agree 
              to these terms, please do not use our service.
            </p>
            
            <h3>2. Description of Service</h3>
            <p>
              IdleCash provides a platform where users can earn virtual currency by keeping the website active, playing mini-games, 
              and participating in other activities. This currency can be converted to real money subject to the conditions outlined 
              in these terms.
            </p>
            
            <h3>3. User Registration</h3>
            <p>
              To use certain features of the service, you may be required to register for an account. You agree to provide accurate, 
              current, and complete information during the registration process and to update such information to keep it accurate, 
              current, and complete.
            </p>
            
            <h3>4. Virtual Currency and Rewards</h3>
            <p>
              Users earn virtual currency through various activities on the platform. This currency has no cash value until converted 
              and withdrawn according to our conversion rates and minimum withdrawal requirements. IdleCash reserves the right to modify 
              conversion rates, earning rates, and withdrawal minimums at any time.
            </p>
            
            <h3>5. Prohibited Conduct</h3>
            <p>
              Users must not:
            </p>
            <ul>
              <li>Use bots, scripts, or automation to earn currency</li>
              <li>Create multiple accounts</li>
              <li>Attempt to manipulate or exploit the system</li>
              <li>Engage in any fraudulent activity</li>
              <li>Use the service for any illegal purpose</li>
            </ul>
            
            <h3>6. Termination of Service</h3>
            <p>
              IdleCash reserves the right to terminate or suspend your account and access to the service at any time, without notice, 
              for conduct that we believe violates these Terms of Service or is harmful to other users, us, or third parties, or for 
              any other reason at our sole discretion.
            </p>
            
            <h3>7. Changes to the Terms</h3>
            <p>
              We reserve the right to modify these terms at any time. We will provide notice of significant changes by posting the 
              new Terms of Service on the site and/or by sending you an email. Your continued use of the service after such changes 
              constitutes your acceptance of the new terms.
            </p>
            
            <h3>8. Limitation of Liability</h3>
            <p>
              To the maximum extent permitted by law, IdleCash shall not be liable for any indirect, incidental, special, consequential, 
              or punitive damages, including without limitation, loss of profits, data, or other intangible losses, resulting from your 
              access to or use of or inability to access or use the service.
            </p>
            
            <h3>9. Governing Law</h3>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which IdleCash operates, 
              without regard to its conflict of law provisions.
            </p>
            
            <h3>10. Contact Information</h3>
            <p>
              If you have any questions about these Terms, please contact us at <a href="mailto:support@idlecash.com" className="text-primary hover:underline">support@idlecash.com</a>.
            </p>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-100 dark:bg-gray-900 py-10">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h3 className="text-xl font-bold text-primary mb-2">IdleCash</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">The easiest way to earn passive income online</p>
            <div className="flex justify-center space-x-4 mb-6">
              <Link to="/terms-of-service" className="text-gray-500 hover:text-primary">Terms of Service</Link>
              <Link to="/privacy-policy" className="text-gray-500 hover:text-primary">Privacy Policy</Link>
              <Link to="/contact" className="text-gray-500 hover:text-primary">Contact</Link>
            </div>
            <p className="text-xs text-gray-400">© {new Date().getFullYear()} IdleCash. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}