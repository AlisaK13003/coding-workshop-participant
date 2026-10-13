import { Link } from 'react-router-dom'
import './PlaceholderPage.css'

/** Temporary page for a workspace that has not been built yet. */
export default function PlaceholderPage({ workspace }) {
  return (
    <main className="placeholder-page">
      <section className="placeholder-panel" aria-labelledby="placeholder-title">
        <span className="placeholder-accent" aria-hidden="true" />
        <h1 id="placeholder-title">{workspace} workspace</h1>
        <p>Coming soon. This workspace is still being built.</p>
        <Link className="placeholder-link" to="/">
          Back to sign in
        </Link>
      </section>
    </main>
  )
}
