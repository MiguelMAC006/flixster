import './Footer.css'

const Footer = () => {
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="footer__inner">
        <p className="footer__copyright">
          &copy; {year} Miguel Cuevas. All rights reserved.
        </p>
        <nav className="footer__links" aria-label="Footer links">
          <a
            className="footer__link"
            href="https://www.themoviedb.org/"
            target="_blank"
            rel="noopener noreferrer"
          >
            The Movie Database
          </a>
          <a
            className="footer__link"
            href="https://github.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </nav>
        <p className="footer__attribution">
          This product uses the TMDb API but is not endorsed or certified by
          TMDb.
        </p>
      </div>
    </footer>
  )
}

export default Footer
