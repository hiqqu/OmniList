import { NextRequest, NextResponse } from 'next/server';
import {
  exchangeNpssoForCode,
  exchangeCodeForAccessToken,
  getUserTitles,
  getUserPlayedGames,
} from 'psn-api';

function parseIsoDurationToHours(duration?: string): number {
  if (!duration) return 0;
  let totalHours = 0;
  const daysMatch = duration.match(/(\d+)D/);
  if (daysMatch) {
    totalHours += parseInt(daysMatch[1], 10) * 24;
  }
  const hoursMatch = duration.match(/(\d+)H/);
  if (hoursMatch) {
    totalHours += parseInt(hoursMatch[1], 10);
  }
  const minutesMatch = duration.match(/(\d+)M/);
  if (minutesMatch) {
    totalHours += parseInt(minutesMatch[1], 10) / 60;
  }
  return Math.round(totalHours * 10) / 10;
}

function normalizePsnTitle(name?: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[®™©]/g, '')
    .replace(/\b(ps4|ps5|playstation 4|playstation 5|ps4™ & ps5™|ps4 & ps5)\b/gi, '')
    .replace(/\b(game of the year edition|goty|deluxe edition|definitive edition|remastered|director's cut|standard edition)\b/gi, '')
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/[:\-_—–,.'!?/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, npsso: customNpsso } = body;

    const npsso = (customNpsso || process.env.PSN_NPSSO || '').trim();

    if (!npsso) {
      return NextResponse.json(
        {
          error: 'Kein PlayStation NPSSO-Token angegeben.',
          hint: 'Melde dich auf store.playstation.com an und rufe https://ca.account.sony.com/api/v1/ssocookie auf, um deinen 64-stelligen NPSSO-Code zu kopieren.',
        },
        { status: 400 }
      );
    }

    // 1. Authenticate with Sony PSN
    let authorization: any;
    try {
      const accessCode = await exchangeNpssoForCode(npsso);
      authorization = await exchangeCodeForAccessToken(accessCode);
    } catch (authErr: any) {
      console.error('PSN Auth Error:', authErr);
      return NextResponse.json(
        {
          error: 'PlayStation NPSSO-Token ist abgelaufen oder ungültig.',
          expired: true,
          hint: 'Bitte erstelle dir auf https://ca.account.sony.com/api/v1/ssocookie einen frischen Token (du musst im Browser bei PlayStation angemeldet sein).',
        },
        { status: 401 }
      );
    }

    // ACTION: get-profile
    if (action === 'get-profile') {
      try {
        const titles = await getUserTitles(authorization, 'me', { limit: 1 });
        return NextResponse.json({
          success: true,
          authenticated: true,
          totalTitles: titles.totalItemCount || 0,
        });
      } catch (err: any) {
        return NextResponse.json({ success: true, authenticated: true });
      }
    }

    // ACTION: get-games (titles, trophies & playtime)
    if (action === 'get-games') {
      // 1. Fetch played games with exact playtime from PSN game list
      let playedTitlesList: any[] = [];
      const playedTitlesMap = new Map<string, { playtimeHours: number; lastPlayed?: string; pt: any }>();

      try {
        const playedRes = await getUserPlayedGames(authorization, 'me', {
          limit: 200,
          offset: 0,
          categories: 'ps4_game,ps5_native_game,pspc_game,unknown',
        });
        playedTitlesList = (playedRes as any)?.titles || [];

        for (const pt of playedTitlesList) {
          const hours = parseIsoDurationToHours(pt.playDuration);
          const info = {
            playtimeHours: hours,
            lastPlayed: pt.lastPlayedDateTime,
            pt,
          };

          if (pt.titleId) {
            playedTitlesMap.set(pt.titleId.toLowerCase().trim(), info);
          }
          if (pt.name) {
            playedTitlesMap.set(pt.name.toLowerCase().trim(), info);
            playedTitlesMap.set(normalizePsnTitle(pt.name), info);
          }
          if (pt.localizedName) {
            playedTitlesMap.set(pt.localizedName.toLowerCase().trim(), info);
            playedTitlesMap.set(normalizePsnTitle(pt.localizedName), info);
          }
          if (pt.concept?.name) {
            playedTitlesMap.set(pt.concept.name.toLowerCase().trim(), info);
            playedTitlesMap.set(normalizePsnTitle(pt.concept.name), info);
          }
          if (Array.isArray(pt.concept?.titleIds)) {
            for (const tid of pt.concept.titleIds) {
              if (tid) playedTitlesMap.set(tid.toLowerCase().trim(), info);
            }
          }
        }
      } catch (err) {
        console.warn('Could not fetch exact PSN playtime via getUserPlayedGames:', err);
      }

      // 2. Fetch trophy titles
      let trophyTitles: any[] = [];
      try {
        const trophyResponse = await getUserTitles(authorization, 'me', { limit: 200 });
        trophyTitles = trophyResponse.trophyTitles || [];
      } catch (tErr) {
        console.warn('Could not fetch PSN trophy titles:', tErr);
      }

      const matchedPlayedTitleIds = new Set<string>();
      const matchedPlayedNames = new Set<string>();

      // 3. Map trophy titles and attach matched playtime
      const games = trophyTitles.map((t: any) => {
        const normTrophy = normalizePsnTitle(t.trophyTitleName);
        let playedInfo =
          (t.npTitleId ? playedTitlesMap.get(t.npTitleId.toLowerCase().trim()) : null) ||
          playedTitlesMap.get(t.trophyTitleName?.toLowerCase().trim()) ||
          playedTitlesMap.get(normTrophy);

        // Fuzzy match if not exact
        if (!playedInfo && normTrophy) {
          for (const pt of playedTitlesList) {
            const normPt = normalizePsnTitle(pt.name || pt.localizedName || pt.concept?.name || '');
            if (
              normPt &&
              (normPt === normTrophy ||
                normPt.includes(normTrophy) ||
                normTrophy.includes(normPt))
            ) {
              playedInfo = {
                playtimeHours: parseIsoDurationToHours(pt.playDuration),
                lastPlayed: pt.lastPlayedDateTime,
                pt,
              };
              break;
            }
          }
        }

        if (playedInfo?.pt) {
          if (playedInfo.pt.titleId) matchedPlayedTitleIds.add(playedInfo.pt.titleId);
          if (playedInfo.pt.name) matchedPlayedNames.add(normalizePsnTitle(playedInfo.pt.name));
        }

        const playtimeHours = playedInfo?.playtimeHours ?? 0;

        const defined = t.definedTrophies || { bronze: 0, silver: 0, gold: 0, platinum: 0 };
        const earned = t.earnedTrophies || { bronze: 0, silver: 0, gold: 0, platinum: 0 };

        const totalTrophies = (defined.bronze || 0) + (defined.silver || 0) + (defined.gold || 0) + (defined.platinum || 0);
        const currentTrophies = (earned.bronze || 0) + (earned.silver || 0) + (earned.gold || 0) + (earned.platinum || 0);

        const hasPlatinum = Boolean(earned.platinum && earned.platinum > 0);
        const completionist100 = hasPlatinum || (currentTrophies === totalTrophies && totalTrophies > 0);

        return {
          id: `psn:${t.npCommunicationId}`,
          communicationId: t.npCommunicationId,
          name: t.trophyTitleName,
          platform: t.trophyTitlePlatform || 'PS5',
          coverUrl: t.trophyTitleIconUrl,
          playtimeHours,
          lastPlayed: playedInfo?.lastPlayed,
          trophies: {
            current: currentTrophies,
            total: totalTrophies,
            hasPlatinum,
            completionist100,
            bronze: earned.bronze || 0,
            silver: earned.silver || 0,
            gold: earned.gold || 0,
            platinum: earned.platinum || 0,
          },
        };
      });

      // 4. Also add any played games from library that didn't have a trophy title match
      for (const pt of playedTitlesList) {
        if (pt.titleId && matchedPlayedTitleIds.has(pt.titleId)) continue;
        const normPt = normalizePsnTitle(pt.name || pt.localizedName || pt.concept?.name || '');
        if (normPt && matchedPlayedNames.has(normPt)) continue;

        const hours = parseIsoDurationToHours(pt.playDuration);
        const cover =
          pt.imageUrl ||
          pt.localizedImageUrl ||
          pt.concept?.media?.images?.[0]?.url;

        games.push({
          id: `psn:${pt.titleId || pt.concept?.id || Math.random().toString(36).slice(2, 8)}`,
          communicationId: pt.titleId,
          name: pt.name || pt.localizedName || pt.concept?.name,
          platform: pt.category?.includes('ps5') ? 'PS5' : 'PS4',
          coverUrl: cover || '',
          playtimeHours: hours,
          lastPlayed: pt.lastPlayedDateTime,
          trophies: {
            current: 0,
            total: 0,
            hasPlatinum: false,
            completionist100: false,
            bronze: 0,
            silver: 0,
            gold: 0,
            platinum: 0,
          },
        });
      }

      games.sort((a: any, b: any) => b.playtimeHours - a.playtimeHours);

      return NextResponse.json({
        success: true,
        totalCount: games.length,
        games,
      });
    }

    return NextResponse.json({ error: 'Ungültige Aktion.' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in /api/sync/psn:', error);
    return NextResponse.json(
      { error: error.message || 'Interner Serverfehler beim PlayStation-Abgleich.' },
      { status: 500 }
    );
  }
}
