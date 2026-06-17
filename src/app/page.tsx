'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Bell, Home, User, Loader2, BookOpen, Clock } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-key';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Notification = {
  id: string;
  message: string;
  created_at: string;
};

export default function Dashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [studentName, setStudentName] = useState<string>('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    async function checkAuthAndLoadData() {
      if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();

        const user = tg.initDataUnsafe?.user;
        let telegramId = user?.id;

        // Local testing fallback
        if (!telegramId) {
           console.warn('No Telegram User ID found');
           // telegramId = 123456789; 
        }

        if (!telegramId) {
          setIsLoading(false);
          return;
        }

        try {
          // 1. Check if user is verified
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('is_verified')
            .eq('telegram_chat_id', telegramId)
            .single();

          if (userError || !userData?.is_verified) {
            router.push('/verify');
            return;
          }

          // 2. Fetch linked student(s)
          const { data: links, error: linksError } = await supabase
            .from('parent_student_links')
            .select('student_code, students(full_name)')
            .eq('parent_telegram_id', telegramId);

          if (!linksError && links && links.length > 0) {
            // For simplicity, we just take the first linked student
            const student = links[0].students as unknown as { full_name: string };
            setStudentName(student?.full_name || 'សិស្ស');

            // 3. Fetch notifications for this student
            const { data: notifs } = await supabase
              .from('notifications')
              .select('*')
              .eq('student_code', links[0].student_code)
              .order('created_at', { ascending: false })
              .limit(10);
            
            if (notifs) {
              setNotifications(notifs);
            }
          }
        } catch (err) {
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      }
    }

    checkAuthAndLoadData();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 pb-[72px]">
      {/* Header */}
      <header className="bg-blue-600 text-white px-5 pt-8 pb-6 rounded-b-[2rem] shadow-md shadow-blue-600/10 shrink-0">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-bold">សួស្តី,</h1>
            <p className="text-blue-100 text-sm mt-1">អាណាព្យាបាលសិស្ស៖ {studentName}</p>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <User className="w-6 h-6 text-white" />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-4 pt-6 pb-6">
        
        {activeTab === 'home' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">កាលវិភាគសិក្សា</h3>
                  <p className="text-sm text-slate-500">មើលម៉ោងរៀនប្រចាំសប្តាហ៍</p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-800">សារដំណឹងថ្មីៗ</h2>
                <button 
                  onClick={() => setActiveTab('notifications')}
                  className="text-sm text-blue-600 font-medium"
                >
                  មើលទាំងអស់
                </button>
              </div>

              <div className="space-y-3">
                {notifications.length > 0 ? (
                  notifications.slice(0, 3).map((notif) => (
                    <div key={notif.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                          </span>
                        </div>
                        <div>
                          <p className="text-slate-700 text-sm leading-relaxed">{notif.message}</p>
                          <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(notif.created_at).toLocaleDateString('km-KH')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-400 text-sm bg-white rounded-2xl border border-slate-100 border-dashed">
                    មិនមានសារដំណឹងថ្មីៗទេ
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-slate-800 mb-4">សារដំណឹងទាំងអស់</h2>
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <div key={notif.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                  <p className="text-slate-700 text-sm leading-relaxed">{notif.message}</p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(notif.created_at).toLocaleDateString('km-KH')}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400 text-sm bg-white rounded-2xl border border-slate-100 border-dashed">
                មិនមានសារដំណឹងទេ
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-800 mb-4">គណនី</h2>
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                 <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-slate-400" />
                 </div>
                 <div>
                   <h3 className="font-semibold text-slate-800">អត្តលេខសិស្ស</h3>
                   <p className="text-sm text-slate-500">{studentName}</p>
                 </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 pb-safe pt-2 px-6 flex justify-between items-center h-[72px] shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 flex-1 ${activeTab === 'home' ? 'text-blue-600' : 'text-slate-400'}`}
        >
          <Home className={`w-6 h-6 ${activeTab === 'home' ? 'fill-blue-50' : ''}`} />
          <span className="text-[10px] font-medium">ទំព័រដើម</span>
        </button>
        
        <button 
          onClick={() => setActiveTab('notifications')}
          className={`flex flex-col items-center gap-1 flex-1 ${activeTab === 'notifications' ? 'text-blue-600' : 'text-slate-400'}`}
        >
          <div className="relative">
            <Bell className={`w-6 h-6 ${activeTab === 'notifications' ? 'fill-blue-50' : ''}`} />
            {notifications.length > 0 && (
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            )}
          </div>
          <span className="text-[10px] font-medium">សារដំណឹង</span>
        </button>
        
        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 flex-1 ${activeTab === 'profile' ? 'text-blue-600' : 'text-slate-400'}`}
        >
          <User className={`w-6 h-6 ${activeTab === 'profile' ? 'fill-blue-50' : ''}`} />
          <span className="text-[10px] font-medium">គណនី</span>
        </button>
      </nav>
    </div>
  );
}
