import { SearchResultItem, MediaItem, SequelNotification } from '@/types/media';
import { MediaAdapter } from './types';
import { createNoCoverSvg } from '../book-cover';

const RAWG_API_KEY = process.env.RAWG_API_KEY;
const RAWG_BASE_URL = 'https://api.rawg.io/api';

export interface CatalogGameItem extends SearchResultItem {
  aliases?: string[];
}

export function normalizeGameQuery(q: string): string[] {
  const raw = q.trim().toLowerCase();
  const variants = new Set<string>([raw]);

  // Handle typos and common variations
  if (raw.includes('unchartet')) {
    variants.add(raw.replace(/unchartet/g, 'uncharted'));
  }
  if (raw.includes('last od us')) {
    variants.add(raw.replace(/last od us/g, 'last of us'));
  }
  if (raw.includes('astrobot')) {
    variants.add(raw.replace(/astrobot/g, 'astro bot'));
  }
  if (raw.includes('astro bot')) {
    variants.add(raw.replace(/astro bot/g, 'astrobot'));
  }
  if (raw.includes('spiderman')) {
    variants.add(raw.replace(/spiderman/g, 'spider-man'));
    variants.add(raw.replace(/spiderman/g, 'spider man'));
  }
  if (raw.includes('spider-man')) {
    variants.add(raw.replace(/spider-man/g, 'spiderman'));
  }
  if (raw.includes('uncharted 1') || raw.includes('unchartet 1')) {
    variants.add('uncharted: drakes schicksal');
    variants.add("uncharted: drake's fortune");
    variants.add('drakes schicksal');
  }

  // Handle Batman Arkham queries and compound searches
  if (raw.includes('arkham city') && raw.includes('arkham asylum')) {
    variants.add('batman: arkham asylum');
    variants.add('batman: arkham city');
    variants.add('batman arkham');
  }
  if (raw.includes('arkham city')) {
    variants.add('batman: arkham city');
    variants.add('arkham city');
  }
  if (raw.includes('arkham asylum')) {
    variants.add('batman: arkham asylum');
    variants.add('arkham asylum');
  }
  if (raw.includes('arkham knight')) {
    variants.add('batman: arkham knight');
    variants.add('arkham knight');
  }
  if (raw.includes('batman') && !raw.includes('arkham')) {
    variants.add('batman arkham');
  }

  // Without special characters
  const cleanPunct = raw.replace(/[-':’]/g, ' ').replace(/\s+/g, ' ').trim();
  variants.add(cleanPunct);

  return Array.from(variants);
}

export const POPULAR_GAMES_CATALOG: CatalogGameItem[] = [
  // ================= UNCHARTED REIHE =================
  {
    id: 'playstation:uncharted-1',
    external_id: 'playstation:uncharted-1',
    title: 'Uncharted: Drakes Schicksal',
    originalTitle: "Uncharted: Drake's Fortune",
    type: 'game',
    coverUrl: 'https://lutris.net/media/igdb/cover_big/co1tp7.jpg',
    releaseDate: '2007-11-19',
    summary: 'Nathan Drake begibt sich auf die Suche nach dem sagenumwobenen Schatz von El Dorado.',
    genres: ['Action-Adventure', 'Third-Person-Shooter'],
    creator: 'Naughty Dog',
    publisher: 'Sony Computer Entertainment',
    franchise_id: 'playstation:franchise:uncharted',
    collection_name: 'Uncharted Reihe',
    totalUnits: 10,
    unit: 'hours',
    rating: 4.6,
    aliases: ['uncharted 1', 'unchartet 1', 'uncharted one', 'drakes schicksal', "drake's fortune"],
  },
  {
    id: 'playstation:uncharted-2',
    external_id: 'playstation:uncharted-2',
    title: 'Uncharted 2: Among Thieves',
    originalTitle: 'Uncharted 2: Among Thieves',
    type: 'game',
    coverUrl: 'https://lutris.net/media/igdb/cover_big/co1tnb.jpg',
    releaseDate: '2009-10-13',
    summary: 'Nathan Drake folgt den Spuren von Marco Polo auf der Suche nach dem Cintamani-Stein im Himalaja.',
    genres: ['Action-Adventure', 'Story-Rich'],
    creator: 'Naughty Dog',
    publisher: 'Sony Computer Entertainment',
    franchise_id: 'playstation:franchise:uncharted',
    collection_name: 'Uncharted Reihe',
    totalUnits: 11,
    unit: 'hours',
    rating: 4.9,
    aliases: ['uncharted 2', 'unchartet 2', 'among thieves'],
  },
  {
    id: 'playstation:uncharted-3',
    external_id: 'playstation:uncharted-3',
    title: "Uncharted 3: Drake's Deception",
    originalTitle: "Uncharted 3: Drake's Deception",
    type: 'game',
    coverUrl: 'https://lutris.net/media/igdb/cover_big/co1tp8.jpg',
    releaseDate: '2011-11-01',
    summary: 'Auf der Suche nach dem Atlantis der Wüste verschlägt es Nathan Drake und Sully in die Rub al-Chali-Wüste.',
    genres: ['Action-Adventure', 'Shooter'],
    creator: 'Naughty Dog',
    publisher: 'Sony Computer Entertainment',
    franchise_id: 'playstation:franchise:uncharted',
    collection_name: 'Uncharted Reihe',
    totalUnits: 11,
    unit: 'hours',
    rating: 4.8,
    aliases: ['uncharted 3', 'unchartet 3', 'drakes deception'],
  },
  {
    id: 'playstation:uncharted-4',
    external_id: 'playstation:uncharted-4',
    title: "Uncharted 4: A Thief's End",
    originalTitle: "Uncharted 4: A Thief's End",
    type: 'game',
    coverUrl: 'https://lutris.net/media/igdb/cover_big/co1r7h.jpg',
    releaseDate: '2016-05-10',
    summary: 'Drei Jahre nach seinem letzten Abenteuer kehrt Nathan Drake zurück, um seinem Bruder Sam zu helfen.',
    genres: ['Action-Adventure', 'Meisterwerk'],
    creator: 'Naughty Dog',
    publisher: 'Sony Interactive Entertainment',
    franchise_id: 'playstation:franchise:uncharted',
    collection_name: 'Uncharted Reihe',
    totalUnits: 15,
    unit: 'hours',
    rating: 4.9,
    aliases: ['uncharted 4', 'unchartet 4', "a thief's end"],
  },
  {
    id: 'playstation:uncharted-ndc',
    external_id: 'playstation:uncharted-ndc',
    title: 'Uncharted: The Nathan Drake Collection',
    originalTitle: 'Uncharted: The Nathan Drake Collection',
    type: 'game',
    coverUrl: 'https://lutris.net/media/igdb/cover_big/co1un2.jpg',
    releaseDate: '2015-10-07',
    summary: 'Enthält die ersten drei Abenteuer: Uncharted 1, Uncharted 2 und Uncharted 3 komplett überarbeitet für PS4.',
    genres: ['Action-Adventure', 'Trilogie'],
    creator: 'Bluepoint Games / Naughty Dog',
    publisher: 'Sony Computer Entertainment',
    franchise_id: 'playstation:franchise:uncharted',
    collection_name: 'Uncharted Reihe',
    totalUnits: 32,
    unit: 'hours',
    rating: 4.8,
    aliases: ['nathan drake collection', 'uncharted collection', 'uncharted trilogie', 'unchartet collection'],
  },
  {
    id: 'playstation:uncharted-lost-legacy',
    external_id: 'playstation:uncharted-lost-legacy',
    title: 'Uncharted: The Lost Legacy',
    originalTitle: 'Uncharted: The Lost Legacy',
    type: 'game',
    coverUrl: 'https://lutris.net/media/igdb/cover_big/co1tp9.jpg',
    releaseDate: '2017-08-22',
    summary: 'Chloe Frazer verbündet sich mit Nadine Ross, um das Goldene Horn von Ganesha in Indien zu finden.',
    genres: ['Action-Adventure'],
    creator: 'Naughty Dog',
    publisher: 'Sony Interactive Entertainment',
    franchise_id: 'playstation:franchise:uncharted',
    collection_name: 'Uncharted Reihe',
    totalUnits: 9,
    unit: 'hours',
    rating: 4.7,
    aliases: ['lost legacy', 'uncharted lost legacy'],
  },

  // ================= ASTRO BOT REIHE =================
  {
    id: 'playstation:astro-bot-2024',
    external_id: 'playstation:astro-bot-2024',
    title: 'Astro Bot',
    originalTitle: 'Astro Bot',
    type: 'game',
    coverUrl: 'https://lutris.net/media/igdb/cover_big/co8aad.jpg',
    releaseDate: '2024-09-06',
    summary: 'Das gefeierte 3D-Plattform-Meisterwerk für PS5: Rette über 300 VIP-Bots aus der gesamten PlayStation-Geschichte.',
    genres: ['3D-Plattformer', 'Familie', 'GOTY'],
    creator: 'Team ASOBI',
    publisher: 'Sony Interactive Entertainment',
    franchise_id: 'playstation:franchise:astrobot',
    collection_name: 'Astro Bot Series',
    totalUnits: 15,
    unit: 'hours',
    rating: 5.0,
    aliases: ['astrobot', 'astro bot ps5', 'astro bot 2024', 'astrobot 2024', 'astrobot ps5'],
  },
  {
    id: 'playstation:astros-playroom',
    external_id: 'playstation:astros-playroom',
    title: "Astro's Playroom",
    originalTitle: "Astro's Playroom",
    type: 'game',
    coverUrl: 'https://lutris.net/media/igdb/cover_big/co2gw7.jpg',
    releaseDate: '2020-11-12',
    summary: 'Erkunde die Wunder der PS5-Hardware in einem kreativen Plattformer voller Nostalgie und DualSense-Effekte.',
    genres: ['Plattformer', 'DualSense Showcase'],
    creator: 'Team ASOBI',
    publisher: 'Sony Interactive Entertainment',
    franchise_id: 'playstation:franchise:astrobot',
    collection_name: 'Astro Bot Series',
    totalUnits: 4,
    unit: 'hours',
    rating: 4.8,
    aliases: ['astros playroom', 'astro playroom', 'astrobot playroom', 'astro bot playroom'],
  },

  // ================= MARVEL'S SPIDER-MAN REIHE =================
  {
    id: 'playstation:spiderman-ps4',
    external_id: 'playstation:spiderman-ps4',
    title: "Marvel's Spider-Man",
    originalTitle: "Marvel's Spider-Man",
    type: 'game',
    coverUrl: 'https://lutris.net/media/igdb/cover_big/co1r77.jpg',
    releaseDate: '2018-09-07',
    summary: 'Das gefeierte Original für PS4: Schwinge als Peter Parker durch Manhattan und rette New York vor den Sinister Six.',
    genres: ['Action-Adventure', 'Superhelden', 'Open World'],
    creator: 'Insomniac Games',
    publisher: 'Sony Interactive Entertainment',
    franchise_id: 'playstation:franchise:spiderman',
    collection_name: "Marvel's Spider-Man Series",
    totalUnits: 20,
    unit: 'hours',
    rating: 4.9,
    aliases: ['spiderman ps4', 'spider-man ps4', 'marvels spiderman', 'marvels spider-man', 'spiderman 1', 'spiderman 2018'],
  },
  {
    id: 'playstation:spiderman-remastered',
    external_id: 'playstation:spiderman-remastered',
    title: "Marvel's Spider-Man Remastered",
    originalTitle: "Marvel's Spider-Man Remastered",
    type: 'game',
    coverUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1817070/library_600x900_2x.jpg',
    releaseDate: '2020-11-12',
    summary: 'Grafisch überarbeitete Version von Marvel\'s Spider-Man für PS5 und PC mit Raytracing und allen DLCs.',
    genres: ['Action-Adventure', 'Superhelden'],
    creator: 'Insomniac Games / Nixxes',
    publisher: 'PlayStation Publishing',
    franchise_id: 'playstation:franchise:spiderman',
    collection_name: "Marvel's Spider-Man Series",
    totalUnits: 25,
    unit: 'hours',
    rating: 4.9,
    aliases: ['spiderman remastered', 'spider-man remastered'],
  },
  {
    id: 'playstation:spiderman-miles-morales',
    external_id: 'playstation:spiderman-miles-morales',
    title: "Marvel's Spider-Man: Miles Morales",
    originalTitle: "Marvel's Spider-Man: Miles Morales",
    type: 'game',
    coverUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1817190/library_600x900_2x.jpg',
    releaseDate: '2020-11-12',
    summary: 'Miles Morales tritt als neuer Spider-Man an, um sein Zuhause Harlem vor einem Krieg zwischen Roxxon und dem Underground zu schützen.',
    genres: ['Action-Adventure', 'Superhelden'],
    creator: 'Insomniac Games',
    publisher: 'Sony Interactive Entertainment',
    franchise_id: 'playstation:franchise:spiderman',
    collection_name: "Marvel's Spider-Man Series",
    totalUnits: 12,
    unit: 'hours',
    rating: 4.8,
    aliases: ['miles morales', 'spiderman miles morales', 'spider-man miles'],
  },
  {
    id: 'playstation:spiderman-2',
    external_id: 'playstation:spiderman-2',
    title: "Marvel's Spider-Man 2",
    originalTitle: "Marvel's Spider-Man 2",
    type: 'game',
    coverUrl: 'https://lutris.net/media/igdb/cover_big/co3swf.jpg',
    releaseDate: '2023-10-20',
    summary: 'Peter Parker und Miles Morales stellen sich gemeinsam Venom, Kraven dem Jäger und ihren eigenen Dämonen.',
    genres: ['Action-Adventure', 'Superhelden'],
    creator: 'Insomniac Games',
    publisher: 'Sony Interactive Entertainment',
    franchise_id: 'playstation:franchise:spiderman',
    collection_name: "Marvel's Spider-Man Series",
    totalUnits: 20,
    unit: 'hours',
    rating: 4.9,
    aliases: ['spiderman 2', 'spider-man 2', 'marvels spiderman 2'],
  },

  // ================= THE LAST OF US REIHE =================
  {
    id: 'playstation:tlou-original',
    external_id: 'playstation:tlou-original',
    title: 'The Last of Us',
    originalTitle: 'The Last of Us',
    type: 'game',
    coverUrl: 'https://lutris.net/media/igdb/cover_big/co1r7f.jpg',
    releaseDate: '2013-06-14',
    summary: 'Das legendäre Original-Meisterwerk: Joel und die 14-jährige Ellie schlagen sich durch ein postapokalyptisches Amerika.',
    genres: ['Action-Adventure', 'Survival-Horror', 'Story-Rich'],
    creator: 'Naughty Dog',
    publisher: 'Sony Computer Entertainment',
    franchise_id: 'playstation:franchise:tlou',
    collection_name: 'The Last of Us Saga',
    totalUnits: 15,
    unit: 'hours',
    rating: 5.0,
    aliases: ['the last of us', 'the last od us', 'last of us 1', 'last of us original', 'the last of us 2013', 'the last of us ps3', 'tlou', 'tlou 1'],
  },
  {
    id: 'playstation:tlou-remastered',
    external_id: 'playstation:tlou-remastered',
    title: 'The Last of Us Remastered',
    originalTitle: 'The Last of Us Remastered',
    type: 'game',
    coverUrl: 'https://lutris.net/media/igdb/cover_big/co1ile.jpg',
    releaseDate: '2014-07-29',
    summary: 'Die aufpolierte PS4-Fassung des preisgekrönten Action-Adventures inklusive des Prequels Left Behind.',
    genres: ['Action-Adventure', 'Survival-Horror'],
    creator: 'Naughty Dog',
    publisher: 'Sony Computer Entertainment',
    franchise_id: 'playstation:franchise:tlou',
    collection_name: 'The Last of Us Saga',
    totalUnits: 16,
    unit: 'hours',
    rating: 4.9,
    aliases: ['the last of us remastered', 'last of us remastered', 'tlou remastered', 'last of us ps4'],
  },
  {
    id: 'playstation:tlou-part-1',
    external_id: 'playstation:tlou-part-1',
    title: 'The Last of Us Part I',
    originalTitle: 'The Last of Us Part I',
    type: 'game',
    coverUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1888930/library_600x900_2x.jpg',
    releaseDate: '2022-09-02',
    summary: 'Das von Grund auf neu entwickelte Remake für PS5 und PC mit modernisiertem Gameplay und fotorealistischer Grafik.',
    genres: ['Action-Adventure', 'Remake'],
    creator: 'Naughty Dog',
    publisher: 'Sony Interactive Entertainment',
    franchise_id: 'playstation:franchise:tlou',
    collection_name: 'The Last of Us Saga',
    totalUnits: 15,
    unit: 'hours',
    rating: 4.8,
    aliases: ['the last of us part 1', 'the last of us part i', 'tlou part 1', 'last of us part 1', 'last of us remake'],
  },
  {
    id: 'playstation:tlou-part-2',
    external_id: 'playstation:tlou-part-2',
    title: 'The Last of Us Part II',
    originalTitle: 'The Last of Us Part II',
    type: 'game',
    coverUrl: 'https://lutris.net/media/igdb/cover_big/co1r0o.jpg',
    releaseDate: '2020-06-19',
    summary: 'Fünf Jahre nach den Ereignissen begibt sich Ellie auf einen unerbittlichen Rachefeldzug durch die Ruinen von Seattle.',
    genres: ['Action-Adventure', 'Drama', 'Survival'],
    creator: 'Naughty Dog',
    publisher: 'Sony Interactive Entertainment',
    franchise_id: 'playstation:franchise:tlou',
    collection_name: 'The Last of Us Saga',
    totalUnits: 25,
    unit: 'hours',
    rating: 4.8,
    aliases: ['the last of us part 2', 'the last of us part ii', 'tlou 2', 'last of us 2'],
  },
  {
    id: 'playstation:tlou-part-2-remastered',
    external_id: 'playstation:tlou-part-2-remastered',
    title: 'The Last of Us Part II Remastered',
    originalTitle: 'The Last of Us Part II Remastered',
    type: 'game',
    coverUrl: 'https://lutris.net/media/igdb/cover_big/co7irs.jpg',
    releaseDate: '2024-01-19',
    summary: 'Die native PS5-Version mit dem Roguelike-Überlebensmodus No Return und Lost Levels.',
    genres: ['Action-Adventure', 'Survival'],
    creator: 'Naughty Dog',
    publisher: 'Sony Interactive Entertainment',
    franchise_id: 'playstation:franchise:tlou',
    collection_name: 'The Last of Us Saga',
    totalUnits: 30,
    unit: 'hours',
    rating: 4.8,
    aliases: ['the last of us part 2 remastered', 'tlou 2 remastered', 'last of us 2 ps5'],
  },

  // ================= WEITERE MEISTERWERKE & KLASSIKER =================
  {
    id: 'playstation:gow-2018',
    external_id: 'playstation:gow-2018',
    title: 'God of War',
    originalTitle: 'God of War',
    type: 'game',
    coverUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1593500/library_600x900_2x.jpg',
    releaseDate: '2018-04-20',
    summary: 'Kratos beginnt ein neues Leben in der nordischen Mythologie und reist mit seinem Sohn Atreus zum höchsten Gipfel aller Reiche.',
    genres: ['Action-Adventure', 'Mythologie', 'GOTY'],
    creator: 'Santa Monica Studio',
    publisher: 'Sony Interactive Entertainment',
    franchise_id: 'playstation:franchise:gow',
    collection_name: 'God of War Saga',
    totalUnits: 35,
    unit: 'hours',
    rating: 5.0,
    aliases: ['god of war 2018', 'god of war 4', 'gow 2018', 'gow 4'],
  },
  {
    id: 'playstation:gow-ragnarok',
    external_id: 'playstation:gow-ragnarok',
    title: 'God of War Ragnarök',
    originalTitle: 'God of War Ragnarök',
    type: 'game',
    coverUrl: 'https://lutris.net/media/igdb/cover_big/co3swk.jpg',
    releaseDate: '2022-11-09',
    summary: 'Kratos und Atreus müssen alle Neun Welten bereisen, um sich auf die prophezeite Schlacht von Ragnarök vorzubereiten.',
    genres: ['Action-Adventure', 'Epos'],
    creator: 'Santa Monica Studio',
    publisher: 'Sony Interactive Entertainment',
    franchise_id: 'playstation:franchise:gow',
    collection_name: 'God of War Saga',
    totalUnits: 40,
    unit: 'hours',
    rating: 4.9,
    aliases: ['god of war ragnarok', 'gow ragnarok', 'gow ragnarök'],
  },
  {
    id: 'playstation:ghost-of-tsushima',
    external_id: 'playstation:ghost-of-tsushima',
    title: 'Ghost of Tsushima',
    originalTitle: 'Ghost of Tsushima',
    type: 'game',
    coverUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2215430/library_600x900_2x.jpg',
    releaseDate: '2020-07-17',
    summary: 'Jin Sakai muss seinen Ehrenkodex als Samurai hinter sich lassen, um die Insel Tsushima vor der mongolischen Invasion zu befreien.',
    genres: ['Action-Adventure', 'Open World', 'Samurai'],
    creator: 'Sucker Punch Productions',
    publisher: 'Sony Interactive Entertainment',
    franchise_id: 'playstation:franchise:tsushima',
    collection_name: 'Ghost of Tsushima',
    totalUnits: 45,
    unit: 'hours',
    rating: 4.9,
    aliases: ['ghost of tsushima', 'tsushima'],
  },
  {
    id: 'playstation:bloodborne',
    external_id: 'playstation:bloodborne',
    title: 'Bloodborne',
    originalTitle: 'Bloodborne',
    type: 'game',
    coverUrl: 'https://lutris.net/media/igdb/cover_big/co1rba.jpg',
    releaseDate: '2015-03-24',
    summary: 'Ein Jäger erwacht in der viktorianischen Stadt Yharnam, in der eine uralte Seuche die Menschen in bestialische Monster verwandelt.',
    genres: ['Action-RPG', 'Souls-like', 'Gothic-Horror'],
    creator: 'FromSoftware',
    publisher: 'Sony Computer Entertainment',
    franchise_id: 'playstation:franchise:bloodborne',
    collection_name: 'Bloodborne',
    totalUnits: 35,
    unit: 'hours',
    rating: 5.0,
    aliases: ['bloodborne', 'bloodborn'],
  },
  {
    id: 'playstation:demons-souls',
    external_id: 'playstation:demons-souls',
    title: "Demon's Souls",
    originalTitle: "Demon's Souls",
    type: 'game',
    coverUrl: 'https://lutris.net/media/igdb/cover_big/co2kj9.jpg',
    releaseDate: '2020-11-12',
    summary: 'Vollständiges PS5-Remake des Souls-Pioniers in der finsteren, nebelverhangenen Welt von Boletaria.',
    genres: ['Action-RPG', 'Souls-like', 'Dark Fantasy'],
    creator: 'Bluepoint Games / FromSoftware',
    publisher: 'Sony Interactive Entertainment',
    franchise_id: 'playstation:franchise:demonsouls',
    collection_name: "Demon's Souls",
    totalUnits: 30,
    unit: 'hours',
    rating: 4.8,
    aliases: ['demons souls', "demon's souls", 'demon souls'],
  },
  {
    id: 'playstation:horizon-zd',
    external_id: 'playstation:horizon-zd',
    title: 'Horizon Zero Dawn',
    originalTitle: 'Horizon Zero Dawn',
    type: 'game',
    coverUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1151640/library_600x900_2x.jpg',
    releaseDate: '2017-02-28',
    summary: 'Aloy erkundet eine postapokalyptische Erde, auf der riesige tierähnliche Maschinen die Herrschaft übernommen haben.',
    genres: ['Action-RPG', 'Open World', 'Sci-Fi'],
    creator: 'Guerrilla Games',
    publisher: 'Sony Interactive Entertainment',
    franchise_id: 'playstation:franchise:horizon',
    collection_name: 'Horizon Series',
    totalUnits: 45,
    unit: 'hours',
    rating: 4.8,
    aliases: ['horizon zero dawn', 'horizon 1', 'zero dawn'],
  },
  {
    id: 'playstation:horizon-fw',
    external_id: 'playstation:horizon-fw',
    title: 'Horizon Forbidden West',
    originalTitle: 'Horizon Forbidden West',
    type: 'game',
    coverUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2420110/library_600x900_2x.jpg',
    releaseDate: '2022-02-18',
    summary: 'Aloy bricht in den Verbotenen Westen auf, um das Geheimnis einer verheerenden biologischen Plage zu lüften.',
    genres: ['Action-RPG', 'Open World'],
    creator: 'Guerrilla Games',
    publisher: 'Sony Interactive Entertainment',
    franchise_id: 'playstation:franchise:horizon',
    collection_name: 'Horizon Series',
    totalUnits: 50,
    unit: 'hours',
    rating: 4.8,
    aliases: ['horizon forbidden west', 'horizon 2', 'forbidden west'],
  },
  // ================= BATMAN: ARKHAM REIHE =================
  {
    id: 'warner:batman-arkham-asylum',
    external_id: 'warner:batman-arkham-asylum',
    title: 'Batman: Arkham Asylum',
    originalTitle: 'Batman: Arkham Asylum',
    type: 'game',
    coverUrl: 'https://lutris.net/media/igdb/cover_big/co1voj.jpg',
    releaseDate: '2009-08-25',
    summary: 'Batman bringt den Joker in die Arkham-Heilanstalt, doch dieser übernimmt die Kontrolle und sperrt den Dunklen Ritter ein.',
    genres: ['Action-Adventure', 'Superhelden', 'Stealth'],
    creator: 'Rocksteady Studios',
    publisher: 'Warner Bros. Games / Eidos',
    franchise_id: 'warner:franchise:batman-arkham',
    collection_name: 'Batman Arkham Saga',
    totalUnits: 12,
    unit: 'hours',
    rating: 4.9,
    aliases: [
      'batman arkham asylum',
      'arkham asylum',
      'batman 1',
      'batman asylum',
      'asylum',
      'batman arkham city arkham asylum'
    ],
  },
  {
    id: 'warner:batman-arkham-city',
    external_id: 'warner:batman-arkham-city',
    title: 'Batman: Arkham City',
    originalTitle: 'Batman: Arkham City',
    type: 'game',
    coverUrl: 'https://lutris.net/media/igdb/cover_big/co1voh.jpg',
    releaseDate: '2011-10-18',
    summary: 'Ein riesiger offener Gefängnisdistrikt in Gotham City: Batman kämpft gegen Hugo Strange, den Joker und das gesamte Schurken-Aufgebot.',
    genres: ['Action-Adventure', 'Open World', 'Meisterwerk'],
    creator: 'Rocksteady Studios',
    publisher: 'Warner Bros. Games',
    franchise_id: 'warner:franchise:batman-arkham',
    collection_name: 'Batman Arkham Saga',
    totalUnits: 15,
    unit: 'hours',
    rating: 5.0,
    aliases: [
      'batman arkham city',
      'arkham city',
      'batman 2',
      'batman city',
      'city',
      'batman arkham city arkham asylum'
    ],
  },
  {
    id: 'warner:batman-arkham-knight',
    external_id: 'warner:batman-arkham-knight',
    title: 'Batman: Arkham Knight',
    originalTitle: 'Batman: Arkham Knight',
    type: 'game',
    coverUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/208650/library_600x900_2x.jpg',
    releaseDate: '2015-06-23',
    summary: 'Das explosive Finale der Trilogie: Scarecrow und der mysteriöse Arkham Knight vereinen Gothams Superschurken, um Batman endgültig zu vernichten.',
    genres: ['Action-Adventure', 'Open World', 'Batmobile'],
    creator: 'Rocksteady Studios',
    publisher: 'Warner Bros. Games',
    franchise_id: 'warner:franchise:batman-arkham',
    collection_name: 'Batman Arkham Saga',
    totalUnits: 20,
    unit: 'hours',
    rating: 4.8,
    aliases: [
      'batman arkham knight',
      'arkham knight',
      'batman 3',
      'batman knight'
    ],
  },
  {
    id: 'warner:batman-arkham-origins',
    external_id: 'warner:batman-arkham-origins',
    title: 'Batman: Arkham Origins',
    originalTitle: 'Batman: Arkham Origins',
    type: 'game',
    coverUrl: 'https://lutris.net/media/igdb/cover_big/co1voi.jpg',
    releaseDate: '2013-10-25',
    summary: 'Heiligabend in Gotham City: Black Mask setzt ein Kopfgeld auf den jungen Batman aus und schickt acht tödliche Attentäter.',
    genres: ['Action-Adventure', 'Open World', 'Prequel'],
    creator: 'WB Games Montréal',
    publisher: 'Warner Bros. Games',
    franchise_id: 'warner:franchise:batman-arkham',
    collection_name: 'Batman Arkham Saga',
    totalUnits: 14,
    unit: 'hours',
    rating: 4.6,
    aliases: ['batman arkham origins', 'arkham origins', 'batman origins'],
  },
  {
    id: 'warner:batman-return-to-arkham',
    external_id: 'warner:batman-return-to-arkham',
    title: 'Batman: Return to Arkham',
    originalTitle: 'Batman: Return to Arkham',
    type: 'game',
    coverUrl: 'https://lutris.net/media/igdb/cover_big/co1vok.jpg',
    releaseDate: '2016-10-18',
    summary: 'Enthält Batman: Arkham Asylum und Batman: Arkham City komplett überarbeitet für PS4, Xbox One und Konsolen.',
    genres: ['Action-Adventure', 'Bundle', 'Remaster'],
    creator: 'Virtuos / Rocksteady',
    publisher: 'Warner Bros. Games',
    franchise_id: 'warner:franchise:batman-arkham',
    collection_name: 'Batman Arkham Saga',
    totalUnits: 27,
    unit: 'hours',
    rating: 4.9,
    aliases: [
      'batman return to arkham',
      'return to arkham',
      'batman arkham collection',
      'batman arkham city arkham asylum',
      'arkham collection'
    ],
  },

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
    publisher: 'Bandai Namco Entertainment',
    franchise_id: 'rawg:franchise:eldenring',
    collection_name: 'Elden Ring Universe',
    totalUnits: 120,
    unit: 'hours',
    rating: 4.9,
    aliases: ['elden ring', 'shadow of the erdtree'],
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
    publisher: 'CD Projekt',
    franchise_id: 'rawg:franchise:witcher',
    collection_name: 'The Witcher Universe',
    totalUnits: 100,
    unit: 'hours',
    rating: 4.9,
    aliases: ['witcher 3', 'the witcher 3', 'wild hunt'],
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
    publisher: 'CD Projekt',
    franchise_id: 'rawg:franchise:cyberpunk',
    collection_name: 'Cyberpunk Universe',
    totalUnits: 65,
    unit: 'hours',
    rating: 4.6,
    aliases: ['cyberpunk', 'cyberpunk 2077', 'phantom liberty'],
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
    publisher: 'Larian Studios',
    franchise_id: 'rawg:franchise:bg',
    collection_name: "Baldur's Gate",
    totalUnits: 110,
    unit: 'hours',
    rating: 5.0,
    aliases: ['baldurs gate 3', "baldur's gate 3", 'bg3'],
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
    publisher: 'Rockstar Games',
    franchise_id: 'rawg:franchise:rdr',
    collection_name: 'Red Dead',
    totalUnits: 80,
    unit: 'hours',
    rating: 4.9,
    aliases: ['rdr2', 'red dead redemption 2', 'red dead 2'],
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
    publisher: 'Rockstar Games',
    franchise_id: 'rawg:franchise:gta',
    collection_name: 'Grand Theft Auto',
    totalUnits: 50,
    unit: 'hours',
    rating: 4.7,
    aliases: ['gta 5', 'gta v', 'grand theft auto 5', 'grand theft auto v'],
  },
  {
    id: 'nintendo:zelda-botw',
    external_id: 'nintendo:zelda-botw',
    title: 'The Legend of Zelda: Breath of the Wild',
    originalTitle: 'The Legend of Zelda: Breath of the Wild',
    type: 'game',
    coverUrl: 'https://lutris.net/media/igdb/cover_big/co3p2d.jpg',
    releaseDate: '2017-03-03',
    summary: 'Erwache aus einem 100-jährigen Schlaf und erkunde das ungezähmte Königreich Hyrule in völliger Freiheit.',
    genres: ['Action-Adventure', 'Open World'],
    creator: 'Nintendo',
    publisher: 'Nintendo',
    franchise_id: 'rawg:franchise:zelda',
    collection_name: 'The Legend of Zelda',
    totalUnits: 80,
    unit: 'hours',
    rating: 5.0,
    aliases: ['zelda breath of the wild', 'botw', 'breath of the wild'],
  },
  {
    id: 'rawg:zelda-totk',
    external_id: 'rawg:zelda-totk',
    title: 'The Legend of Zelda: Tears of the Kingdom',
    originalTitle: 'The Legend of Zelda: Tears of the Kingdom',
    type: 'game',
    coverUrl: 'https://lutris.net/media/igdb/co5vmg.png',
    releaseDate: '2023-05-12',
    summary: 'Link erkundet das Land Hyrule und die endlosen Himmelsinseln mit neuen Baufähigkeiten und Artefakten.',
    genres: ['Action-Adventure', 'Open World'],
    creator: 'Nintendo',
    publisher: 'Nintendo',
    franchise_id: 'rawg:franchise:zelda',
    collection_name: 'The Legend of Zelda',
    totalUnits: 90,
    unit: 'hours',
    rating: 4.9,
    aliases: ['zelda tears of the kingdom', 'totk', 'tears of the kingdom'],
  },
  {
    id: 'nintendo:mario-odyssey',
    external_id: 'nintendo:mario-odyssey',
    title: 'Super Mario Odyssey',
    originalTitle: 'Super Mario Odyssey',
    type: 'game',
    coverUrl: 'https://lutris.net/media/igdb/cover_big/co1m76.jpg',
    releaseDate: '2017-10-27',
    summary: 'Begleite Mario und Cappy auf einer weltumspannenden 3D-Reise mit dem Luftschiff Odyssey, um Prinzessin Peach zu retten.',
    genres: ['3D-Plattformer', 'Abenteuer'],
    creator: 'Nintendo',
    publisher: 'Nintendo',
    franchise_id: 'nintendo:franchise:mario',
    collection_name: 'Super Mario Series',
    totalUnits: 25,
    unit: 'hours',
    rating: 4.9,
    aliases: ['mario odyssey', 'super mario odyssey'],
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
    publisher: 'Team Cherry',
    franchise_id: 'rawg:franchise:hollowknight',
    collection_name: 'Hollow Knight Series',
    totalUnits: 40,
    unit: 'hours',
    rating: 4.8,
    aliases: ['hollow knight', 'hollowknight'],
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
    publisher: 'Game Science',
    franchise_id: 'rawg:franchise:wukong',
    totalUnits: 45,
    unit: 'hours',
    rating: 4.8,
    aliases: ['black myth wukong', 'wukong'],
  },
  {
    id: 'playstation:ff7-remake',
    external_id: 'playstation:ff7-remake',
    title: 'Final Fantasy VII Remake',
    originalTitle: 'Final Fantasy VII Remake',
    type: 'game',
    coverUrl: 'https://lutris.net/media/igdb/cover_big/co1r76.jpg',
    releaseDate: '2020-04-10',
    summary: 'Cloud Strife kämpft in der Industriemetropole Midgar an der Seite von Avalanche gegen den Megakonzern Shinra.',
    genres: ['Action-RPG', 'JRPG'],
    creator: 'Square Enix',
    publisher: 'Square Enix',
    franchise_id: 'square:franchise:ff7',
    collection_name: 'Final Fantasy VII Remake Project',
    totalUnits: 35,
    unit: 'hours',
    rating: 4.8,
    aliases: ['final fantasy 7 remake', 'ff7 remake', 'ffvii remake'],
  },
  {
    id: 'playstation:ff7-rebirth',
    external_id: 'playstation:ff7-rebirth',
    title: 'Final Fantasy VII Rebirth',
    originalTitle: 'Final Fantasy VII Rebirth',
    type: 'game',
    coverUrl: 'https://lutris.net/media/igdb/cover_big/co7320.jpg',
    releaseDate: '2024-02-29',
    summary: 'Cloud und seine Gefährten verlassen Midgar und erkunden die weite Welt auf der Jagd nach Sephiroth.',
    genres: ['Action-RPG', 'Open World', 'JRPG'],
    creator: 'Square Enix',
    publisher: 'Square Enix',
    franchise_id: 'square:franchise:ff7',
    collection_name: 'Final Fantasy VII Remake Project',
    totalUnits: 65,
    unit: 'hours',
    rating: 4.9,
    aliases: ['final fantasy 7 rebirth', 'ff7 rebirth', 'ffvii rebirth'],
  },
  {
    id: 'atlus:persona-5-royal',
    external_id: 'atlus:persona-5-royal',
    title: 'Persona 5 Royal',
    originalTitle: 'Persona 5 Royal',
    type: 'game',
    coverUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1687950/library_600x900_2x.jpg',
    releaseDate: '2019-10-31',
    summary: 'Schlüpfe in die Rolle von Joker und stiehl die verkommenen Begierden korrupter Herzen in Tokyo.',
    genres: ['JRPG', 'Social Sim', 'Turn-Based'],
    creator: 'Atlus',
    publisher: 'Sega',
    franchise_id: 'atlus:franchise:persona',
    collection_name: 'Persona Series',
    totalUnits: 100,
    unit: 'hours',
    rating: 5.0,
    aliases: ['persona 5', 'p5r', 'persona 5 royal'],
  },
];

async function searchWikipediaGames(query: string): Promise<SearchResultItem[]> {
  const items: SearchResultItem[] = [];
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
      query
    )}&srlimit=6&format=json&origin=*`;
    const sRes = await fetch(searchUrl, {
      headers: { 'User-Agent': 'OmniTrack/1.0 (https://omnitrack.app)' },
      signal: AbortSignal.timeout(4000),
    });
    if (!sRes.ok) return [];
    const sData = await sRes.json();
    const hits = sData.query?.search || [];

    for (const h of hits) {
      try {
        const sumUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(h.title)}`;
        const sumRes = await fetch(sumUrl, {
          headers: { 'User-Agent': 'OmniTrack/1.0 (https://omnitrack.app)' },
          signal: AbortSignal.timeout(3000),
        });
        if (!sumRes.ok) continue;
        const sumData = await sumRes.json();
        const desc = (sumData.description || '').toLowerCase();
        const extract = (sumData.extract || '').toLowerCase();

        const isGame =
          (desc.includes('video game') ||
            desc.includes('arcade game') ||
            desc.includes('role-playing game') ||
            desc.includes('platform game') ||
            desc.includes('action-adventure') ||
            extract.includes('video game developed') ||
            extract.includes('action-adventure game') ||
            extract.includes('game developed and published') ||
            extract.includes('gameplay')) &&
          !desc.includes('film') &&
          !desc.includes('television') &&
          !desc.includes('director') &&
          !desc.includes('producer') &&
          !desc.includes('designer') &&
          !desc.includes('composer') &&
          !desc.includes('programmer') &&
          !desc.includes('executive') &&
          !desc.includes('born ') &&
          !desc.includes('fictional character') &&
          !desc.includes('soundtrack');

        const coverUrl = sumData.thumbnail?.source || sumData.originalimage?.source;

        if (isGame && coverUrl) {
          const yearMatch = sumData.description?.match(/\b(19\d\d|20\d\d)\b/);
          items.push({
            id: `wiki:${sumData.pageid || h.title}`,
            external_id: `wiki:${sumData.pageid || h.title}`,
            title: sumData.title,
            type: 'game',
            coverUrl: coverUrl,
            releaseDate: yearMatch ? `${yearMatch[0]}-01-01` : undefined,
            summary: sumData.extract
              ? sumData.extract.slice(0, 240) + '...'
              : `Videospiel (${sumData.description || 'Konsole & PC'}).`,
            genres: ['Videospiel', sumData.description ? sumData.description.replace(/\b\d{4}\b/, '').trim() : 'Konsole & PC'],
            creator: sumData.description || 'Multiplattform',
            totalUnits: 30,
            unit: 'hours',
            rating: 4.8,
          });
        }
      } catch (err) {
        // Continue to next hit
      }
      if (items.length >= 4) break;
    }
  } catch (e) {
    console.warn('Wikipedia game search error:', e);
  }
  return items;
}

export class RAWGAdapter implements MediaAdapter {
  async search(query: string): Promise<SearchResultItem[]> {
    const rawLower = query.trim().toLowerCase();
    if (!rawLower) {
      return POPULAR_GAMES_CATALOG;
    }

    const queryVariants = normalizeGameQuery(rawLower);

    // Multi-search target collection (handles compound searches like "Batman arkham city arkham asylum")
    const searchTargets: string[] = [];
    if (rawLower.includes('arkham city') && rawLower.includes('arkham asylum')) {
      searchTargets.push('batman: arkham asylum', 'batman: arkham city');
    } else {
      searchTargets.push(queryVariants[1] || queryVariants[0]);
    }

    const catalogMatches: SearchResultItem[] = [];

    // 1. Check popular and curated console catalog with alias and substring intelligence
    for (const game of POPULAR_GAMES_CATALOG) {
      const isMatch = queryVariants.some((v) => {
        if (game.title.toLowerCase().includes(v)) return true;
        if (game.originalTitle?.toLowerCase().includes(v)) return true;
        if (game.creator?.toLowerCase().includes(v)) return true;
        if (game.publisher?.toLowerCase().includes(v)) return true;
        if (game.collection_name?.toLowerCase().includes(v)) return true;
        if (game.aliases && game.aliases.some((a) => a.toLowerCase().includes(v) || v.includes(a.toLowerCase()))) {
          return true;
        }

        // Check if all words of the variant match anywhere in title or aliases
        const words = v.split(/\s+/).filter((w) => w.length > 1);
        if (words.length > 0) {
          const haystack = (
            game.title +
            ' ' +
            (game.originalTitle || '') +
            ' ' +
            (game.aliases ? game.aliases.join(' ') : '')
          ).toLowerCase();
          if (words.every((w) => haystack.includes(w))) return true;
        }
        return false;
      });

      if (isMatch) {
        catalogMatches.push(game);
      }
    }

    const items: SearchResultItem[] = [...catalogMatches];
    const seenTitles = new Set<string>(items.map((i) => i.title.toLowerCase()));

    // 2. Global Multi-Console & PC Search via Wikipedia Video Games DB
    for (const target of searchTargets) {
      try {
        const wikiHits = await searchWikipediaGames(target);
        for (const game of wikiHits) {
          const norm = game.title.toLowerCase();
          if (!seenTitles.has(norm)) {
            seenTitles.add(norm);
            items.push(game);
          }
        }
      } catch (e) {
        console.warn('Wikipedia game search failed for target:', target, e);
      }
    }

    // 3. Live Lutris Open Video Games Database Search API (Multiplatform: PlayStation, Nintendo, Xbox, PC, Retro)
    for (const target of searchTargets) {
      try {
        const lutrisRes = await fetch(
          `https://lutris.net/api/games?search=${encodeURIComponent(target)}`,
          { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(4000) }
        );
        if (lutrisRes.ok) {
          const lutrisData = await lutrisRes.json();
          const qLower = target.toLowerCase().trim();
          const validGames = (lutrisData.results || [])
            .filter((g: any) => g.name && g.coverart)
            .sort((a: any, b: any) => {
              const aLower = a.name.toLowerCase();
              const bLower = b.name.toLowerCase();
              if (aLower === qLower && bLower !== qLower) return -1;
              if (bLower === qLower && aLower !== qLower) return 1;
              const aStarts = aLower.startsWith(qLower);
              const bStarts = bLower.startsWith(qLower);
              if (aStarts && !bStarts) return -1;
              if (!aStarts && bStarts) return 1;
              const aIsMod = aLower.includes('mod') || aLower.includes('edition');
              const bIsMod = bLower.includes('mod') || bLower.includes('edition');
              if (!aIsMod && bIsMod) return -1;
              if (aIsMod && !bIsMod) return 1;
              return 0;
            })
            .slice(0, 6);

          for (const game of validGames) {
            const external_id = `lutris:${game.slug || game.id}`;
            const norm = game.name.toLowerCase();
            if (!seenTitles.has(norm)) {
              seenTitles.add(norm);
              const platformsStr = game.platforms?.map((p: any) => p.name).join(', ');
              items.push({
                id: external_id,
                external_id,
                title: game.name,
                type: 'game',
                coverUrl: game.coverart,
                releaseDate: game.year ? `${game.year}-01-01` : undefined,
                summary: platformsStr
                  ? `Plattformen: ${platformsStr}`
                  : `Videospiel in der offenen Spieledatenbank.`,
                genres: ['Videospiel', platformsStr ? platformsStr.split(', ')[0] : 'Multiplattform'],
                creator: platformsStr || 'Videospiel',
                franchise_id: `lutris:franchise:${game.slug || game.id}`,
                totalUnits: 30,
                unit: 'hours',
                rating: 4.7,
              });
            }
          }
        }
      } catch (e) {
        console.warn('Lutris search failed for target:', target, e);
      }
    }

    // 4. Live Steam Store Search API (Completely FREE, public)
    for (const target of searchTargets) {
      try {
        const steamRes = await fetch(
          `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(target)}&l=german&cc=DE`,
          { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(4000) }
        );
        if (steamRes.ok) {
          const data = await steamRes.json();
          for (const game of (data.items || []).slice(0, 4)) {
            if (!game.name || !game.id) continue;
            const external_id = `steam:${game.id}`;
            const norm = game.name.toLowerCase();
            const coverUrl = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${game.id}/library_600x900_2x.jpg`;

            if (!seenTitles.has(norm)) {
              seenTitles.add(norm);
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
        }
      } catch (e) {
        console.warn('Steam Store Search failed for target:', target, e);
      }
    }

    // 5. RAWG Live API if configured
    if (RAWG_API_KEY) {
      try {
        const res = await fetch(
          `${RAWG_BASE_URL}/games?search=${encodeURIComponent(queryVariants[0])}&key=${RAWG_API_KEY}&page_size=8`
        );
        if (res.ok) {
          const data = await res.json();
          for (const game of data.results || []) {
            const external_id = `rawg:${game.id}`;
            const norm = game.name.toLowerCase();
            if (!seenTitles.has(norm)) {
              seenTitles.add(norm);
              items.push({
                id: external_id,
                external_id,
                title: game.name,
                type: 'game',
                coverUrl: game.background_image || createNoCoverSvg(game.name, 'game'),
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
        }
      } catch (e) {
        console.warn('RAWG live search failed:', e);
      }
    }

    if (items.length > 0) {
      return items;
    }

    // Dynamic fallback with dark no-cover placeholder
    const capitalized = query.trim().replace(/\b\w/g, (c) => c.toUpperCase());
    return [
      {
        id: `custom:game:${Date.now()}`,
        external_id: `custom:game:${Date.now()}`,
        title: capitalized,
        type: 'game',
        coverUrl: createNoCoverSvg(capitalized, 'game'),
        releaseDate: new Date().toISOString().split('T')[0],
        summary: undefined,
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

    // 1. Uncharted 1 -> Uncharted 2
    if (
      (item.external_id === 'playstation:uncharted-1' || titleLower.includes('drakes schicksal') || (titleLower.includes('uncharted') && (titleLower.includes('fortune') || titleLower.includes(' 1')))) &&
      !titleLower.includes('among thieves') &&
      !titleLower.includes('uncharted 2')
    ) {
      return {
        id: `seq-uncharted-2-${item.id}`,
        parentMediaId: item.id,
        parentMediaTitle: item.title,
        parentMediaType: 'game',
        parentCoverUrl: item.coverUrl,
        sequelTitle: 'Uncharted 2: Among Thieves',
        sequelType: 'game',
        sequelCoverUrl: 'https://lutris.net/media/igdb/cover_big/co1tnb.jpg',
        releaseDate: '2009-10-13',
        status: 'released',
        badgeText: 'Jetzt verfügbar',
        external_id: 'playstation:uncharted-2',
        franchise_id: 'playstation:franchise:uncharted',
        description: 'Das gefeierte Sequel: Nathan Drake folgt Marco Polos Spuren nach Shambhala.',
        detectedAt: new Date().toISOString(),
        progressSuggestion: { current: 0, total: 11, unit: 'hours' },
      };
    }

    // 2. Uncharted 2 -> Uncharted 3
    if (
      (item.external_id === 'playstation:uncharted-2' || (titleLower.includes('uncharted') && (titleLower.includes('among thieves') || titleLower.includes(' 2')))) &&
      !titleLower.includes('deception') &&
      !titleLower.includes('uncharted 3')
    ) {
      return {
        id: `seq-uncharted-3-${item.id}`,
        parentMediaId: item.id,
        parentMediaTitle: item.title,
        parentMediaType: 'game',
        parentCoverUrl: item.coverUrl,
        sequelTitle: "Uncharted 3: Drake's Deception",
        sequelType: 'game',
        sequelCoverUrl: 'https://lutris.net/media/igdb/cover_big/co1tp8.jpg',
        releaseDate: '2011-11-01',
        status: 'released',
        badgeText: 'Jetzt verfügbar',
        external_id: 'playstation:uncharted-3',
        franchise_id: 'playstation:franchise:uncharted',
        description: 'Nathan Drake und Sully durchqueren die Wüste auf der Suche nach dem Atlantis des Sandes.',
        detectedAt: new Date().toISOString(),
        progressSuggestion: { current: 0, total: 11, unit: 'hours' },
      };
    }

    // 3. Astro's Playroom -> Astro Bot (2024)
    if (
      (item.external_id === 'playstation:astros-playroom' || titleLower.includes('playroom')) &&
      !titleLower.includes('2024') &&
      item.title !== 'Astro Bot'
    ) {
      return {
        id: `seq-astro-bot-${item.id}`,
        parentMediaId: item.id,
        parentMediaTitle: item.title,
        parentMediaType: 'game',
        parentCoverUrl: item.coverUrl,
        sequelTitle: 'Astro Bot (PS5)',
        sequelType: 'game',
        sequelCoverUrl: 'https://lutris.net/media/igdb/cover_big/co8aad.jpg',
        releaseDate: '2024-09-06',
        status: 'released',
        badgeText: 'Jetzt verfügbar',
        external_id: 'playstation:astro-bot-2024',
        franchise_id: 'playstation:franchise:astrobot',
        description: 'Das große 3D-Plattformer-Meisterwerk von Team ASOBI mit über 300 VIP-Bots.',
        detectedAt: new Date().toISOString(),
        progressSuggestion: { current: 0, total: 15, unit: 'hours' },
      };
    }

    // 4. Spider-Man -> Spider-Man 2
    if (
      (item.external_id === 'playstation:spiderman-ps4' || item.external_id === 'playstation:spiderman-remastered' || (titleLower.includes('spider-man') && !titleLower.includes(' 2') && !titleLower.includes('miles'))) &&
      !titleLower.includes('spider-man 2') &&
      !titleLower.includes('spiderman 2')
    ) {
      return {
        id: `seq-spiderman-2-${item.id}`,
        parentMediaId: item.id,
        parentMediaTitle: item.title,
        parentMediaType: 'game',
        parentCoverUrl: item.coverUrl,
        sequelTitle: "Marvel's Spider-Man 2",
        sequelType: 'game',
        sequelCoverUrl: 'https://lutris.net/media/igdb/cover_big/co3swf.jpg',
        releaseDate: '2023-10-20',
        status: 'released',
        badgeText: 'Jetzt verfügbar',
        external_id: 'playstation:spiderman-2',
        franchise_id: 'playstation:franchise:spiderman',
        description: 'Peter Parker und Miles Morales kämpfen gemeinsam gegen Venom und Kraven den Jäger.',
        detectedAt: new Date().toISOString(),
        progressSuggestion: { current: 0, total: 20, unit: 'hours' },
      };
    }

    // 5. The Last of Us -> The Last of Us Part II
    if (
      (item.external_id === 'playstation:tlou-original' || item.external_id === 'playstation:tlou-remastered' || item.external_id === 'playstation:tlou-part-1' || (titleLower.includes('last of us') && !titleLower.includes('part ii') && !titleLower.includes('part 2') && !titleLower.includes('part 1'))) &&
      !titleLower.includes('part 2') &&
      !titleLower.includes('part ii')
    ) {
      return {
        id: `seq-tlou-2-${item.id}`,
        parentMediaId: item.id,
        parentMediaTitle: item.title,
        parentMediaType: 'game',
        parentCoverUrl: item.coverUrl,
        sequelTitle: 'The Last of Us Part II',
        sequelType: 'game',
        sequelCoverUrl: 'https://lutris.net/media/igdb/cover_big/co1r0o.jpg',
        releaseDate: '2020-06-19',
        status: 'released',
        badgeText: 'Jetzt verfügbar',
        external_id: 'playstation:tlou-part-2',
        franchise_id: 'playstation:franchise:tlou',
        description: 'Fünf Jahre später: Ellie begibt sich auf einen unerbittlichen Vergeltungszug durch Seattle.',
        detectedAt: new Date().toISOString(),
        progressSuggestion: { current: 0, total: 25, unit: 'hours' },
      };
    }

    // 6. Elden Ring -> Shadow of the Erdtree
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

    // 7. God of War -> God of War Ragnarök
    if (
      (item.external_id === 'playstation:gow-2018' || (titleLower.includes('god of war') && !titleLower.includes('ragnar'))) &&
      !titleLower.includes('ragnarok') &&
      !titleLower.includes('ragnarök')
    ) {
      return {
        id: `seq-gow-ragnarok-${item.id}`,
        parentMediaId: item.id,
        parentMediaTitle: item.title,
        parentMediaType: 'game',
        parentCoverUrl: item.coverUrl,
        sequelTitle: 'God of War Ragnarök',
        sequelType: 'game',
        sequelCoverUrl: 'https://lutris.net/media/igdb/cover_big/co3swk.jpg',
        releaseDate: '2022-11-09',
        status: 'released',
        badgeText: 'Jetzt verfügbar',
        external_id: 'playstation:gow-ragnarok',
        franchise_id: 'playstation:franchise:gow',
        description: 'Kratos und Atreus reisen durch die Neun Welten vor Beginn von Ragnarök.',
        detectedAt: new Date().toISOString(),
        progressSuggestion: { current: 0, total: 40, unit: 'hours' },
      };
    }

    // 8. The Witcher 3 -> The Witcher 4: Polaris
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

    // 9. Hollow Knight -> Silksong
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

    // 10. GTA V -> GTA VI
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
          'https://lutris.net/media/igdb/cover_big/co7g61.jpg',
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

    // 11. Batman: Arkham Asylum -> Batman: Arkham City
    if (
      (item.external_id === 'warner:batman-arkham-asylum' || (titleLower.includes('arkham') && titleLower.includes('asylum'))) &&
      !titleLower.includes('city') &&
      !titleLower.includes('knight')
    ) {
      return {
        id: `seq-arkham-city-${item.id}`,
        parentMediaId: item.id,
        parentMediaTitle: item.title,
        parentMediaType: 'game',
        parentCoverUrl: item.coverUrl,
        sequelTitle: 'Batman: Arkham City',
        sequelType: 'game',
        sequelCoverUrl: 'https://lutris.net/media/igdb/cover_big/co1voh.jpg',
        releaseDate: '2011-10-18',
        status: 'released',
        badgeText: 'Jetzt verfügbar',
        external_id: 'warner:batman-arkham-city',
        franchise_id: 'warner:franchise:batman-arkham',
        description: 'Das gefeierte Meisterwerk: Batman wird in den offenen Gefängnis-Superdistrikt Arkham City eingeschleust.',
        detectedAt: new Date().toISOString(),
        progressSuggestion: { current: 0, total: 15, unit: 'hours' },
      };
    }

    // 12. Batman: Arkham City -> Batman: Arkham Knight
    if (
      (item.external_id === 'warner:batman-arkham-city' || (titleLower.includes('arkham') && titleLower.includes('city'))) &&
      !titleLower.includes('knight') &&
      !titleLower.includes('origins')
    ) {
      return {
        id: `seq-arkham-knight-${item.id}`,
        parentMediaId: item.id,
        parentMediaTitle: item.title,
        parentMediaType: 'game',
        parentCoverUrl: item.coverUrl,
        sequelTitle: 'Batman: Arkham Knight',
        sequelType: 'game',
        sequelCoverUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/208650/library_600x900_2x.jpg',
        releaseDate: '2015-06-23',
        status: 'released',
        badgeText: 'Jetzt verfügbar',
        external_id: 'warner:batman-arkham-knight',
        franchise_id: 'warner:franchise:batman-arkham',
        description: 'Das finale Kapitel der Rocksteady-Trilogie: Scarecrow und der Arkham Knight greifen ganz Gotham City an.',
        detectedAt: new Date().toISOString(),
        progressSuggestion: { current: 0, total: 20, unit: 'hours' },
      };
    }

    return null;
  }
}
