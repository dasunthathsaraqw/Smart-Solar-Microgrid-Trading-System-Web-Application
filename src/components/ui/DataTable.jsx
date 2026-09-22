// DataTable.jsx — responsive presentation table for caller-supplied rows and columns.
// Author: M.K.E Dharmarathne it23142732
import LoadingState from "./LoadingState";
import EmptyState from "./EmptyState";
import ErrorState from "./ErrorState";

// Renders display columns and optional row actions without fetching or changing data.
export default function DataTable({ columns, rows, getRowKey, actions, isLoading = false, error = "", onRetry, emptyMessage = "No results found.", loadingMessage = "Loading..." }) {
  const columnCount = columns.length + (actions ? 1 : 0);

  return (
    <div className="overflow-x-auto rounded-lg border border-brand-border bg-brand-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-brand-white-soft text-brand-black">
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" className="whitespace-nowrap px-4 py-3">{column.header}</th>
            ))}
            {actions && <th scope="col" className="px-4 py-3">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {isLoading || error || rows.length === 0 ? (
            <tr>
              <td colSpan={columnCount}>
                {isLoading ? <LoadingState message={loadingMessage} /> : error ? <ErrorState message={error} onRetry={onRetry} /> : <EmptyState message={emptyMessage} />}
              </td>
            </tr>
          ) : rows.map((row) => (
            <tr key={getRowKey(row)} className="border-t border-brand-border">
              {columns.map((column) => (
                <td key={column.key} className="px-4 py-3">{column.render ? column.render(row) : row[column.key]}</td>
              ))}
              {actions && <td className="px-4 py-3"><div className="flex flex-wrap gap-2">{actions(row)}</div></td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
