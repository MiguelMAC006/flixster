import './SearchBar.css'

const SearchBar = ({
  query,
  onQueryChange,
  onSearch,
  onClear,
}) => {
  const handleSubmit = (e) => {
    e.preventDefault()
    onSearch()
  }

  return (
    <form className="search-bar" role="search" onSubmit={handleSubmit}>
      <label className="search-bar__label" htmlFor="movie-search">
        Search movies
      </label>
      <input
        id="movie-search"
        className="search-bar__input"
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Search movies…"
        autoComplete="off"
      />
      <button type="submit" className="search-bar__btn search-bar__btn--search">
        Search
      </button>
      <button
        type="button"
        className="search-bar__btn search-bar__btn--clear"
        onClick={onClear}
      >
        Clear
      </button>
    </form>
  )
}

export default SearchBar
