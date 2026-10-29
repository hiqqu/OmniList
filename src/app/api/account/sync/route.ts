import { NextRequest, NextResponse } from 'next/server';
import { getUserBySessionToken, getUserCloudData, saveUserCloudData } from '@/lib/server/account-db';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization') || '';
    const body = await req.json();
    const token = authHeader.replace(/^Bearer\s+/i, '').trim() || body.token;
    const { action, data } = body;

    if (!token) {
      return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
    }

    const user = await getUserBySessionToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Sitzung abgelaufen oder ungültig.' }, { status: 401 });
    }

    if (action === 'push') {
      if (!data) {
        return NextResponse.json({ error: 'Keine Daten zum Synchronisieren übergeben.' }, { status: 400 });
      }

      const updatedData = await saveUserCloudData(user.id, {
        media: data.media,
        sequels: data.sequels,
        trash: data.trash,
        integrations: data.integrations,
      });

      return NextResponse.json({
        success: true,
        updatedAt: updatedData.updatedAt,
        itemCount: updatedData.itemCount,
        message: 'Erfolgreich mit deinem Account synchronisiert.',
      });
    }

    if (action === 'pull') {
      const cloudData = await getUserCloudData(user.id);
      return NextResponse.json({
        success: true,
        data: cloudData,
      });
    }

    return NextResponse.json({ error: 'Ungültige Aktion. Bitte "push" oder "pull" angeben.' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in /api/account/sync:', error);
    return NextResponse.json(
      { error: error.message || 'Synchronisationsfehler.' },
      { status: 500 }
    );
  }
}
