import { SearchResultItem, MediaItem, SequelNotification } from '@/types/media';
import { MediaAdapter } from './types';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

const MOCK_TMDB_CATALOG: SearchResultItem[] = [
  {
    id: 'tmdb:movie:438631',
    external_id: 'tmdb:movie:438631',
    title: 'Dune',
    originalTitle: 'Dune: Part One',
    type: 'movie',
    coverUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=80',
    releaseDate: '2021-09-15',
    summary: 'Paul Atreides, ein brillanter und begabter junger Mann, der zu einem großen Schicksal geboren wurde, muss auf den gefährlichsten Planeten des Universums reisen.',
    genres: ['Sci-Fi', 'Abenteuer'],
    creator: 'Denis Villeneuve',
    franchise_id: 'tmdb:collection:726871',
    collection_name: 'Dune Filmreihe',
    totalUnits: 155,
    unit: 'hours',
    rating: 4.6,
  },
  {
    id: 'tmdb:movie:693134',
    external_id: 'tmdb:movie:693134',
    title: 'Dune: Teil 2',
    originalTitle: 'Dune: Part Two',
    type: 'movie',
    coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80',
    releaseDate: '2024-03-01',
    summary: 'Die Reise von Paul Atreides geht weiter, als er sich mit Chani und den Fremen zusammenschließt, um Rache an den Verschwörern zu üben.',
    genres: ['Sci-Fi', 'Action', 'Abenteuer'],
    creator: 'Denis Villeneuve',
    franchise_id: 'tmdb:collection:726871',
    collection_name: 'Dune Filmreihe',
    totalUnits: 166,
    unit: 'hours',
    rating: 4.8,
  },
  {
    id: 'tmdb:tv:94605',
    external_id: 'tmdb:tv:94605',
    title: 'Arcane',
    originalTitle: 'Arcane: League of Legends',
    type: 'show',
    coverUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=80',
    releaseDate: '2021-11-06',
    summary: 'Inmitten des Konflikts zwischen den Zwillingsstädten Piltover und Zhaun kämpfen zwei Schwestern auf entgegengesetzten Seiten eines Krieges zwischen magischen Technologien.',
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
    id: 'tmdb:tv:100088',
    external_id: 'tmdb:tv:100088',
    title: 'The Last of Us',
    originalTitle: 'The Last of Us',
    type: 'show',
    coverUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&auto=format&fit=crop&q=80',
    releaseDate: '2023-01-15',
    summary: 'Zwanzig Jahre nach dem Zusammenbruch der Zivilisation wird der abgebrühte Überlebende Joel angeheuert, um die 14-jährige Ellie aus einer bedrückenden Quarantänezone zu schmuggeln.',
    genres: ['Drama', 'Sci-Fi', 'Horror'],
    creator: 'Craig Mazin, Neil Druckmann',
    franchise_id: 'tmdb:collection:tlou',
    collection_name: 'The Last of Us Saga',
    totalUnits: 9,
    totalSeasons: 1,
    unit: 'episodes',
    rating: 4.7,
  },
  {
    id: 'tmdb:tv:95557',
    external_id: 'tmdb:tv:95557',
    title: 'Severance',
    originalTitle: 'Severance',
    type: 'show',
    coverUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&auto=format&fit=crop&q=80',
    releaseDate: '2022-02-18',
    summary: 'Mark leitet ein Team bei Lumon Industries, dessen Angestellte sich einem chirurgischen Eingriff unterzogen haben, der ihre Erinnerungen zwischen Arbeit und Privatleben trennt.',
    genres: ['Mystery', 'Sci-Fi', 'Thriller'],
    creator: 'Dan Erickson',
    franchise_id: 'tmdb:collection:severance',
    collection_name: 'Severance Universe',
    totalUnits: 19,
    totalSeasons: 2,
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
    summary: 'Die Geschichte des amerikanischen Wissenschaftlers J. Robert Oppenheimer und seiner Rolle bei der Entwicklung der Atombombe im Manhattan-Projekt.',
    genres: ['Biografie', 'Drama', 'Historie'],
    creator: 'Christopher Nolan',
    totalUnits: 180,
    unit: 'hours',
    rating: 4.8,
  },
  {
    id: 'tmdb:tv:66732',
    external_id: 'tmdb:tv:66732',
    title: 'Stranger Things',
    originalTitle: 'Stranger Things',
    type: 'show',
    coverUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=500&auto=format&fit=crop&q=80',
    releaseDate: '2016-07-15',
    summary: 'Als ein kleiner Junge spurlos verschwindet, decken seine Freunde geheime Experimente und furchterregende übernatürliche Kräfte auf.',
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
    id: 'tmdb:movie:157336',
    external_id: 'tmdb:movie:157336',
    title: 'Interstellar',
    originalTitle: 'Interstellar',
    type: 'movie',
    coverUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=500&auto=format&fit=crop&q=80',
    releaseDate: '2014-11-05',
    summary: 'Ein Team von Forschern nutzt ein neu entdecktes Wurmloch, um die Grenzen der menschlichen Raumfahrt zu überwinden und das Überleben der Menschheit zu sichern.',
    genres: ['Sci-Fi', 'Drama', 'Abenteuer'],
    creator: 'Christopher Nolan',
    totalUnits: 169,
    unit: 'hours',
    rating: 4.9,
  },
];

export class TMDBAdapter implements MediaAdapter {
  async search(query: string): Promise<SearchResultItem[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    if (TMDB_API_KEY) {
      try {
        const res = await fetch(
          `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
            q
          )}&language=de-DE&include_adult=false`
        );
        if (res.ok) {
          const data = await res.json();
          const items: SearchResultItem[] = [];

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

          if (items.length > 0) return items;
        }
      } catch (e) {
        console.warn('TMDB live search failed, falling back to mock catalog', e);
      }
    }

    // Fallback: search in mock catalog
    return MOCK_TMDB_CATALOG.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        (m.originalTitle && m.originalTitle.toLowerCase().includes(q)) ||
        (m.creator && m.creator.toLowerCase().includes(q)) ||
        (m.genres && m.genres.some((g) => g.toLowerCase().includes(q)))
    );
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

    // If live API key is available, attempt live TMDB lookup
    if (TMDB_API_KEY && item.external_id.startsWith('tmdb:tv:')) {
      try {
        const tvId = item.external_id.split(':')[2];
        const res = await fetch(`${TMDB_BASE_URL}/tv/${tvId}?api_key=${TMDB_API_KEY}&language=de-DE`);
        if (res.ok) {
          const data = await res.json();
          const currentSeason = item.progress.currentSeason || item.progress.totalSeasons || 1;
          if (data.number_of_seasons > currentSeason) {
            const nextSeason = currentSeason + 1;
            return {
              id: `seq-live-${item.id}-${nextSeason}`,
              parentMediaId: item.id,
              parentMediaTitle: item.title,
              parentMediaType: 'show',
              parentCoverUrl: item.coverUrl,
              sequelTitle: `${item.title} (Staffel ${nextSeason})`,
              sequelType: 'show',
              sequelCoverUrl: item.coverUrl,
              status: 'released',
              badgeText: `Staffel ${nextSeason} verfügbar`,
              external_id: `tmdb:tv:${tvId}:s${nextSeason}`,
              franchise_id: item.franchise_id,
              description: `Neue Staffel ${nextSeason} mit ${data.seasons?.[nextSeason]?.episode_count || 10} Episoden verfügbar!`,
              detectedAt: new Date().toISOString(),
              progressSuggestion: {
                current: 0,
                total: data.seasons?.[nextSeason]?.episode_count || 10,
                unit: 'episodes',
                currentSeason: nextSeason,
                totalSeasons: data.number_of_seasons,
              },
            };
          }
        }
      } catch (err) {
        console.warn('Live TMDB sequel check failed', err);
      }
    }

    return null;
  }
}
