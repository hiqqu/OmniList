import { SearchResultItem, MediaItem, SequelNotification } from '@/types/media';
import { MediaAdapter } from './types';

const RAWG_API_KEY = process.env.RAWG_API_KEY;
const RAWG_BASE_URL = 'https://api.rawg.io/api';

function createGameSvgCover(title: string): string {
  const safeTitle = title.replace(/[<>&"]/g, '').slice(0, 28);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900">
    <defs>
      <linearGradient id="gameBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#2e1065" />
        <stop offset="50%" stop-color="#581c87" />
        <stop offset="100%" stop-color="#0f172a" />
      </linearGradient>
    </defs>
    <rect width="600" height="900" fill="url(#gameBg)"/>
    <rect x="30" y="30" width="540" height="840" rx="20" fill="none" stroke="#a855f7" stroke-opacity="0.4" stroke-width="2"/>
    <rect x="80" y="80" width="110" height="32" rx="8" fill="#a855f7" fill-opacity="0.25"/>
    <text x="135" y="102" fill="#d8b4fe" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" text-anchor="middle">VIDEOSPIEL</text>
    <text x="300" y="450" fill="#ffffff" font-family="system-ui, sans-serif" font-size="32" font-weight="bold" text-anchor="middle">${safeTitle}</text>
    <text x="300" y="500" fill="#c084fc" font-family="system-ui, sans-serif" font-size="18" text-anchor="middle">PC / Konsole</text>
    <text x="300" y="780" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="16" text-anchor="middle">OmniTrack Library</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const POPULAR_GAMES_CATALOG: SearchResultItem[] = [
  {
    id: 'rawg:eldenring',
    external_id: 'rawg:eldenring',
    title: 'Elden Ring',
    originalTitle: 'Elden Ring',
    type: 'game',
    coverUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1245620/library_600x900_2x.jpg',
    releaseDate: '2022-02-25',
    summary: 'Erhebe dich, Befleckter, und lasse dich von der Gnade leiten, um der Eldenfürst im Zwischenland zu werden.',
    genres: ['Action-RPG', 'Open World', 'Souls-like'],
    creator: 'FromSoftware / Bandai Namco',
    franchise_id: 'rawg:franchise:eldenring',
    collection_name: 'Elden Ring Universe',
    totalUnits: 120,
    unit: 'hours',
    rating: 4.9,
  },
  {
    id: 'rawg:witcher3',
    external_id: 'rawg:witcher3',
    title: 'The Witcher 3: Wild Hunt',
    originalTitle: 'The Witcher 3: Wild Hunt',
    type: 'game',
    coverUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/292030/library_600x900_2x.jpg',
    releaseDate: '2015-05-19',
    summary: 'Als Hexer Geralt von Riva durchstreifst du eine vom Krieg verwüstete Welt auf der Suche nach dem Kind der Prophezeiung.',
    genres: ['RPG', 'Open World', 'Story-Rich'],
    creator: 'CD Projekt RED',
    franchise_id: 'rawg:franchise:witcher',
    collection_name: 'The Witcher Universe',
    totalUnits: 100,
    unit: 'hours',
    rating: 4.9,
  },
  {
    id: 'rawg:cyberpunk2077',
    external_id: 'rawg:cyberpunk2077',
    title: 'Cyberpunk 2077',
    originalTitle: 'Cyberpunk 2077',
    type: 'game',
    coverUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1091500/library_600x900_2x.jpg',
    releaseDate: '2020-12-10',
    summary: 'Ein Open-World-Action-Adventure in der futuristischen Metropole Night City, besessen von Macht und Cyberware.',
    genres: ['Action', 'RPG', 'Cyberpunk'],
    creator: 'CD Projekt RED',
    franchise_id: 'rawg:franchise:cyberpunk',
    collection_name: 'Cyberpunk Universe',
    totalUnits: 65,
    unit: 'hours',
    rating: 4.6,
  },
  {
    id: 'rawg:silksong',
    external_id: 'rawg:hollowknight',
    title: 'Hollow Knight',
    originalTitle: 'Hollow Knight',
    type: 'game',
    coverUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/367520/library_600x900_2x.jpg',
    releaseDate: '2017-02-24',
    summary: 'Erkunde ein verlassenes Insekten-Königreich in diesem handgezeichneten 2D-Metroidvania voller Geheimnisse.',
    genres: ['Metroidvania', 'Souls-like', 'Indie'],
    creator: 'Team Cherry',
    franchise_id: 'rawg:franchise:hollowknight',
    collection_name: 'Hollow Knight Series',
    totalUnits: 40,
    unit: 'hours',
    rating: 4.8,
  },
  {
    id: 'rawg:gta5',
    external_id: 'rawg:gta5',
    title: 'Grand Theft Auto V',
    originalTitle: 'Grand Theft Auto V',
    type: 'game',
    coverUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/271590/library_600x900_2x.jpg',
    releaseDate: '2013-09-17',
    summary: 'Drei völlig unterschiedliche Kriminelle planen eine Reihe gefährlicher Überfälle in der Metropole Los Santos.',
    genres: ['Action', 'Open World', 'Crime'],
    creator: 'Rockstar Games',
    franchise_id: 'rawg:franchise:gta',
    collection_name: 'Grand Theft Auto',
    totalUnits: 50,
    unit: 'hours',
    rating: 4.7,
  },
  {
    id: 'rawg:bg3',
    external_id: 'rawg:bg3',
    title: "Baldur's Gate 3",
    originalTitle: "Baldur's Gate 3",
    type: 'game',
    coverUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1086940/library_600x900_2x.jpg',
    releaseDate: '2023-08-03',
    summary: 'Ein episches Party-basiertes D&D-Rollenspiel voller Entscheidungen, Magie und Abenteuer in den Vergessenen Reichen.',
    genres: ['RPG', 'Turn-Based', 'Story-Rich'],
    creator: 'Larian Studios',
    franchise_id: 'rawg:franchise:bg',
    collection_name: "Baldur's Gate",
    totalUnits: 110,
    unit: 'hours',
    rating: 5.0,
  },
  {
    id: 'rawg:rdr2',
    external_id: 'rawg:rdr2',
    title: 'Red Dead Redemption 2',
    originalTitle: 'Red Dead Redemption 2',
    type: 'game',
    coverUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1174180/library_600x900_2x.jpg',
    releaseDate: '2018-10-26',
    summary: 'Amerika, 1899: Arthur Morgan und die Van-der-Linde-Bande sind Gesetzlose auf der Flucht vor Bundesagenten und Kopfgeldjägern.',
    genres: ['Open World', 'Story-Rich', 'Western'],
    creator: 'Rockstar Games',
    franchise_id: 'rawg:franchise:rdr',
    collection_name: 'Red Dead',
    totalUnits: 80,
    unit: 'hours',
    rating: 4.9,
  },
  {
    id: 'rawg:zelda-totk',
    external_id: 'rawg:zelda-totk',
    title: 'The Legend of Zelda: Tears of the Kingdom',
    originalTitle: 'The Legend of Zelda: Tears of the Kingdom',
    type: 'game',
    coverUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co5vmg.jpg',
    releaseDate: '2023-05-12',
    summary: 'Link erkundet das Land Hyrule und die endlosen Himmelsinseln mit neuen Baufähigkeiten und Artefakten.',
    genres: ['Action-Adventure', 'Open World'],
    creator: 'Nintendo',
    franchise_id: 'rawg:franchise:zelda',
    collection_name: 'The Legend of Zelda',
    totalUnits: 90,
    unit: 'hours',
    rating: 4.9,
  },
  {
    id: 'rawg:wukong',
    external_id: 'rawg:wukong',
    title: 'Black Myth: Wukong',
    originalTitle: 'Black Myth: Wukong',
    type: 'game',
    coverUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2358720/library_600x900_2x.jpg',
    releaseDate: '2024-08-20',
    summary: 'Tauche ein in die faszinierende chinesische Mythologie als der Auserkorene auf den Spuren des Affenkönigs Sun Wukong.',
    genres: ['Action-RPG', 'Souls-like'],
    creator: 'Game Science',
    franchise_id: 'rawg:franchise:wukong',
    totalUnits: 45,
    unit: 'hours',
    rating: 4.8,
  },
];

export class RAWGAdapter implements MediaAdapter {
  async search(query: string): Promise<SearchResultItem[]> {
    const q = query.trim().toLowerCase();
    if (!q) {
      return POPULAR_GAMES_CATALOG;
    }

    const items: SearchResultItem[] = [];

    // 1. Live Steam Store Search API (Completely FREE, public, returns real official 2:3 vertical covers!)
    try {
      const steamRes = await fetch(
        `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(q)}&l=german&cc=DE`
      );
      if (steamRes.ok) {
        const data = await steamRes.json();
        for (const game of (data.items || []).slice(0, 6)) {
          if (!game.name || !game.id) continue;
          const external_id = `steam:${game.id}`;
          const coverUrl = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${game.id}/library_600x900_2x.jpg`;

          items.push({
            id: external_id,
            external_id,
            title: game.name,
            type: 'game',
            coverUrl,
            summary: `Videospiel auf Steam (App-ID: ${game.id}).`,
            genres: ['Videospiel', 'PC / Konsole'],
            creator: 'Steam Store',
            franchise_id: `steam:franchise:${game.id}`,
            totalUnits: 40,
            unit: 'hours',
            rating: 4.6,
          });
        }
      }
    } catch (e) {
      console.warn('Steam Store Search failed:', e);
    }

    // 2. RAWG Live API if configured
    if (RAWG_API_KEY) {
      try {
        const res = await fetch(
          `${RAWG_BASE_URL}/games?search=${encodeURIComponent(q)}&key=${RAWG_API_KEY}&page_size=8`
        );
        if (res.ok) {
          const data = await res.json();
          for (const game of data.results || []) {
            const external_id = `rawg:${game.id}`;
            items.push({
              id: external_id,
              external_id,
              title: game.name,
              type: 'game',
              coverUrl: game.background_image || createGameSvgCover(game.name),
              releaseDate: game.released,
              summary: `Plattformen: ${game.platforms?.map((p: any) => p.platform.name).join(', ') || 'PC, Konsolen'}`,
              genres: game.genres?.map((g: any) => g.name) || ['Game'],
              creator: game.developers?.[0]?.name || 'Entwicklerstudio',
              franchise_id: `rawg:franchise:${game.slug}`,
              totalUnits: game.playtime || 40,
              unit: 'hours',
              rating: game.rating ? Math.round(game.rating * 10) / 10 : 4.5,
            });
          }
        }
      } catch (e) {
        console.warn('RAWG live search failed:', e);
      }
    }

    // 3. Search in popular catalog
    const matches = POPULAR_GAMES_CATALOG.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        (m.creator && m.creator.toLowerCase().includes(q)) ||
        (m.genres && m.genres.some((g) => g.toLowerCase().includes(q)))
    );

    const combined = [...items];
    for (const match of matches) {
      if (!combined.some((x) => x.title.toLowerCase() === match.title.toLowerCase())) {
        combined.push(match);
      }
    }

    if (combined.length > 0) {
      return combined;
    }

    // Dynamic fallback with dedicated game artwork (Never shows the wrong cover!)
    const capitalized = query.trim().replace(/\b\w/g, (c) => c.toUpperCase());
    return [
      {
        id: `custom:game:${Date.now()}`,
        external_id: `custom:game:${Date.now()}`,
        title: capitalized,
        type: 'game',
        coverUrl: createGameSvgCover(capitalized),
        releaseDate: new Date().toISOString().split('T')[0],
        summary: `Videospiel: ${capitalized}. Spielzeit und Trophäen in OmniTrack erfassen.`,
        genres: ['Action', 'Videospiel'],
        creator: 'Game Studio',
        totalUnits: 40,
        unit: 'hours',
        rating: 4.5,
      },
    ];
  }

  async checkSequels(item: MediaItem): Promise<SequelNotification | null> {
    const titleLower = item.title.toLowerCase();

    // 1. Elden Ring -> Shadow of the Erdtree
    if (
      (item.external_id === 'rawg:eldenring' || titleLower.includes('elden ring')) &&
      !titleLower.includes('shadow of the erdtree')
    ) {
      return {
        id: `seq-er-erdtree-${item.id}`,
        parentMediaId: item.id,
        parentMediaTitle: item.title,
        parentMediaType: 'game',
        parentCoverUrl: item.coverUrl,
        sequelTitle: 'Elden Ring: Shadow of the Erdtree (Erweiterung)',
        sequelType: 'game',
        sequelCoverUrl:
          'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2778580/library_600x900_2x.jpg',
        releaseDate: '2024-06-21',
        status: 'released',
        badgeText: 'Jetzt verfügbar',
        external_id: 'rawg:er-erdtree',
        franchise_id: 'rawg:franchise:eldenring',
        description: 'Im Schattenland folgen Spieler den Spuren von Miquella in das finsterste Geheimnis des Erdbaums.',
        detectedAt: new Date().toISOString(),
        progressSuggestion: { current: 0, total: 45, unit: 'hours' },
      };
    }

    // 2. The Witcher 3 -> The Witcher 4: Polaris
    if (
      (item.external_id === 'rawg:witcher3' || titleLower.includes('witcher 3')) &&
      !titleLower.includes('witcher 4') &&
      !titleLower.includes('polaris')
    ) {
      return {
        id: `seq-witcher4-${item.id}`,
        parentMediaId: item.id,
        parentMediaTitle: item.title,
        parentMediaType: 'game',
        parentCoverUrl: item.coverUrl,
        sequelTitle: 'The Witcher 4: Polaris',
        sequelType: 'game',
        sequelCoverUrl:
          'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/292030/library_600x900_2x.jpg',
        releaseDate: '2026-11-15',
        status: 'announced',
        badgeText: 'Neu angekündigt',
        external_id: 'rawg:witcher-4',
        franchise_id: 'rawg:franchise:witcher',
        description: 'Der Beginn einer neuen Hexer-Trilogie auf Basis der Unreal Engine 5 von CD Projekt RED.',
        detectedAt: new Date().toISOString(),
        progressSuggestion: { current: 0, total: 80, unit: 'hours' },
      };
    }

    // 3. Hollow Knight -> Silksong
    if (
      (item.external_id === 'rawg:hollowknight' || titleLower.includes('hollow knight')) &&
      !titleLower.includes('silksong')
    ) {
      return {
        id: `seq-silksong-${item.id}`,
        parentMediaId: item.id,
        parentMediaTitle: item.title,
        parentMediaType: 'game',
        parentCoverUrl: item.coverUrl,
        sequelTitle: 'Hollow Knight: Silksong',
        sequelType: 'game',
        sequelCoverUrl:
          'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/367520/library_600x900_2x.jpg',
        releaseDate: '2025-06-01',
        status: 'announced',
        badgeText: 'Neu angekündigt',
        external_id: 'rawg:silksong',
        franchise_id: 'rawg:franchise:hollowknight',
        description: 'Schlüpfe in die Rolle von Hornet, Prinzessin und Beschützerin von Hallownest.',
        detectedAt: new Date().toISOString(),
        progressSuggestion: { current: 0, total: 35, unit: 'hours' },
      };
    }

    // 4. GTA V -> GTA VI
    if (
      (item.external_id === 'rawg:gta5' || titleLower.includes('gta 5') || titleLower.includes('grand theft auto v')) &&
      !titleLower.includes('vi') &&
      !titleLower.includes('gta 6')
    ) {
      return {
        id: `seq-gta6-${item.id}`,
        parentMediaId: item.id,
        parentMediaTitle: item.title,
        parentMediaType: 'game',
        parentCoverUrl: item.coverUrl,
        sequelTitle: 'Grand Theft Auto VI',
        sequelType: 'game',
        sequelCoverUrl:
          'https://images.igdb.com/igdb/image/upload/t_cover_big/co7s44.jpg',
        releaseDate: '2025-10-01',
        status: 'announced',
        badgeText: 'Startet im Herbst 2025',
        external_id: 'rawg:gta6',
        franchise_id: 'rawg:franchise:gta',
        description: 'Willkommen im sonnigen Vice City! Die lang erwartete Fortsetzung von Rockstar Games.',
        detectedAt: new Date().toISOString(),
        progressSuggestion: { current: 0, total: 70, unit: 'hours' },
      };
    }

    return null;
  }
}
