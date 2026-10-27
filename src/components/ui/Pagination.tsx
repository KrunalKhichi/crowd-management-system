import { pageItems } from '@/utils/pagination'
import { Icon } from './Icon'
import styles from './Pagination.module.css'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  disabled?: boolean
  label?: string
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  disabled = false,
  label = 'Pagination',
}: PaginationProps) {
  if (totalPages <= 1) return null
  const items = pageItems(page, totalPages)
  return (
    <nav className={styles.nav} aria-label={label}>
      <button
        type="button"
        className={styles.arrow}
        onClick={() => {
          onPageChange(page - 1)
        }}
        disabled={disabled || page <= 1}
        aria-label="Previous page"
      >
        <Icon name="chevronLeft" size={16} />
      </button>
      <ul className={styles.list}>
        {items.map((item) =>
          typeof item === 'number' ? (
            <li key={item}>
              <button
                type="button"
                className={item === page ? styles.current : styles.page}
                onClick={() => {
                  onPageChange(item)
                }}
                disabled={disabled}
                aria-label={`Page ${item}`}
                aria-current={item === page ? 'page' : undefined}
              >
                {item}
              </button>
            </li>
          ) : (
            <li key={item} className={styles.ellipsis} aria-hidden="true">
              …
            </li>
          ),
        )}
      </ul>
      <button
        type="button"
        className={styles.arrow}
        onClick={() => {
          onPageChange(page + 1)
        }}
        disabled={disabled || page >= totalPages}
        aria-label="Next page"
      >
        <Icon name="chevronRight" size={16} />
      </button>
    </nav>
  )
}
