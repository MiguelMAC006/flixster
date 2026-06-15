import './SortControl.css'

const SortControl = ({ sortOption, onSortChange }) => {
  return (
    <div className="sort-control">
      <label className="sort-control__label" htmlFor="movie-sort">
        Sort movies
      </label>
      <select
        id="movie-sort"
        className="sort-control__select"
        value={sortOption}
        onChange={(e) => onSortChange(e.target.value)}
      >
        <option value="default">Browse by…</option>
        <option value="title">Title (A-Z)</option>
        <option value="release_date">Release Date (Newest)</option>
        <option value="vote_average">Vote Average (Highest)</option>
      </select>
    </div>
  )
}

export default SortControl
