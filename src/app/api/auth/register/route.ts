import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/server/account-db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password, initialData } = body;

    const cleanUsername = (username || '').trim();
    if (!cleanUsername || cleanUsername.length < 3) {
      return NextResponse.json(
        { error: 'Der Benutzername muss mindestens 3 Zeichen lang sein.' },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9_\-\.]{3,30}$/.test(cleanUsername)) {
      return NextResponse.json(
        { error: 'Der Benutzername darf nur Buchstaben, Zahlen sowie die Zeichen - _ . enthalten.' },
        { status: 400 }
      );
    }

    const cleanPassword = (password || '').trim();
    if (!cleanPassword || cleanPassword.length < 4) {
      return NextResponse.json(
        { error: 'Das Passwort muss mindestens 4 Zeichen lang sein.' },
        { status: 400 }
      );
    }

    const result = await createUser(cleanUsername, cleanPassword, initialData);

    return NextResponse.json({
      success: true,
      user: result.user,
      token: result.token,
      data: result.data,
      message: `Account "${result.user.username}" erfolgreich erstellt. Deine Daten werden ab sofort automatisch synchronisiert.`,
    });
  } catch (error: any) {
    console.error('Error in /api/auth/register:', error);
    return NextResponse.json(
      { error: error.message || 'Registrierung fehlgeschlagen.' },
      { status: 400 }
    );
  }
}
