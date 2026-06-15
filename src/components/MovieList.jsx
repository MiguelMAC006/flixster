import { useState, useEffect } from 'react'
import MovieCard from './MovieCard'
import { fetchNowPlaying, searchMovies } from '../services/tmdb'
import './MovieList.css'

const MovieList = ({ mode, query, page, onTotalPages }) => {
  const [movies, setMovies] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Don't fetch a search with no query (e.g. right after clearing).
    if (mode === 'search' && !query) {
      return
    }

    let ignore = false

    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data =
          mode === 'search'
            ? await searchMovies(query, page)
            : await fetchNowPlaying(page)

        if (ignore) return

        const results = data.results ?? []
        // Page 1 replaces the list (initial load, new search, toggle);
        // later pages append (Load More).
        setMovies((prevMovies) =>
          page === 1 ? results : [...prevMovies, ...results]
        )
        onTotalPages(data.total_pages ?? 1)
      } catch (err) {
        if (ignore) return
        setError(err.message ?? 'Failed to load movies.')
      } finally {
        if (!ignore) setIsLoading(false)
      }
    }

    load()

    // Discard this fetch's result if mode/query/page changed before it landed.
    return () => {
      ignore = true
    }
  }, [mode, query, page, onTotalPages])

  // Full-screen loading only on a fresh list (page 1); appends keep the grid.
  if (isLoading && page === 1) {
    return <p className="movie-list__status">Loading movies…</p>
  }

  if (error) {
    return <p className="movie-list__status movie-list__status--error">{error}</p>
  }

  if (movies.length === 0) {
    return <p className="movie-list__status">No movies found.</p>
  }

  return (
    <div className="movie-list">
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} />
      ))}
    </div>
  )
}

export default MovieList
