import { useState, useCallback } from 'react'
import SearchBar from './components/SearchBar'
import MovieList from './components/MovieList'
import './App.css'

const App = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [mode, setMode] = useState('now_playing')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

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

  // Stable so it doesn't re-trigger MovieList's fetch effect on every render.
  const handleTotalPages = useCallback((total) => setTotalPages(total), [])

  const hasMore = page < totalPages

  return (
    <div className="app">
      <SearchBar
        query={searchQuery}
        onQueryChange={handleQueryChange}
        onSearch={handleSearch}
        onClear={handleClear}
      />
      <MovieList
        mode={mode}
        query={submittedQuery}
        page={page}
        onTotalPages={handleTotalPages}
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
    </div>
  )
}

export default App
