import { NextRequest, NextResponse } from 'next/server';

interface GogGame {
  id: string;
  gameId: string | number;
  title: string;
  playtimeMinutes: number;
  playtimeHours: number;
  coverUrl?: string;
  bannerUrl?: string;
  achievements?: {
    current: number;
    total: number;
    completionist100: boolean;
  };
}

const GOG_CLIENT_ID = '46899977096215655';
const GOG_CLIENT_SECRET = '9d85c43b1482497dbbce61f6e4aa173a433796eeae2ca8c5f6129f2dc4de46d9';
const GOG_REDIRECT_URI = 'https://embed.gog.com/on_login_success?origin=client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, token: customToken, code: customCode, username: customUser } = body;

    let authToken = (customToken || process.env.GOG_TOKEN || '').trim();
    let authCode = (customCode || '').trim();
    const username = (customUser || process.env.GOG_USERNAME || '').trim();

    // Check if token or code was passed inside username or token field (e.g. user pasted full URL or code into input)
    if (!authCode) {
      if (authToken.includes('code=')) {
        const match = authToken.match(/[?&]code=([^&]+)/);
        if (match) {
          authCode = match[1];
          authToken = '';
        }
      } else if (username.includes('code=')) {
        const match = username.match(/[?&]code=([^&]+)/);
        if (match) authCode = match[1];
      }
    }

    if (authCode.includes('code=')) {
      const match = authCode.match(/[?&]code=([^&]+)/);
      if (match) authCode = match[1];
    }

    // Exchange auth code for access token if code is provided
    if (authCode) {
      const params = new URLSearchParams({
        client_id: GOG_CLIENT_ID,
        client_secret: GOG_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: authCode,
        redirect_uri: GOG_REDIRECT_URI,
      });

      const tokenRes = await fetch(`https://auth.gog.com/token?${params.toString()}`);
      if (!tokenRes.ok) {
        const errData = await tokenRes.json().catch(() => ({}));
        return NextResponse.json(
          {
            error: 'GOG-Code ist ungültig oder abgelaufen. Bitte generiere über den Link einen neuen Code.',
            details: errData.error_description || errData.error,
          },
          { status: 401 }
        );
      }

      const tokenData = await tokenRes.json();
      if (tokenData.access_token) {
        authToken = tokenData.access_token;
      }
    }

    if (!authToken && !username) {
      return NextResponse.json(
        {
          error: 'Bitte gib deinen GOG Login-Code oder deinen GOG-Benutzernamen an.',
          hint: 'Klicke auf den Link "GOG-Code holen", um dich schnell anzumelden.',
        },
        { status: 400 }
      );
    }

    // ACTION: get-profile & games via Token (GOG Galaxy API)
    if (authToken) {
      // 1. Fetch user data
      const userRes = await fetch('https://embed.gog.com/userData.json', {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'User-Agent': 'Mozilla/5.0 OmniList/1.0',
        },
      });

      let userId = '';
      let profileUsername = username || 'GOG Spieler';

      if (userRes.ok) {
        const userData = await userRes.json();
        if (userData && userData.isLoggedIn) {
          userId = String(userData.userId || userData.id || '');
          profileUsername = userData.username || profileUsername;
        }
      }

      if (!userId) {
        return NextResponse.json(
          {
            error: 'GOG-Sitzung ungültig oder abgelaufen. Bitte erneuere deinen GOG-Code.',
            expired: true,
          },
          { status: 401 }
        );
      }

      // 2. Fetch played games with playtime
      let playedGamesList: any[] = [];
      try {
        const gameplayRes = await fetch(
          `https://gameplay.gog.com/clients/46899977096215648/users/${userId}/games`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
              'User-Agent': 'Mozilla/5.0 OmniList/1.0',
            },
          }
        );
        if (gameplayRes.ok) {
          const rawGameplay = await gameplayRes.json();
          playedGamesList = Array.isArray(rawGameplay) ? rawGameplay : rawGameplay.games || [];
        }
      } catch (err) {
        console.warn('Could not fetch GOG gameplay stats:', err);
      }

      // 3. Fetch all owned game IDs
      let ownedGameIds: (string | number)[] = [];
      try {
        const ownedRes = await fetch('https://embed.gog.com/user/data/games', {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'User-Agent': 'Mozilla/5.0 OmniList/1.0',
          },
        });
        if (ownedRes.ok) {
          const ownedData = await ownedRes.json();
          ownedGameIds = Array.isArray(ownedData.owned) ? ownedData.owned : [];
        }
      } catch (err) {
        console.warn('Could not fetch GOG owned games:', err);
      }

      // Merge played and owned games
      const gamesMap = new Map<string, { gameId: string; minutesPlayed: number }>();

      // Insert played games first
      for (const pg of playedGamesList) {
        if (!pg.game_id) continue;
        const gId = String(pg.game_id);
        gamesMap.set(gId, {
          gameId: gId,
          minutesPlayed: pg.minutes_played || 0,
        });
      }

      // Insert owned games that might not have playtime yet
      for (const ogId of ownedGameIds) {
        const gId = String(ogId);
        if (!gamesMap.has(gId)) {
          gamesMap.set(gId, {
            gameId: gId,
            minutesPlayed: 0,
          });
        }
      }

      const allMerged = Array.from(gamesMap.values());
      // Sort by playtime descending, then unplayed
      allMerged.sort((a, b) => b.minutesPlayed - a.minutesPlayed);

      const allGameIds = allMerged.map((g) => g.gameId);

      // 4. Batch fetch metadata from Product API in chunks of 50
      const productMetaMap = new Map<string, { title: string; coverUrl?: string; bannerUrl?: string }>();
      const chunkSize = 50;

      for (let i = 0; i < allGameIds.length; i += chunkSize) {
        const chunk = allGameIds.slice(i, i + chunkSize);
        try {
          const prodRes = await fetch(`https://api.gog.com/products?ids=${chunk.join(',')}`, {
            headers: { 'User-Agent': 'Mozilla/5.0 OmniList/1.0' },
          });
          if (prodRes.ok) {
            const prods = await prodRes.json();
            if (Array.isArray(prods)) {
              for (const p of prods) {
                const fixUrl = (u?: string) => (u ? (u.startsWith('//') ? 'https:' + u : u) : undefined);
                productMetaMap.set(String(p.id), {
                  title: p.title || `GOG Spiel ${p.id}`,
                  coverUrl: fixUrl(p.images?.logo2x || p.images?.logo),
                  bannerUrl: fixUrl(p.images?.background),
                });
              }
            }
          }
        } catch {
          // ignore chunk error
        }
      }

      // 5. Fetch achievements for played games with minutesPlayed > 0 (up to top 30 to stay fast)
      const achievementsMap = new Map<string, GogGame['achievements']>();
      const gamesToFetchAchievements = allMerged.filter((g) => g.minutesPlayed > 0).slice(0, 30);

      await Promise.all(
        gamesToFetchAchievements.map(async (g) => {
          try {
            const achRes = await fetch(
              `https://gameplay.gog.com/clients/46899977096215648/users/${userId}/games/${g.gameId}/achievements`,
              {
                headers: {
                  Authorization: `Bearer ${authToken}`,
                  'User-Agent': 'Mozilla/5.0 OmniList/1.0',
                },
              }
            );
            if (achRes.ok) {
              const achData = await achRes.json();
              const total = achData.total_count ?? (Array.isArray(achData.achievements) ? achData.achievements.length : 0);
              const current = achData.unlocked_count ?? 0;
              if (total > 0) {
                achievementsMap.set(g.gameId, {
                  current,
                  total,
                  completionist100: current === total && total > 0,
                });
              }
            }
          } catch {
            // Ignore achievement error
          }
        })
      );

      // Build enriched games list
      const enrichedGames: GogGame[] = allMerged.map((g) => {
        const meta = productMetaMap.get(g.gameId);
        const minutes = g.minutesPlayed;
        const hours = Math.round((minutes / 60) * 10) / 10;
        return {
          id: `gog:${g.gameId}`,
          gameId: g.gameId,
          title: meta?.title || `GOG Spiel ${g.gameId}`,
          playtimeMinutes: minutes,
          playtimeHours: hours,
          coverUrl: meta?.coverUrl || `https://images.gog-statics.com/${g.gameId}.jpg`,
          bannerUrl: meta?.bannerUrl,
          achievements: achievementsMap.get(g.gameId),
        };
      });

      return NextResponse.json({
        success: true,
        username: profileUsername,
        token: authToken,
        games: enrichedGames,
      });
    }

    // Fallback: Query public profile by username
    if (username) {
      const pubRes = await fetch(
        `https://www.gog.com/u/${encodeURIComponent(username)}/games/stats?sort=date_last_played&order=desc`,
        {
          headers: { 'User-Agent': 'Mozilla/5.0 OmniList/1.0' },
        }
      );

      if (pubRes.ok) {
        const text = await pubRes.text();
        try {
          const data = JSON.parse(text);
          const rawItems = Array.isArray(data) ? data : data.games || [];
          const games: GogGame[] = rawItems.map((item: any) => ({
            id: `gog:${item.id || item.game_id}`,
            gameId: item.id || item.game_id,
            title: item.title || item.name || 'GOG Spiel',
            playtimeMinutes: item.minutes_played || 0,
            playtimeHours: Math.round(((item.minutes_played || 0) / 60) * 10) / 10,
            coverUrl: item.image ? (item.image.startsWith('//') ? `https:${item.image}.jpg` : `https:${item.image}.jpg`) : undefined,
          }));

          return NextResponse.json({
            success: true,
            username,
            games,
          });
        } catch {
          // Profile HTML response or private profile
        }
      }

      return NextResponse.json(
        {
          error: `GOG blockiert anonyme Profil-Abfragen (Fehler ${pubRes.status}). Bitte nutze den GOG-Login-Code oben für den direkten Abgleich.`,
          hint: 'Klicke im GOG-Reiter auf "Login-Code abrufen", um dich mit 1 Klick anzumelden.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ error: 'Keine gültigen GOG-Daten gefunden.' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in /api/sync/gog:', error);
    return NextResponse.json(
      { error: error.message || 'Interner Serverfehler beim GOG-Abgleich.' },
      { status: 500 }
    );
  }
}
