# OmniList – Modern All-in-One Medien-Tracker

OmniList ist eine moderne Web-Applikation zur lückenlosen Verwaltung deiner Filme, Serien, Anime, Bücher und Videospiele.

---

## Schnellstart

### 1. Entwicklungsserver starten
```bash
npm run dev
```
Öffne anschließend [http://localhost:3000](http://localhost:3000) im Browser.

### 2. Produktions-Build erstellen & ausführen
```bash
npm run build
npm start
```

---

## Hauptfunktionen & Architektur

### 1. Saubere Nutzersammlung (Keine Demo-Einträge)
* **Startet leer und aufgeräumt:** OmniList startet standardmäßig vollständig ohne vorbefüllte Demo-Einträge. Ausschließlich die Medien, die du aktiv über die Suche oder manuell hinzufügst, werden in deiner persönlichen Sammlung gespeichert.
* **Lokaler Speicher oder Cloud-Sync:** Daten werden primär im Browser (`localStorage`) gespeichert und können optional über Vercel KV über all deine Geräte hinweg synchronisiert werden.

### 2. Hybrid-Suche & Single Source of Truth
* **Instant Dashboard-Suche (< 10 ms):** Lokale Volltextsuche über Titel, Genres, Autoren, Verlage und Studios ohne spürbare Latenz.
* **Typ-fokussierte externe Suche:** Vorabauswahl (Film/Serie, Anime, Buch, Videospiel) verhindert unnötigen API-Fan-out.
* **300 ms Debounce & AbortController:** Verhindert Race Conditions und spart Bandbreite bei schnellem Tippen.
* **Server-seitiges Caching (24h TTL):** Häufige Suchanfragen werden serverseitig zwischengespeichert.
* **Multiquellen-Adapter:**
  * **TMDB:** Filme & Serien (inkl. Fortsetzungen via Collections & neue Staffeln)
  * **AniList:** Anime (Live GraphQL-Relations `SEQUEL` & Fallback)
  * **Deutsche Nationalbibliothek (DNB) & Open Library:** Deutsche Verlagsausgaben (z. B. Reclam, Insel Klassik, Suhrkamp, dtv), ISBN-13, genaue Seitenzahlen & Verlagsfilter
  * **RAWG:** Videospiele & Expansions

### 3. Der "Sequel Radar"
* **Automatische Erkennung:** Prüft Medien mit dem Status „Beendet“ oder „Gerade dabei“ auf neue Veröffentlichungen oder angekündigte Nachfolger.
* **1-Klick-Übernahme:** Mit einem Klick auf „+ Zu 'Geplant' hinzufügen“ oder „Direkt starten“ wandert die Fortsetzung direkt in deine Sammlung.
* **Manueller Scan-Button:** „Sequel Radar prüfen“ führt eine Überprüfung durch.

### 4. Kachel-First Dark-Mode UI & Tracker
* **Design:** Konsequenter Dark Mode mit Tailwind Zinc-Farbpalette und 2:3 Poster-Format.
* **Kategorie-Statistiken:** In der Gesamtansicht wird die Gesamtsammlung angezeigt; in den Einzelkategorien (Filme, Serien, Anime, Bücher, Videospiele) erscheinen direkt die Zähler für *Geplant*, *Gerade dabei*, *Abgeschlossen* und *Sequel Radar*.
* **Spezialisierte Tracker:**
  * **Videospiele:** Erfassung von Spielzeit (ohne künstliches Limit), Story-Status, 100%-Abschluss und Achievements.
  * **Bücher:** Seitenzählung, Verlags- und ISBN-Zuordnung sowie Autoren-/Übersetzerangaben.
  * **Filme & Serien:** Minuten- bzw. Episodenfortschritt mit Quick-Increment (`+1 Ep.`, `+15 Min.`, `+10 S.`).

---

## Cloud-Synchronisation via Vercel KV (Optional)

OmniList funktioniert standardmäßig komplett lokal im Browser. Wenn du deine Sammlung geräteübergreifend (z. B. auf PC und Smartphone) synchron halten möchtest, kannst du Vercel KV verbinden:

1. Erstelle ein kostenloses Konto auf [vercel.com](https://vercel.com) und erstelle ein Projekt mit einem **Vercel KV Storage**.
2. Erstelle in deinem Projektordner die Datei `.env.local` und hinterlege deine Zugangsdaten:
```env
KV_REST_API_URL=https://dein-kv-cluster.upstash.io
KV_REST_API_TOKEN=dein_kv_token
```
3. Öffne in OmniList in der linken Seitenleiste das Wolken-Symbol („Cloud Sync“), um deinen Sync-Schlüssel festzulegen oder die Verbindung zu testen.

---

## Optionale API-Keys (.env.local)

OmniList funktioniert out-of-the-box ohne externe API-Keys dank öffentlicher Endpunkte (AniList, Open Library & DNB).

Falls du Live-Daten für TMDB oder RAWG nutzen möchtest, kannst du diese in deiner `.env.local` eintragen:
```env
TMDB_API_KEY=dein_tmdb_api_key
RAWG_API_KEY=dein_rawg_api_key
GOOGLE_BOOKS_API_KEY=optionaler_key
```
