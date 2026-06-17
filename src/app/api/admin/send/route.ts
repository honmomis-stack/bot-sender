import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { getServiceSupabase } from '@/lib/supabase';
import { Telegraf } from 'telegraf';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN as string);

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'មិនមានសិទ្ធិទេ (Unauthorized)' }, { status: 401 });
    }

    const { targetAudience, studentCode, message } = await req.json();

    if (!targetAudience || !message) {
      return NextResponse.json({ error: 'សូមបំពេញព័ត៌មានឲ្យបានគ្រប់គ្រាន់' }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    let telegramIdsToNotify: number[] = [];
    let successCount = 0;

    if (targetAudience === 'specific_parent') {
      if (!studentCode) {
        return NextResponse.json({ error: 'សូមបំពេញអត្តលេខសិស្ស' }, { status: 400 });
      }

      // 1. Find parents linked to this student
      const { data: links, error: linksError } = await supabase
        .from('parent_student_links')
        .select('parent_telegram_id')
        .eq('student_code', studentCode);

      if (linksError || !links || links.length === 0) {
        return NextResponse.json({ error: 'មិនមានអាណាព្យាបាលភ្ជាប់ជាមួយអត្តលេខនេះទេ' }, { status: 404 });
      }

      telegramIdsToNotify = links.map(link => Number(link.parent_telegram_id));

      // Save notification to DB for the specific student
      await supabase.from('notifications').insert({
        student_code: studentCode,
        message: message,
      });

    } else {
      // It's a role broadcast (teacher_all, student_all, parent_all)
      const roleMap: Record<string, string> = {
        'teacher_all': 'teacher',
        'student_all': 'student',
        'parent_all': 'parent'
      };
      
      const role = roleMap[targetAudience];
      if (!role) {
        return NextResponse.json({ error: 'ក្រុមគោលដៅមិនត្រឹមត្រូវ' }, { status: 400 });
      }

      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('telegram_chat_id')
        .eq('role', role);

      if (usersError) {
        console.error('Error fetching users by role:', usersError);
        return NextResponse.json({ error: 'មានបញ្ហាក្នុងការស្វែងរកអ្នកប្រើប្រាស់' }, { status: 500 });
      }

      if (!users || users.length === 0) {
        return NextResponse.json({ error: 'មិនមានអ្នកប្រើប្រាស់នៅក្នុងក្រុមនេះទេ' }, { status: 404 });
      }

      telegramIdsToNotify = users.map(u => Number(u.telegram_chat_id));
      // Note: We don't save role broadcasts to the `notifications` table since they aren't tied to a specific studentCode.
    }

    // Broadcast message
    for (const chatId of telegramIdsToNotify) {
      try {
        await bot.telegram.sendMessage(
          chatId,
          `🔔 សារដំណឹងថ្មីពីសាលា៖\n\n${message}`
        );
        successCount++;
      } catch (err) {
        console.error(`Failed to send to ${chatId}:`, err);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `បានផ្ញើសារជោគជ័យទៅកាន់ ${successCount} គណនី` 
    });

  } catch (error) {
    console.error('Admin send error:', error);
    return NextResponse.json({ error: 'បញ្ហាបច្ចេកទេស' }, { status: 500 });
  }
}
