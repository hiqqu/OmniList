import { NextRequest, NextResponse } from 'next/server';
import { getUserBySessionToken, getUserCloudData } from '@/lib/server/account-db';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization') || '';
    const body = await req.json().catch(() => ({}));
    const token = authHeader.replace(/^Bearer\s+/i, '').trim() || body.token;

    if (!token) {
      return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
    }

    const user = await getUserBySessionToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Sitzung abgelaufen oder ungültig.' }, { status: 401 });
    }

    const data = await getUserCloudData(user.id);

    return NextResponse.json({
      success: true,
      user,
      data,
    });
  } catch (error: any) {
    console.error('Error in /api/auth/me:', error);
    return NextResponse.json(
      { error: error.message || 'Fehler beim Laden des Profils.' },
      { status: 500 }
    );
  }
}
