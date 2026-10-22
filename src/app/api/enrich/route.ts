import { NextRequest, NextResponse } from 'next/server';
import { normalizeGameTitle } from '@/lib/game-import';
import { normalizeMetacriticKey } from '@/lib/metacritic';

export const dynamic = 'force-dynamic';

function cleanHtmlText(text?: string): string {
  if (!text) return '';
  return text
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<p\b[^>]*>/gi, '')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]*>?/gm, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const KNOWN_ANIME_FALLBACKS: Record<string, { rating: number; count: number; mal: number; summary: string }> = {
  frieren: {
    rating: 92,
    count: 380000,
    mal: 9.38,
    summary:
      'Die Elfenmagierin Frieren und ihre tapferen Gefährten haben den Dämonenkönig besiegt und der Welt nach einem zehnjährigen Kampf Frieden gebracht. Doch für eine langlebige Elfe sind zehn Jahre nur ein Wimpernschlag. Nach dem Abschied vergehen die Jahrzehnte, bis ihre alten Gefährten sterben. Tief berührt von der Erkenntnis, wie flüchtig das menschliche Leben ist, begibt sich Frieren auf eine neue Reise, um die Menschen besser zu verstehen und verlorene Bindungen neu zu knüpfen.',
  },
  'jujutsu kaisen': {
    rating: 87,
    count: 420000,
    mal: 8.65,
    summary:
      'Yuji Itadori ist ein Oberschüler mit außergewöhnlichen körperlichen Fähigkeiten. Als er einen versiegelten Fluchtalismann – einen Finger des legendären Dämonenkönigs Ryomen Sukuna – schluckt, um seine Mitschüler zu retten, teilt er fortan seinen Körper mit dem mächtigsten aller Flüche. Unter der Führung des mächtigen Jujutsu-Zauberers Satoru Gojo tritt Yuji der Tokyo Jujutsu High School bei, um alle Finger zu sammeln und die Menschheit vor böswilligen Flüchen zu beschützen.',
  },
  'solo leveling': {
    rating: 84,
    count: 290000,
    mal: 8.32,
    summary:
      'Vor über einem Jahrzehnt öffneten sich mysteriöse Tore, die unsere Welt mit finsteren Dungeons voller Monster verbinden. Sung Jin-Woo gilt als der schwächste Jäger der gesamten Menschheit. Nach einer tödlichen Falle in einem Doppel-Dungeon erhält er jedoch als einziger Überlebender ein geheimnisvolles Quest-System, das nur er sehen kann. Mit jedem abgeschlossenen Training und Kampf steigt sein Level unaufhaltsam, bis er zum gefürchteten Schattenmonarchen heranwächst.',
  },
  'demon slayer': {
    rating: 86,
    count: 510000,
    mal: 8.52,
    summary:
      'Im Japan der Taisho-Ära wird das friedliche Leben des herzensguten Köhlersohns Tanjiro Kamado zerstört, als ein Dämon seine Familie ermordet. Seine jüngere Schwester Nezuko überlebt als Einzige, wurde jedoch selbst in einen Dämon verwandelt. Um Nezuko wieder in einen Menschen zurückzuverwandeln und den Mörder seiner Familie zur Rechenschaft zu ziehen, schließt sich Tanjiro dem geheimen Dämonenjäger-Korps an.',
  },
  'attack on titan': {
    rating: 89,
    count: 650000,
    mal: 8.92,
    summary:
      'Seit einem Jahrhundert lebt der Rest der Menschheit hinter gigantischen Mauern, die Schutz vor den menschenfressenden Titanen bieten. Als ein kolossaler Titan das äußere Tor durchbricht, muss der junge Eren Jäger miterleben, wie seine Mutter verschlungen wird. Voller Zorn schwört er, jeden einzelnen Titanen auf Erden auszulöschen, und tritt gemeinsam mit Mikasa und Armin dem Aufklärungstrupp bei.',
  },
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'game';
    const rawTitle = searchParams.get('title') || '';
    const externalId = searchParams.get('externalId') || '';
    const appIdParam = searchParams.get('appId') || '';
    const isbn = searchParams.get('isbn') || '';

    const title = rawTitle.trim();
    if (!title && !externalId && !appIdParam && !isbn) {
      return NextResponse.json({ error: 'Fehlende Parameter' }, { status: 400 });
    }

    // ==========================================
    // 1. VIDEOGAMES ENRICHMENT
    // ==========================================
    if (type === 'game') {
      let steamAppId = appIdParam.replace(/\D/g, '');
      if (!steamAppId && externalId.startsWith('steam:')) {
        steamAppId = externalId.replace('steam:', '').trim();
      }

      // If we don't have a Steam AppId yet, search Steam store by title
      if (!steamAppId && title) {
        try {
          const cleanSearch = normalizeMetacriticKey(title) || title;
          const searchRes = await fetch(
            `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(cleanSearch)}&l=german&cc=DE`,
            {
              headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
              signal: AbortSignal.timeout(3500),
            }
          );
          if (searchRes.ok) {
            const data = await searchRes.json();
            if (data?.items && data.items.length > 0) {
              steamAppId = String(data.items[0].id);
            }
          }
        } catch (e) {
          // Storesearch timeout / error
        }
      }

      // If Steam AppId is known, fetch full appdetails (German)
      if (steamAppId) {
        try {
          const appRes = await fetch(
            `https://store.steampowered.com/api/appdetails?appids=${steamAppId}&l=german`,
            {
              headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
              signal: AbortSignal.timeout(4000),
            }
          );
          if (appRes.ok) {
            const appData = await appRes.json();
            const gameData = appData?.[steamAppId]?.data;
            if (gameData) {
              const summary = cleanHtmlText(gameData.short_description || gameData.detailed_description);
              const genres: string[] = Array.isArray(gameData.genres)
                ? gameData.genres.map((g: { description: string }) => g.description)
                : [];
              const creator = gameData.developers?.[0] || undefined;
              const publisher = gameData.publishers?.[0] || undefined;
              const metacritic = gameData.metacritic?.score ? Number(gameData.metacritic.score) : undefined;
              const releaseDate = gameData.release_date?.date || undefined;

              if (summary && summary.length > 20) {
                return NextResponse.json({
                  success: true,
                  source: 'steam_store',
                  summary,
                  genres,
                  creator,
                  publisher,
                  metacritic,
                  releaseDate,
                  appId: steamAppId,
                });
              }
            }
          }
        } catch (e) {
          // Steam appdetails failed
        }
      }

      // Fallback: Wikipedia Summary (German)
      if (title) {
        try {
          const cleanWikiTitle = title
            .replace(/\s*\([^)]*\)/g, '')
            .replace(/[™®©]/g, '')
            .trim();

          const wikiRes = await fetch(
            `https://de.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanWikiTitle)}`,
            {
              headers: { 'User-Agent': 'OmniTrack/1.0 (info@omnitrack.local)' },
              signal: AbortSignal.timeout(3000),
            }
          );
          if (wikiRes.ok) {
            const wikiData = await wikiRes.json();
            if (wikiData.extract && wikiData.type === 'standard' && wikiData.extract.length > 40) {
              return NextResponse.json({
                success: true,
                source: 'wikipedia_de',
                summary: wikiData.extract.trim(),
                genres: ['Videospiel', 'Action-Adventure'],
              });
            }
          }

          // English Wikipedia fallback if German not found
          const wikiEnRes = await fetch(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanWikiTitle)}`,
            {
              headers: { 'User-Agent': 'OmniTrack/1.0 (info@omnitrack.local)' },
              signal: AbortSignal.timeout(3000),
            }
          );
          if (wikiEnRes.ok) {
            const wikiEnData = await wikiEnRes.json();
            if (wikiEnData.extract && wikiEnData.type === 'standard' && wikiEnData.extract.length > 40) {
              return NextResponse.json({
                success: true,
                source: 'wikipedia_en',
                summary: wikiEnData.extract.trim(),
                genres: ['Videospiel'],
              });
            }
          }
        } catch (e) {
          // Wiki timeout
        }
      }

      return NextResponse.json({ success: false, error: 'Keine Spieledetails gefunden' }, { status: 404 });
    }

    // ==========================================
    // 2. ANIME ENRICHMENT
    // ==========================================
    if (type === 'anime') {
      let anilistMediaId: number | undefined = undefined;
      if (externalId.startsWith('anilist:')) {
        const parsed = parseInt(externalId.replace('anilist:', ''), 10);
        if (!isNaN(parsed) && parsed > 0) anilistMediaId = parsed;
      }

      // Query AniList GraphQL
      const gqlQuery = anilistMediaId
        ? `
          query ($id: Int) {
            Media(id: $id, type: ANIME) {
              id
              title { english romaji native }
              description(asHtml: false)
              averageScore
              meanScore
              popularity
              genres
              episodes
              studios(isMain: true) { nodes { name } }
            }
          }
        `
        : `
          query ($search: String) {
            Media(search: $search, type: ANIME, sort: POPULARITY_DESC) {
              id
              title { english romaji native }
              description(asHtml: false)
              averageScore
              meanScore
              popularity
              genres
              episodes
              studios(isMain: true) { nodes { name } }
            }
          }
        `;

      try {
        const aniRes = await fetch('https://graphql.anilist.co', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            query: gqlQuery,
            variables: anilistMediaId ? { id: anilistMediaId } : { search: title },
          }),
          signal: AbortSignal.timeout(4000),
        });

        if (aniRes.ok) {
          const json = await aniRes.json();
          const media = json?.data?.Media;
          if (media) {
            const rawDesc = media.description || '';
            const summary = cleanHtmlText(rawDesc);
            const averageScore = media.averageScore || media.meanScore || undefined;
            const popularity = media.popularity || undefined;
            const genres: string[] = media.genres || ['Anime'];
            const creator = media.studios?.nodes?.[0]?.name || undefined;
            const totalUnits = media.episodes || undefined;

            // Fetch MyAnimeList score via Jikan for critics score
            let malScore: number | undefined = undefined;
            try {
              const jikanRes = await fetch(
                `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(media.title?.romaji || title)}&limit=1`,
                { signal: AbortSignal.timeout(2500) }
              );
              if (jikanRes.ok) {
                const jikanData = await jikanRes.json();
                const jikanAnime = jikanData?.data?.[0];
                if (jikanAnime?.score && typeof jikanAnime.score === 'number') {
                  malScore = jikanAnime.score;
                }
              }
            } catch {
              // Jikan optional fallback
            }

            return NextResponse.json({
              success: true,
              source: 'anilist',
              summary: summary || undefined,
              communityRating: averageScore, // 0 - 100 AniList percentage score
              communityRatingsCount: popularity,
              metacritic: malScore ? Math.round(malScore * 10) : undefined,
              criticsScore: malScore ? `${malScore.toFixed(2)} / 10` : undefined,
              criticsLabel: malScore ? 'MyAnimeList' : undefined,
              genres,
              creator,
              totalUnits,
              externalId: `anilist:${media.id}`,
            });
          }
        }
      } catch (e) {
        // AniList failed
      }

      // Check curated anime catalog fallbacks
      const lower = title.toLowerCase();
      for (const [key, val] of Object.entries(KNOWN_ANIME_FALLBACKS)) {
        if (lower.includes(key)) {
          return NextResponse.json({
            success: true,
            source: 'curated_anime',
            summary: val.summary,
            communityRating: val.rating,
            communityRatingsCount: val.count,
            metacritic: Math.round(val.mal * 10),
            criticsScore: `${val.mal.toFixed(2)} / 10`,
            criticsLabel: 'MyAnimeList #1',
            genres: ['Fantasy', 'Abenteuer', 'Drama'],
          });
        }
      }

      return NextResponse.json({ success: false, error: 'Keine Anime-Details gefunden' }, { status: 404 });
    }

    // ==========================================
    // 3. BOOKS ENRICHMENT
    // ==========================================
    if (type === 'book') {
      const q = isbn ? `isbn:${isbn}` : title;
      try {
        const olRes = await fetch(
          `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&fields=key,ratings_average,ratings_count,number_of_pages_median,subject&limit=1`,
          { headers: { 'User-Agent': 'OmniTrack/1.0' }, signal: AbortSignal.timeout(3500) }
        );
        if (olRes.ok) {
          const data = await olRes.json();
          const doc = data.docs?.[0];
          if (doc) {
            return NextResponse.json({
              success: true,
              source: 'openlibrary',
              communityRating: doc.ratings_average ? Math.round(doc.ratings_average * 10) / 10 : undefined,
              communityRatingsCount: doc.ratings_count || undefined,
              totalUnits: doc.number_of_pages_median || undefined,
              genres: doc.subject ? doc.subject.slice(0, 4) : undefined,
            });
          }
        }
      } catch {
        // OpenLibrary error
      }
    }

    return NextResponse.json({ success: false, error: 'Nicht unterstützt' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in /api/enrich:', error);
    return NextResponse.json({ error: error.message || 'Interner Fehler' }, { status: 500 });
  }
}
