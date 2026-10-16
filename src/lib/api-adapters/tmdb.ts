import { SearchResultItem, MediaItem, SequelNotification } from '@/types/media';
import { MediaAdapter } from './types';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const OMDB_KEY = 'trilogy';

function createSvgPlaceholder(title: string, type: string): string {
  const safeTitle = title.replace(/[<>&"]/g, '');
  const color = type === 'show' ? '#f59e0b' : '#ef4444';
  const label = type === 'show' ? 'SERIE' : 'FILM';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f172a" />
        <stop offset="100%" stop-color="#020617" />
      </linearGradient>
    </defs>
    <rect width="600" height="900" fill="url(#bg)"/>
    <rect x="40" y="40" width="520" height="820" rx="24" fill="none" stroke="${color}" stroke-opacity="0.3" stroke-width="3"/>
    <rect x="70" y="80" width="80" height="32" rx="8" fill="${color}" fill-opacity="0.2"/>
    <text x="110" y="102" fill="${color}" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" text-anchor="middle">${label}</text>
    <text x="300" y="450" fill="#ffffff" font-family="system-ui, sans-serif" font-size="32" font-weight="bold" text-anchor="middle">${safeTitle.slice(0, 24)}</text>
    <text x="300" y="500" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="18" text-anchor="middle">OmniTrack Library</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const POPULAR_TMDB_CATALOG: SearchResultItem[] = [
  {
    id: 'imdb:tt0145487',
    external_id: 'imdb:tt0145487',
    title: 'Spider-Man',
    originalTitle: 'Spider-Man (2002)',
    type: 'movie',
    coverUrl: 'https://m.media-amazon.com/images/M/MV5BZWM0OWVmNTEtNWVkOS00MzgyLTkyMzgtMmE2ZTZiNjY4MmFiXkEyXkFqcGc@._V1_QL75_UY562_CR0,0,380,562_.jpg',
    releaseDate: '2002-05-03',
    summary: 'Ein schüchterner Teenager wird von einer genetisch veränderten Spinne gebissen und nutzt seine neuen Superkräfte, um als Maskenheld gegen das Verbrechen zu kämpfen.',
    genres: ['Action', 'Sci-Fi'],
    creator: 'Sam Raimi (mit Tobey Maguire)',
    franchise_id: 'franchise:spiderman-raimi',
    collection_name: 'Spider-Man Raimi Trilogie',
    totalUnits: 121,
    unit: 'minutes',
    rating: 4.8,
  },
  {
    id: 'imdb:tt0316654',
    external_id: 'imdb:tt0316654',
    title: 'Spider-Man 2',
    originalTitle: 'Spider-Man 2 (2004)',
    type: 'movie',
    coverUrl: 'https://m.media-amazon.com/images/M/MV5BNGQ0YTQyYTgtNWI2YS00NTE2LWJmNDEtM2E1NjlmY2VkY2E4XkEyXkFqcGc@._V1_QL75_UY562_CR0,0,380,562_.jpg',
    releaseDate: '2004-06-30',
    summary: 'Peter Parker hadert mit seinem Doppelleben als Superheld und Student, während Dr. Otto Octavius als Doc Ock New York bedroht.',
    genres: ['Action', 'Sci-Fi'],
    creator: 'Sam Raimi',
    franchise_id: 'franchise:spiderman-raimi',
    collection_name: 'Spider-Man Raimi Trilogie',
    totalUnits: 127,
    unit: 'minutes',
    rating: 4.9,
  },
  {
    id: 'imdb:tt10872600',
    external_id: 'imdb:tt10872600',
    title: 'Spider-Man: No Way Home',
    originalTitle: 'Spider-Man: No Way Home',
    type: 'movie',
    coverUrl: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg',
    releaseDate: '2021-12-17',
    summary: 'Nachdem Peters Identität als Spider-Man enthüllt wurde, bittet er Doctor Strange um Hilfe – mit unvorhergesehenen Multiversums-Folgen.',
    genres: ['Action', 'Sci-Fi', 'Abenteuer'],
    creator: 'Jon Watts',
    franchise_id: 'franchise:spiderman-mcu',
    collection_name: 'Spider-Man MCU',
    totalUnits: 148,
    unit: 'minutes',
    rating: 4.9,
  },
  {
    id: 'tmdb:movie:438631',
    external_id: 'tmdb:movie:438631',
    title: 'Dune',
    originalTitle: 'Dune: Part One',
    type: 'movie',
    coverUrl: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/d5NXSklXo0qyIYkgV94XAgMIckC.jpg',
    releaseDate: '2021-09-15',
    summary: 'Paul Atreides muss auf den gefährlichsten Wüstenplaneten Arrakis reisen, um die Zukunft seines Volkes zu sichern.',
    genres: ['Sci-Fi', 'Abenteuer'],
    creator: 'Denis Villeneuve',
    franchise_id: 'tmdb:collection:726871',
    collection_name: 'Dune Filmreihe',
    totalUnits: 155,
    unit: 'minutes',
    rating: 4.7,
  },
  {
    id: 'tmdb:movie:693134',
    external_id: 'tmdb:movie:693134',
    title: 'Dune: Teil 2',
    originalTitle: 'Dune: Part Two',
    type: 'movie',
    coverUrl: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg',
    releaseDate: '2024-03-01',
    summary: 'Die Reise von Paul Atreides geht weiter mit den Fremen auf Arrakis im Kampf gegen das Haus Harkonnen.',
    genres: ['Sci-Fi', 'Action', 'Abenteuer'],
    creator: 'Denis Villeneuve',
    franchise_id: 'tmdb:collection:726871',
    collection_name: 'Dune Filmreihe',
    totalUnits: 166,
    unit: 'minutes',
    rating: 4.9,
  },
  {
    id: 'tmdb:tv:94605',
    external_id: 'tmdb:tv:94605',
    title: 'Arcane',
    originalTitle: 'Arcane: League of Legends',
    type: 'show',
    coverUrl: 'https://static.tvmaze.com/uploads/images/original_untouched/477/1193309.jpg',
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
    coverUrl: 'https://static.tvmaze.com/uploads/images/original_untouched/398/995400.jpg',
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
    coverUrl: 'https://static.tvmaze.com/uploads/images/original_untouched/477/1194988.jpg',
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
    coverUrl: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/ptpr0kGAckfQkJeJIt8st5dglvd.jpg',
    releaseDate: '2023-07-21',
    summary: 'Die Geschichte von J. Robert Oppenheimer und die Entwicklung der Atombombe im Manhattan-Projekt.',
    genres: ['Biografie', 'Drama', 'Historie'],
    creator: 'Christopher Nolan',
    totalUnits: 180,
    unit: 'minutes',
    rating: 4.8,
  },
  {
    id: 'tmdb:movie:157336',
    external_id: 'tmdb:movie:157336',
    title: 'Interstellar',
    originalTitle: 'Interstellar',
    type: 'movie',
    coverUrl: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    releaseDate: '2014-11-05',
    summary: 'Ein Forscherteam reist durch ein Wurmloch, um eine neue Heimat für die bedrohte Menschheit zu finden.',
    genres: ['Sci-Fi', 'Drama', 'Abenteuer'],
    creator: 'Christopher Nolan',
    totalUnits: 169,
    unit: 'minutes',
    rating: 4.9,
  },
  {
    id: 'tmdb:movie:27205',
    external_id: 'tmdb:movie:27205',
    title: 'Inception',
    originalTitle: 'Inception',
    type: 'movie',
    coverUrl: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg',
    releaseDate: '2010-07-16',
    summary: 'Ein Dieb, der Geheimnisse aus Träumen stiehlt, erhält die umgekehrte Aufgabe: eine Idee in ein Unterbewusstsein einzupflanzen.',
    genres: ['Sci-Fi', 'Action', 'Heist'],
    creator: 'Christopher Nolan',
    totalUnits: 148,
    unit: 'minutes',
    rating: 4.8,
  },
  {
    id: 'tmdb:movie:155',
    external_id: 'tmdb:movie:155',
    title: 'The Dark Knight',
    originalTitle: 'The Dark Knight',
    type: 'movie',
    coverUrl: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    releaseDate: '2008-07-18',
    summary: 'Batman verbündet sich mit Gordon und Dent gegen das Verbrechen in Gotham, als der Joker Chaos sät.',
    genres: ['Action', 'Krimi', 'Drama'],
    creator: 'Christopher Nolan',
    franchise_id: 'tmdb:franchise:batman',
    collection_name: 'The Dark Knight Trilogie',
    totalUnits: 152,
    unit: 'minutes',
    rating: 4.9,
  },
  {
    id: 'tmdb:tv:1396',
    external_id: 'tmdb:tv:1396',
    title: 'Breaking Bad',
    originalTitle: 'Breaking Bad',
    type: 'show',
    coverUrl: 'https://static.tvmaze.com/uploads/images/original_untouched/501/1253519.jpg',
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
    coverUrl: 'https://static.tvmaze.com/uploads/images/original_untouched/200/501942.jpg',
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
    id: 'tmdb:movie:569094',
    external_id: 'tmdb:movie:569094',
    title: 'Spider-Man: Across the Spider-Verse',
    originalTitle: 'Spider-Man: Across the Spider-Verse',
    type: 'movie',
    coverUrl: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg',
    releaseDate: '2023-06-02',
    summary: 'Miles Morales reist durch das Multiversum und gerät in Konflikt mit einer Vereinigung von Spider-Helden.',
    genres: ['Animation', 'Action', 'Sci-Fi'],
    creator: 'Joaquim Dos Santos, Kemp Powers',
    franchise_id: 'tmdb:franchise:spiderverse',
    collection_name: 'Spider-Verse Saga',
    totalUnits: 140,
    unit: 'minutes',
    rating: 4.9,
  },
  {
    id: 'tmdb:movie:603',
    external_id: 'tmdb:movie:603',
    title: 'Matrix',
    originalTitle: 'The Matrix',
    type: 'movie',
    coverUrl: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
    releaseDate: '1999-03-31',
    summary: 'Ein Computerhacker erfährt von mysteriösen Rebellen die schockierende Natur seiner Realität.',
    genres: ['Sci-Fi', 'Action'],
    creator: 'Lana & Lilly Wachowski',
    franchise_id: 'tmdb:franchise:matrix',
    collection_name: 'Matrix Reihe',
    totalUnits: 136,
    unit: 'minutes',
    rating: 4.8,
  },
];

export class TMDBAdapter implements MediaAdapter {
  async search(query: string): Promise<SearchResultItem[]> {
    const rawQ = query.trim().toLowerCase();
    if (!rawQ) {
      return POPULAR_TMDB_CATALOG;
    }

    // Clean search terms like "Spider-Man 1", "Dune Teil 1" -> "Spider-Man", "Dune"
    const cleanedQ = rawQ.replace(/\s+(1|i|teil\s*1|part\s*1|staffel\s*1|season\s*1)$/i, '').trim();
    const searchTerms = cleanedQ && cleanedQ !== rawQ ? [cleanedQ, rawQ] : [rawQ];

    const items: SearchResultItem[] = [];
    const seenIds = new Set<string>();

    // 1. Live OMDB Search (Real movie & show posters from IMDb/Amazon for ANY title!)
    // 1a. Try exact title first (e.g. "Spider-Man", "Inception")
    try {
      const exactQ = cleanedQ || rawQ;
      const exactRes = await fetch(
        `https://www.omdbapi.com/?t=${encodeURIComponent(exactQ)}&apikey=${OMDB_KEY}`
      );
      if (exactRes.ok) {
        const exact = await exactRes.json();
        if (exact.Response !== 'False' && exact.Title && exact.Poster && exact.Poster !== 'N/A') {
          const isMovie = exact.Type !== 'series';
          const external_id = `omdb:${exact.imdbID}`;
          seenIds.add(external_id);
          items.push({
            id: external_id,
            external_id,
            title: exact.Title,
            originalTitle: exact.Title,
            type: isMovie ? 'movie' : 'show',
            coverUrl: exact.Poster,
            releaseDate: exact.Year ? `${exact.Year.split('–')[0]}-01-01` : undefined,
            summary: exact.Plot && exact.Plot !== 'N/A' ? exact.Plot : `${isMovie ? 'Spielfilm' : 'Serie'} (${exact.Year}).`,
            genres: exact.Genre ? exact.Genre.split(', ') : [isMovie ? 'Film' : 'Serie'],
            creator: exact.Director && exact.Director !== 'N/A' ? exact.Director : 'Filmindustrie',
            franchise_id: `imdb:franchise:${exact.imdbID}`,
            totalUnits: isMovie ? 120 : 10,
            totalSeasons: isMovie ? undefined : (parseInt(exact.totalSeasons) || 1),
            unit: isMovie ? 'minutes' : 'episodes',
            rating: exact.imdbRating && exact.imdbRating !== 'N/A' ? Math.round((parseFloat(exact.imdbRating) / 2) * 10) / 10 : 4.6,
          });
        }
      }
    } catch (e) {
      console.warn('OMDb exact query failed:', e);
    }

    // 1b. Search list for terms
    for (const term of searchTerms) {
      try {
        const omdbRes = await fetch(
          `https://www.omdbapi.com/?s=${encodeURIComponent(term)}&apikey=${OMDB_KEY}`
        );
        if (omdbRes.ok) {
          const omdbData = await omdbRes.json();
          if (omdbData.Search && Array.isArray(omdbData.Search)) {
            for (const entry of omdbData.Search.slice(0, 6)) {
              if (!entry.Title || entry.Poster === 'N/A') continue;
              const external_id = `omdb:${entry.imdbID}`;
              if (seenIds.has(external_id)) continue;
              seenIds.add(external_id);

              const isMovie = entry.Type !== 'series';
              items.push({
                id: external_id,
                external_id,
                title: entry.Title,
                originalTitle: entry.Title,
                type: isMovie ? 'movie' : 'show',
                coverUrl: entry.Poster,
                releaseDate: entry.Year ? `${entry.Year.split('–')[0]}-01-01` : undefined,
                summary: `${isMovie ? 'Spielfilm' : 'Serie'} (${entry.Year}).`,
                genres: [isMovie ? 'Film' : 'Serie'],
                creator: 'Filmindustrie',
                franchise_id: `imdb:franchise:${entry.imdbID}`,
                totalUnits: isMovie ? 120 : 10,
                totalSeasons: isMovie ? undefined : 1,
                unit: isMovie ? 'minutes' : 'episodes',
                rating: 4.6,
              });
            }
          }
        }
      } catch (e) {
        console.warn('OMDb query failed:', e);
      }

      if (items.length >= 4) break;
    }

    // 2. Live TVmaze Search for TV shows (Returns official series poster images)
    for (const term of searchTerms) {
      try {
        const tvRes = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(term)}`);
        if (tvRes.ok) {
          const tvData = await tvRes.json();
          for (const entry of tvData.slice(0, 4)) {
            const show = entry.show;
            if (!show || !show.image) continue;

            const external_id = `tvmaze:${show.id}`;
            const coverUrl =
              show.image?.original?.replace('http://', 'https://') ||
              show.image?.medium?.replace('http://', 'https://');

            const summaryText = show.summary
              ? show.summary.replace(/<[^>]*>?/gm, '').slice(0, 250)
              : 'Offizielle Serie.';

            items.push({
              id: external_id,
              external_id,
              title: show.name,
              type: 'show',
              coverUrl,
              releaseDate: show.premiered,
              summary: summaryText,
              genres: show.genres || ['Drama', 'Serie'],
              creator: show.network?.name || show.webChannel?.name || 'TV Studio',
              franchise_id: `tvmaze:franchise:${show.id}`,
              totalUnits: 10,
              totalSeasons: 1,
              unit: 'episodes',
              rating: show.rating?.average ? Math.round((show.rating.average / 2) * 10) / 10 : 4.5,
            });
          }
        }
      } catch (e) {
        console.warn('TVmaze query error:', e);
      }

      if (items.length >= 6) break;
    }

    // 3. Search in popular catalog
    const catalogMatches = POPULAR_TMDB_CATALOG.filter(
      (m) =>
        m.title.toLowerCase().includes(rawQ) ||
        (cleanedQ && m.title.toLowerCase().includes(cleanedQ)) ||
        (m.originalTitle && m.originalTitle.toLowerCase().includes(rawQ)) ||
        (m.creator && m.creator.toLowerCase().includes(rawQ))
    );

    // Merge results without duplicate titles
    const combined: SearchResultItem[] = [];
    const seenTitles = new Set<string>();

    for (const item of [...items, ...catalogMatches]) {
      const norm = item.title.toLowerCase();
      if (!seenTitles.has(norm)) {
        seenTitles.add(norm);
        combined.push(item);
      }
    }

    if (combined.length > 0) {
      return combined;
    }

    // 4. Clean dynamic fallback with dedicated SVG artwork (Never shows the wrong poster!)
    const capitalized = query.trim().replace(/\b\w/g, (c) => c.toUpperCase());
    return [
      {
        id: `custom:movie:${Date.now()}`,
        external_id: `custom:movie:${Date.now()}`,
        title: capitalized,
        type: 'movie',
        coverUrl: createSvgPlaceholder(capitalized, 'movie'),
        releaseDate: new Date().toISOString().split('T')[0],
        summary: `Film: ${capitalized}. Jetzt zur Sammlung hinzufügen und Fortschritt erfassen.`,
        genres: ['Film'],
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
        coverUrl: createSvgPlaceholder(capitalized, 'show'),
        releaseDate: new Date().toISOString().split('T')[0],
        summary: `Serie: ${capitalized}. Verfolge Staffeln und Episoden in OmniTrack.`,
        genres: ['Serie'],
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
        sequelCoverUrl: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg',
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
        sequelCoverUrl: 'https://static.tvmaze.com/uploads/images/original_untouched/398/995400.jpg',
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
        sequelCoverUrl: 'https://static.tvmaze.com/uploads/images/original_untouched/477/1194988.jpg',
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
        sequelCoverUrl: 'https://static.tvmaze.com/uploads/images/original_untouched/477/1193309.jpg',
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
        sequelCoverUrl: 'https://static.tvmaze.com/uploads/images/original_untouched/200/501942.jpg',
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
