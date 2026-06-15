import { useState, useEffect, useCallback } from 'react'
import Header from './components/Header'
import SearchBar from './components/SearchBar'
import SortControl from './components/SortControl'
import MovieList from './components/MovieList'
import MovieModal from './components/MovieModal'
import Footer from './components/Footer'
import { fetchMovieDetails } from './services/tmdb'
import './App.css'

const App = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [mode, setMode] = useState('now_playing')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [sortOption, setSortOption] = useState('default')

  // Modal: the clicked movie's id drives a separate details fetch.
  const [selectedMovieId, setSelectedMovieId] = useState(null)
  const [details, setDetails] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState(null)

  // Fetch full details whenever a movie is selected; skip when none is.
  useEffect(() => {
    if (selectedMovieId === null) return

    let ignore = false

    const load = async () => {
      setDetailsLoading(true)
      setDetailsError(null)
      try {
        const data = await fetchMovieDetails(selectedMovieId)
        if (ignore) return
        setDetails(data)
      } catch (err) {
        if (ignore) return
        setDetailsError(err.message ?? 'Failed to load movie details.')
      } finally {
        if (!ignore) setDetailsLoading(false)
      }
    }

    load()

    return () => {
      ignore = true
    }
  }, [selectedMovieId])

  const handleQueryChange = (value) => setSearchQuery(value)

  const handleSearch = () => {
    const trimmed = searchQuery.trim()
    if (!trimmed) return
    setSubmittedQuery(trimmed)
    setMode('search')
    setPage(1)
  }

  const handleClear = () => {
    setSearchQuery('')
    setSubmittedQuery('')
    setMode('now_playing')
    setPage(1)
  }

  const handleLoadMore = () => setPage((prevPage) => prevPage + 1)

  const handleCardClick = (id) => setSelectedMovieId(id)

  const handleSortChange = (value) => setSortOption(value)

  // Clear details too so reopening a card never flashes the previous movie.
  const handleCloseModal = () => {
    setSelectedMovieId(null)
    setDetails(null)
    setDetailsError(null)
  }

  // Stable so it doesn't re-trigger MovieList's fetch effect on every render.
  const handleTotalPages = useCallback((total) => setTotalPages(total), [])

  const hasMore = page < totalPages

  return (
    <div className="app">
      <Header />
      <SearchBar
        query={searchQuery}
        onQueryChange={handleQueryChange}
        onSearch={handleSearch}
        onClear={handleClear}
      />
      <SortControl sortOption={sortOption} onSortChange={handleSortChange} />
      <MovieList
        mode={mode}
        query={submittedQuery}
        page={page}
        sortOption={sortOption}
        onTotalPages={handleTotalPages}
        onCardClick={handleCardClick}
      />
      {hasMore && (
        <div className="load-more">
          <button
            type="button"
            className="load-more__btn"
            onClick={handleLoadMore}
          >
            Load More
          </button>
        </div>
      )}
      {selectedMovieId !== null && (
        <MovieModal
          details={details}
          isLoading={detailsLoading}
          error={detailsError}
          onClose={handleCloseModal}
        />
      )}
      <Footer />
    </div>
  )
}

export default App
