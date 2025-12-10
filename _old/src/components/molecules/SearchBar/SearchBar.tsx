// src/components/molecules/SearchBar/SearchBar.tsx
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useDebounce } from '@/hooks/shared/useDebounce';

interface SearchBarProps {
  readonly placeholder?: string;
  readonly onSearch: (query: string) => void;
  readonly className?: string;
}

/**
 * SearchBar - Barre de recherche avec debounce pour tableau produits
 * 
 * Features :
 * - Debounce 300ms pour performance
 * - Clear button avec icône X
 * - Placeholder intelligent
 * - Recherche par fin de code avec * + fin du code
 * - Taille agrandie pour meilleure UX
 * - Focus states accessibles
 */
export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Rechercher par nom, code EAN ou *fin_code...',
  onSearch,
  className = ''
}) => {
  const [query, setQuery] = useState('');
  
  // Valeur debouncée de la query
  const debouncedQuery = useDebounce(query, 300);
  
  // Effect pour déclencher la recherche quand la valeur debouncée change
  useEffect(() => {
    onSearch(debouncedQuery);
  }, [debouncedQuery, onSearch]);

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setQuery(value);
  }, []);

  const handleClear = useCallback(() => {
    setQuery('');
  }, []);

  const handleSubmit = useCallback((event: React.FormEvent) => {
    event.preventDefault();
    onSearch(query);
  }, [query, onSearch]);

  return (
    <form 
      onSubmit={handleSubmit}
      className={`relative w-full max-w-lg ${className}`}
    >
      {/* Icône recherche */}
      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
        <Search className="w-5 h-5 text-gray-400" />
      </div>

      {/* Input principal agrandi */}
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        placeholder={placeholder}
        className="
          w-full pl-12 pr-12 py-3.5 
          bg-white border border-gray-200 rounded-xl
          text-sm text-gray-900 placeholder-gray-500
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          transition-all duration-200
          hover:border-gray-300
          shadow-sm hover:shadow-md
        "
      />

      {/* Clear button */}
      {query && (
        <button
          type="button"
          onClick={handleClear}
          className="
            absolute inset-y-0 right-0 flex items-center pr-4
            text-gray-400 hover:text-gray-600
            transition-colors duration-200
          "
          aria-label="Effacer la recherche"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </form>
  );
};