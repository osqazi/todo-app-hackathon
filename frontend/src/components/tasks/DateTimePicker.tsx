"use client";

import { forwardRef } from "react";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface DateTimePickerProps {
  selected: Date | null;
  onChange: (date: Date | null) => void;
  label?: string;
  showTimeSelect?: boolean;
  timeIntervals?: number;
  dateFormat?: string;
  minDate?: Date;
  placeholderText?: string;
  isClearable?: boolean;
  className?: string;
}

/**
 * DateTimePicker component - wrapper around react-datepicker
 * Supports date and time selection with UTC conversion
 */
export default function DateTimePicker({
  selected,
  onChange,
  label = "Due Date",
  showTimeSelect = true,
  timeIntervals = 15,
  dateFormat = "MMM d, yyyy h:mm aa",
  minDate,
  placeholderText = "Select date and time",
  isClearable = true,
  className = "",
}: DateTimePickerProps) {
  // Custom input component for better styling
  const CustomInput = forwardRef<HTMLButtonElement, any>(({ value, onClick }, ref) => (
    <button
      type="button"
      onClick={onClick}
      ref={ref}
      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-left text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
    >
      {value || <span className="text-gray-400 dark:text-gray-500">{placeholderText}</span>}
    </button>
  ));
  CustomInput.displayName = "CustomInput";

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <div className="relative">
        <ReactDatePicker
          selected={selected}
          onChange={onChange}
          showTimeSelect={showTimeSelect}
          timeIntervals={timeIntervals}
          dateFormat={dateFormat}
          minDate={minDate}
          placeholderText={placeholderText}
          isClearable={isClearable}
          customInput={<CustomInput />}
          className={className}
          wrapperClassName="w-full"
          calendarClassName="shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
        />
      </div>
      {selected && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Selected: {selected.toLocaleString()}
        </p>
      )}
    </div>
  );
}
