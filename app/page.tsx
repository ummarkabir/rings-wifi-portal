'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from './lib/supabaseClient';

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  duration: string;
  features: string[];
  recommended?: boolean;
}

export default function Home() {
  const [darkMode, setDarkMode] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(true);

  // Fetch plans live from Supabase on load
  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoadingPlans(true);
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .order('price', { ascending: true });

    if (!error && data && data.length > 0) {
      setPricingPlans(data);
      setSelectedPlanId(data[0].id); // Select first plan by default
    } else {
      // Fallback default plans if table is empty
      const defaultPlans: PricingPlan[] = [
        {
          id: 'plan_200',
          name: 'DAILY PLAN',
          price: 200,
          duration: 'Valid for 24 Hours',
          features: ['High Speed Internet', 'Unlimited Access', 'Single Device Connection'],
        },
        {
          id: 'plan_300',
          name: 'STANDARD PLAN',
          price: 300,
          duration: 'Valid for 24 Hours',
          features: ['High Speed Internet', 'Priority Bandwidth', 'Single Device Connection'],
          recommended: true,
        },
        {
          id: 'plan_400',
          name: 'PREMIUM PLAN',
          price: 400,
          duration: 'Valid for 24 Hours',
          features: ['Ultra High Speed Internet', 'Maximum Bandwidth Priority', 'Multi-tasking & HD Streaming'],
        },
      ];
      setPricingPlans(defaultPlans);
      setSelectedPlanId(defaultPlans[1].id);
    }
    setLoadingPlans(false);
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const handleProceedToPayment = async (planId: string) => {
    setErrorMsg('');
    setSuccessMsg('');

    const cleanPhone = phoneNumber.replace(/\s+/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid phone number to continue.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Save subscriber details directly to Supabase
      const { error } = await supabase
        .from('subscribers')
        .insert([
          {
            phone_number: `+234${cleanPhone}`,
            plan_id: planId,
            status: 'pending',
          },
        ]);

      if (error) {
        throw error;
      }

      // 2. Success feedback & preparation for Payment Gateway (OPay/Paystack)
      const selectedPlan = pricingPlans.find((p) => p.id === planId);
      setSuccessMsg(`Successfully registered +234${cleanPhone} for ${selectedPlan?.name}. Redirecting to payment...`);

      setTimeout(() => {
        alert(`Proceeding to payment gateway for ${selectedPlan?.name} (₦${selectedPlan?.price})`);
      }, 1000);

    } catch (err: any) {
      console.error('Supabase error:', err);
      setErrorMsg(err.message || 'Failed to save phone number. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen font-sans flex flex-col justify-between transition-colors duration-300 ${
      darkMode ? 'bg-neutral-950 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Navigation Header */}
      <header className={`border-b sticky top-0 z-50 backdrop-blur-md ${
        darkMode ? 'border-neutral-800 bg-black/80' : 'border-gray-200 bg-white/80'
      }`}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center">
              <span className="text-3xl font-black tracking-tighter text-red-600">RINGS</span>
              <div className="flex -space-x-2 ml-1">
                <div className={`w-6 h-6 border-2 rounded-full ${darkMode ? 'border-white' : 'border-gray-900'}`}></div>
                <div className={`w-6 h-6 border-2 rounded-full ${darkMode ? 'border-white' : 'border-gray-900'}`}></div>
                <div className={`w-6 h-6 border-2 rounded-full ${darkMode ? 'border-white' : 'border-gray-900'}`}></div>
              </div>
            </div>
            <div className={`h-6 w-px hidden sm:block ${darkMode ? 'bg-neutral-800' : 'bg-gray-300'}`}></div>
            <span className="text-xs text-amber-500 font-mono tracking-wide hidden sm:inline-block">
              RC: 9507508
            </span>
          </div>

          <nav className="flex items-center space-x-4 sm:space-x-6 text-sm">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-2 transition-all ${
                darkMode 
                  ? 'bg-neutral-900 border-neutral-700 text-yellow-400 hover:border-yellow-400' 
                  : 'bg-gray-100 border-gray-300 text-gray-800 hover:border-gray-500'
              }`}
            >
              {darkMode ? '☀️ White Mode' : '🌙 Dark Mode'}
            </button>

            <a href="#plans" className={`transition-colors ${darkMode ? 'text-neutral-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}>Pricing</a>
            
            {/* Link to Admin Portal */}
            <Link 
              href="/admin" 
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                darkMode 
                  ? 'bg-red-950/40 border-red-800 text-red-400 hover:bg-red-900 hover:text-white' 
                  : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-600 hover:text-white'
              }`}
            >
              Admin Portal
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-12 flex-1 flex flex-col items-center justify-center">
        {/* Hero Banner Section */}
        <div className="text-center space-y-3 mb-10 max-w-2xl">
          <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium border ${
            darkMode 
              ? 'bg-red-950/60 text-red-400 border-red-800/50' 
              : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            RINGS Highspeed Wi-Fi Hotspot
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">
            Fast. Reliable. <span className="text-red-600">Affordable.</span>
          </h1>
          <p className={`text-sm md:text-base ${darkMode ? 'text-neutral-400' : 'text-gray-600'}`}>
            Get instant, ultra-fast internet connectivity tailored for all your browsing, streaming, and business needs.
          </p>
        </div>

        {/* Phone Input Card */}
        <div className={`w-full max-w-md border rounded-2xl p-6 md:p-8 shadow-2xl mb-12 backdrop-blur-sm transition-colors ${
          darkMode 
            ? 'bg-neutral-900/90 border-neutral-800 text-white' 
            : 'bg-white border-gray-200 text-gray-900 shadow-gray-200'
        }`}>
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold flex items-center justify-center gap-2">
              <span className="text-red-500">📡</span> Connect to Internet
            </h2>
            <p className={`text-xs mt-1 ${darkMode ? 'text-neutral-400' : 'text-gray-500'}`}>
              Enter your mobile number to initialize connection and select a daily pass.
            </p>
          </div>

          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            <div>
              <label className={`block text-xs font-medium mb-2 ${darkMode ? 'text-neutral-300' : 'text-gray-700'}`}>
                Phone Number
              </label>
              <div className={`flex rounded-xl border transition-all overflow-hidden ${
                darkMode 
                  ? 'border-neutral-700 bg-neutral-950 focus-within:border-red-600' 
                  : 'border-gray-300 bg-gray-50 focus-within:border-red-600'
              }`}>
                <span className={`inline-flex items-center px-3.5 text-sm font-semibold border-r ${
                  darkMode 
                    ? 'bg-neutral-900 text-neutral-300 border-neutral-800' 
                    : 'bg-gray-200 text-gray-700 border-gray-300'
                }`}>
                  🇳🇬 +234
                </span>
                <input
                  type="tel"
                  placeholder="8012345678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className={`w-full py-3 px-4 bg-transparent text-sm focus:outline-none ${
                    darkMode ? 'text-white placeholder-neutral-600' : 'text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>
              {errorMsg && <p className="text-red-500 text-xs mt-2">{errorMsg}</p>}
              {successMsg && <p className="text-emerald-500 text-xs mt-2 font-medium">{successMsg}</p>}
            </div>

            <p className={`text-[11px] leading-relaxed text-center ${darkMode ? 'text-neutral-500' : 'text-gray-500'}`}>
              We use your phone number to authenticate your connection session and send receipt details.
            </p>
          </form>
        </div>

        {/* Pricing Plans Grid Section */}
        <div id="plans" className="w-full space-y-6">
          <div className="text-center space-y-1">
            <h3 className="text-xs font-bold text-red-500 tracking-widest uppercase">
              Subscription Packages
            </h3>
            <h2 className="text-2xl font-bold">Choose Your Daily Pass</h2>
          </div>

          {loadingPlans ? (
            <div className="text-center py-8 text-xs text-neutral-400">Loading available plans...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {pricingPlans.map((plan) => {
                const isSelected = selectedPlanId === plan.id;

                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`relative cursor-pointer rounded-2xl border p-6 flex flex-col justify-between transition-all duration-200 ${
                      isSelected
                        ? 'border-red-600 ring-1 ring-red-600 shadow-xl ' + (darkMode ? 'bg-neutral-900 shadow-red-950/20' : 'bg-white shadow-red-100')
                        : darkMode 
                          ? 'border-neutral-800 bg-neutral-900/40 hover:border-neutral-700' 
                          : 'border-gray-200 bg-white hover:border-gray-300 shadow-sm'
                    }`}
                  >
                    {plan.recommended && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] uppercase font-extrabold px-3 py-0.5 rounded-full tracking-wider shadow-md">
                        Most Popular
                      </span>
                    )}

                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className={`font-bold text-sm ${darkMode ? 'text-neutral-300' : 'text-gray-800'}`}>{plan.name}</h4>
                          <span className={`text-xs ${darkMode ? 'text-neutral-500' : 'text-gray-500'}`}>{plan.duration || 'Valid for 24 Hours'}</span>
                        </div>
                        <span className="text-2xl font-black">₦{plan.price}</span>
                      </div>

                      <ul className="space-y-2 mb-6">
                        {(plan.features || ['High Speed Internet', 'Instant Activation']).map((feature, idx) => (
                          <li key={idx} className={`text-xs flex items-center gap-2 ${darkMode ? 'text-neutral-400' : 'text-gray-600'}`}>
                            <svg className="w-3.5 h-3.5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProceedToPayment(plan.id);
                      }}
                      className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 ${
                        isSelected
                          ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/30'
                          : darkMode 
                            ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200' 
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                      }`}
                    >
                      {isSubmitting && isSelected ? 'Processing...' : 'Pay with OPay / Card'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Admin Login Link */}
        <div className="mt-12 text-center">
          <Link 
            href="/admin" 
            className={`text-xs underline underline-offset-4 transition-colors ${
              darkMode ? 'text-neutral-400 hover:text-white' : 'text-gray-600 hover:text-black'
            }`}
          >
            Administrator Login / Access Dashboard &rarr;
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className={`border-t py-8 text-xs transition-colors ${
        darkMode ? 'border-neutral-900 bg-black/90 text-neutral-400' : 'border-gray-200 bg-white text-gray-600'
      }`}>
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
          <div>
            <h5 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>RINGS Digital Hub Limited</h5>
            <p className={darkMode ? 'text-neutral-500' : 'text-gray-500'}>I & I Ultra Modern Plaza, Farm Center, Kano, Nigeria.</p>
          </div>
          <div>
            <h5 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>Customer Support</h5>
            <p className={darkMode ? 'text-neutral-500' : 'text-gray-500'}>WhatsApp / Call: <a href="https://wa.me/2347071730292" className="text-red-600 font-semibold hover:underline">07071730292</a></p>
          </div>
          <div className="md:text-right">
            <p className="text-emerald-500 font-medium">🔒 Secure 256-Bit Encrypted Payment</p>
            <p className={darkMode ? 'text-neutral-600' : 'text-gray-400'}>© 2024 RINGS Digital Hub Limited. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}