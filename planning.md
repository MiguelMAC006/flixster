# Component Architecture:
### App
- Responsibility: Root component; owns app-level state (search, sort, selection, favorites/watched) and wires every child together. The Now Playing list fetch lives in MovieList.
- Renders: The entire page — Header, SearchBar, SortControl, MovieList, Footer (and conditionally MovieModal).
- Props: none (root).
- States: searchQuery, page, selectedMovie, sortOption, favorites, watched (see State Architecture). The `movies` array and its `isLoading`/`error` flags are owned by MovieList.
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
- Props: onCardClick (fn), favorites (Set/array), watched (Set/array), onToggleFavorite (fn), onToggleWatched (fn).
- States: movies (Array, init []), isLoading (Boolean, init false), error (String|null, init null).
- Trigger: Fetches the Now Playing endpoint via useEffect on mount and stores `results[]` in `movies`.
- Children: MovieCard

### MovieCard
- Responsibility: Display a movie's poster, title, and rating; on click open the MovieModal.
- Renders: A tile with a poster image, title, vote average, and favorite/watched toggle icons.
- Props: movie ({ id, title, poster_path, vote_average }), onClick (fn), isFavorite (bool), isWatched (bool), onToggleFavorite (fn), onToggleWatched (fn).
- States: None (favorite/watched state is lifted to App so the Favorites/Watched pages can read it — see State Architecture).
- Children: None

### MovieModal
- Responsibility: Display full details for the selected movie plus an AI watch recommendation.
- Renders: A centered, shadowed pop-up over a darkened backdrop showing backdrop image, title, runtime, release date, genres, overview, and the AI recommendation.
- Props: movie (details object), isOpen (bool), onClose (fn), aiRecommendation (string|null), aiLoading (bool), aiError (string|null).
- States: None (driven by App via props).
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
└── MovieModal (conditional, when selectedMovie !== null)
```


# API Contracts:
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
- URL: `GET https://api.themoviedb.org/3/movie/{movie_id}`
- Parameters: `api_key` (required), `language` (optional), `append_to_response=videos` (optional — for the stretch trailer feature)
- Response fields used: `runtime`, `backdrop_path`, `release_date`, `genres[].name`, `overview` (and `videos.results[]` for trailers if implemented)
- Error cases: invalid `movie_id` (404), missing `backdrop_path` or `runtime` (use a placeholder/fallback), network failure

Image transformation (not an endpoint): posters and backdrops are built from the base URL
`https://image.tmdb.org/t/p/w500{poster_path}` (use a larger size such as `w780`/`original` for the modal backdrop).


# State Architecture:
### movies
- Type: Array<Movie>
- Initial Value: []
- Component: MovieList
- Trigger: Now Playing fetch on mount (inside MovieList); replaced by Search results; appended by "Load More"; reordered by sort

### searchQuery
- Type: String
- Initial Value: ""
- Component: App
- Trigger: User types in the SearchBar input (onQueryChange); reset to "" on Clear

### page
- Type: Number
- Initial Value: 1
- Component: App
- Trigger: User clicks the "Load More" button (incremented, then re-fetch)

### selectedMovie
- Type: Object | null
- Initial Value: null
- Component: App
- Trigger: User clicks a MovieCard (set to the fetched details); cleared to null on modal close

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
On mount, **MovieList** calls the Now Playing endpoint and receives a raw JSON response. MovieList reads the `results[]` array and stores it in its own `movies` state — each card only needs `id`, `title`, `poster_path`, and `vote_average`, and the `poster_path` is turned into a full URL (`https://image.tmdb.org/t/p/w500{poster_path}`) inside MovieCard at render time. MovieList maps over `movies` and renders one **MovieCard** per movie, passing each `movie` object plus the `isFavorite`/`isWatched` flags derived from App's `favorites`/`watched` state.

When a user clicks a MovieCard, the card calls `onClick(movie.id)`; that handler lives in App, so the clicked movie's **id flows back up** to App. App then fires the Movie Details fetch (`/movie/{id}`), stores the result in `selectedMovie`, and renders **MovieModal** with it. The details response is transformed for display: `genres[]` is mapped to a comma-separated list of `name`s, `runtime` is formatted into hours/minutes, and `backdrop_path` is expanded into a full image URL. Sorting and searching are pure transformations of the `movies` array inside App before it is handed to MovieList, so the data path to MovieCard stays the same.


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
