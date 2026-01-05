"use client";

export interface SortOptions {
  sort_by: string;
  sort_order: "asc" | "desc";
}

interface SortSelectorProps {
  value: SortOptions;
  onChange: (sort: SortOptions) => void;
}

const SORT_FIELDS = [
  { value: "created_at", label: "Date Created" },
  { value: "due_date", label: "Due Date" },
  { value: "priority", label: "Priority" },
  { value: "title", label: "Title" },
];

/**
 * Sort selector component with dropdown for sort field and order
 */
export default function SortSelector({ value, onChange }: SortSelectorProps) {
  const handleFieldChange = (field: string) => {
    onChange({ ...value, sort_by: field });
  };

  const handleOrderToggle = () => {
    onChange({ ...value, sort_order: value.sort_order === "asc" ? "desc" : "asc" });
  };

  const currentField = SORT_FIELDS.find((f) => f.value === value.sort_by) || SORT_FIELDS[0];

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Sort by:</label>
      <div className="flex items-center gap-1">
        <select
          value={value.sort_by}
          onChange={(e) => handleFieldChange(e.target.value)}
          className="block px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        >
          {SORT_FIELDS.map((field) => (
            <option key={field.value} value={field.value}>
              {field.label}
            </option>
          ))}
        </select>
        <button
          onClick={handleOrderToggle}
          className="p-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          aria-label={`Sort ${value.sort_order === "asc" ? "ascending" : "descending"}`}
          title={`Currently: ${value.sort_order === "asc" ? "Ascending" : "Descending"}. Click to toggle.`}
        >
          {value.sort_order === "asc" ? (
            <svg
              className="w-5 h-5 text-gray-600 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5 text-gray-600 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
