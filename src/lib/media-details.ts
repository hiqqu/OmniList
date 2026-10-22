import { MediaItem, MediaType } from '@/types/media';
import { formatIsbn } from '@/lib/api-adapters/googlebooks';
import { getMediaMetacriticScore } from '@/lib/metacritic';

export interface CastMember {
  name: string;
  role: string;
  avatarUrl?: string;
  voiceActorJp?: string; // Speziell für Anime
  voiceActorDe?: string; // Speziell für Anime / synchronisierte Serien
}

export interface ReviewItem {
  author: string;
  source: string;
  score: string;
  text: string;
  date: string;
}

export interface EnrichedMediaDetails {
  tagline?: string;
  director?: string;
  writers?: string[];
  studio?: string;
  developer?: string;
  publisher?: string;
  platforms?: string[];
  playtime?: {
    mainStory: string;
    extras: string;
    completionist: string;
  };
  duration?: string;
  language?: string;
  ageRating?: string;
  pageCount?: number;
  isbn?: string;
  scores: {
    community: string;
    critics?: string;
    criticsLabel?: string;
    audience?: string;
    audienceLabel?: string;
  };
  cast: CastMember[];
  reviews: ReviewItem[];
  trailerUrl?: string;
}

// Curated rich details for default / popular seed items
const CURATED_DETAILS: Record<string, Partial<EnrichedMediaDetails>> = {
  'media-frieren-1': {
    tagline: 'Die Reise nach dem Ende des großen Abenteuers.',
    director: 'Keiichirō Saitō (Bocchi the Rock!)',
    writers: ['Kanehito Yamada (Manga)', 'Tomohiro Suzuki (Drehbuch)'],
    studio: 'Madhouse Studios',
    duration: '28 Episoden (~24 Min.)',
    language: 'Japanisch (OmU & Synchro)',
    ageRating: 'FSK 12',
    scores: {
      community: '4.9 / 5.0',
      critics: '9.38 / 10',
      criticsLabel: 'MyAnimeList #1 All-Time',
      audience: '92%',
      audienceLabel: 'AniList Score',
    },
    cast: [
      {
        name: 'Frieren',
        role: 'Elfen-Erzmagierin',
        voiceActorJp: 'Atsumi Tanezaki (Anya in Spy×Family)',
        voiceActorDe: 'Lina Rabea Mohr',
        avatarUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=150&auto=format&fit=crop&q=80',
      },
      {
        name: 'Fern',
        role: 'Magieschülerin & Reisebegleiterin',
        voiceActorJp: 'Kana Ichinose (Suletta in Gundam)',
        voiceActorDe: 'Julia Bautz',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      },
      {
        name: 'Stark',
        role: 'Krieger der Eisernen Axt',
        voiceActorJp: 'Chiaki Kobayashi (Mash in Mashle)',
        voiceActorDe: 'Vincent Borko',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      },
      {
        name: 'Himmel der Held',
        role: 'Legendärer Held der Vorzeit',
        voiceActorJp: 'Nobuhiko Okamoto (Bakugo in MHA)',
        voiceActorDe: 'Patrick Keller',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      },
    ],
    reviews: [
      {
        author: 'Anime News Network',
        source: 'Kritiker-Review',
        score: 'A+',
        text: 'Ein atemberaubendes Meisterwerk über Trauer, Vergänglichkeit und die Schönheit der kleinen Augenblicke. Madhouse in absoluter Höchstform.',
        date: 'Herbst 2023',
      },
      {
        author: 'IGN Anime',
        source: 'Editorial',
        score: '10/10',
        text: 'Frieren definiert moderne Fantasy neu: Kein lauter Action-Zirkus, sondern tief berührendes Storytelling mit unglaublicher musikalischer Untermalung von Evan Call.',
        date: 'Winter 2024',
      },
    ],
  },
  'media-dune-1': {
    tagline: 'Die Angst tötet den Verstand.',
    director: 'Denis Villeneuve (Blade Runner 2049, Arrival)',
    writers: ['Jon Spaihts', 'Denis Villeneuve', 'Eric Roth', 'Frank Herbert (Roman)'],
    studio: 'Warner Bros. Pictures / Legendary Entertainment',
    duration: '155 Minuten (2 Std. 35 Min.)',
    language: 'Englisch (Dolby Atmos)',
    ageRating: 'FSK 12',
    scores: {
      community: '4.7 / 5.0',
      critics: '74 / 100',
      criticsLabel: 'Metacritic',
      audience: '8.0 / 10',
      audienceLabel: 'IMDb (820k Stimmen)',
    },
    cast: [
      {
        name: 'Timothée Chalamet',
        role: 'Paul Atreides',
        avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
      },
      {
        name: 'Rebecca Ferguson',
        role: 'Lady Jessica Atreides (Bene Gesserit)',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      },
      {
        name: 'Oscar Isaac',
        role: 'Herzog Leto Atreides',
        avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
      },
      {
        name: 'Zendaya',
        role: 'Chani (Fremen-Kriegerin)',
        avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      },
      {
        name: 'Javier Bardem',
        role: 'Stilgar (Sietch Tabr Anführer)',
        avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
      },
    ],
    reviews: [
      {
        author: 'The Guardian',
        source: 'Peter Bradshaw',
        score: '5/5',
        text: 'Monumentales Sci-Fi-Kino von kolossaler visueller Wucht. Hans Zimmers Score vibriert bis ins Mark.',
        date: 'September 2021',
      },
      {
        author: 'Variety',
        source: 'Film Critic',
        score: '9/10',
        text: 'Villeneuve gelingt, was lange als unfilmbar galt: Eine respektvolle, epische Umsetzung von Frank Herberts Wüstenplanet.',
        date: 'Oktober 2021',
      },
    ],
  },
  'media-severance-1': {
    tagline: 'Bitte schätzen Sie alle Komponenten gleich.',
    director: 'Ben Stiller & Aoife McArdle',
    writers: ['Dan Erickson (Creator)', 'Mohamad El Masri'],
    publisher: 'Apple TV+ Original',
    duration: '9 Episoden (~50 Min.)',
    language: 'Englisch (Dolby Vision)',
    ageRating: 'FSK 16',
    scores: {
      community: '4.8 / 5.0',
      critics: '83 / 100',
      criticsLabel: 'Metacritic',
      audience: '8.7 / 10',
      audienceLabel: 'IMDb',
    },
    cast: [
      {
        name: 'Adam Scott',
        role: 'Mark Scout (Innie / Outie)',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      },
      {
        name: 'Britt Lower',
        role: 'Helly R.',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      },
      {
        name: 'Patricia Arquette',
        role: 'Harmony Cobel / Mrs. Selvig',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      },
      {
        name: 'John Turturro',
        role: 'Irving Bailiff',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      },
      {
        name: 'Christopher Walken',
        role: 'Burt Goodman (O&D)',
        avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
      },
    ],
    reviews: [
      {
        author: 'Rolling Stone',
        source: 'Alan Sepinwall',
        score: '9.5/10',
        text: 'Ein schockierend brillanter Psychothriller über Spätkapitalismus und Identitätsverlust mit einem der besten Staffelfinals der TV-Geschichte.',
        date: 'Frühjahr 2022',
      },
    ],
  },
  'media-eldenring-1': {
    tagline: 'Erhebe dich, Befleckter, und werde Eldenfürst.',
    director: 'Hidetaka Miyazaki',
    writers: ['George R. R. Martin (World-Building)', 'Hidetaka Miyazaki'],
    developer: 'FromSoftware Inc.',
    publisher: 'Bandai Namco Entertainment',
    platforms: ['PlayStation 5', 'PlayStation 4', 'Xbox Series X/S', 'PC (Steam)'],
    playtime: {
      mainStory: '~58 Std.',
      extras: '~102 Std.',
      completionist: '~135 Std.',
    },
    ageRating: 'USK 16 / PEGI 16',
    scores: {
      community: '4.9 / 5.0',
      critics: '96 / 100',
      criticsLabel: 'Metacritic (Must-Play)',
      audience: '92%',
      audienceLabel: 'Steam (Sehr positiv)',
    },
    cast: [
      {
        name: 'Melina',
        role: 'Führerin der Gnade',
        voiceActorJp: 'Martha Mackintosh',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      },
      {
        name: 'Ranni die Hexe',
        role: 'Mondprinzessin',
        voiceActorJp: 'Aimée-Ffion Bentley',
        avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      },
      {
        name: 'General Radahn',
        role: 'Sternengeißel & Halbgott',
        avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
      },
    ],
    reviews: [
      {
        author: 'GamePro / Gamestar',
        source: 'Testbericht',
        score: '94/100',
        text: 'Ein Meilenstein des Open-World-Designs. FromSoftware verbindet ihr Souls-Gameplay mit einer atemberaubenden, geheimnisvollen Welt voller Entdeckungen.',
        date: 'Februar 2022',
      },
    ],
  },
  'media-habits-1': {
    tagline: 'Kleine Änderungen, bemerkenswerte Ergebnisse.',
    writers: ['James Clear (Autor & Vortragsredner)'],
    publisher: 'Goldmann Verlag (Penguin Random House)',
    pageCount: 320,
    isbn: '978-3-442-17858-2',
    language: 'Deutsch (Übersetzung aus dem US-Englischen)',
    scores: {
      community: '4.8 / 5.0',
      critics: '#1 NYT',
      criticsLabel: 'New York Times Bestseller',
      audience: '4.38 / 5',
      audienceLabel: 'Goodreads (1,9 Mio. Ratings)',
    },
    cast: [
      {
        name: 'James Clear',
        role: 'Autor & Experte für Gewohnheitsbildung',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      },
      {
        name: 'Annika Brinkmann',
        role: 'Deutsche Übersetzung',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      },
    ],
    reviews: [
      {
        author: 'Mark Manson',
        source: 'Bestseller-Autor',
        score: '5/5',
        text: 'Ein extrem praktisches, nützliches Buch. James Clear destilliert die grundlegendsten Informationen über Gewohnheitsbildung, damit man sich auf weniger konzentrieren und mehr erreichen kann.',
        date: '2019',
      },
    ],
  },
  'media-3body-1': {
    tagline: 'Das Schicksal der Menschheit entscheidet sich im Alpha Centauri System.',
    writers: ['Cixin Liu (Autor)', 'Martina Hasse (Deutsche Übersetzung)'],
    publisher: 'Heyne Verlag',
    pageCount: 592,
    isbn: '978-3-453-31716-1',
    language: 'Deutsch (Original: Chinesisch)',
    scores: {
      community: '4.7 / 5.0',
      critics: 'Hugo Award',
      criticsLabel: 'Hugo Award für Besten Roman',
      audience: '4.1 / 5',
      audienceLabel: 'Goodreads (700k Ratings)',
    },
    cast: [
      {
        name: 'Cixin Liu',
        role: 'Autor (Chinesischer Science-Fiction Großmeister)',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      },
    ],
    reviews: [
      {
        author: 'Barack Obama',
        source: 'Buchempfehlung',
        score: 'Top Pick',
        text: 'Unglaublich fantasievoll. Es hat meinen täglichen Sorgen mit dem Kongress eine ganz neue kosmische Perspektive gegeben.',
        date: '2017',
      },
    ],
  },
  'media-cyberpunk-1': {
    tagline: 'Night City verändert jeden. Finde deinen eigenen Ausweg.',
    director: 'Gabe Amatangelo',
    developer: 'CD Projekt RED',
    publisher: 'CD Projekt',
    platforms: ['PC (Steam/GOG)', 'PlayStation 5', 'Xbox Series X/S'],
    playtime: {
      mainStory: '~25 Std.',
      extras: '~62 Std.',
      completionist: '~105 Std.',
    },
    ageRating: 'USK 18 / PEGI 18',
    scores: {
      community: '4.6 / 5.0',
      critics: '86 / 100',
      criticsLabel: 'Metacritic (Phantom Liberty: 89)',
      audience: 'Sehr positiv',
      audienceLabel: 'Steam (650k Rezensionen)',
    },
    cast: [
      {
        name: 'Keanu Reeves',
        role: 'Johnny Silverhand (Rockstar & Rebell)',
        avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
      },
      {
        name: 'Idris Elba',
        role: 'Solomon Reed (FIA-Geheimagent)',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      },
      {
        name: 'Gavin Drea / Cherami Leigh',
        role: 'V (Protagonist)',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      },
    ],
    reviews: [
      {
        author: 'Eurogamer',
        source: 'Update 2.0 Review',
        score: 'Empfehlenswert',
        text: 'Nach den grandiosen Patches und dem Phantom Liberty DLC ist Cyberpunk 2077 das fesselnde Zukunfts-Epos geworden, das uns 2020 versprochen wurde.',
        date: 'Herbst 2023',
      },
    ],
  },
};

function parseBookContributors(creator?: string, originalTitle?: string, title?: string): CastMember[] {
  if (!creator) {
    return [
      { name: 'Autor/in', role: 'Autor / Schriftsteller' },
      ...(originalTitle && originalTitle !== title
        ? [{ name: 'Deutsche Übersetzung', role: 'Übersetzung / Lokalisierung' }]
        : []),
    ];
  }

  const parts = creator.split(/[,;\n]/).map((p) => p.trim()).filter(Boolean);
  if (parts.length > 1) {
    return parts.map((part, idx) => {
      let role = idx === 0 ? 'Autor / Schriftsteller' : 'Mitwirkende/r';
      let cleanName = part;
      if (/übersetz|transl/i.test(part)) {
        role = 'Übersetzer / Deutsche Übersetzung';
        cleanName = part.replace(/\(?(übersetzt von|übersetzung|übers\.|transl\.?|translator)\)?/gi, '').trim();
      } else if (/illustrat|zeichn/i.test(part)) {
        role = 'Illustration / Cover';
        cleanName = part.replace(/\(?(illustrator|illustration|illustriert von)\)?/gi, '').trim();
      } else if (/herausgeb|hrsg/i.test(part)) {
        role = 'Herausgeber (Hrsg.)';
        cleanName = part.replace(/\(?(herausgeber|hrsg\.)\)?/gi, '').trim();
      }
      return {
        name: cleanName || part,
        role,
      };
    });
  }

  return [
    {
      name: creator,
      role: 'Autor / Schriftsteller',
    },
    ...(originalTitle && originalTitle !== title
      ? [{ name: 'Deutsche Übersetzung', role: 'Übersetzer / Lokalisierung' }]
      : []),
  ];
}

export function getEnrichedMediaDetails(item: MediaItem): EnrichedMediaDetails {
  const realMetascore = getMediaMetacriticScore(item);

  // Check if we have exact curated details
  const curated = CURATED_DETAILS[item.id];
  if (curated) {
    return {
      ...curated,
      publisher: item.publisher || curated.publisher,
      scores: {
        ...curated.scores,
        critics: realMetascore ? `${realMetascore} / 100` : curated.scores?.critics,
        criticsLabel: realMetascore ? 'Metacritic' : curated.scores?.criticsLabel,
        community: item.rating ? `${item.rating.toFixed(1)} / 5.0` : 'Nicht bewertet',
      },
      cast: curated.cast || [],
      reviews: curated.reviews || [],
    } as EnrichedMediaDetails;
  }

  // Generate intelligent type-specific dynamic details
  const typeDetails: Record<MediaType, Partial<EnrichedMediaDetails>> = {
    movie: {
      director: item.creator || undefined,
      duration: undefined,
      ageRating: undefined,
      language: undefined,
      scores: {
        community: item.rating ? `${item.rating.toFixed(1)} / 5.0` : 'Nicht bewertet',
        critics: realMetascore ? `${realMetascore} / 100` : undefined,
        criticsLabel: realMetascore ? 'Metacritic' : undefined,
        audience: item.communityRating ? `${item.communityRating.toFixed(1)} / 5.0` : undefined,
        audienceLabel: item.communityRating ? 'Publikumswertung' : undefined,
      },
      cast: item.creator ? [{ name: item.creator, role: 'Regie / Schöpfer' }] : [],
      reviews: [],
    },
    show: {
      director: item.creator || undefined,
      duration: item.progress.total ? `${item.progress.total} Episoden` : undefined,
      ageRating: undefined,
      language: undefined,
      scores: {
        community: item.rating ? `${item.rating.toFixed(1)} / 5.0` : 'Nicht bewertet',
        critics: realMetascore ? `${realMetascore} / 100` : undefined,
        criticsLabel: realMetascore ? 'Metacritic' : undefined,
        audience: item.communityRating ? `${item.communityRating.toFixed(1)} / 5.0` : undefined,
        audienceLabel: item.communityRating ? 'Zuschauer-Wertung' : undefined,
      },
      cast: item.creator ? [{ name: item.creator, role: 'Showrunner / Schöpfer' }] : [],
      reviews: [],
    },
    anime: {
      studio: item.creator || undefined,
      duration: item.progress.total ? `${item.progress.total} Folgen` : undefined,
      language: undefined,
      ageRating: undefined,
      scores: {
        community: item.rating ? `${item.rating.toFixed(1)} / 5.0` : 'Nicht bewertet',
        critics: realMetascore
          ? `${realMetascore} / 100`
          : item.metacritic
          ? `${item.metacritic > 10 ? (item.metacritic / 10).toFixed(2) : item.metacritic.toFixed(2)} / 10`
          : undefined,
        criticsLabel: realMetascore ? 'Metacritic' : item.metacritic ? 'MyAnimeList Score' : undefined,
        audience: item.communityRating
          ? `${item.communityRating > 10 ? Math.round(item.communityRating) + '%' : (item.communityRating * 10).toFixed(0) + '%'}${
              item.communityRatingsCount
                ? ` (${item.communityRatingsCount.toLocaleString('de-DE')} User)`
                : ''
            }`
          : undefined,
        audienceLabel: item.communityRating ? 'AniList Score' : undefined,
      },
      cast: item.creator ? [{ name: item.creator, role: 'Studio / Schöpfer' }] : [],
      reviews: [],
    },
    book: {
      writers: item.creator ? [item.creator] : undefined,
      publisher:
        item.publisher ||
        (item.collection_name ? item.collection_name.replace(' Ausgabe', '') : undefined) ||
        (item.originalTitle && item.originalTitle.includes('Verlag') ? item.originalTitle : undefined),
      pageCount: item.progress.total || undefined,
      isbn: item.isbn
        ? formatIsbn(item.isbn)
        : item.external_id?.startsWith('isbn:')
        ? formatIsbn(item.external_id.replace('isbn:', ''))
        : undefined,
      language: undefined,
      scores: {
        community: item.rating ? `${item.rating.toFixed(1)} / 5.0` : 'Nicht bewertet',
        audience: item.communityRating
          ? `${item.communityRating.toFixed(1)} / 5.0${
              item.communityRatingsCount
                ? ` (${item.communityRatingsCount.toLocaleString('de-DE')} Leser)`
                : ''
            }`
          : undefined,
        audienceLabel: 'Leser-Bewertung',
      },
      cast: parseBookContributors(item.creator, item.originalTitle, item.title),
      reviews: [],
    },
    game: {
      developer: item.creator || undefined,
      platforms: undefined,
      playtime: item.progress.total
        ? {
            mainStory: `${Math.round(item.progress.total * 0.6)} Std.`,
            extras: `${item.progress.total} Std.`,
            completionist: `${Math.round(item.progress.total * 1.5)} Std.`,
          }
        : undefined,
      ageRating: undefined,
      scores: {
        community: item.rating ? `${item.rating.toFixed(1)} / 5.0` : 'Nicht bewertet',
        critics: realMetascore ? `${realMetascore} / 100` : undefined,
        criticsLabel: realMetascore ? 'Metacritic' : undefined,
        audience: item.communityRating
          ? `${item.communityRating.toFixed(1)} / 5.0${
              item.communityRatingsCount
                ? ` (${item.communityRatingsCount >= 1000 ? Math.round(item.communityRatingsCount / 1000) + 'k' : item.communityRatingsCount} Spieler)`
                : ''
            }`
          : undefined,
        audienceLabel: item.communityRating ? 'Spieler-Wertung' : undefined,
      },
      cast: item.creator ? [{ name: item.creator, role: 'Entwicklerstudio / Lead' }] : [],
      reviews: [],
    },
  };

  const dynamic = typeDetails[item.type] || typeDetails.movie;

  return {
    tagline: undefined,
    ...dynamic,
    scores: {
      ...dynamic.scores,
      community: item.rating ? `${item.rating.toFixed(1)} / 5.0` : 'Nicht bewertet',
    },
    cast: dynamic.cast || [],
    reviews: dynamic.reviews || [],
  } as EnrichedMediaDetails;
}
