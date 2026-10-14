import { ChevronRight } from 'lucide-react'
import { Button } from './Button.jsx'

/** "View all ›" link-style button for a panel's header, e.g. to the full list page. */
export function ViewAllButton({ onClick, disabled = false, title }) {
  return (
    <Button variant="ghost" onClick={onClick} disabled={disabled} title={title}>
      View all <ChevronRight size={16} />
    </Button>
  )
}
