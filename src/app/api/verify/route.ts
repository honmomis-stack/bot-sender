import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { telegramId, studentCode, secretPin } = body;

    if (!telegramId || !studentCode || !secretPin) {
      return NextResponse.json({ error: 'ព័ត៌មានមិនគ្រប់គ្រាន់ទេ' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // 1. Check if student exists and pin matches
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('student_code', studentCode)
      .eq('secret_pin', secretPin)
      .single();

    if (studentError || !student) {
      return NextResponse.json(
        { error: 'អត្តលេខសិស្ស ឬលេខកូដសម្ងាត់មិនត្រឹមត្រូវទេ' },
        { status: 400 }
      );
    }

    // 2. Insert into parent_student_links
    const { error: linkError } = await supabase
      .from('parent_student_links')
      .upsert(
        {
          parent_telegram_id: telegramId,
          student_code: studentCode,
        },
        { onConflict: 'parent_telegram_id, student_code' }
      );

    if (linkError) {
      console.error('Link Error:', linkError);
      return NextResponse.json(
        { error: 'មិនអាចភ្ជាប់គណនីបានទេ សូមសាកល្បងម្ដងទៀត' },
        { status: 500 }
      );
    }

    // 3. Update user is_verified to true
    await supabase
      .from('users')
      .update({ is_verified: true })
      .eq('telegram_chat_id', telegramId);

    return NextResponse.json({ success: true, message: 'ភ្ជាប់គណនីបានជោគជ័យ' });
  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json({ error: 'បញ្ហាបច្ចេកទេស' }, { status: 500 });
  }
}
