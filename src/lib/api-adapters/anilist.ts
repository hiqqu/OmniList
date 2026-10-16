import { SearchResultItem, MediaItem, SequelNotification } from '@/types/media';
import { MediaAdapter } from './types';

const ANILIST_URL = 'https://graphql.anilist.co';

const MOCK_ANILIST_CATALOG: SearchResultItem[] = [
  {
    id: 'anilist:154587',
    external_id: 'anilist:154587',
    title: "Frieren: Beyond Journey's End",
    originalTitle: 'Sousou no Frieren',
    type: 'anime',
    coverUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=500&auto=format&fit=crop&q=80',
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
    coverUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=500&auto=format&fit=crop&q=80',
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
    coverUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80',
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
    coverUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=80',
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
    coverUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=500&auto=format&fit=crop&q=80',
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
                'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=500&auto=format&fit=crop&q=80',
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
          'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=500&auto=format&fit=crop&q=80',
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
          'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80',
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
