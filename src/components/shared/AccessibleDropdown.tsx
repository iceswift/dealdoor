// src/components/shared/AccessibleDropdown.tsx

import { useState, useRef, useEffect, useCallback } from 'react';
import { handleArrowNavigation } from '../../lib/accessibility';

interface DropdownItem {
  label: string;
  value: string;
  icon?: string;
  disabled?: boolean;
}

interface AccessibleDropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  onSelect: (value: string) => void;
  label: string;
}

export default function AccessibleDropdown({
  trigger,
  items,
  onSelect,
  label,
}: AccessibleDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemsRef = useRef<(HTMLButtonElement | null)[]>([]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
        setActiveIndex(0);
      }
      return;
    }

    const newIndex = handleArrowNavigation(
      e,
      itemsRef.current.filter(Boolean) as HTMLElement[],
      activeIndex,
      (index) => {
        const item = items[index];
        if (item && !item.disabled) {
          onSelect(item.value);
          setIsOpen(false);
          triggerRef.current?.focus();
        }
      }
    );

    setActiveIndex(newIndex);
  }, [isOpen, activeIndex, items, onSelect]);

  useEffect(() => {
    const element = dropdownRef.current;
    if (element) {
      element.addEventListener('keydown', handleKeyDown);
      return () => element.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown]);

  const handleItemClick = (item: DropdownItem) => {
    if (!item.disabled) {
      onSelect(item.value);
      setIsOpen(false);
      triggerRef.current?.focus();
    }
  };

  return (
    <div ref={dropdownRef} className="relative inline-block">
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={label}
      >
        {trigger}
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label={label}
          className="absolute right-0 top-full z-50 mt-2 min-w-[200px] rounded-lg border border-border bg-bg shadow-lg"
        >
          {items.map((item, index) => (
            <button
              key={item.value}
              ref={(el) => { itemsRef.current[index] = el; }}
              role="option"
              aria-selected={activeIndex === index}
              aria-disabled={item.disabled}
              onClick={() => handleItemClick(item)}
              onMouseEnter={() => setActiveIndex(index)}
              className={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors ${
                activeIndex === index ? 'bg-bg-secondary' : ''
              } ${item.disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-bg-secondary'}`}
            >
              {item.icon && <span>{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
