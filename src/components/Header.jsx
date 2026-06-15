import './Header.css'

const Header = () => {
  return (
    <header className="header">
      <div className="header__inner">
        <img className="header__logo" src="/movie.png" alt="" />
        <div className="header__text">
          <h1 className="header__title">Flixster</h1>
          <p className="header__tagline">Discover what&apos;s playing now</p>
        </div>
      </div>
    </header>
  )
}

export default Header
