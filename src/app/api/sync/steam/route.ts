import { NextRequest, NextResponse } from 'next/server';

interface SteamOwnedGame {
  appid: number;
  name: string;
  playtime_forever: number; // in minutes
  img_icon_url?: string;
  rtime_last_played?: number;
}

// Helper to extract SteamID64 from various input formats (URL, vanity name, or 64-bit ID)
async function resolveSteamId64(input: string, apiKey: string): Promise<string | null> {
  const clean = input.trim();
  if (!clean) return null;

  // Direct 17-digit numeric Steam ID
  if (/^\d{17}$/.test(clean)) {
    return clean;
  }

  // Check if it's a URL
  // e.g. https://steamcommunity.com/profiles/76561198012345678
  const profileMatch = clean.match(/steamcommunity\.com\/profiles\/(\d{17})/);
  if (profileMatch) {
    return profileMatch[1];
  }

  // e.g. https://steamcommunity.com/id/vanityname/ or just "vanityname"
  let vanity = clean;
  const idMatch = clean.match(/steamcommunity\.com\/id\/([^\/]+)/);
  if (idMatch) {
    vanity = idMatch[1];
  } else {
    // strip any trailing slashes
    vanity = vanity.replace(/\/+$/, '');
  }

  // Resolve vanity URL via Steam API
  try {
    const res = await fetch(
      `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${apiKey}&vanityurl=${encodeURIComponent(vanity)}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.response?.success === 1 && data?.response?.steamid) {
      return data.response.steamid;
    }
  } catch (err) {
    console.error('Error resolving Steam vanity URL:', err);
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, steamInput, apiKey: customKey, appIds } = body;

    const apiKey = (customKey || process.env.STEAM_API_KEY || '').trim();

    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'Kein Steam Web API Key konfiguriert.',
          hint: 'Trage deinen kostenlosen Steam Web API Key in die Einstellungen oder als STEAM_API_KEY in Vercel/.env.local ein.',
        },
        { status: 400 }
      );
    }

    if (!steamInput) {
      return NextResponse.json(
        { error: 'Bitte gib deinen Steam-Profil-Link oder deine Steam-ID ein.' },
        { status: 400 }
      );
    }

    const steamId64 = await resolveSteamId64(steamInput, apiKey);
    if (!steamId64) {
      return NextResponse.json(
        { error: `Steam-Profil konnte nicht aufgelöst werden. Bitte prüfe deine Steam-ID oder deinen Profil-Namen.` },
        { status: 404 }
      );
    }

    // ACTION: fetch player profile summary
    if (action === 'get-profile') {
      const summaryRes = await fetch(
        `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${steamId64}`
      );
      if (!summaryRes.ok) {
        return NextResponse.json({ error: 'Steam-Profil konnte nicht geladen werden.' }, { status: summaryRes.status });
      }
      const summaryData = await summaryRes.json();
      const player = summaryData?.response?.players?.[0];

      return NextResponse.json({
        steamId: steamId64,
        personaname: player?.personaname || 'Steam Spieler',
        avatar: player?.avatarfull || player?.avatar,
        profileurl: player?.profileurl,
      });
    }

    // ACTION: fetch owned games
    if (action === 'get-games') {
      const gamesRes = await fetch(
        `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${apiKey}&steamid=${steamId64}&include_appinfo=1&include_played_free_games=1&format=json`
      );

      if (!gamesRes.ok) {
        return NextResponse.json(
          { error: `Steam API Fehler (${gamesRes.status}): Profil ist möglicherweise auf "Privat" gestellt.` },
          { status: gamesRes.status }
        );
      }

      const gamesData = await gamesRes.json();
      const rawGames: SteamOwnedGame[] = gamesData?.response?.games || [];

      // Sort by playtime descending
      const games = rawGames.map((g) => {
        const playtimeHours = Math.round((g.playtime_forever / 60) * 10) / 10;
        return {
          appid: g.appid,
          name: g.name,
          playtimeMinutes: g.playtime_forever,
          playtimeHours,
          iconUrl: g.img_icon_url
            ? `https://media.steampowered.com/steamcommunity/public/images/apps/${g.appid}/${g.img_icon_url}.jpg`
            : undefined,
          coverUrl: `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${g.appid}/library_600x900.jpg`,
          headerUrl: `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${g.appid}/header.jpg`,
          lastPlayed: g.rtime_last_played ? new Date(g.rtime_last_played * 1000).toISOString() : undefined,
        };
      }).sort((a, b) => b.playtimeMinutes - a.playtimeMinutes);

      return NextResponse.json({
        success: true,
        steamId: steamId64,
        gameCount: rawGames.length,
        games,
      });
    }

    // ACTION: fetch achievements for specific game appIds
    if (action === 'get-achievements') {
      if (!Array.isArray(appIds) || appIds.length === 0) {
        return NextResponse.json({ achievements: {} });
      }

      // Limit to max 50 games at a time to prevent rate limits
      const targetAppIds = appIds.slice(0, 50);
      const achievementResults: Record<number, { current: number; total: number; completionist100: boolean }> = {};

      await Promise.all(
        targetAppIds.map(async (appid) => {
          try {
            const achRes = await fetch(
              `https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?appid=${appid}&key=${apiKey}&steamid=${steamId64}`
            );
            if (!achRes.ok) return;
            const achData = await achRes.json();
            const rawAchievements = achData?.playerstats?.achievements;
            if (Array.isArray(rawAchievements) && rawAchievements.length > 0) {
              const total = rawAchievements.length;
              const current = rawAchievements.filter((a: any) => a.achieved === 1).length;
              achievementResults[appid] = {
                current,
                total,
                completionist100: current === total && total > 0,
              };
            }
          } catch {
            // Ignore individual achievement fetch errors (some games have no achievements)
          }
        })
      );

      return NextResponse.json({
        success: true,
        achievements: achievementResults,
      });
    }

    return NextResponse.json({ error: 'Ungültige Aktion.' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in /api/sync/steam:', error);
    return NextResponse.json(
      { error: error.message || 'Interner Serverfehler beim Steam-Abgleich.' },
      { status: 500 }
    );
  }
}
