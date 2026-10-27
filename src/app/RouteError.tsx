import { isRouteErrorResponse, Link, useRouteError } from 'react-router'
import styles from './RouteError.module.css'

/** Last-resort boundary for render errors and failed lazy chunk loads (e.g. after a deploy). */
export function RouteError() {
  const error = useRouteError()
  const notFound = isRouteErrorResponse(error) && error.status === 404
  return (
    <div className={styles.wrap} role="alert">
      <h1>{notFound ? 'Page not found' : 'Something went wrong'}</h1>
      <p>
        {notFound ? 'That page doesn’t exist.' : 'An unexpected error occurred. Reloading usually fixes it.'}
      </p>
      <div className={styles.actions}>
        {!notFound && (
          <button
            type="button"
            onClick={() => {
              window.location.reload()
            }}
          >
            Reload
          </button>
        )}
        <Link to="/overview">Go to Overview</Link>
      </div>
    </div>
  )
}
