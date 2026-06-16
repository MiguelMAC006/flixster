import { useEffect, useState } from 'react'
import { getMovieInsight } from '../services/openrouter'
import './MovieModal.css'

const BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/w780'

const SparkleIcon = () => (
  <svg viewBox="0 0 512 512" fill="currentColor" aria-hidden="true">
    <path d="M286 110c8-15 30-15 38 0 18 34 36 53 60 67 16 9 16 33 0 42-24 14-42 33-60 67-8 15-30 15-38 0-18-34-36-53-60-67-16-9-16-33 0-42 24-14 42-33 60-67z" />
    <path d="M122 92c6-13 25-13 31 0 12 24 24 36 42 47 13 7 13 27 0 34-18 11-30 23-42 47-6 13-25 13-31 0-12-24-24-36-42-47-13-7-13-27 0-34 18-11 30-23 42-47z" />
    <path d="M243 28c4-9 16-9 20 0 6 13 12 19 22 25 8 4 8 16 0 20-10 6-16 12-22 25-4 9-16 9-20 0-6-13-12-19-22-25-8-4-8-16 0-20 10-6 16-12 22-25z" />
  </svg>
)

// Picks the best YouTube trailer from TMDb's videos payload: an official
// "Trailer" if present, otherwise any YouTube trailer, then any YouTube clip.
// Returns the video key (used to build the embed URL) or null.
const findTrailerKey = (videos) => {
  const results = videos?.results?.filter((v) => v.site === 'YouTube') ?? []
  if (results.length === 0) return null
  const trailer =
    results.find((v) => v.type === 'Trailer' && v.official) ??
    results.find((v) => v.type === 'Trailer') ??
    results[0]
  return trailer?.key ?? null
}

// "128" -> "2h 8m"; guards a missing/zero runtime.
const formatRuntime = (runtime) => {
  if (!runtime) return null
  const hours = Math.floor(runtime / 60)
  const minutes = runtime % 60
  if (hours === 0) return `${minutes}m`
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}m`
}

const MovieModal = ({ details, isLoading, error, onClose }) => {
  // AI watch recommendation — fetched once details land (see AI Feature Spec).
  const [aiInsight, setAiInsight] = useState(null)
  const [loadingInsight, setLoadingInsight] = useState(false)

  // Close on Escape, regardless of focus. Listener lives only while open.
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Only a click on the backdrop itself (not a bubbled click from the card) closes.
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  const backdropUrl = details?.backdrop_path
    ? `${BACKDROP_BASE_URL}${details.backdrop_path}`
    : null
  const runtime = formatRuntime(details?.runtime)
  const genres = details?.genres?.map((genre) => genre.name).join(', ')
  const trailerKey = findTrailerKey(details?.videos)

  // Once details are loaded, ask the AI for a watch recommendation. Keyed on
  // the movie id so switching movies refetches; the `ignore` flag discards a
  // stale response if the user switches before this one lands.
  useEffect(() => {
    if (!details) return

    let ignore = false

    const loadInsight = async () => {
      setLoadingInsight(true)
      setAiInsight(null)
      const insight = await getMovieInsight(details.title, genres, details.overview)
      if (!ignore) {
        setAiInsight(insight)
        setLoadingInsight(false)
      }
    }

    loadInsight()

    return () => {
      ignore = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [details?.id])

  return (
    <div className="movie-modal__overlay" onClick={handleBackdropClick}>
      <div
        className="movie-modal"
        role="dialog"
        aria-modal="true"
        aria-label={details?.title ?? 'Movie details'}
      >
        <button
          type="button"
          className="movie-modal__close"
          aria-label="Close"
          onClick={onClose}
        >
          ×
        </button>

        {isLoading && (
          <p className="movie-modal__status">Loading details…</p>
        )}

        {!isLoading && error && (
          <p className="movie-modal__status movie-modal__status--error">
            Couldn&apos;t load movie details. Please try again.
          </p>
        )}

        {!isLoading && !error && details && (
          <>
            {backdropUrl && (
              <img
                className="movie-modal__backdrop"
                src={backdropUrl}
                alt={`${details.title} backdrop`}
              />
            )}
            <div className="movie-modal__body">
              <h2 className="movie-modal__title">{details.title}</h2>
              <div className="movie-modal__meta">
                {runtime && <span>{runtime}</span>}
                {details.release_date && <span>{details.release_date}</span>}
              </div>
              {genres && <p className="movie-modal__genres">{genres}</p>}
              {details.overview && (
                <p className="movie-modal__overview">{details.overview}</p>
              )}

              {trailerKey && (
                <div className="movie-modal__trailer">
                  <h3 className="movie-modal__trailer-label">Trailer</h3>
                  <div className="movie-modal__trailer-frame-wrap">
                    <iframe
                      className="movie-modal__trailer-frame"
                      src={`https://www.youtube.com/embed/${trailerKey}`}
                      title={`${details.title} trailer`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              <div className="movie-modal__insight">
                <h3 className="movie-modal__insight-label">Watch Recommendation</h3>
                {loadingInsight ? (
                  <p className="movie-modal__insight-loading">
                    <span className="movie-modal__insight-sparkle">
                      <SparkleIcon />
                    </span>
                    Getting a recommendation…
                  </p>
                ) : (
                  aiInsight && (
                    <p className="movie-modal__insight-text">{aiInsight}</p>
                  )
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default MovieModal
