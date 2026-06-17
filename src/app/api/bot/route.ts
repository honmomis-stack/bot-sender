import { Telegraf } from 'telegraf';
import { getServiceSupabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN as string);

bot.start(async (ctx) => {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const supabase = getServiceSupabase();

  try {
    // Insert user with a default unassigned state if they don't exist
    // We'll let them update their role via the buttons below
    await supabase.from('users').upsert(
      {
        telegram_chat_id: telegramId,
        // We temporarily set them to parent if they don't exist, but they'll update it right away.
        // It's safer to use the 'parent' enum as fallback since it's the DB default.
      },
      { onConflict: 'telegram_chat_id', ignoreDuplicates: true }
    );

    await ctx.reply(
      'សាលារៀនកម្ពុជា សូមស្វាគមន៍! សូមជ្រើសរើសតួនាទីរបស់អ្នក៖',
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '👨‍🎓 សិស្ស', callback_data: 'set_role_student' },
              { text: '👨‍👩‍👧 អាណាព្យាបាល', callback_data: 'set_role_parent' }
            ],
            [
              { text: '👨‍🏫 គ្រូបង្រៀន', callback_data: 'set_role_teacher' }
            ]
          ],
        },
      }
    );
  } catch (error) {
    console.error('Error in /start:', error);
    await ctx.reply('សុំទោស មានបញ្ហាបច្ចេកទេស។ សូមព្យាយាមម្ដងទៀត។');
  }
});

// Action Handlers for Role Selection
const handleRoleSelection = async (ctx: any, role: string, roleNameKhmer: string) => {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const supabase = getServiceSupabase();

  try {
    // Update user's role in the database
    const { error } = await supabase
      .from('users')
      .update({ role })
      .eq('telegram_chat_id', telegramId);

    if (error) throw error;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://example.com';

    // Acknowledge the callback to remove the loading state on the button
    await ctx.answerCbQuery(`កំណត់តួនាទីជា ${roleNameKhmer} បានជោគជ័យ!`);

    // Reply with the final Web App button
    await ctx.reply(
      `ជោគជ័យ! អ្នកបានជ្រើសរើសតួនាទីជា **${roleNameKhmer}**។\n\nសូមចុចប៊ូតុងខាងក្រោមដើម្បីបើកកម្មវិធី៖`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🏫 បើកកម្មវិធីសាលារៀន',
                web_app: { url: appUrl },
              },
            ],
          ],
        },
      }
    );
  } catch (error) {
    console.error(`Error setting role to ${role}:`, error);
    await ctx.answerCbQuery('មានបញ្ហាបច្ចេកទេស សូមសាកល្បងម្ដងទៀត។', { show_alert: true });
  }
};

bot.action('set_role_student', (ctx) => handleRoleSelection(ctx, 'student', 'សិស្ស'));
bot.action('set_role_parent', (ctx) => handleRoleSelection(ctx, 'parent', 'អាណាព្យាបាល'));
bot.action('set_role_teacher', (ctx) => handleRoleSelection(ctx, 'teacher', 'គ្រូបង្រៀន'));

// Since Next.js API Routes don't run as a continuous process, 
// we handle the incoming POST request from the webhook here.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await bot.handleUpdate(body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
