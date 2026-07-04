// src/components/explore/SearchBar.tsx

import { useState, useRef } from 'react';

interface SearchBarProps {
  placeholder?: string;
}

export default function SearchBar({ placeholder = 'ค้นหาดีล ร้านค้า...' }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      window.location.href = `/explore/search?q=${encodeURIComponent(query.trim())}`;
    }
  };

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div
        className={`relative flex items-center rounded-xl border-2 transition-all ${
          focused
            ? 'border-primary shadow-sm shadow-primary/10 bg-bg'
            : 'border-border bg-bg-secondary hover:border-border-hover'
        }`}
      >
        <svg
          className="absolute left-3.5 h-5 w-5 text-text-tertiary pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className="w-full bg-transparent py-3 pl-11 pr-10 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
          data-search-input
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 p-1 rounded-full text-text-tertiary hover:text-text-secondary hover:bg-bg-tertiary transition-colors"
            aria-label="Clear search"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </form>
  );
}
