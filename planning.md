# Component Architecture:
### App
- Responsibility: Root component; owns app-level state (search, mode, pagination, sort, selection, favorites/watched) and wires every child together. The actual fetch (Now Playing or Search) lives in MovieList, driven by props from App.
- Renders: The entire page — Header, SearchBar, SortControl, MovieList, Footer (and conditionally MovieModal).
- Props: none (root).
- States: searchQuery, submittedQuery, mode, page, selectedMovieId, details, detailsLoading, detailsError, sortOption, favorites, watched (see State Architecture). The `movies` array, `totalPages`, and the `isLoading`/`error` flags are owned by MovieList.
- Children: Header, SearchBar, SortControl, MovieList, Footer, MovieModal

### Header
- Responsibility: Display the app logo/title and banner.
- Renders: Logo image and heading text.
- Props: none.
- States: None
- Children: None

### SearchBar
- Responsibility: Let the user type a query and search, submit, or clear results.
- Renders: A form with a text input, a Submit/Search button, and a Clear button.
- Props: query (string), onQueryChange (fn), onSearch (fn), onClear (fn).
- States: None (controlled by App via props).
- Children: None

### SortControl (Browse)
- Responsibility: Sort the current movie list by title, release date, or vote average using a dropdown.
- Renders: A `<select>` dropdown with sort options.
- Props: sortOption (string), onSortChange (fn).
- States: None (controlled by App via props).
- Children: None

### MovieList
- Responsibility: Fetch the Now Playing movies from TMDb and lay out the grid of MovieCard components.
- Renders: A responsive grid of MovieCards (plus loading and error states).
- Props: mode ("now_playing" | "search"), query (string, the submitted search text), page (number), sortOption (string — "default" | "title" | "release_date" | "vote_average"; selects the render-time sort), onTotalPages (fn — reports the response's `total_pages` up to App), onCardClick (fn — receives a clicked card's `movie.id` and is passed straight down to each MovieCard's `onClick`), favorites (Set/array), watched (Set/array), onToggleFavorite (fn), onToggleWatched (fn).
- States: movies (Array, init []), isLoading (Boolean, init false), error (String|null, init null), totalPages (Number, init 1).
- Trigger: A useEffect keyed on `[mode, query, page]` fetches the matching endpoint. When `page === 1` the results **replace** `movies`; when `page > 1` they are **appended**. `total_pages` is stored locally and reported up via `onTotalPages` so App can hide/disable "Load More".
- Children: MovieCard

### MovieCard
- Responsibility: Display a movie's poster, title, and rating; on click open the MovieModal.
- Renders: A tile with a poster image, title, vote average, and favorite/watched toggle icons.
- Props: movie ({ id, title, poster_path, vote_average }), onClick (fn — called with `movie.id` when the card is clicked, opening the modal), isFavorite (bool), isWatched (bool), onToggleFavorite (fn), onToggleWatched (fn). The favorite/watched icon buttons `stopPropagation` so toggling them doesn't also open the modal.
- States: None (favorite/watched state is lifted to App so the Favorites/Watched pages can read it — see State Architecture).
- Children: None

### MovieModal
- Responsibility: Display full details for the selected movie. (An AI watch recommendation is planned for a later milestone — see AI Feature Spec — and is not built yet.)
- Renders: A centered, shadowed pop-up over a darkened (semi-transparent) backdrop showing backdrop image, title, runtime, release date, genres, and overview. Also renders loading and error states so a failed details fetch never leaves a broken modal.
- Props: details (object|null — the fetched Movie Details), isLoading (bool), error (string|null), onClose (fn). (The `aiRecommendation`/`aiLoading`/`aiError` props are deferred to the AI milestone.)
- Open trigger: The user clicks a MovieCard; the card's `movie.id` flows up to App (via onCardClick), App stores it in `selectedMovieId`, and App renders MovieModal once an id is set.
- Close mechanisms (all call `onClose`, which clears `selectedMovieId`): an `×` button, clicking the darkened backdrop (but not the modal card itself), and pressing the **Escape** key.
- States: None (presentational — driven by App via props; it does not fetch).
- Children: None

### Footer
- Responsibility: Display copyright information and relevant links.
- Renders: Text and links.
- Props: none.
- States: None
- Children: None

### Hierarchy:
```
App
├── Header
├── SearchBar
├── SortControl (Browse)
├── MovieList
│   └── MovieCard (×N)
├── Footer
└── MovieModal (conditional, when selectedMovieId !== null)
```


# API Contracts:
All TMDb calls go through a thin service layer in `src/services/tmdb.js` (no React) so components never build URLs or call `fetch` directly. The contract URLs below map 1:1 to its exported functions: `fetchNowPlaying(page)`, `searchMovies(query, page)` (and later `fetchMovieDetails(id)`).

### Now Playing
- URL: `GET https://api.themoviedb.org/3/movie/now_playing`
- Parameters: `api_key` (required), `language` (e.g. `en-US`), `page` (number, for "Load More")
- Response fields used: `results[]` → `id`, `title`, `poster_path`, `vote_average`; `page`; `total_pages`
- Error cases: non-200 status (bad/expired key), empty `results`, network failure, reaching `total_pages` (disable "Load More")

### Search
- URL: `GET https://api.themoviedb.org/3/search/movie`
- Parameters: `api_key` (required), `query` (required, the search text), `page` (number)
- Response fields used: same `results[]` shape as Now Playing (`id`, `title`, `poster_path`, `vote_average`)
- Error cases: empty query, zero results (show "no movies found"), non-200 status, network failure

### Movie Details
- URL: `GET https://api.themoviedb.org/3/movie/{movie_id}` (the movie id is a **path** parameter). Exposed as `fetchMovieDetails(id)` in the service layer.
- Parameters: `api_key` (required), `language` (e.g. `en-US`), `append_to_response=videos` (optional — for the stretch trailer feature)
- Response fields used: `title`, `runtime`, `release_date`, `genres[].name`, `overview`, `backdrop_path` (and `videos.results[]` for trailers if implemented)
- Error cases: **movie not found (404)** for an invalid `movie_id`; **bad/expired API key (401)**; **network failure**. All three throw in the service (`request()` rejects on non-2xx), surface via App's `detailsError`, and render as a friendly message in the modal rather than a broken modal. Additionally, missing `backdrop_path` or `runtime` are handled gracefully (those fields are simply omitted from the render).

Image transformation (not an endpoint): posters and backdrops are built from the base URL
`https://image.tmdb.org/t/p/w500{poster_path}` (use a larger size such as `w780`/`original` for the modal backdrop).


# State Architecture:
### movies
- Type: Array<Movie>
- Initial Value: []
- Component: MovieList
- Trigger: Fetch keyed on `[mode, query, page]`. Page 1 **replaces** the array (initial load, new search, mode switch); page > 1 **appends** ("Load More"). The array itself always stays in fetch order — sorting reorders a **derived copy at render time** (`useMemo` on `[movies, sortOption]`), never mutating `movies`.

### searchQuery
- Type: String
- Initial Value: ""
- Component: App
- Trigger: User types in the SearchBar input (onQueryChange) — this is the live, controlled input value; reset to "" on Clear / "Now Playing"

### submittedQuery
- Type: String
- Initial Value: ""
- Component: App
- Trigger: Set to the current `searchQuery` when the user submits the SearchBar (Enter or Search button). This is the value actually sent to the Search endpoint, kept separate from the live input so typing doesn't re-fetch on every keystroke. Reset to "" on Clear / "Now Playing".

### mode
- Type: String ("now_playing" | "search")
- Initial Value: "now_playing"
- Component: App
- Trigger: Set to "search" on a non-empty search submit; reset to "now_playing" on Clear / "Now Playing". Determines which endpoint MovieList fetches.

### page
- Type: Number
- Initial Value: 1
- Component: App
- Trigger: Incremented by the "Load More" button (triggers an append fetch). Reset to 1 whenever the mode or submitted query changes (new search, return to Now Playing).

### totalPages
- Type: Number
- Initial Value: 1
- Component: MovieList (reported up to App via onTotalPages)
- Trigger: Set from the API response's `total_pages` after each fetch. App compares it against `page` to hide/disable "Load More" once the last page is reached.

### selectedMovieId
- Type: Number | null
- Initial Value: null
- Component: App
- Trigger: User clicks a MovieCard (set to that card's `movie.id`); cleared to null on modal close. A non-null value both (a) drives the details fetch effect and (b) gates whether MovieModal renders.

### details
- Type: Object | null
- Initial Value: null
- Component: App
- Trigger: Set to the Movie Details response when the details fetch (keyed on `selectedMovieId`) resolves; cleared to null on modal close so a reopened card never flashes the previous movie. Passed to MovieModal as `details`.

### detailsLoading
- Type: Boolean
- Initial Value: false
- Component: App
- Trigger: Set true before the details fetch, false after it resolves/rejects. Drives the modal's loading state.

### detailsError
- Type: String | null
- Initial Value: null
- Component: App
- Trigger: Set when the details fetch fails (404/401/network); cleared before the next fetch and on modal close. Drives the modal's friendly error message.

### sortOption
- Type: String
- Initial Value: "default"
- Component: App
- Trigger: User selects an option in the SortControl dropdown ("title" | "release_date" | "vote_average")

### isLoading
- Type: Boolean
- Initial Value: false
- Component: MovieList
- Trigger: Set true before the Now Playing fetch, false after it resolves/rejects

### error
- Type: String | null
- Initial Value: null
- Component: MovieList
- Trigger: Set when the Now Playing fetch fails; cleared on the next successful fetch

### favorites
- Type: Array<number> (movie ids) or Set
- Initial Value: []
- Component: App
- Trigger: User clicks the heart icon on a MovieCard (onToggleFavorite). Lifted to App so the Favorites page can read it.

### watched
- Type: Array<number> (movie ids) or Set
- Initial Value: []
- Component: App
- Trigger: User clicks the eye icon on a MovieCard (onToggleWatched). Lifted to App so the Watched page can read it.

### isFavorite / isWatched (derived per card)
- Type: Boolean
- Initial Value: false
- Component: MovieCard (derived from App's `favorites`/`watched` via props)
- Trigger: Recomputed whenever favorites/watched change

> The `ai*` state below is **deferred to the AI Watch Recommendation milestone** and is not implemented yet — the current modal renders details only.

### aiRecommendation
- Type: String | null
- Initial Value: null
- Component: App (passed to MovieModal) — see AI Feature Spec
- Trigger: Set when the AI call resolves after a movie modal opens

### aiLoading
- Type: Boolean
- Initial Value: false
- Component: App
- Trigger: Set true while the AI recommendation is generating, false when done

### aiError
- Type: String | null
- Initial Value: null
- Component: App
- Trigger: Set when the AI call fails (drives the graceful fallback message)


# Data Flow:
App owns the orchestration state (`mode`, `submittedQuery`, `page`, `totalPages`) and passes `mode`/`query`/`page` down to **MovieList** — but App itself does no network or data work. The actual fetching lives in the **`src/services/tmdb.js`** layer (`fetchNowPlaying(page)`, `searchMovies(query, page)`), which build the URL and return the raw JSON. MovieList runs a `useEffect` keyed on `[mode, query, page]`: it picks the matching service function, reads the `results[]` array, and stores it in its own `movies` state. When `page === 1` the results **replace** `movies` (initial load, a new search, or returning to Now Playing); when `page > 1` they are **appended** (Load More). MovieList reports `total_pages` back up to App via `onTotalPages` so App can show/hide the Load More button (`page < totalPages`). Each card only needs `id`, `title`, `poster_path`, and `vote_average`, and the `poster_path` is turned into a full URL (`https://image.tmdb.org/t/p/w500{poster_path}`) inside MovieCard at render time. MovieList maps over `movies` and renders one **MovieCard** per movie, passing each `movie` object plus the `isFavorite`/`isWatched` flags derived from App's `favorites`/`watched` state.

When a user clicks a MovieCard, the card calls `onClick(movie.id)`; MovieList passes App's `onCardClick` straight through as that `onClick`, so the clicked movie's **id flows back up** to App and is stored in `selectedMovieId`. App owns a `useEffect` keyed on `[selectedMovieId]` that — when the id is non-null — calls `fetchMovieDetails(id)` (the `/movie/{id}` service function), storing the response in `details` (with `detailsLoading`/`detailsError` alongside) using an `ignore` flag to discard a stale response if the selection changes. App renders **MovieModal** (presentational — it does not fetch) whenever `selectedMovieId !== null`, passing `details`, `detailsLoading`, and `detailsError`. The details response is transformed for display inside the modal: `genres[]` is mapped to a comma-separated list of `name`s, `runtime` is formatted into hours/minutes, and `backdrop_path` is expanded into a full image URL (`w780`). Closing the modal (× button, backdrop click, or Escape) clears `selectedMovieId`, `details`, and `detailsError`. Sorting is a render-time transformation **inside MovieList** (the owner of that array): App holds `sortOption` and passes it down, and MovieList derives a sorted **copy** of `movies` via `useMemo` (title → A-Z, release date → newest first, vote average → highest first; "default" keeps API order) and maps over that copy. The source `movies` array is never reordered, so the pagination append logic is unaffected. Searching swaps the endpoint MovieList fetches — so the data path to MovieCard stays the same.


### AI Feature Spec:
- Which component will display the AI insight?  **MovieModal** — shown alongside the movie details.

- Provider: **OpenRouter** (`https://openrouter.ai/api/v1/chat/completions`). The request is made **directly from the client to the AI API URL** (not through a backend server), so it is visible in the browser DevTools Network tab as required.

- Role: A concise film critic / watch-recommendation assistant.

- Task: Given one movie's data, return a short, friendly recommendation telling the user whether and why they might enjoy watching it.

- Inputs (context sent to the AI): movie `title`, `genres`, `overview`, and `vote_average`.
- Output format: Plain text, 2–3 sentences. No markdown, no lists.

- Constraints: Keep to 2–3 sentences; no spoilers; conversational, encouraging tone; base the recommendation only on the supplied data.

- Failure behavior: While the request is in flight, show a loading state (`aiLoading`) in the modal. If the call fails or returns nothing, show a graceful fallback message (e.g. "Couldn't generate a recommendation right now.") driven by `aiError` — the rest of the modal still renders normally.

- Where does the AI response live in state? `aiRecommendation` (string|null), with `aiLoading` (boolean) and `aiError` (string|null) alongside it, owned by App and passed to MovieModal as props.


# Responsive / Breakpoints:
The movie grid (`.movie-list`) uses CSS Grid and is tuned at two breakpoints — **600px** and **1024px** — capped at a `1400px` max-width container. Target layout per viewport:

| Viewport      | Width range     | Cards/row | Card min     |
|---------------|-----------------|-----------|--------------|
| Wide desktop  | ≥ 1024px        | ~6        | 180px        |
| Tablet        | 600px – 1023px  | ~3–4      | 150px        |
| Mobile        | < 600px         | 2 (fixed) | 2-col layout |

Desktop and tablet use a fluid `repeat(auto-fill, minmax(<min>, 1fr))` grid; mobile switches to an explicit `repeat(2, 1fr)` so it always shows exactly two readable cards per row instead of collapsing to one oversized column. Gaps and padding tighten as the viewport narrows. Cards scale via `width: 100%` + `aspect-ratio: 2/3` on the poster, and the mobile breakpoint also reduces title/rating font size and action-icon size so the 2-up cells stay legible and uncluttered. (Implemented in `MovieList.css` and `MovieCard.css`.)
