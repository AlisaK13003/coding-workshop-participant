import { ChevronRight } from 'lucide-react'
import { Button } from './Button.jsx'

/** "View all ›" link-style button for a panel's header, e.g. to the full list page. */
export function ViewAllButton({ onClick }) {
  return (
    <Button variant="ghost" onClick={onClick}>
      View all <ChevronRight size={16} />
    </Button>
  )
}
