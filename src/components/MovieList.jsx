import { useState, useEffect } from 'react'
import MovieCard from './MovieCard'
import './MovieList.css'

const MovieList = () => {
  const [movies, setMovies] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchNowPlaying = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const apiKey = import.meta.env.VITE_API_KEY
        const url = `https://api.themoviedb.org/3/movie/now_playing?api_key=${apiKey}&language=en-US&page=1`
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`Request failed (${response.status})`)
        }
        const data = await response.json()
        setMovies(data.results ?? [])
      } catch (err) {
        setError(err.message ?? 'Failed to load movies.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchNowPlaying()
  }, [])

  if (isLoading) {
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
