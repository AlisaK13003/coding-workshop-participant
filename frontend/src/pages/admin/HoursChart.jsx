import { formatHours, formatMoney } from '../../utils/format.js'
import './HoursChart.css'

/** Bar height as a percentage of the largest value in its series. */
function percent(value, max) {
  return max ? Math.max((value / max) * 100, value ? 2 : 0) : 0
}

/** Paired bar chart of logged hours and labor cost. data: [{ key, month, hours, cost }] from getMonthlyTotals. */
export function HoursChart({ data }) {
  const maxHours = Math.max(...data.map((item) => item.hours))
  const maxCost = Math.max(...data.map((item) => item.cost))
  return (
    <>
      <div className="chart">
        {data.map(({ key, month, hours, cost }) => (
          <div className="chart-group" key={key} title={`${formatHours(hours)} · ${formatMoney(cost)}`}>
            <div>
              <i className="bar-hours" style={{ height: `${percent(hours, maxHours)}%` }} />
              <i className="bar-cost" style={{ height: `${percent(cost, maxCost)}%` }} />
            </div>
            <span>{month}</span>
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
