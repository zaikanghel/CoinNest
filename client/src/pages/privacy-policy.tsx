import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
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
            <h1 className="text-2xl font-bold">Privacy Policy</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-10">
        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 md:p-8">
          <div className="prose dark:prose-invert max-w-none">
            <h2>Privacy Policy</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Last updated: April 27, 2025</p>
            
            <p>
              At CoinNest, we take your privacy seriously. This Privacy Policy describes how we collect, use, and share 
              information when you use our services.
            </p>
            
            <h3>1. Information We Collect</h3>
            <p>
              We collect information you provide directly to us, such as:
            </p>
            <ul>
              <li>Account information (name, email address, username, password)</li>
              <li>Profile information (profile picture, biographical information)</li>
              <li>Payment information (PayPal email, GCash number)</li>
              <li>Communications you send to us</li>
            </ul>
            
            <p>
              We also automatically collect certain information when you use our service, including:
            </p>
            <ul>
              <li>Log information (IP address, browser type, pages visited, time and date of visit)</li>
              <li>Device information (hardware model, operating system)</li>
              <li>Usage data (time spent on the platform, activities performed)</li>
              <li>Cookies and similar technologies</li>
            </ul>
            
            <h3>2. How We Use Your Information</h3>
            <p>
              We use the information we collect to:
            </p>
            <ul>
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Monitor and analyze trends, usage, and activities</li>
              <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities</li>
              <li>Communicate with you about our services</li>
              <li>Personalize your experience</li>
            </ul>
            
            <h3>3. Sharing of Information</h3>
            <p>
              We may share information as follows:
            </p>
            <ul>
              <li>With vendors, consultants, and other service providers who need access to such information to carry out work on our behalf</li>
              <li>In response to a request for information if we believe disclosure is in accordance with applicable law</li>
              <li>If we believe your actions are inconsistent with our user agreements or policies</li>
              <li>In connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition</li>
            </ul>
            
            <h3>4. Data Security</h3>
            <p>
              We take reasonable measures to help protect your personal information from loss, theft, misuse, unauthorized access, 
              disclosure, alteration, and destruction. However, no internet or email transmission is ever fully secure or error-free.
            </p>
            
            <h3>5. Your Choices</h3>
            <p>
              Account Information: You may update, correct, or delete information about you at any time by logging into your online account.
            </p>
            <p>
              Cookies: Most web browsers are set to accept cookies by default. If you prefer, you can usually choose to set your browser 
              to remove or reject browser cookies.
            </p>
            <p>
              Promotional Communications: You may opt out of receiving promotional communications from us by following the instructions 
              in those communications.
            </p>
            
            <h3>6. Children's Privacy</h3>
            <p>
              Our services are not intended for individuals under the age of 18, and we do not knowingly collect personal information 
              from children under 18. If we learn we have collected personal information from a child under 18, we will delete that 
              information.
            </p>
            
            <h3>7. Changes to This Policy</h3>
            <p>
              We may change this Privacy Policy from time to time. If we make changes, we will notify you by revising the date at the 
              top of the policy and, in some cases, we may provide you with additional notice (such as adding a statement to our website
              or sending you a notification).
            </p>
            
            <h3>8. Contact Us</h3>
            <p>
              If you have any questions about this Privacy Policy, please contact us at <a href="mailto:privacy@coinnest.com" className="text-primary hover:underline">privacy@coinnest.com</a>.
            </p>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-100 dark:bg-gray-900 py-10">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h3 className="text-xl font-bold text-primary mb-2">CoinNest</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Turn your free time into real rewards</p>
            <div className="flex justify-center space-x-4 mb-6">
              <Link to="/terms-of-service" className="text-gray-500 hover:text-primary">Terms of Service</Link>
              <Link to="/privacy-policy" className="text-gray-500 hover:text-primary">Privacy Policy</Link>
              <Link to="/contact" className="text-gray-500 hover:text-primary">Contact</Link>
            </div>
            <p className="text-xs text-gray-400">© {new Date().getFullYear()} CoinNest. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}