import { NextRequest, NextResponse } from 'next/server';
import { getMediaMetacriticScore, normalizeMetacriticKey } from '@/lib/metacritic';

export const dynamic = 'force-dynamic';

const metacriticCache = new Map<string, number | null>();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title') || '';
    const appId = searchParams.get('appId') || '';
    const externalId = searchParams.get('externalId') || '';

    if (!title && !appId && !externalId) {
      return NextResponse.json({ error: 'Missing title or id' }, { status: 400 });
    }

    const cacheKey = (appId || externalId || title).toLowerCase();
    if (metacriticCache.has(cacheKey)) {
      const cached = metacriticCache.get(cacheKey);
      return NextResponse.json({ score: cached, source: 'cache' });
    }

    // 1. Try local curated dictionary
    const mockItem: any = {
      id: externalId || 'temp',
      title,
      type: 'game',
      external_id: externalId || (appId ? `steam:${appId}` : undefined),
    };

    const curatedScore = getMediaMetacriticScore(mockItem);
    if (curatedScore !== null) {
      metacriticCache.set(cacheKey, curatedScore);
      return NextResponse.json({ score: curatedScore, source: 'curated' });
    }

    // 2. Query Steam storesearch if it's a game title
    const searchTarget = normalizeMetacriticKey(title) || title;
    if (searchTarget && searchTarget.length >= 2) {
      try {
        const steamRes = await fetch(
          `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(searchTarget)}&l=english&cc=US`,
          { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(3500) }
        );

        if (steamRes.ok) {
          const data = await steamRes.json();
          const items = data.items || [];
          for (const it of items.slice(0, 4)) {
            if (it.metascore) {
              const score = parseInt(it.metascore, 10);
              if (!isNaN(score) && score > 0 && score <= 100) {
                metacriticCache.set(cacheKey, score);
                return NextResponse.json({ score, source: 'steam' });
              }
            }
          }
        }
      } catch (err) {
        // Steam storesearch failed or timed out
      }
    }

    metacriticCache.set(cacheKey, null);
    return NextResponse.json({ score: null, source: null });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error resolving metacritic' }, { status: 500 });
  }
}
