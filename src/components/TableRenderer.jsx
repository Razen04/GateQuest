/**
 * Renders a markdown table with LaTeX support inside cells
 */
const TableRenderer = ({ tableText }) => {
    // Skip if no table text
    if (!tableText || typeof tableText !== 'string') return null

    // Parse the table from markdown format
    const lines = tableText.trim().split('\n')
    const tableLines = lines.filter(line => line.trim().startsWith('|'))

    // Need at least header and one data row
    if (tableLines.length < 3) return <p className="text-red-500">Invalid table format</p>

    // Process table rows
    const rows = tableLines.map(line => {
        // Split by | but remove first and last empty elements
        return line.split('|')
            .filter(cell => cell.trim() !== '')
            .map(cell => cell.trim())
    })

    // Extract header (first row) and ignore separator (second row)
    const headers = rows[0]
    const dataRows = rows.slice(2) // Skip the separator row

    return (
        <div className="overflow-x-auto my-4">
            <table className="min-w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                    <tr>
                        {headers.map((header, i) => (
                            <th key={i} className="px-4 py-2 text-left text-sm font-medium text-gray-600 border-b">
                                <MathRenderer text={header} />
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {dataRows.map((row, rowIndex) => (
                        <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            {row.map((cell, cellIndex) => (
                                <td key={cellIndex} className="px-4 py-2 text-sm text-gray-700 border-t">
                                    <MathRenderer text={cell} />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default TableRenderer