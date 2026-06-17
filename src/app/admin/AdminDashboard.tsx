'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, LogOut, Loader2, CheckCircle2, AlertCircle, Users } from 'lucide-react';

export default function AdminDashboard({ adminEmail }: { adminEmail: string }) {
  const router = useRouter();
  const [targetAudience, setTargetAudience] = useState('specific_parent');
  const [studentCode, setStudentCode] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.refresh();
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus(null);

    try {
      const res = await fetch('/api/admin/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetAudience, studentCode, message }),
      });

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'បរាជ័យក្នុងការផ្ញើ');

      setStatus({ type: 'success', text: data.message });
      setMessage(''); // Clear message after success
      if (targetAudience === 'specific_parent') {
        setStudentCode('');
      }
    } catch (err: any) {
      setStatus({ type: 'error', text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-slate-800">ផ្ទាំងគ្រប់គ្រង</h1>
          <p className="text-sm text-slate-500">{adminEmail}</p>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
        >
          <LogOut className="w-4 h-4 mr-2" /> ចាកចេញ
        </button>
      </header>

      <main className="max-w-2xl mx-auto p-6 mt-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-blue-600 px-6 py-4">
            <h2 className="text-white font-semibold flex items-center">
              <Send className="w-5 h-5 mr-2" /> ផ្ញើសារដំណឹង
            </h2>
          </div>
          
          <div className="p-6">
            {status && (
              <div className={`mb-6 p-4 rounded-xl flex items-start text-sm border ${status.type === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                {status.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 mr-2 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                )}
                <span>{status.text}</span>
              </div>
            )}

            <form onSubmit={handleSend} className="space-y-5">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5 flex items-center">
                  <Users className="w-4 h-4 mr-1.5 text-slate-500" />
                  អ្នកទទួល (Target Audience)
                </label>
                <div className="relative">
                  <select
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 appearance-none pr-10"
                  >
                    <option value="teacher_all">👨‍🏫 គ្រូបង្រៀនទាំងអស់ (All Teachers)</option>
                    <option value="student_all">👨‍🎓 សិស្សទាំងអស់ (All Students)</option>
                    <option value="parent_all">👨‍👩‍👧 អាណាព្យាបាលទាំងអស់ (All Parents)</option>
                    <option value="specific_parent">🎯 អាណាព្យាបាលជាក់លាក់ (Specific Parent)</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </div>
                </div>
              </div>

              {targetAudience === 'specific_parent' && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">
                    អត្តលេខសិស្ស (Student Code)
                  </label>
                  <input
                    type="text"
                    required={targetAudience === 'specific_parent'}
                    placeholder="ឧ. STU001"
                    value={studentCode}
                    onChange={(e) => setStudentCode(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">
                  ខ្លឹមសារ (Message)
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="សរសេរសារនៅទីនេះ..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 resize-y"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !message || (targetAudience === 'specific_parent' && !studentCode)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3.5 px-4 rounded-xl transition-colors flex items-center justify-center disabled:opacity-70 mt-4 shadow-sm"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" /> ផ្ញើសារ
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
