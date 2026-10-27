interface ChartDataTableProps {
  caption: string
  columns: readonly string[]
  rows: readonly (readonly (string | number)[])[]
}

/** Visually hidden table giving screen-reader users the exact values behind a chart. */
export function ChartDataTable({ caption, columns, rows }: ChartDataTableProps) {
  return (
    <table className="visually-hidden">
      <caption>{caption}</caption>
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c} scope="col">
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => (
              <td key={j}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
