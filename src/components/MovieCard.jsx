import PropTypes from 'prop-types'
import './MovieCard.css'

const POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w500'
const FALLBACK_POSTER = '/movie.png'

const HeartIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 21s-7.5-4.55-10-9.2C.5 8.5 2.1 5 5.5 5c2 0 3.4 1.2 4.5 2.6C11.1 6.2 12.5 5 14.5 5 17.9 5 19.5 8.5 22 11.8 19.5 16.45 12 21 12 21z" />
  </svg>
)

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 5c-5 0-9.27 3.11-11 7.5C2.73 16.89 7 20 12 20s9.27-3.11 11-7.5C21.27 8.11 17 5 12 5zm0 12.5a5 5 0 110-10 5 5 0 010 10z" />
    <circle cx="12" cy="12.5" r="2.5" />
  </svg>
)

const MovieCard = ({
  movie,
  onClick = () => {},
  isFavorite = false,
  isWatched = false,
  onToggleFavorite = () => {},
  onToggleWatched = () => {},
}) => {
  const posterUrl = movie.poster_path
    ? `${POSTER_BASE_URL}${movie.poster_path}`
    : FALLBACK_POSTER

  const handleFavorite = (e) => {
    e.stopPropagation()
    onToggleFavorite(movie.id)
  }

  const handleWatched = (e) => {
    e.stopPropagation()
    onToggleWatched(movie.id)
  }

  return (
    <article className="movie-card" onClick={() => onClick(movie.id)}>
      <div className="movie-card__poster-wrap">
        <img
          className="movie-card__poster"
          src={posterUrl}
          alt={movie.title}
          loading="lazy"
        />
        <div className="movie-card__actions">
          <button
            type="button"
            className={`movie-card__icon-btn${isFavorite ? ' is-active' : ''}`}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            aria-pressed={isFavorite}
            onClick={handleFavorite}
          >
            <HeartIcon />
          </button>
          <button
            type="button"
            className={`movie-card__icon-btn${isWatched ? ' is-active' : ''}`}
            aria-label={isWatched ? 'Mark as unwatched' : 'Mark as watched'}
            aria-pressed={isWatched}
            onClick={handleWatched}
          >
            <EyeIcon />
          </button>
        </div>
      </div>
      <div className="movie-card__info">
        <h3 className="movie-card__title">{movie.title}</h3>
        <span className="movie-card__rating">
          ★ {movie.vote_average?.toFixed(1) ?? 'N/A'}
        </span>
      </div>
    </article>
  )
}

export default MovieCard
