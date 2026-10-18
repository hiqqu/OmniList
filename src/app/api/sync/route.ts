import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const LOCAL_STORE_FILE = path.join(process.cwd(), '.sync-store.json');

async function getLocalStore(): Promise<Record<string, any>> {
  try {
    if (fs.existsSync(LOCAL_STORE_FILE)) {
      const content = await fs.promises.readFile(LOCAL_STORE_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error('Error reading local sync store:', error);
  }
  return {};
}

async function saveLocalStore(data: Record<string, any>): Promise<void> {
  try {
    await fs.promises.writeFile(LOCAL_STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving local sync store:', error);
  }
}

export async function GET() {
  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  const isCloudConfigured = Boolean(kvUrl && kvToken);

  return NextResponse.json({
    isConfigured: true,
    isCloudConfigured,
    mode: isCloudConfigured ? 'cloud' : 'local',
    provider: isCloudConfigured ? (process.env.UPSTASH_REDIS_REST_URL ? 'Upstash Redis' : 'Vercel KV') : 'Lokaler Server',
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
    const isCloudConfigured = Boolean(kvUrl && kvToken);

    const redisKey = `omnilist:sync:${syncCode}`;
    const legacyRedisKey = `omnitrack:sync:${syncCode}`;

    if (action === 'push') {
      if (!data) {
        return NextResponse.json({ error: 'Keine Daten zum Sichern übergeben.' }, { status: 400 });
      }

      const payload = {
        media: data.media || [],
        sequels: data.sequels || [],
        updatedAt: new Date().toISOString(),
        itemCount: (data.media || []).length,
      };

      if (isCloudConfigured && kvUrl && kvToken) {
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
          throw new Error(`Cloud-Datenbank-Fehler (${putRes.status}): ${putRes.statusText}`);
        }

        return NextResponse.json({
          success: true,
          mode: 'cloud',
          message: `Erfolgreich in der Cloud gesichert (${payload.itemCount} Medien). Auf jedem beliebigen Gerät abrufbar.`,
          updatedAt: payload.updatedAt,
        });
      } else {
        // Fallback: Store locally in .sync-store.json on the server
        const store = await getLocalStore();
        store[syncCode] = payload;
        await saveLocalStore(store);

        return NextResponse.json({
          success: true,
          mode: 'local',
          message: `Erfolgreich auf deinem Server gesichert (${payload.itemCount} Medien). Geräte im selben Netzwerk können diesen Code sofort abrufen. Für weltweiten Cloud-Sync kann optional Upstash Redis oder Vercel KV verbunden werden.`,
          updatedAt: payload.updatedAt,
        });
      }
    }

    if (action === 'pull') {
      let parsedData: any = null;

      if (isCloudConfigured && kvUrl && kvToken) {
        let getRes = await fetch(`${kvUrl}/get/${encodeURIComponent(redisKey)}`, {
          headers: {
            Authorization: `Bearer ${kvToken}`,
          },
        });

        if (!getRes.ok) {
          throw new Error(`Cloud-Datenbank-Fehler (${getRes.status}): ${getRes.statusText}`);
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

        if (rawResult && rawResult.result !== null && rawResult.result !== undefined) {
          parsedData = typeof rawResult.result === 'string' ? JSON.parse(rawResult.result) : rawResult.result;
        }
      }

      // If not found in Cloud or cloud not configured, check local store
      if (!parsedData) {
        const store = await getLocalStore();
        if (store[syncCode]) {
          parsedData = store[syncCode];
        }
      }

      if (!parsedData) {
        return NextResponse.json(
          {
            error: `Unter dem Code "${syncCode}" wurde noch kein Backup gefunden. Bitte zuerst auf dem Hauptgerät "In Cloud sichern" bzw. "Auf Server sichern" ausführen.`,
          },
          { status: 404 }
        );
      }

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
      { error: error.message || 'Serverfehler beim Synchronisieren.' },
      { status: 500 }
    );
  }
}
