import { SearchResultItem, MediaItem, SequelNotification } from '@/types/media';
import { MediaAdapter } from './types';

const ANILIST_URL = 'https://graphql.anilist.co';

function createAnimeSvgCover(title: string): string {
  const safeTitle = title.replace(/[<>&"]/g, '').slice(0, 26);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900">
    <defs>
      <linearGradient id="animeBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0c4a6e" />
        <stop offset="50%" stop-color="#0284c7" />
        <stop offset="100%" stop-color="#0f172a" />
      </linearGradient>
    </defs>
    <rect width="600" height="900" fill="url(#animeBg)"/>
    <rect x="30" y="30" width="540" height="840" rx="20" fill="none" stroke="#38bdf8" stroke-opacity="0.4" stroke-width="2"/>
    <rect x="80" y="80" width="90" height="32" rx="8" fill="#38bdf8" fill-opacity="0.25"/>
    <text x="125" y="102" fill="#7dd3fc" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" text-anchor="middle">ANIME</text>
    <text x="300" y="450" fill="#ffffff" font-family="system-ui, sans-serif" font-size="32" font-weight="bold" text-anchor="middle">${safeTitle}</text>
    <text x="300" y="500" fill="#bae6fd" font-family="system-ui, sans-serif" font-size="18" text-anchor="middle">Animation Studio</text>
    <text x="300" y="780" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="16" text-anchor="middle">OmniList Library</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const MOCK_ANILIST_CATALOG: SearchResultItem[] = [
  {
    id: 'anilist:154587',
    external_id: 'anilist:154587',
    title: "Frieren: Beyond Journey's End",
    originalTitle: 'Sousou no Frieren',
    type: 'anime',
    coverUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-qQTzQnEJJ3oB.jpg',
    releaseDate: '2023-09-29',
    summary: 'Die Elfenmagierin Frieren überlebt ihre menschlichen Gefährten und begibt sich auf eine emotionale Reise, um den wahren Wert von Zeit und Bindungen zu verstehen.',
    genres: ['Fantasy', 'Abenteuer', 'Drama'],
    creator: 'Madhouse',
    franchise_id: 'anilist:franchise:frieren',
    collection_name: 'Frieren Saga',
    totalUnits: 28,
    unit: 'episodes',
    rating: 4.9,
  },
  {
    id: 'anilist:113415',
    external_id: 'anilist:113415',
    title: 'Jujutsu Kaisen',
    originalTitle: 'Jujutsu Kaisen',
    type: 'anime',
    coverUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-bbBWj4pEFseh.jpg',
    releaseDate: '2020-10-03',
    summary: 'Yuji Itadori schluckt einen verfluchten Talisman und wird Teil der Welt der Flüche und Jujutsu-Zauberer.',
    genres: ['Action', 'Fantasy', 'Supernatural'],
    creator: 'MAPPA',
    franchise_id: 'anilist:franchise:jjk',
    collection_name: 'Jujutsu Kaisen Universe',
    totalUnits: 24,
    unit: 'episodes',
    rating: 4.7,
  },
  {
    id: 'anilist:151807',
    external_id: 'anilist:151807',
    title: 'Solo Leveling',
    originalTitle: 'Ore dake Level Up na Ken',
    type: 'anime',
    coverUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx151807-m1agTGhyCVB0.jpg',
    releaseDate: '2024-01-07',
    summary: 'Der schwächste Jäger aller Zeiten, Sung Jin-Woo, erhält nach einem tödlichen Dungeon eine geheime Quest, die nur er sehen und leveln kann.',
    genres: ['Action', 'Fantasy', 'Abenteuer'],
    creator: 'A-1 Pictures',
    franchise_id: 'anilist:franchise:sololeveling',
    collection_name: 'Solo Leveling',
    totalUnits: 12,
    unit: 'episodes',
    rating: 4.6,
  },
  {
    id: 'anilist:101922',
    external_id: 'anilist:101922',
    title: 'Demon Slayer: Kimetsu no Yaiba',
    originalTitle: 'Kimetsu no Yaiba',
    type: 'anime',
    coverUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101922-PEn1CTDYxZao.png',
    releaseDate: '2019-04-06',
    summary: 'Tanjiro Kamado will seine in einen Dämon verwandelte Schwester Nezuko retten und schließt sich dem Demon Slayer Corps an.',
    genres: ['Action', 'Fantasy', 'Historie'],
    creator: 'ufotable',
    franchise_id: 'anilist:franchise:demonslayer',
    collection_name: 'Demon Slayer Universe',
    totalUnits: 26,
    unit: 'episodes',
    rating: 4.8,
  },
  {
    id: 'anilist:16498',
    external_id: 'anilist:16498',
    title: 'Attack on Titan',
    originalTitle: 'Shingeki no Kyojin',
    type: 'anime',
    coverUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-73IhOXpJZiDY.png',
    releaseDate: '2013-04-07',
    summary: 'Nachdem die Mauern seiner Heimatstadt von kolossalen Titanen durchbrochen wurden, schwört Eren Jaeger, jeden einzelnen Titanen auszulöschen.',
    genres: ['Action', 'Drama', 'Mystery', 'Fantasy'],
    creator: 'Wit Studio / MAPPA',
    franchise_id: 'anilist:franchise:aot',
    collection_name: 'Attack on Titan',
    totalUnits: 25,
    unit: 'episodes',
    rating: 4.9,
  },
  {
    id: 'anilist:21',
    external_id: 'anilist:21',
    title: 'One Piece',
    originalTitle: 'ONE PIECE',
    type: 'anime',
    coverUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-ELSYx3yMPcKM.jpg',
    releaseDate: '1999-10-20',
    summary: 'Monkey D. Ruffy und seine Strohhut-Bande begeben sich auf die Grand Line auf der Suche nach dem legendären Schatz One Piece.',
    genres: ['Action', 'Abenteuer', 'Comedy'],
    creator: 'Toei Animation',
    franchise_id: 'anilist:franchise:op',
    collection_name: 'One Piece',
    totalUnits: 1100,
    unit: 'episodes',
    rating: 4.9,
  },
];

export class AniListAdapter implements MediaAdapter {
  async search(query: string): Promise<SearchResultItem[]> {
    const q = query.trim().toLowerCase();
    if (!q) return MOCK_ANILIST_CATALOG;

    try {
      const gqlQuery = `
        query ($search: String) {
          Page(page: 1, perPage: 8) {
            media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
              id
              title {
                romaji
                english
                native
              }
              coverImage {
                extraLarge
                large
              }
              startDate {
                year
                month
                day
              }
              description(asHtml: false)
              genres
              episodes
              status
              averageScore
              studios(isMain: true) {
                nodes {
                  name
                }
              }
            }
          }
        }
      `;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(ANILIST_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          query: gqlQuery,
          variables: { search: q },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        const mediaList = json?.data?.Page?.media || [];

        if (mediaList.length > 0) {
          return mediaList.map((m: any) => {
            const external_id = `anilist:${m.id}`;
            const title = m.title?.english || m.title?.romaji || 'Unbekannter Anime';
            const releaseDate = m.startDate?.year
              ? `${m.startDate.year}-${String(m.startDate.month || 1).padStart(2, '0')}-${String(
                  m.startDate.day || 1
                ).padStart(2, '0')}`
              : undefined;

            return {
              id: external_id,
              external_id,
              title,
              originalTitle: m.title?.romaji || m.title?.native,
              type: 'anime' as const,
              coverUrl:
                m.coverImage?.extraLarge ||
                m.coverImage?.large ||
                createAnimeSvgCover(title),
              releaseDate,
              summary: m.description ? m.description.replace(/<[^>]*>?/gm, '').slice(0, 300) : 'Keine Beschreibung.',
              genres: m.genres || ['Anime'],
              creator: m.studios?.nodes?.[0]?.name || 'Anime Studio',
              franchise_id: `anilist:franchise:${m.id}`,
              totalUnits: m.episodes || 12,
              unit: 'episodes' as const,
              rating: m.averageScore ? Math.round((m.averageScore / 20) * 10) / 10 : 4.5,
            };
          });
        }
      }
    } catch (e) {
      console.warn('AniList live search failed, falling back to mock catalog', e);
    }

    // Mock catalog fallback
    return MOCK_ANILIST_CATALOG.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        (m.originalTitle && m.originalTitle.toLowerCase().includes(q)) ||
        (m.genres && m.genres.some((g) => g.toLowerCase().includes(q)))
    );
  }

  async checkSequels(item: MediaItem): Promise<SequelNotification | null> {
    const titleLower = item.title.toLowerCase();

    // 1. Frieren Staffel 2 – Neu angekündigt (Required Mock case in user prompt!)
    if (
      (item.external_id === 'anilist:154587' || titleLower.includes('frieren')) &&
      !titleLower.includes('staffel 2') &&
      !titleLower.includes('season 2')
    ) {
      return {
        id: `seq-frieren-s2-${item.id}`,
        parentMediaId: item.id,
        parentMediaTitle: item.title,
        parentMediaType: 'anime',
        parentCoverUrl: item.coverUrl,
        sequelTitle: "Frieren: Beyond Journey's End (Staffel 2)",
        sequelType: 'anime',
        sequelCoverUrl:
          'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx182255-butzrqd4I0aC.jpg',
        releaseDate: '2025-10-01',
        status: 'announced',
        badgeText: 'Neu angekündigt',
        external_id: 'anilist:frieren-s2',
        franchise_id: 'anilist:franchise:frieren',
        description: 'Offiziell bestätigt von Studio Madhouse: Die Fortsetzung der Reise von Frieren und Fern.',
        detectedAt: new Date().toISOString(),
        progressSuggestion: { current: 0, total: 24, unit: 'episodes' },
      };
    }

    // 2. Solo Leveling Season 2
    if (
      (item.external_id === 'anilist:151807' || titleLower.includes('solo leveling')) &&
      !titleLower.includes('staffel 2') &&
      !titleLower.includes('season 2') &&
      !titleLower.includes('arise')
    ) {
      return {
        id: `seq-sololeveling-s2-${item.id}`,
        parentMediaId: item.id,
        parentMediaTitle: item.title,
        parentMediaType: 'anime',
        parentCoverUrl: item.coverUrl,
        sequelTitle: 'Solo Leveling: Arise from the Shadow (Staffel 2)',
        sequelType: 'anime',
        sequelCoverUrl:
          'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx176274-P9a7sFzZf5cQ.jpg',
        releaseDate: '2025-01-05',
        status: 'releasing',
        badgeText: 'Staffel 2 verfügbar',
        external_id: 'anilist:sololeveling-s2',
        franchise_id: 'anilist:franchise:sololeveling',
        description: 'Sung Jin-Woo setzt seinen Aufstieg als Schattenmonarch in den Tiefen des roten Gates fort.',
        detectedAt: new Date().toISOString(),
        progressSuggestion: { current: 0, total: 13, unit: 'episodes' },
      };
    }

    // 3. Jujutsu Kaisen Culling Game Arc
    if (
      (item.external_id === 'anilist:113415' || titleLower.includes('jujutsu kaisen')) &&
      !titleLower.includes('culling') &&
      !titleLower.includes('staffel 3')
    ) {
      return {
        id: `seq-jjk-s3-${item.id}`,
        parentMediaId: item.id,
        parentMediaTitle: item.title,
        parentMediaType: 'anime',
        parentCoverUrl: item.coverUrl,
        sequelTitle: 'Jujutsu Kaisen: Culling Game Arc (Staffel 3)',
        sequelType: 'anime',
        sequelCoverUrl: item.coverUrl,
        releaseDate: '2025-12-01',
        status: 'announced',
        badgeText: 'Neu angekündigt',
        external_id: 'anilist:jjk-culling-game',
        franchise_id: 'anilist:franchise:jjk',
        description: 'Der Culling Game Arc wurde von Studio MAPPA offiziell in Produktion gegeben.',
        detectedAt: new Date().toISOString(),
        progressSuggestion: { current: 0, total: 24, unit: 'episodes' },
      };
    }

    // Live AniList GraphQL relations check if item has an anilist numeric ID
    if (item.external_id.startsWith('anilist:') && !isNaN(Number(item.external_id.replace('anilist:', '')))) {
      try {
        const numericId = parseInt(item.external_id.replace('anilist:', ''), 10);
        const relQuery = `
          query ($id: Int) {
            Media(id: $id, type: ANIME) {
              id
              title {
                romaji
                english
              }
              relations {
                edges {
                  relationType
                  node {
                    id
                    title {
                      romaji
                      english
                    }
                    coverImage {
                      large
                    }
                    status
                    episodes
                    startDate {
                      year
                      month
                      day
                    }
                  }
                }
              }
            }
          }
        `;

        const res = await fetch(ANILIST_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: relQuery, variables: { id: numericId } }),
        });

        if (res.ok) {
          const json = await res.json();
          const edges = json?.data?.Media?.relations?.edges || [];

          for (const edge of edges) {
            if (edge.relationType === 'SEQUEL' && edge.node) {
              const node = edge.node;
              const sequelTitle = node.title?.english || node.title?.romaji || 'Anime Sequel';
              let badgeText = 'Neu angekündigt';
              let status: 'releasing' | 'announced' | 'released' = 'announced';

              if (node.status === 'RELEASING') {
                badgeText = 'Jetzt verfügbar';
                status = 'releasing';
              } else if (node.status === 'FINISHED') {
                badgeText = 'Bereits erschienen';
                status = 'released';
              } else if (node.startDate?.year) {
                badgeText = `Startet am: ${node.startDate.year}-${String(node.startDate.month || 1).padStart(
                  2,
                  '0'
                )}`;
              }

              const releaseDate = node.startDate?.year
                ? `${node.startDate.year}-${String(node.startDate.month || 1).padStart(2, '0')}-${String(
                    node.startDate.day || 1
                  ).padStart(2, '0')}`
                : undefined;

              return {
                id: `seq-live-anilist-${node.id}`,
                parentMediaId: item.id,
                parentMediaTitle: item.title,
                parentMediaType: 'anime',
                parentCoverUrl: item.coverUrl,
                sequelTitle,
                sequelType: 'anime',
                sequelCoverUrl: node.coverImage?.large || item.coverUrl,
                releaseDate,
                status,
                badgeText,
                external_id: `anilist:${node.id}`,
                franchise_id: item.franchise_id,
                description: `Offizielle Fortsetzung via AniList (${node.status})`,
                detectedAt: new Date().toISOString(),
                progressSuggestion: { current: 0, total: node.episodes || 12, unit: 'episodes' },
              };
            }
          }
        }
      } catch (err) {
        console.warn('AniList live sequel check failed', err);
      }
    }

    return null;
  }
}
