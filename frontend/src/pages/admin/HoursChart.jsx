import './HoursChart.css'

/** Paired bar chart of logged hours and labor cost. data: [{ month, hours, cost }] in percent. */
export function HoursChart({ data }) {
  return (
    <>
      <div className="chart">
        {data.map(({ month, hours, cost }) => (
          <div className="chart-group" key={month}>
            <div>
              <i className="bar-hours" style={{ height: `${hours}%` }} />
              <i className="bar-cost" style={{ height: `${cost}%` }} />
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
