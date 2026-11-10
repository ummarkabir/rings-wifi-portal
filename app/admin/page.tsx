'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface Subscriber {
  id: string;
  phone_number: string;
  plan_id: string;
  status: string;
  created_at: string;
}

interface PlanItem {
  id: string;
  name: string;
  price: number;
  duration: string;
  features: string[];
}

export default function AdminPage() {
  const [darkMode, setDarkMode] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // New Plan Form State
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanPrice, setNewPlanPrice] = useState('');
  const [newPlanDuration, setNewPlanDuration] = useState('Valid for 24 Hours');

  // Admin password
  const ADMIN_SECRET = 'rings2026';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_SECRET) {
      setIsAuthenticated(true);
      setErrorMsg('');
      fetchSubscribers();
      fetchPlans();
    } else {
      setErrorMsg('Incorrect password. Please try again.');
    }
  };

  const fetchSubscribers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('subscribers')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setSubscribers(data);
    }
    setLoading(false);
  };

  const fetchPlans = async () => {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .order('price', { ascending: true });

    if (!error && data && data.length > 0) {
      setPlans(data);
    } else {
      // Fallback default plans if table is empty
      const defaultPlans: PlanItem[] = [
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
        },
        {
          id: 'plan_400',
          name: 'PREMIUM PLAN',
          price: 400,
          duration: 'Valid for 24 Hours',
          features: ['Ultra High Speed Internet', 'Maximum Bandwidth', 'HD Streaming'],
        },
      ];
      setPlans(defaultPlans);
    }
  };

  // Add New Plan Handler (Saved to Supabase live)
  const handleAddPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanName || !newPlanPrice) return;

    const newPlanId = `plan_${Date.now()}`;
    const newPlanObj = {
      id: newPlanId,
      name: newPlanName.toUpperCase(),
      price: Number(newPlanPrice),
      duration: newPlanDuration,
      features: ['High Speed Internet', 'Instant Activation', 'Reliable Connection'],
    };

    const { error } = await supabase.from('plans').insert([newPlanObj]);

    if (error) {
      alert('Error adding plan to database: ' + error.message);
      return;
    }

    setPlans([...plans, newPlanObj]);
    setNewPlanName('');
    setNewPlanPrice('');
    alert('Plan successfully added and published to the customer app page!');
  };

  // Delete Plan Handler (Removed from Supabase)
  const handleDeletePlan = async (id: string) => {
    const { error } = await supabase.from('plans').delete().eq('id', id);

    if (error) {
      alert('Error deleting plan: ' + error.message);
      return;
    }

    setPlans(plans.filter((p) => p.id !== id));
  };

  // Download FinTech Receipt Handler
  const handleDownloadReceipt = (sub: Subscriber) => {
    const receiptContent = `
========================================
       RINGS DIGITAL HUB LIMITED        
     RC: 9507508 | Farm Center, Kano     
========================================
RECEIPT / TRANSACTION CONFIRMATION
----------------------------------------
Subscriber Phone: ${sub.phone_number}
Package Plan    : ${sub.plan_id.toUpperCase()}
Status          : ${sub.status.toUpperCase()}
Date & Time     : ${new Date(sub.created_at).toLocaleString()}
Payment Gateway : OPay / Secure 256-Bit
----------------------------------------
Thank you for choosing RINGS Highspeed WiFi!
Customer Support: 07071730292
========================================
    `.trim();

    const blob = new Blob([receiptContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `RINGS_Receipt_${sub.phone_number}_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Filtered Subscribers
  const filteredSubscribers = subscribers.filter((sub) =>
    sub.phone_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.plan_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Total Revenue Calculation
  const totalRevenue = subscribers.reduce((acc, sub) => {
    const foundPlan = plans.find((p) => p.id === sub.plan_id);
    return acc + (foundPlan ? foundPlan.price : 300);
  }, 0);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl">
          <div className="text-center mb-6">
            <span className="text-2xl font-black text-red-600">RINGS</span>
            <h2 className="text-lg font-bold mt-2">FinTech Admin Portal</h2>
            <p className="text-xs text-neutral-400">Enter secure password to access management</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1 text-neutral-300">Admin Password</label>
              <input
                type="password"
                placeholder="******"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 bg-neutral-950 border border-neutral-700 rounded-xl text-sm focus:outline-none focus:border-red-600 text-white"
              />
            </div>
            {errorMsg && <p className="text-red-500 text-xs">{errorMsg}</p>}
            <button
              type="submit"
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
            >
              Access Secure Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-4 md:p-8 transition-colors duration-300 ${
      darkMode ? 'bg-neutral-950 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header & Theme Toggle */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-4 border-neutral-800">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">RINGS FinTech Management</h1>
            <p className={`text-xs ${darkMode ? 'text-neutral-400' : 'text-gray-500'}`}>RC: 9507508 | Farm Center, Kano, Nigeria</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-2 transition-all ${
                darkMode 
                  ? 'bg-neutral-900 border-neutral-700 text-yellow-400 hover:border-yellow-400' 
                  : 'bg-gray-200 border-gray-300 text-gray-800 hover:border-gray-500'
              }`}
            >
              {darkMode ? '☀️ White Mode' : '🌙 Dark Mode'}
            </button>
            <button
              onClick={() => setIsAuthenticated(false)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-all"
            >
              Secure Logout
            </button>
          </div>
        </div>

        {/* Analytics & Business Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className={`p-4 rounded-xl border ${darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200 shadow-sm'}`}>
            <h3 className={`text-xs ${darkMode ? 'text-neutral-400' : 'text-gray-500'}`}>Total Subscribers</h3>
            <p className="text-2xl font-bold mt-1">{subscribers.length}</p>
          </div>
          <div className={`p-4 rounded-xl border ${darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200 shadow-sm'}`}>
            <h3 className={`text-xs ${darkMode ? 'text-neutral-400' : 'text-gray-500'}`}>Estimated Revenue</h3>
            <p className="text-2xl font-bold text-emerald-500 mt-1">₦{totalRevenue.toLocaleString()}</p>
          </div>
          <div className={`p-4 rounded-xl border ${darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200 shadow-sm'}`}>
            <h3 className={`text-xs ${darkMode ? 'text-neutral-400' : 'text-gray-500'}`}>Active Gateway</h3>
            <p className="text-sm font-bold text-red-500 mt-2">● OPay / Supabase Live</p>
          </div>
          <div className={`p-4 rounded-xl border flex items-center justify-between ${darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200 shadow-sm'}`}>
            <div>
              <h3 className={`text-xs ${darkMode ? 'text-neutral-400' : 'text-gray-500'}`}>Database Sync</h3>
              <p className={`text-xs mt-1 ${darkMode ? 'text-neutral-500' : 'text-gray-400'}`}>Refresh records</p>
            </div>
            <button
              onClick={() => { fetchSubscribers(); fetchPlans(); }}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-all"
            >
              Sync
            </button>
          </div>
        </div>

        {/* SECTION 1: Plan Management (Add / Delete Plans live to Supabase) */}
        <div className={`p-6 rounded-2xl border space-y-6 ${darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200 shadow-sm'}`}>
          <div className="flex justify-between items-center border-b pb-3 border-neutral-800">
            <h3 className="font-bold text-sm tracking-wide">Manage WiFi Data Packages & Pricing (Syncs Live to App Page)</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div key={plan.id} className={`p-4 rounded-xl border flex flex-col justify-between space-y-4 ${
                darkMode ? 'bg-neutral-950 border-neutral-800' : 'bg-gray-50 border-gray-200'
              }`}>
                <div>
                  <div className="flex justify-between items-start">
                    <h4 className={`font-bold text-sm ${darkMode ? 'text-neutral-200' : 'text-gray-800'}`}>{plan.name}</h4>
                    <span className="text-lg font-black text-red-600">₦{plan.price}</span>
                  </div>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-neutral-500' : 'text-gray-500'}`}>{plan.duration}</p>
                </div>
                <button
                  onClick={() => handleDeletePlan(plan.id)}
                  className="w-full py-2 bg-red-950/40 border border-red-800/50 hover:bg-red-900 text-red-400 hover:text-white text-xs font-semibold rounded-lg transition-all"
                >
                  Delete Plan
                </button>
              </div>
            ))}
          </div>

          {/* Add New Plan Form */}
          <form onSubmit={handleAddPlan} className="pt-4 border-t border-neutral-800 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div>
              <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-neutral-400' : 'text-gray-600'}`}>Plan Name</label>
              <input
                type="text"
                placeholder="e.g. MEGA PLAN"
                value={newPlanName}
                onChange={(e) => setNewPlanName(e.target.value)}
                className={`w-full p-2.5 rounded-xl text-xs border focus:outline-none focus:border-red-600 ${
                  darkMode ? 'bg-neutral-950 border-neutral-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                }`}
              />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-neutral-400' : 'text-gray-600'}`}>Price (₦)</label>
              <input
                type="number"
                placeholder="500"
                value={newPlanPrice}
                onChange={(e) => setNewPlanPrice(e.target.value)}
                className={`w-full p-2.5 rounded-xl text-xs border focus:outline-none focus:border-red-600 ${
                  darkMode ? 'bg-neutral-950 border-neutral-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                }`}
              />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-neutral-400' : 'text-gray-600'}`}>Duration</label>
              <input
                type="text"
                value={newPlanDuration}
                onChange={(e) => setNewPlanDuration(e.target.value)}
                className={`w-full p-2.5 rounded-xl text-xs border focus:outline-none focus:border-red-600 ${
                  darkMode ? 'bg-neutral-950 border-neutral-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                }`}
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
            >
              + Publish New Plan
            </button>
          </form>
        </div>

        {/* SECTION 2: Subscribers Table & Receipt Download */}
        <div className={`rounded-2xl border overflow-hidden space-y-4 ${darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200 shadow-sm'}`}>
          <div className="p-4 border-b border-neutral-800 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h3 className="font-bold text-sm">Live Subscriber Transactions & Receipts</h3>
            <input
              type="text"
              placeholder="Search by phone number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full sm:w-64 p-2 rounded-xl text-xs border focus:outline-none focus:border-red-600 ${
                darkMode ? 'bg-neutral-950 border-neutral-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
              }`}
            />
          </div>

          {loading ? (
            <div className={`p-8 text-center text-xs ${darkMode ? 'text-neutral-400' : 'text-gray-500'}`}>Loading live data...</div>
          ) : filteredSubscribers.length === 0 ? (
            <div className={`p-8 text-center text-xs ${darkMode ? 'text-neutral-400' : 'text-gray-500'}`}>No subscriber records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={`border-b ${darkMode ? 'bg-neutral-950 text-neutral-400 border-neutral-800' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                  <tr>
                    <th className="p-3">Phone Number</th>
                    <th className="p-3">Plan ID</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Date / Time</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? 'divide-neutral-800' : 'divide-gray-200'}`}>
                  {filteredSubscribers.map((sub) => (
                    <tr key={sub.id} className={darkMode ? 'hover:bg-neutral-800/50' : 'hover:bg-gray-50'}>
                      <td className="p-3 font-mono font-bold text-red-600">{sub.phone_number}</td>
                      <td className="p-3 uppercase font-medium">{sub.plan_id}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                          sub.status === 'active' 
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className={`p-3 ${darkMode ? 'text-neutral-400' : 'text-gray-500'}`}>{new Date(sub.created_at).toLocaleString()}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDownloadReceipt(sub)}
                          className={`px-3 py-1.5 font-semibold rounded-lg transition-all text-[11px] ${
                            darkMode 
                              ? 'bg-neutral-800 hover:bg-red-600 text-neutral-200 hover:text-white' 
                              : 'bg-gray-100 hover:bg-red-600 text-gray-800 hover:text-white'
                          }`}
                        >
                          📄 Download Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}