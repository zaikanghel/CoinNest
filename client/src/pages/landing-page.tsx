import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute w-[500px] h-[500px] rounded-full bg-primary/10 -top-32 -left-32 animate-pulse-slow"></div>
          <div className="absolute w-[600px] h-[600px] rounded-full bg-accent/10 bottom-0 -right-32 animate-pulse-slow" style={{animationDelay: '2s'}}></div>
        </div>

        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-6"
            >
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                IdleCash
              </h1>
              <p className="text-xl md:text-2xl font-medium text-gray-600 dark:text-gray-300">
                Earn Money While You Sleep
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-10"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
                Start Earning Passive Income <br/>
                <span className="text-primary">Without Active Work</span>
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                IdleCash allows you to earn real money just by keeping a tab open in your browser. 
                No complex tasks, no skills required - just sign up, keep the site open, and watch your earnings grow.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 mb-16"
            >
              <Button asChild size="lg" className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-medium px-8 py-6 text-lg">
                <Link to="/auth?tab=register">Get Started Now</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-primary text-primary hover:bg-primary/5 px-8 py-6 text-lg">
                <Link to="/auth?tab=login">Login</Link>
              </Button>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-xl p-6 mb-10"
            >
              <h3 className="text-2xl font-bold mb-2 text-center">
                How It Works
              </h3>
              <div className="h-1 w-16 mx-auto bg-primary/30 rounded-full mb-6"></div>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl">1️⃣</span>
                  </div>
                  <h4 className="text-xl font-semibold mb-2">Create Account</h4>
                  <p className="text-gray-600 dark:text-gray-300">Sign up for free in less than a minute</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl">2️⃣</span>
                  </div>
                  <h4 className="text-xl font-semibold mb-2">Keep Tab Open</h4>
                  <p className="text-gray-600 dark:text-gray-300">Our system recognizes your activity</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl">3️⃣</span>
                  </div>
                  <h4 className="text-xl font-semibold mb-2">Get Paid</h4>
                  <p className="text-gray-600 dark:text-gray-300">Withdraw money to PayPal or GCash</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose IdleCash?</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              We've built the simplest passive income platform for everyone
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-transform hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4 text-white text-xl">
                💤
              </div>
              <h3 className="text-xl font-bold mb-2">Truly Passive Income</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Keep the site open while you sleep, work, or do anything else. You'll earn coins automatically.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-transform hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-4 text-white text-xl">
                💰
              </div>
              <h3 className="text-xl font-bold mb-2">Real Money Withdrawals</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Convert your earned coins to real cash and withdraw to PayPal or GCash once you hit the minimum.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-transform hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4 text-white text-xl">
                🚀
              </div>
              <h3 className="text-xl font-bold mb-2">Boost Your Earnings</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Play our mini-games and invite friends to significantly increase your earning potential.
              </p>
            </div>
            
            {/* Feature 4 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-transform hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center mb-4 text-white text-xl">
                🎮
              </div>
              <h3 className="text-xl font-bold mb-2">Fun Mini-Games</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Bored? Play our simple but engaging mini-games to earn additional coins and have fun.
              </p>
            </div>
            
            {/* Feature 5 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-transform hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center mb-4 text-white text-xl">
                👥
              </div>
              <h3 className="text-xl font-bold mb-2">Referral Program</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Share your referral code and earn a percentage of all your friends' earnings forever.
              </p>
            </div>
            
            {/* Feature 6 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-transform hover:scale-105">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center mb-4 text-white text-xl">
                📱
              </div>
              <h3 className="text-xl font-bold mb-2">Works On Any Device</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Run IdleCash on your desktop, tablet, or mobile phone - earn from anywhere.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-primary to-accent rounded-2xl shadow-2xl p-10 text-white">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Start Earning Today</h2>
              <p className="text-lg mb-8 opacity-90">
                Join thousands of users who are already earning passive income with IdleCash. 
                It takes less than a minute to sign up and start earning.
              </p>
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 font-bold px-10 py-6 text-lg">
                <Link to="/auth?tab=register">Create Your Free Account</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 dark:bg-gray-900 py-10">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h3 className="text-xl font-bold text-primary mb-2">IdleCash</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">The easiest way to earn passive income online</p>
            <div className="flex justify-center space-x-4 mb-6">
              <a href="#" className="text-gray-500 hover:text-primary">Terms of Service</a>
              <a href="#" className="text-gray-500 hover:text-primary">Privacy Policy</a>
              <a href="#" className="text-gray-500 hover:text-primary">Contact</a>
            </div>
            <p className="text-xs text-gray-400">© {new Date().getFullYear()} IdleCash. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}