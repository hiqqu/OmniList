import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/server/account-db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    const cleanUsername = (username || '').trim();
    const cleanPassword = (password || '').trim();

    if (!cleanUsername || !cleanPassword) {
      return NextResponse.json(
        { error: 'Bitte gib deinen Benutzernamen und dein Passwort ein.' },
        { status: 400 }
      );
    }

    const result = await authenticateUser(cleanUsername, cleanPassword);
    if (!result) {
      return NextResponse.json(
        { error: 'Ungültiger Benutzername oder falsches Passwort.' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: result.user,
      token: result.token,
      data: result.data,
      message: `Willkommen zurück, ${result.user.username}!`,
    });
  } catch (error: any) {
    console.error('Error in /api/auth/login:', error);
    return NextResponse.json(
      { error: error.message || 'Anmeldung fehlgeschlagen.' },
      { status: 500 }
    );
  }
}
