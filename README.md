# 📡 OmniTrack – Modern All-in-One Medien-Tracker & Sequel Radar

OmniTrack ist eine moderne, lokale Web-Applikation zur lückenlosen Verwaltung deiner Filme, Serien, Anime, Bücher und Videospiele – ausgestattet mit einem intelligenten **Sequel Radar**, der automatisch neue Staffeln, Fortsetzungen und Veröffentlichungen zu Titeln deiner Bibliothek aufspürt.

---

## 🚀 Schnellstart

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

## 🌟 Hauptfunktionen & Architektur

### 1. Hybrid-Suche & Single Source of Truth
* **Reine Nutzersammlung:** In der lokalen Datenbank/Storage werden ausschließlich Werke gespeichert, die du aktiv hinzugefügt hast.
* **Instant Dashboard-Suche (< 10 ms):** Volltextsuche über Titel, Genres, Autoren und Studios ohne spürbare Latenz.
* **Typ-fokussierte externe Suche:** Vorabauswahl (Film/Serie, Anime, Buch, Videospiel) verhindert unnötigen API-Fan-out.
* **300 ms Debounce & AbortController:** Verhindert Race Conditions und spart Bandbreite bei schnellem Tippen.
* **Server-seitiges Caching (24h TTL):** Suchanfragen werden serverseitig zwischengespeichert.
* **Adapter-Pattern mit Mock-Fallback:**
  * **TMDB:** Filme & Serien (inkl. Fortsetzungen via Collections & neue Staffeln)
  * **AniList:** Anime (Live GraphQL-Relations `SEQUEL` & Mock-Fallback)
  * **Google Books:** Bücher & Buchserien
  * **RAWG:** Videospiele & Expansions

### 2. Der "Sequel Radar"
* **Automatische Erkennung:** Prüft Medien mit dem Status *„Beendet“* oder *„Gerade dabei“* auf Nachfolger.
* **Sofortige interaktive Demos:**
  * 🌸 *Frieren: Beyond Journey's End* &rarr; **Staffel 2 (Neu angekündigt)**
  * 🏜️ *Dune* &rarr; **Dune: Teil 2 (Jetzt verfügbar)**
  * 🏢 *Severance* &rarr; **Staffel 2 verfügbar**
  * ⚔️ *Elden Ring* &rarr; **Shadow of the Erdtree (Erweiterung)**
* **1-Klick-Übernahme:** Mit einem Klick auf *„+ Zu 'Geplant' hinzufügen“* oder *„Direkt starten“* wandert die Fortsetzung direkt in deine Sammlung.
* **Manueller Sync-Button:** *„Sequel Radar prüfen“* ruft den Route Handler `/api/check-sequels` auf.

### 3. Kachel-First Dark-Mode UI
* **Design:** Konsequenter Dark Mode mit Tailwind Zinc/Slate-Farben und 2:3 Poster-Format.
* **Farbkodierte Badges:**
  * 🔴 Rot: Film
  * 🟡 Amber: Serie
  * 🔵 Blau: Anime
  * 🟠 Orange: Buch
  * 🟣 Violett: Videospiel
* **Quick-Increment:** Ein Klick auf `+1 Ep.`, `+10 S.` oder `+1 Std.` aktualisiert den Fortschritt optimistisch in Echtzeit.
* **Sterne-Rating:** Schnelle visuelle Orientierung (★ 4.8).

---

## 🔑 Optionale API-Keys (.env.local)

OmniTrack funktioniert standardmäßig **100 % out-of-the-box ohne API-Keys** dank integrierter Mock-Kataloge und öffentlicher Endpunkte (wie AniList & Google Books). 

Falls du Live-Daten für TMDB oder RAWG nutzen möchtest, erstelle eine `.env.local`:
```env
TMDB_API_KEY=dein_tmdb_api_key
RAWG_API_KEY=dein_rawg_api_key
GOOGLE_BOOKS_API_KEY=optionaler_key
```

---

## 📁 Ordnerstruktur

```
src/
├── types/
│   └── media.ts              # TypeScript Datenmodelle
├── lib/
│   ├── utils.ts              # Styling & Badge-Utilities
│   ├── storage.ts            # LocalStorage & Zustandsverwaltung
│   ├── seed-data.ts          # Vorbefüllte Standard-Sammlung & Fortsetzungen
│   ├── cache.ts              # 24h Server-Cache
│   └── api-adapters/
│       ├── types.ts          # MediaAdapter Interface
│       ├── tmdb.ts           # TMDB Filme & Serien Adapter
│       ├── anilist.ts        # AniList GraphQL Anime Adapter
│       ├── googlebooks.ts    # Google Books Adapter
│       ├── rawg.ts           # RAWG Gaming Adapter
│       └── index.ts          # Adapter-Registry
├── components/
│   ├── Sidebar.tsx           # Navigation & leuchtender Radar-Badge
│   ├── Header.tsx            # < 10ms Volltextsuche & Sortierung
│   ├── MediaCard.tsx         # 2:3 Poster Kachel mit Quick-Increment
│   ├── SequelCard.tsx        # Radar Fortsetzungs-Kachel
│   ├── AddMediaDialog.tsx    # Typ-fokussierte Suche mit Debounce
│   ├── EditMediaModal.tsx    # Detailbearbeitung
│   ├── StatsBar.tsx          # Sammlungs-Übersicht
│   └── Toast.tsx             # Feedback-Meldungen
└── app/
    ├── api/
    │   ├── search/route.ts   # Live-Suche
    │   └── check-sequels/    # Radar-Sync Endpunkt
    ├── globals.css           # Dark Mode Styles & Animationen
    ├── layout.tsx            # Root Layout & Metadaten
    └── page.tsx              # Haupt-Dashboard & Sequel-Radar-View
```
