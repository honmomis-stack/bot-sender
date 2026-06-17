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

    const { studentCode, message } = await req.json();

    if (!studentCode || !message) {
      return NextResponse.json({ error: 'សូមបំពេញអត្តលេខសិស្ស និងសារ' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // 1. Find all parent_telegram_ids linked to this student_code
    const { data: links, error: linksError } = await supabase
      .from('parent_student_links')
      .select('parent_telegram_id')
      .eq('student_code', studentCode);

    if (linksError) {
      console.error('Error fetching links:', linksError);
      return NextResponse.json({ error: 'មានបញ្ហាក្នុងការស្វែងរកអាណាព្យាបាល' }, { status: 500 });
    }

    if (!links || links.length === 0) {
      return NextResponse.json({ error: 'មិនមានអាណាព្យាបាលភ្ជាប់ជាមួយអត្តលេខនេះទេ' }, { status: 404 });
    }

    // 2. Save the notification in the database
    const { error: notifError } = await supabase
      .from('notifications')
      .insert({
        student_code: studentCode,
        message: message,
      });

    if (notifError) {
      console.error('Error saving notification:', notifError);
      return NextResponse.json({ error: 'មានបញ្ហាក្នុងការរក្សាទុកសារ' }, { status: 500 });
    }

    // 3. Broadcast the message via Telegram Bot
    let successCount = 0;
    for (const link of links) {
      try {
        await bot.telegram.sendMessage(
          Number(link.parent_telegram_id),
          `🔔 សារដំណឹងថ្មីពីសាលា៖\n\n${message}`
        );
        successCount++;
      } catch (err) {
        console.error(`Failed to send to ${link.parent_telegram_id}:`, err);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `បានផ្ញើសារជោគជ័យទៅកាន់អាណាព្យាបាលចំនួន ${successCount} នាក់` 
    });

  } catch (error) {
    console.error('Admin send error:', error);
    return NextResponse.json({ error: 'បញ្ហាបច្ចេកទេស' }, { status: 500 });
  }
}
