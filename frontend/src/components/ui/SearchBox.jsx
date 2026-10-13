import { Search } from 'lucide-react'
import './SearchBox.css'

/** Search input with a leading icon. onChange receives the new string. */
export function SearchBox({ value, onChange, placeholder = 'Search' }) {
  return (
    <div className="search-box">
      <Search size={17} />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}
