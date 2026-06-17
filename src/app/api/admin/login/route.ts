import { NextRequest, NextResponse } from 'next/server';
import { createAdminToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      return NextResponse.json({ error: 'ម៉ាស៊ីនមិនទាន់បានកំណត់គណនី Admin ទេ' }, { status: 500 });
    }

    if (email === adminEmail && password === adminPassword) {
      const token = await createAdminToken(email);
      
      const cookieStore = await cookies();
      cookieStore.set('admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 // 1 day
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'អ៊ីមែល ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវ' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: 'មានបញ្ហាបច្ចេកទេស' }, { status: 500 });
  }
}
