const API_BASE_URL = 'https://api.themoviedb.org/3'
const API_KEY = import.meta.env.VITE_API_KEY

// Builds a full TMDb URL with the api_key and any extra params, then fetches
// it and returns the parsed JSON. Throws on a non-ok response so callers can
// surface a consistent error message.
const request = async (path, params = {}) => {
  const url = new URL(`${API_BASE_URL}${path}`)
  url.searchParams.set('api_key', API_KEY)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`)
  }
  return response.json()
}

// Now Playing list, paginated. Returns { results, page, total_pages }.
export const fetchNowPlaying = (page = 1) =>
  request('/movie/now_playing', { language: 'en-US', page })

// Search movies by title, paginated. Same response shape as Now Playing.
export const searchMovies = (query, page = 1) =>
  request('/search/movie', { query, page })
