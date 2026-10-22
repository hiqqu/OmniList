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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, token: customToken, username: customUser } = body;

    const token = (customToken || process.env.GOG_TOKEN || '').trim();
    const username = (customUser || process.env.GOG_USERNAME || '').trim();

    if (!token && !username) {
      return NextResponse.json(
        {
          error: 'Bitte gib deinen GOG Galaxy Token oder deinen GOG-Benutzernamen an.',
          hint: 'Den Token erhältst du z. B. über den GOG-Login oder dein GOG Galaxy Profil.',
        },
        { status: 400 }
      );
    }

    // ACTION: get-profile & games via Token (GOG Galaxy API)
    if (token) {
      // 1. Fetch user data
      const userRes = await fetch('https://embed.gog.com/userData.json', {
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': 'OmniList/1.0',
        },
      });

      let userId = '';
      let profileUsername = username || 'GOG Spieler';

      if (userRes.ok) {
        const userData = await userRes.json();
        userId = String(userData.userId || userData.id || '');
        profileUsername = userData.username || profileUsername;
      }

      // If user ID was found, fetch played games with playtime
      if (userId) {
        const gameplayRes = await fetch(
          `https://gameplay.gog.com/clients/46899977096215648/users/${userId}/games`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'User-Agent': 'OmniList/1.0',
            },
          }
        );

        if (gameplayRes.ok) {
          const rawGames = await gameplayRes.json();
          const gameList: any[] = Array.isArray(rawGames) ? rawGames : rawGames.games || [];

          // Sort by minutes_played descending
          const topGames = gameList
            .filter((g: any) => g.game_id)
            .sort((a: any, b: any) => (b.minutes_played || 0) - (a.minutes_played || 0))
            .slice(0, 40);

          // Enrich top games with titles & metadata from GOG Product API
          const enrichedGames: GogGame[] = await Promise.all(
            topGames.map(async (g: any) => {
              const minutes = g.minutes_played || 0;
              const hours = Math.round((minutes / 60) * 10) / 10;
              let title = `GOG Spiel ${g.game_id}`;
              let coverUrl = `https://images.gog-statics.com/${g.game_id}.jpg`;
              let bannerUrl: string | undefined;

              try {
                const prodRes = await fetch(`https://api.gog.com/products/${g.game_id}`, {
                  headers: { 'User-Agent': 'OmniList/1.0' },
                });
                if (prodRes.ok) {
                  const prod = await prodRes.json();
                  title = prod.title || title;
                  if (prod.images?.logo2x || prod.images?.logo) {
                    coverUrl = prod.images.logo2x || prod.images.logo;
                  }
                  if (prod.images?.background) {
                    bannerUrl = prod.images.background;
                  }
                }
              } catch {
                // Ignore product fetch error
              }

              // Optional achievements for game
              let achievements: GogGame['achievements'] = undefined;
              try {
                const achRes = await fetch(
                  `https://gameplay.gog.com/clients/46899977096215648/users/${userId}/games/${g.game_id}/achievements`,
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                      'User-Agent': 'OmniList/1.0',
                    },
                  }
                );
                if (achRes.ok) {
                  const achData = await achRes.json();
                  const total = achData.total_count ?? (Array.isArray(achData.achievements) ? achData.achievements.length : 0);
                  const current = achData.unlocked_count ?? 0;
                  if (total > 0) {
                    achievements = {
                      current,
                      total,
                      completionist100: current === total && total > 0,
                    };
                  }
                }
              } catch {
                // Ignore achievement error
              }

              return {
                id: `gog:${g.game_id}`,
                gameId: g.game_id,
                title,
                playtimeMinutes: minutes,
                playtimeHours: hours,
                coverUrl,
                bannerUrl,
                achievements,
              };
            })
          );

          return NextResponse.json({
            success: true,
            username: profileUsername,
            games: enrichedGames,
          });
        }
      }
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
            coverUrl: item.image ? `https:${item.image}.jpg` : undefined,
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
          error: `GOG-Profil für "${username}" konnte nicht öffentlich ausgelesen werden.`,
          hint: 'Stelle dein GOG-Profil auf "Öffentlich" oder nutze deinen GOG Galaxy Auth-Token.',
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
