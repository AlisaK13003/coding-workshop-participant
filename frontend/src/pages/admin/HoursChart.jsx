import { useState } from 'react'
import { formatHours, formatMoney } from '../../utils/format.js'
import './HoursChart.css'

/** Bar height as a percentage of the largest value in its series. */
function percent(value, max) {
  return max ? Math.max((value / max) * 100, value ? 2 : 0) : 0
}

/** "October 2026" from a "2026-10" key. */
function monthLabel(key) {
  const [year, month] = key.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })
}

/** Keeps the tooltip inside the chart: edge months align it to their side instead of centring it. */
function tooltipSide(index, count) {
  if (index === 0) return 'align-start'
  return index === count - 1 ? 'align-end' : ''
}

/**
 * Paired bar chart of logged hours and labor cost. data: [{ key, month, hours, cost }] from
 * getMonthlyTotals. Hovering or focusing a month (the whole column is the target) shows a
 * tooltip with both values, since the chart has no y-axis.
 */
export function HoursChart({ data }) {
  const [active, setActive] = useState(null)
  const maxHours = Math.max(...data.map((item) => item.hours))
  const maxCost = Math.max(...data.map((item) => item.cost))
  return (
    <>
      <div className="chart" onPointerLeave={() => setActive(null)}>
        {data.map(({ key, month, hours, cost }, index) => (
          <div
            className={`chart-group${active === key ? ' active' : ''}`}
            key={key}
            tabIndex={0}
            aria-label={`${monthLabel(key)}: ${formatHours(hours)} logged, ${formatMoney(cost)} labor cost`}
            onPointerEnter={() => setActive(key)}
            onFocus={() => setActive(key)}
            onBlur={() => setActive(null)}
          >
            <div className="chart-bars">
              <i className="bar-hours" style={{ height: `${percent(hours, maxHours)}%` }} />
              <i className="bar-cost" style={{ height: `${percent(cost, maxCost)}%` }} />
            </div>
            <span>{month}</span>
            {active === key && (
              <div className={`chart-tooltip ${tooltipSide(index, data.length)}`} role="tooltip">
                <small>{monthLabel(key)}</small>
                <p>
                  <i className="tooltip-key legend-teal" />
                  <strong>{formatHours(hours)}</strong> logged hours
                </p>
                <p>
                  <i className="tooltip-key legend-dark" />
                  <strong>{formatMoney(cost)}</strong> labor cost
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="chart-legend">
        <span>
          <i className="legend-teal" />
          Logged hours
        </span>
        <span>
          <i className="legend-dark" />
          Labor cost
        </span>
      </div>
    </>
  )
}
