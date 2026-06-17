import { Telegraf } from 'telegraf';
import { getServiceSupabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN as string);

bot.start(async (ctx) => {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const supabase = getServiceSupabase();

  try {
    // Insert user if they don't exist
    await supabase.from('users').upsert(
      {
        telegram_chat_id: telegramId,
        role: 'parent',
      },
      { onConflict: 'telegram_chat_id', ignoreDuplicates: true }
    );

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://example.com';

    await ctx.reply(
      'សាលារៀនកម្ពុជា សូមស្វាគមន៍!',
      {
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
    console.error('Error in /start:', error);
    await ctx.reply('សុំទោស មានបញ្ហាបច្ចេកទេស។ សូមព្យាយាមម្ដងទៀត។');
  }
});

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
