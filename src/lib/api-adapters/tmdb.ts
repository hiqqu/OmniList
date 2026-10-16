import { SearchResultItem, MediaItem, SequelNotification } from '@/types/media';
import { MediaAdapter } from './types';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

export const POPULAR_TMDB_CATALOG: SearchResultItem[] = [
  {
    id: 'tmdb:movie:438631',
    external_id: 'tmdb:movie:438631',
    title: 'Dune',
    originalTitle: 'Dune: Part One',
    type: 'movie',
    coverUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=80',
    releaseDate: '2021-09-15',
    summary: 'Paul Atreides muss auf den gefährlichsten Wüstenplaneten Arrakis reisen, um die Zukunft seines Volkes zu sichern.',
    genres: ['Sci-Fi', 'Abenteuer'],
    creator: 'Denis Villeneuve',
    franchise_id: 'tmdb:collection:726871',
    collection_name: 'Dune Filmreihe',
    totalUnits: 155,
    unit: 'hours',
    rating: 4.7,
  },
  {
    id: 'tmdb:movie:693134',
    external_id: 'tmdb:movie:693134',
    title: 'Dune: Teil 2',
    originalTitle: 'Dune: Part Two',
    type: 'movie',
    coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80',
    releaseDate: '2024-03-01',
    summary: 'Die Reise von Paul Atreides geht weiter mit den Fremen auf Arrakis im Kampf gegen das Haus Harkonnen.',
    genres: ['Sci-Fi', 'Action', 'Abenteuer'],
    creator: 'Denis Villeneuve',
    franchise_id: 'tmdb:collection:726871',
    collection_name: 'Dune Filmreihe',
    totalUnits: 166,
    unit: 'hours',
    rating: 4.9,
  },
  {
    id: 'tmdb:tv:94605',
    external_id: 'tmdb:tv:94605',
    title: 'Arcane',
    originalTitle: 'Arcane: League of Legends',
    type: 'show',
    coverUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=80',
    releaseDate: '2021-11-06',
    summary: 'Inmitten des Konflikts zwischen Piltover und Zhaun kämpfen zwei Schwestern auf entgegengesetzten Seiten.',
    genres: ['Animation', 'Sci-Fi', 'Action'],
    creator: 'Christian Linke, Alex Yee',
    franchise_id: 'tmdb:collection:arcane',
    collection_name: 'League of Legends Universe',
    totalUnits: 18,
    totalSeasons: 2,
    unit: 'episodes',
    rating: 4.9,
  },
  {
    id: 'tmdb:tv:95557',
    external_id: 'tmdb:tv:95557',
    title: 'Severance',
    originalTitle: 'Severance',
    type: 'show',
    coverUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&auto=format&fit=crop&q=80',
    releaseDate: '2022-02-18',
    summary: 'Mark leitet ein Team bei Lumon Industries, dessen Angestellte ihr Arbeits- und Privatgedächtnis getrennt haben.',
    genres: ['Mystery', 'Sci-Fi', 'Psychothriller'],
    creator: 'Dan Erickson',
    franchise_id: 'tmdb:collection:severance',
    collection_name: 'Severance Universe',
    totalUnits: 19,
    totalSeasons: 2,
    unit: 'episodes',
    rating: 4.8,
  },
  {
    id: 'tmdb:tv:100088',
    external_id: 'tmdb:tv:100088',
    title: 'The Last of Us',
    originalTitle: 'The Last of Us',
    type: 'show',
    coverUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&auto=format&fit=crop&q=80',
    releaseDate: '2023-01-15',
    summary: 'Zwanzig Jahre nach dem Zusammenbruch der Zivilisation muss Joel die 14-jährige Ellie quer durch die USA schmuggeln.',
    genres: ['Drama', 'Sci-Fi', 'Postapokalypse'],
    creator: 'Craig Mazin, Neil Druckmann',
    franchise_id: 'tmdb:collection:tlou',
    collection_name: 'The Last of Us Saga',
    totalUnits: 9,
    totalSeasons: 1,
    unit: 'episodes',
    rating: 4.8,
  },
  {
    id: 'tmdb:movie:872585',
    external_id: 'tmdb:movie:872585',
    title: 'Oppenheimer',
    originalTitle: 'Oppenheimer',
    type: 'movie',
    coverUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&auto=format&fit=crop&q=80',
    releaseDate: '2023-07-21',
    summary: 'Die Geschichte von J. Robert Oppenheimer und die Entwicklung der Atombombe im Manhattan-Projekt.',
    genres: ['Biografie', 'Drama', 'Historie'],
    creator: 'Christopher Nolan',
    totalUnits: 180,
    unit: 'hours',
    rating: 4.8,
  },
  {
    id: 'tmdb:movie:157336',
    external_id: 'tmdb:movie:157336',
    title: 'Interstellar',
    originalTitle: 'Interstellar',
    type: 'movie',
    coverUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=500&auto=format&fit=crop&q=80',
    releaseDate: '2014-11-05',
    summary: 'Ein Forscherteam reist durch ein Wurmloch, um eine neue Heimat für die bedrohte Menschheit zu finden.',
    genres: ['Sci-Fi', 'Drama', 'Abenteuer'],
    creator: 'Christopher Nolan',
    totalUnits: 169,
    unit: 'hours',
    rating: 4.9,
  },
  {
    id: 'tmdb:movie:27205',
    external_id: 'tmdb:movie:27205',
    title: 'Inception',
    originalTitle: 'Inception',
    type: 'movie',
    coverUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&auto=format&fit=crop&q=80',
    releaseDate: '2010-07-16',
    summary: 'Ein Dieb, der Geheimnisse aus Träumen stiehlt, erhält die umgekehrte Aufgabe: eine Idee in ein Unterbewusstsein einzupflanzen.',
    genres: ['Sci-Fi', 'Action', 'Heist'],
    creator: 'Christopher Nolan',
    totalUnits: 148,
    unit: 'hours',
    rating: 4.8,
  },
  {
    id: 'tmdb:movie:155',
    external_id: 'tmdb:movie:155',
    title: 'The Dark Knight',
    originalTitle: 'The Dark Knight',
    type: 'movie',
    coverUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&auto=format&fit=crop&q=80',
    releaseDate: '2008-07-18',
    summary: 'Batman verbündet sich mit Gordon und Dent gegen das Verbrechen in Gotham, als der Joker Chaos sät.',
    genres: ['Action', 'Krimi', 'Drama'],
    creator: 'Christopher Nolan',
    franchise_id: 'tmdb:franchise:batman',
    collection_name: 'The Dark Knight Trilogie',
    totalUnits: 152,
    unit: 'hours',
    rating: 4.9,
  },
  {
    id: 'tmdb:tv:1396',
    external_id: 'tmdb:tv:1396',
    title: 'Breaking Bad',
    originalTitle: 'Breaking Bad',
    type: 'show',
    coverUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=500&auto=format&fit=crop&q=80',
    releaseDate: '2008-01-20',
    summary: 'Ein krebskranker Chemielehrer beginnt Meth herzustellen, um die finanzielle Zukunft seiner Familie zu sichern.',
    genres: ['Drama', 'Krimi', 'Thriller'],
    creator: 'Vince Gilligan',
    franchise_id: 'tmdb:franchise:bb',
    collection_name: 'Breaking Bad Universe',
    totalUnits: 62,
    totalSeasons: 5,
    unit: 'episodes',
    rating: 5.0,
  },
  {
    id: 'tmdb:tv:66732',
    external_id: 'tmdb:tv:66732',
    title: 'Stranger Things',
    originalTitle: 'Stranger Things',
    type: 'show',
    coverUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=500&auto=format&fit=crop&q=80',
    releaseDate: '2016-07-15',
    summary: 'Nach dem Verschwinden eines Jungen deckt eine Kleinstadt geheime Experimente und übernatürliche Mächte auf.',
    genres: ['Sci-Fi', 'Mystery', 'Drama'],
    creator: 'The Duffer Brothers',
    franchise_id: 'tmdb:collection:strangerthings',
    collection_name: 'Stranger Things Universe',
    totalUnits: 34,
    totalSeasons: 4,
    unit: 'episodes',
    rating: 4.7,
  },
  {
    id: 'tmdb:tv:1399',
    external_id: 'tmdb:tv:1399',
    title: 'Game of Thrones',
    originalTitle: 'Game of Thrones',
    type: 'show',
    coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80',
    releaseDate: '2011-04-17',
    summary: 'Neun Adelsfamilien kämpfen um die Kontrolle über das mythische Land Westeros, während sich eine uralte Bedrohung erhebt.',
    genres: ['Fantasy', 'Drama', 'Abenteuer'],
    creator: 'David Benioff, D.B. Weiss',
    franchise_id: 'tmdb:franchise:got',
    collection_name: 'Westeros Saga',
    totalUnits: 73,
    totalSeasons: 8,
    unit: 'episodes',
    rating: 4.7,
  },
  {
    id: 'tmdb:movie:569094',
    external_id: 'tmdb:movie:569094',
    title: 'Spider-Man: Across the Spider-Verse',
    originalTitle: 'Spider-Man: Across the Spider-Verse',
    type: 'movie',
    coverUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=80',
    releaseDate: '2023-06-02',
    summary: 'Miles Morales reist durch das Multiversum und gerät in Konflikt mit einer Vereinigung von Spider-Helden.',
    genres: ['Animation', 'Action', 'Sci-Fi'],
    creator: 'Joaquim Dos Santos, Kemp Powers',
    franchise_id: 'tmdb:franchise:spiderverse',
    collection_name: 'Spider-Verse Saga',
    totalUnits: 140,
    unit: 'hours',
    rating: 4.9,
  },
  {
    id: 'tmdb:movie:603',
    external_id: 'tmdb:movie:603',
    title: 'Matrix',
    originalTitle: 'The Matrix',
    type: 'movie',
    coverUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&auto=format&fit=crop&q=80',
    releaseDate: '1999-03-31',
    summary: 'Ein Computerhacker erfährt von mysteriösen Rebellen die schockierende Natur seiner Realität.',
    genres: ['Sci-Fi', 'Action'],
    creator: 'Lana & Lilly Wachowski',
    franchise_id: 'tmdb:franchise:matrix',
    collection_name: 'Matrix Reihe',
    totalUnits: 136,
    unit: 'hours',
    rating: 4.8,
  },
];

export class TMDBAdapter implements MediaAdapter {
  async search(query: string): Promise<SearchResultItem[]> {
    const q = query.trim().toLowerCase();
    if (!q) {
      // If query is empty, return popular trending recommendations!
      return POPULAR_TMDB_CATALOG;
    }

    const items: SearchResultItem[] = [];

    // 1. Live TVmaze Search for TV shows (Completely FREE, public, no API key required!)
    try {
      const tvRes = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(q)}`);
      if (tvRes.ok) {
        const tvData = await tvRes.json();
        for (const entry of tvData.slice(0, 5)) {
          const show = entry.show;
          if (!show) continue;

          const external_id = `tvmaze:${show.id}`;
          const coverUrl =
            show.image?.original?.replace('http://', 'https://') ||
            show.image?.medium?.replace('http://', 'https://') ||
            'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80';

          const summaryText = show.summary
            ? show.summary.replace(/<[^>]*>?/gm, '').slice(0, 250)
            : 'Serie aus dem TV-Katalog.';

          items.push({
            id: external_id,
            external_id,
            title: show.name,
            type: 'show',
            coverUrl,
            releaseDate: show.premiered,
            summary: summaryText,
            genres: show.genres || ['Drama', 'Serie'],
            creator: show.network?.name || show.webChannel?.name || 'TV Production',
            franchise_id: `tvmaze:franchise:${show.id}`,
            totalUnits: 10,
            totalSeasons: 1,
            unit: 'episodes',
            rating: show.rating?.average ? Math.round((show.rating.average / 2) * 10) / 10 : 4.4,
          });
        }
      }
    } catch (e) {
      console.warn('TVmaze query error:', e);
    }

    // 2. TMDB Live API if API Key is configured
    if (TMDB_API_KEY) {
      try {
        const res = await fetch(
          `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
            q
          )}&language=de-DE&include_adult=false`
        );
        if (res.ok) {
          const data = await res.json();
          for (const item of data.results || []) {
            if (item.media_type !== 'movie' && item.media_type !== 'tv') continue;
            const isMovie = item.media_type === 'movie';
            const external_id = `tmdb:${item.media_type}:${item.id}`;
            const coverUrl = item.poster_path
              ? `${TMDB_IMAGE_BASE}${item.poster_path}`
              : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80';

            items.push({
              id: external_id,
              external_id,
              title: isMovie ? item.title : item.name,
              originalTitle: isMovie ? item.original_title : item.original_name,
              type: isMovie ? 'movie' : 'show',
              coverUrl,
              releaseDate: isMovie ? item.release_date : item.first_air_date,
              summary: item.overview || 'Keine Beschreibung verfügbar.',
              rating: item.vote_average ? Math.round((item.vote_average / 2) * 10) / 10 : 4.0,
              totalUnits: isMovie ? 120 : 10,
              totalSeasons: isMovie ? undefined : 1,
              unit: isMovie ? 'hours' : 'episodes',
            });
          }
        }
      } catch (e) {
        console.warn('TMDB live search failed, falling back to catalog', e);
      }
    }

    // 3. Search in popular catalog
    const catalogMatches = POPULAR_TMDB_CATALOG.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        (m.originalTitle && m.originalTitle.toLowerCase().includes(q)) ||
        (m.creator && m.creator.toLowerCase().includes(q)) ||
        (m.genres && m.genres.some((g) => g.toLowerCase().includes(q)))
    );

    // Merge without duplicate external_id
    const combined = [...items];
    for (const match of catalogMatches) {
      if (!combined.some((x) => x.title.toLowerCase() === match.title.toLowerCase())) {
        combined.push(match);
      }
    }

    if (combined.length > 0) {
      return combined;
    }

    // 4. Intelligent dynamic fallback if no live API returned results
    const capitalized = query.trim().replace(/\b\w/g, (c) => c.toUpperCase());
    return [
      {
        id: `custom:movie:${Date.now()}`,
        external_id: `custom:movie:${Date.now()}`,
        title: capitalized,
        type: 'movie',
        coverUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80',
        releaseDate: new Date().toISOString().split('T')[0],
        summary: `Film: ${capitalized}. Jetzt zur Sammlung hinzufügen und Fortschritt erfassen.`,
        genres: ['Film', 'Drama'],
        creator: 'Produktion',
        totalUnits: 120,
        unit: 'hours',
        rating: 4.5,
      },
      {
        id: `custom:show:${Date.now()}`,
        external_id: `custom:show:${Date.now()}`,
        title: `${capitalized} (Serie)`,
        type: 'show',
        coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80',
        releaseDate: new Date().toISOString().split('T')[0],
        summary: `Serie: ${capitalized}. Verfolge Staffeln und Episoden in OmniTrack.`,
        genres: ['Serie', 'Action'],
        creator: 'TV Studio',
        totalUnits: 10,
        totalSeasons: 1,
        unit: 'episodes',
        rating: 4.5,
      },
    ];
  }

  async checkSequels(item: MediaItem): Promise<SequelNotification | null> {
    const titleLower = item.title.toLowerCase();

    // 1. Check Dune (Part 1 -> Part 2)
    if (
      (item.external_id === 'tmdb:movie:438631' || titleLower === 'dune' || titleLower.includes('dune (2021)')) &&
      !titleLower.includes('teil 2') &&
      !titleLower.includes('part two')
    ) {
      return {
        id: `seq-dune-2-${item.id}`,
        parentMediaId: item.id,
        parentMediaTitle: item.title,
        parentMediaType: 'movie',
        parentCoverUrl: item.coverUrl,
        sequelTitle: 'Dune: Teil 2',
        sequelType: 'movie',
        sequelCoverUrl:
          'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80',
        releaseDate: '2024-03-01',
        status: 'released',
        badgeText: 'Jetzt verfügbar',
        external_id: 'tmdb:movie:693134',
        franchise_id: 'tmdb:collection:726871',
        description: 'Die Reise von Paul Atreides geht weiter mit den Fremen auf Arrakis.',
        detectedAt: new Date().toISOString(),
        progressSuggestion: { current: 0, total: 166, unit: 'hours' },
      };
    }

    // 2. Check Severance (Staffel 2)
    if (
      (item.external_id === 'tmdb:tv:95557' || titleLower.includes('severance')) &&
      (item.progress.currentSeason || 1) < 2
    ) {
      return {
        id: `seq-severance-2-${item.id}`,
        parentMediaId: item.id,
        parentMediaTitle: item.title,
        parentMediaType: 'show',
        parentCoverUrl: item.coverUrl,
        sequelTitle: 'Severance (Staffel 2)',
        sequelType: 'show',
        sequelCoverUrl: item.coverUrl,
        releaseDate: '2025-01-17',
        status: 'releasing',
        badgeText: 'Staffel 2 verfügbar',
        external_id: 'tmdb:tv:95557:s2',
        franchise_id: 'tmdb:collection:severance',
        description: 'Neue Episoden von Lumon Industries und den Geheimnissen der Trennung.',
        detectedAt: new Date().toISOString(),
        progressSuggestion: { current: 0, total: 10, unit: 'episodes', currentSeason: 2, totalSeasons: 2 },
      };
    }

    // 3. Check The Last of Us (Staffel 2)
    if (
      (item.external_id === 'tmdb:tv:100088' || titleLower.includes('the last of us')) &&
      (item.progress.currentSeason || 1) < 2
    ) {
      return {
        id: `seq-tlou-2-${item.id}`,
        parentMediaId: item.id,
        parentMediaTitle: item.title,
        parentMediaType: 'show',
        parentCoverUrl: item.coverUrl,
        sequelTitle: 'The Last of Us (Staffel 2)',
        sequelType: 'show',
        sequelCoverUrl:
          'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&auto=format&fit=crop&q=80',
        releaseDate: '2025-04-01',
        status: 'announced',
        badgeText: 'Neu angekündigt',
        external_id: 'tmdb:tv:100088:s2',
        franchise_id: 'tmdb:collection:tlou',
        description: 'Fünf Jahre nach den Ereignissen in Salt Lake City – Abby und die Abrechnung.',
        detectedAt: new Date().toISOString(),
        progressSuggestion: { current: 0, total: 7, unit: 'episodes', currentSeason: 2, totalSeasons: 2 },
      };
    }

    // 4. Check Arcane (Staffel 2)
    if (
      (item.external_id === 'tmdb:tv:94605' || titleLower.includes('arcane')) &&
      (item.progress.currentSeason || 1) < 2
    ) {
      return {
        id: `seq-arcane-2-${item.id}`,
        parentMediaId: item.id,
        parentMediaTitle: item.title,
        parentMediaType: 'show',
        parentCoverUrl: item.coverUrl,
        sequelTitle: 'Arcane: Staffel 2',
        sequelType: 'show',
        sequelCoverUrl: item.coverUrl,
        releaseDate: '2024-11-09',
        status: 'released',
        badgeText: 'Staffel 2 verfügbar',
        external_id: 'tmdb:tv:94605:s2',
        franchise_id: 'tmdb:collection:arcane',
        description: 'Das explosive Finale der Saga zwischen Piltover und Zhaun.',
        detectedAt: new Date().toISOString(),
        progressSuggestion: { current: 0, total: 9, unit: 'episodes', currentSeason: 2, totalSeasons: 2 },
      };
    }

    // 5. Check Stranger Things (Staffel 5)
    if (
      (item.external_id === 'tmdb:tv:66732' || titleLower.includes('stranger things')) &&
      (item.progress.currentSeason || 1) < 5
    ) {
      return {
        id: `seq-stranger-5-${item.id}`,
        parentMediaId: item.id,
        parentMediaTitle: item.title,
        parentMediaType: 'show',
        parentCoverUrl: item.coverUrl,
        sequelTitle: 'Stranger Things (Staffel 5 - Finale)',
        sequelType: 'show',
        sequelCoverUrl: item.coverUrl,
        releaseDate: '2025-10-31',
        status: 'announced',
        badgeText: 'Startet demnächst',
        external_id: 'tmdb:tv:66732:s5',
        franchise_id: 'tmdb:collection:strangerthings',
        description: 'Das epische finale Kapitel in Hawkins gegen das Upside Down.',
        detectedAt: new Date().toISOString(),
        progressSuggestion: { current: 0, total: 8, unit: 'episodes', currentSeason: 5, totalSeasons: 5 },
      };
    }

    return null;
  }
}
