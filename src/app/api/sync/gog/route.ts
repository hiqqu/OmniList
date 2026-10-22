import { NextRequest, NextResponse } from 'next/server';

interface GogGame {
  id: string;
  gameId: string | number;
  title: string;
  playtimeMinutes: number;
  playtimeHours: number;
  coverUrl?: string;
  bannerUrl?: string;
  lastPlayed?: string;
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
    const { token: customToken, code: customCode, username: customUser } = body;

    let authToken = (customToken || process.env.GOG_TOKEN || '').trim();
    let authCode = (customCode || '').trim();
    let username = (customUser || process.env.GOG_USERNAME || '').trim();

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
        if (match) {
          authCode = match[1];
          username = '';
        }
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

    let userId = '';
    let profileUsername = username || '';

    // If authToken is present, fetch profile info
    if (authToken) {
      const userRes = await fetch('https://embed.gog.com/userData.json', {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'User-Agent': 'Mozilla/5.0 OmniList/1.0',
        },
      });

      if (userRes.ok) {
        const userData = await userRes.json();
        if (userData && userData.isLoggedIn) {
          userId = String(userData.userId || userData.id || '');
          if (userData.username) {
            profileUsername = userData.username;
          }
        }
      }

      if (!userId && !profileUsername) {
        return NextResponse.json(
          {
            error: 'GOG-Sitzung ungültig oder abgelaufen. Bitte erneuere deinen GOG-Code.',
            expired: true,
          },
          { status: 401 }
        );
      }
    }

    if (!profileUsername) {
      profileUsername = 'GOG Spieler';
    }

    // Map to hold collected games
    interface ExtractedGame {
      gameId: string;
      title: string;
      playtimeMinutes: number;
      lastPlayed?: string;
      achievements?: GogGame['achievements'];
      coverUrl?: string;
      bannerUrl?: string;
    }

    const gamesMap = new Map<string, ExtractedGame>();

    const formatImg = (img?: string) => {
      if (!img) return undefined;
      if (img.startsWith('//')) return `https:${img}`;
      if (img.startsWith('http')) return img;
      return `https://${img}`;
    };

    // 1. Fetch played and listed games with exact stats & playtime from GOG stats endpoint
    try {
      let page = 1;
      let totalPages = 1;
      do {
        const statsUrl = `https://embed.gog.com/u/${encodeURIComponent(profileUsername)}/games/stats?sort=date_last_played&order=desc&page=${page}`;
        const headers: Record<string, string> = {
          'User-Agent': 'Mozilla/5.0 OmniList/1.0',
        };
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }

        const statsRes = await fetch(statsUrl, { headers });
        if (!statsRes.ok) break;

        const statsData = await statsRes.json();
        totalPages = typeof statsData.pages === 'number' ? statsData.pages : 1;
        const pageItems = Array.isArray(statsData._embedded?.items) ? statsData._embedded.items : [];

        for (const item of pageItems) {
          if (!item?.game?.id) continue;
          const gId = String(item.game.id);

          let playtimeMinutes = 0;
          let lastPlayed: string | undefined = undefined;
          let achievementsPercentage: number | undefined = undefined;

          if (item.stats && typeof item.stats === 'object' && !Array.isArray(item.stats)) {
            const userStats = (userId && item.stats[userId]) || Object.values(item.stats)[0];
            if (userStats) {
              if (typeof userStats.playtime === 'number') {
                playtimeMinutes = userStats.playtime;
              }
              if (typeof userStats.lastSession === 'string' && userStats.lastSession.trim()) {
                lastPlayed = userStats.lastSession;
              }
              if (typeof userStats.achievementsPercentage === 'number') {
                achievementsPercentage = userStats.achievementsPercentage;
              }
            }
          }

          let achievements: GogGame['achievements'] = undefined;
          if (achievementsPercentage !== undefined) {
            achievements = {
              current: achievementsPercentage,
              total: 100,
              completionist100: achievementsPercentage === 100,
            };
          } else if (item.game.achievementSupport) {
            achievements = {
              current: 0,
              total: 100,
              completionist100: false,
            };
          }

          gamesMap.set(gId, {
            gameId: gId,
            title: item.game.title || `GOG Spiel ${gId}`,
            playtimeMinutes,
            lastPlayed,
            achievements,
            coverUrl: formatImg(item.game.image),
          });
        }

        page++;
      } while (page <= totalPages && page <= 10);
    } catch (err) {
      console.warn('Could not fetch GOG stats:', err);
    }

    // 2. If authToken is available, fetch all owned game IDs to include backlog games that haven't been launched
    if (authToken) {
      try {
        const ownedRes = await fetch('https://embed.gog.com/user/data/games', {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'User-Agent': 'Mozilla/5.0 OmniList/1.0',
          },
        });
        if (ownedRes.ok) {
          const ownedData = await ownedRes.json();
          const ownedGameIds: (string | number)[] = Array.isArray(ownedData.owned) ? ownedData.owned : [];
          for (const ogId of ownedGameIds) {
            const gId = String(ogId);
            if (!gamesMap.has(gId)) {
              gamesMap.set(gId, {
                gameId: gId,
                title: `GOG Spiel ${gId}`,
                playtimeMinutes: 0,
              });
            }
          }
        }
      } catch (err) {
        console.warn('Could not fetch GOG owned games:', err);
      }
    }

    // 3. Batch fetch metadata (proper title and banner artwork) from Product API in chunks of 50
    const missingMetaIds = Array.from(gamesMap.values())
      .filter((g) => !g.coverUrl || g.title.startsWith('GOG Spiel ') || !g.bannerUrl)
      .map((g) => g.gameId);

    const chunkSize = 50;
    for (let i = 0; i < missingMetaIds.length; i += chunkSize) {
      const chunk = missingMetaIds.slice(i, i + chunkSize);
      try {
        const prodRes = await fetch(`https://api.gog.com/products?ids=${chunk.join(',')}`, {
          headers: { 'User-Agent': 'Mozilla/5.0 OmniList/1.0' },
        });
        if (prodRes.ok) {
          const prods = await prodRes.json();
          if (Array.isArray(prods)) {
            for (const p of prods) {
              const g = gamesMap.get(String(p.id));
              if (g) {
                const fixUrl = (u?: string) => (u ? (u.startsWith('//') ? 'https:' + u : u) : undefined);
                if (p.title && g.title.startsWith('GOG Spiel ')) {
                  g.title = p.title;
                }
                if (!g.coverUrl) {
                  g.coverUrl = fixUrl(p.images?.logo2x || p.images?.logo);
                }
                if (!g.bannerUrl) {
                  g.bannerUrl = fixUrl(p.images?.background);
                }
              }
            }
          }
        }
      } catch {
        // ignore chunk error
      }
    }

    if (gamesMap.size === 0) {
      return NextResponse.json(
        {
          error: `Keine GOG-Spiele für '${profileUsername}' gefunden oder das GOG-Profil ist auf privat gestellt.`,
          hint: 'Klicke im GOG-Reiter auf "Login-Code holen", um dich mit 1 Klick anzumelden.',
        },
        { status: 404 }
      );
    }

    // Build enriched games list
    const enrichedGames: GogGame[] = Array.from(gamesMap.values()).map((g) => {
      const minutes = g.playtimeMinutes || 0;
      const hours = Math.round((minutes / 60) * 10) / 10;
      return {
        id: `gog:${g.gameId}`,
        gameId: g.gameId,
        title: g.title,
        playtimeMinutes: minutes,
        playtimeHours: hours,
        coverUrl: g.coverUrl || `https://images.gog-statics.com/${g.gameId}.jpg`,
        bannerUrl: g.bannerUrl,
        lastPlayed: g.lastPlayed,
        achievements: g.achievements,
      };
    });

    // Sort by playtime descending, then alphabetically
    enrichedGames.sort((a, b) => {
      if (b.playtimeMinutes !== a.playtimeMinutes) {
        return b.playtimeMinutes - a.playtimeMinutes;
      }
      return a.title.localeCompare(b.title);
    });

    return NextResponse.json({
      success: true,
      username: profileUsername,
      token: authToken,
      games: enrichedGames,
    });
  } catch (error: any) {
    console.error('Error in /api/sync/gog:', error);
    return NextResponse.json(
      { error: error.message || 'Interner Serverfehler beim GOG-Abgleich.' },
      { status: 500 }
    );
  }
}
