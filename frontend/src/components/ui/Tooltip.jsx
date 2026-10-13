import './Tooltip.css'

/** Small "?" bubble that shows `text` as a native tooltip on hover. */
export function Tooltip({ text }) {
  return (
    <span className="tooltip" title={text}>
      ?
    </span>
  )
}
