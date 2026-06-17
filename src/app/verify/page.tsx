'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { School, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// We need a client-side supabase for checking verification state if we want, 
// but actually we'll handle the actual link through our API to use service role or normal flow.
// Wait, the API handles the link.

export default function VerifyPage() {
  const router = useRouter();
  const [telegramId, setTelegramId] = useState<number | null>(null);
  const [studentCode, setStudentCode] = useState('');
  const [secretPin, setSecretPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if Telegram Web App is ready
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      // Expand the web app to full height
      tg.expand();
      
      const user = tg.initDataUnsafe?.user;
      if (user?.id) {
        setTelegramId(user.id);
      } else {
        // Fallback for local testing or non-telegram environment
        console.warn('No Telegram User ID found');
        // Uncomment for local testing:
        // setTelegramId(123456789);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!telegramId) {
      setError('មិនអាចស្វែងរកគណនី Telegram របស់អ្នកបានទេ។ សូមបើកកម្មវិធីនេះតាមរយៈ Telegram។');
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          telegramId,
          studentCode,
          secretPin,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'មានបញ្ហាបច្ចេកទេស');
      }

      // Success, redirect to home
      router.push('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 px-4 py-8">
      <div className="flex flex-col items-center justify-center flex-1 max-w-md mx-auto w-full">
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 w-full mb-6 text-center">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <School size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">បញ្ជាក់គណនី</h1>
          <p className="text-slate-500 text-sm">
            សូមបញ្ចូលអត្តលេខសិស្ស និងលេខកូដសម្ងាត់ ដើម្បីភ្ជាប់គណនីរបស់អ្នកជាមួយសិស្ស។
          </p>
        </div>

        {error && (
          <div className="w-full bg-red-50 text-red-600 p-4 rounded-xl flex items-start mb-6 text-sm border border-red-100">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 block">
              អត្តលេខសិស្ស
            </label>
            <input
              type="text"
              value={studentCode}
              onChange={(e) => setStudentCode(e.target.value)}
              placeholder="ឧទាហរណ៍៖ STU001"
              required
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 placeholder-slate-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 block">
              លេខកូដសម្ងាត់
            </label>
            <input
              type="password"
              value={secretPin}
              onChange={(e) => setSecretPin(e.target.value)}
              placeholder="បញ្ជូលលេខកូដសម្ងាត់"
              required
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 placeholder-slate-400"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !studentCode || !secretPin}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3.5 px-4 rounded-xl transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed shadow-sm shadow-blue-600/20"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-5 h-5 mr-2" />
                <span>ភ្ជាប់គណនី</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
