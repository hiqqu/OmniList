export function getKnownGamePresets(title: string): { summary?: string; genres?: string[]; creator?: string } {
  const norm = (title || '').toLowerCase();
  if (norm.includes('arkham knight')) {
    return {
      summary: 'Batman™: Arkham Knight stellt das epische Finale der preisgekrönten Arkham-Trilogie von Rocksteady Studios dar. Der Dunkle Ritter stellt sich der ultimativen Bedrohung gegen die Stadt, die er geschworen hat zu beschützen.',
      genres: ['Action', 'Open World', 'Superheld'],
      creator: 'Rocksteady Studios',
    };
  }
  if (norm.includes('arkham city')) {
    return {
      summary: 'Arkham City baut auf der intensiven Atmosphäre von Arkham Asylum auf und schickt Batman in ein riesiges, von Schwerverbrechern beherrschtes Gefängnisviertel von Gotham City.',
      genres: ['Action', 'Open World', 'Superheld'],
      creator: 'Rocksteady Studios',
    };
  }
  if (norm.includes('witcher 3') || norm.includes('wilde jagd') || norm.includes('wild hunt')) {
    return {
      summary: 'Als Hexer Geralt von Riva durchreist du vom Krieg verwüstete Länder auf der Suche nach Ciri, dem Kind der Prophezeiung.',
      genres: ['Open World', 'RPG', 'Story'],
      creator: 'CD PROJEKT RED',
    };
  }
  if (norm.includes('cyberpunk 2077')) {
    return {
      summary: 'Ein Open-World-Action-Adventure in Night City, einer von Macht, Glamour und Körpermodifikationen besessenen Megacity.',
      genres: ['Cyberpunk', 'Open World', 'Action RPG'],
      creator: 'CD PROJEKT RED',
    };
  }
  if (norm.includes('elden ring')) {
    return {
      summary: 'Erhebe dich, Befleckter, und werde zum Eldenfürsten im Zwischenland. Entdecke ein riesiges Fantasy-Abenteuer von FromSoftware und George R. R. Martin.',
      genres: ['Souls-like', 'Dark Fantasy', 'Open World'],
      creator: 'FromSoftware Inc.',
    };
  }
  if (norm.includes('bloodborne')) {
    return {
      summary: 'Ein düsteres Action-Rollenspiel voller unerbittlicher Gefahren in der verfallenen Stadt Yharnam, die von einer unheimlichen Seuche heimgesucht wird.',
      genres: ['Action RPG', 'Gothic Horror', 'Souls-like'],
      creator: 'FromSoftware / Japan Studio',
    };
  }
  if (norm.includes('god of war ragnar')) {
    return {
      summary: 'Kratos und Atreus begeben sich auf eine mythische Reise durch alle neun Reiche, während die Streitkräfte Asgards sich auf den prophezeiten Untergang vorbereiten.',
      genres: ['Action-Adventure', 'Mythologie', 'Story'],
      creator: 'Santa Monica Studio',
    };
  }
  if (norm.includes('god of war')) {
    return {
      summary: 'Gemeinsam mit seinem Sohn Atreus wagt Kratos den Schritt in die unbarmherzige Wildnis der nordischen Mythologie.',
      genres: ['Action-Adventure', 'Mythologie', 'Story'],
      creator: 'Santa Monica Studio',
    };
  }
  if (norm.includes('last of us')) {
    return {
      summary: 'Erlebe die emotionale Erzählung und die unvergesslichen Charaktere von Joel und Ellie in einer von einer tödlichen Pilzinfektion verwüsteten Welt.',
      genres: ['Action-Adventure', 'Story', 'Postapokalypse'],
      creator: 'Naughty Dog',
    };
  }
  if (norm.includes('spider-man') || norm.includes('spiderman')) {
    return {
      summary: 'Schwinge als Spider-Man durch ein atemberaubend lebendiges New York und stelle dich ikonischen Superschurken aus dem Marvel-Universum.',
      genres: ['Action', 'Open World', 'Superheld'],
      creator: 'Insomniac Games',
    };
  }
  if (norm.includes('baldur')) {
    return {
      summary: 'Stelle deine Gefährten zusammen und kehre in die Vergessenen Reiche zurück in einer fesselnden D&D-Geschichte voller Freiheit und bedeutsamer Entscheidungen.',
      genres: ['CRPG', 'D&D', 'Rundenbasiert'],
      creator: 'Larian Studios',
    };
  }
  if (norm.includes('hades')) {
    return {
      summary: 'Trotze dem Gott der Toten und erkämpfe dir deinen Weg aus der Unterwelt der griechischen Mythologie in diesem preisgekrönten Rogue-like Dungeon Crawler.',
      genres: ['Rogue-like', 'Action', 'Griechische Mythologie'],
      creator: 'Supergiant Games',
    };
  }
  return {};
}
