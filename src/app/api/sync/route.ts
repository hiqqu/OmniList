import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return NextResponse.json({
    isConfigured: Boolean(kvUrl && kvToken),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, code, data } = body;

    const syncCode = (code || '').trim().toUpperCase();
    if (!syncCode || syncCode.length < 4) {
      return NextResponse.json(
        { error: 'Der Sync-Code muss mindestens 4 Zeichen lang sein (z. B. OMNI-7821).' },
        { status: 400 }
      );
    }

    const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!kvUrl || !kvToken) {
      return NextResponse.json(
        {
          error: 'Vercel KV ist noch nicht mit deinem Projekt verbunden.',
          isConfigured: false,
          hint: 'Klicke in deinem Vercel-Dashboard auf "Storage" -> "Create KV Database" und verbinde sie mit diesem Projekt.',
        },
        { status: 503 }
      );
    }

    const redisKey = `omnilist:sync:${syncCode}`;
    const legacyRedisKey = `omnitrack:sync:${syncCode}`;

    if (action === 'push') {
      if (!data) {
        return NextResponse.json({ error: 'Keine Daten zum Sichern übergeben.' }, { status: 400 });
      }

      const payload = {
        media: data.media || [],
        sequels: data.sequels || [],
        integrations: data.integrations || {},
        updatedAt: new Date().toISOString(),
        itemCount: (data.media || []).length,
      };

      // Store in Vercel KV / Upstash Redis via native REST API
      const putRes = await fetch(`${kvUrl}/set/${encodeURIComponent(redisKey)}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${kvToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(JSON.stringify(payload)),
      });

      if (!putRes.ok) {
        throw new Error(`KV Error (${putRes.status}): ${putRes.statusText}`);
      }

      return NextResponse.json({
        success: true,
        message: `In der Cloud gesichert (${payload.itemCount} Medien).`,
        updatedAt: payload.updatedAt,
      });
    }

    if (action === 'pull') {
      let getRes = await fetch(`${kvUrl}/get/${encodeURIComponent(redisKey)}`, {
        headers: {
          Authorization: `Bearer ${kvToken}`,
        },
      });

      if (!getRes.ok) {
        throw new Error(`KV Error (${getRes.status}): ${getRes.statusText}`);
      }

      let rawResult = await getRes.json();
      if (!rawResult || rawResult.result === null || rawResult.result === undefined) {
        // Fallback to legacy key if not found under omnilist
        const legacyRes = await fetch(`${kvUrl}/get/${encodeURIComponent(legacyRedisKey)}`, {
          headers: {
            Authorization: `Bearer ${kvToken}`,
          },
        });
        if (legacyRes.ok) {
          rawResult = await legacyRes.json();
        }
      }

      if (!rawResult || rawResult.result === null || rawResult.result === undefined) {
        return NextResponse.json(
          { error: `Unter dem Code "${syncCode}" wurde noch kein Backup gefunden. Bitte zuerst auf dem Hauptgerät in die Cloud sichern.` },
          { status: 404 }
        );
      }

      const parsedData = typeof rawResult.result === 'string' ? JSON.parse(rawResult.result) : rawResult.result;

      return NextResponse.json({
        success: true,
        data: parsedData,
        message: `Erfolgreich geladen (${parsedData.itemCount || parsedData.media?.length || 0} Medien).`,
      });
    }

    return NextResponse.json({ error: 'Ungültige Aktion. Bitte "push" oder "pull" angeben.' }, { status: 400 });
  } catch (error: any) {
    console.error('Sync route error:', error);
    return NextResponse.json(
      { error: error.message || 'Serverfehler beim Cloud-Sync.' },
      { status: 500 }
    );
  }
}
