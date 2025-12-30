/**
 * TagInput component - chip-based UI for managing task tags.
 *
 * Allows users to add and remove category tags for tasks.
 * Validates tags: max 10 tags, alphanumeric + hyphens/underscores, max 50 chars.
 */

"use client";

import { useState, KeyboardEvent } from "react";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
  maxTags?: number;
}

export function TagInput({
  tags,
  onChange,
  disabled = false,
  maxTags = 10,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const validateTag = (tag: string): string | null => {
    if (tag.length === 0) {
      return "Tag cannot be empty";
    }
    if (tag.length > 50) {
      return "Tag cannot exceed 50 characters";
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(tag)) {
      return "Tag can only contain letters, numbers, hyphens, and underscores";
    }
    if (tags.some((t) => t.toLowerCase() === tag.toLowerCase())) {
      return "Tag already exists";
    }
    return null;
  };

  const handleAddTag = () => {
    const trimmedTag = inputValue.trim();
    setError(null);

    if (!trimmedTag) {
      return;
    }

    if (tags.length >= maxTags) {
      setError(`Maximum ${maxTags} tags allowed`);
      return;
    }

    const validationError = validateTag(trimmedTag);
    if (validationError) {
      setError(validationError);
      return;
    }

    onChange([...tags, trimmedTag]);
    setInputValue("");
  };

  const handleRemoveTag = (indexToRemove: number) => {
    onChange(tags.filter((_, index) => index !== indexToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      // Remove last tag on backspace when input is empty
      handleRemoveTag(tags.length - 1);
    }
  };

  return (
    <div className="tag-input">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Tags {tags.length > 0 && `(${tags.length}/${maxTags})`}
      </label>

      {/* Tag chips */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="tag-chip inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
            >
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => handleRemoveTag(index)}
                disabled={disabled}
                className="tag-remove hover:text-blue-900 disabled:cursor-not-allowed"
                aria-label={`Remove ${tag} tag`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input field */}
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Add a tag..."
          disabled={disabled || tags.length >= maxTags}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        <button
          type="button"
          onClick={handleAddTag}
          disabled={disabled || !inputValue.trim() || tags.length >= maxTags}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
        >
          Add
        </button>
      </div>

      {/* Error message */}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      {/* Helper text */}
      {!error && (
        <p className="mt-1 text-xs text-gray-500">
          Press Enter to add a tag. Use letters, numbers, hyphens, and
          underscores only.
        </p>
      )}
    </div>
  );
}
