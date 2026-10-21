import { NextRequest, NextResponse } from 'next/server';
import {
  exchangeNpssoForCode,
  exchangeCodeForAccessToken,
  getUserTitles,
  getUserPlayedGames,
  getProfileFromUserName,
} from 'psn-api';

function parseIsoDurationToHours(duration?: string): number {
  if (!duration) return 0;
  const hoursMatch = duration.match(/(\d+)H/);
  const minutesMatch = duration.match(/(\d+)M/);
  const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
  const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;
  return Math.round((hours + minutes / 60) * 10) / 10;
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
          error: 'Ungültiger oder abgelaufener PlayStation NPSSO-Token.',
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
      // 1. Fetch trophy titles (has trophies and platform)
      const trophyResponse = await getUserTitles(authorization, 'me', { limit: 100 });
      const trophyTitles = trophyResponse.trophyTitles || [];

      // 2. Fetch played games with exact playtime
      let playedTitlesMap = new Map<string, { playtimeHours: number; lastPlayed?: string }>();
      try {
        const playedRes = await getUserPlayedGames(authorization, 'me', { limit: 100, offset: 0 });
        const playedTitles = (playedRes as any).titles || [];
        for (const pt of playedTitles) {
          const hours = parseIsoDurationToHours(pt.playDuration);
          const key = (pt.titleId || pt.name || '').toLowerCase();
          playedTitlesMap.set(key, {
            playtimeHours: hours,
            lastPlayed: pt.lastPlayedDateTime,
          });
        }
      } catch (err) {
        console.warn('Could not fetch exact PSN playtime, using trophy progress:', err);
      }

      const games = trophyTitles.map((t) => {
        const playedInfo = playedTitlesMap.get((t.npCommunicationId || t.trophyTitleName || '').toLowerCase()) ||
                           playedTitlesMap.get((t.trophyTitleName || '').toLowerCase());
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
      }).sort((a, b) => b.playtimeHours - a.playtimeHours);

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
