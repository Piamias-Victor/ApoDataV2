'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, X, Loader2, Shapes, CheckCircle2 } from 'lucide-react';
import { useFilterStore } from '@/stores/useFilterStore';
import { SelectedGroup } from '@/types/filters';

export const GroupSelector = () => {
    const { groups, setGroups } = useFilterStore();
    const [search, setSearch] = useState('');
    const [results, setResults] = useState<SelectedGroup[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Search groups when typing
    useEffect(() => {
        const fetchGroups = async () => {
            if (!search.trim()) {
                setResults([]);
                return;
            }

            setIsLoading(true);
            try {
                const response = await fetch('/api/groups/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ search }),
                });

                if (response.ok) {
                    const data = await response.json();
                    setResults(data.groups || []);
                }
            } catch (error) {
                console.error("Failed to search groups", error);
            } finally {
                setIsLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchGroups, 300);
        return () => clearTimeout(timeoutId);
    }, [search]);

    const handleSelect = (group: SelectedGroup) => {
        // Prevent duplicates
        if (!groups.some(g => g.id === group.id)) {
            setGroups([...groups, group]);
        }
        setSearch('');
        setIsOpen(false);
    };

    const handleRemove = (groupId: string) => {
        setGroups(groups.filter(g => g.id !== groupId));
    };

    const handleSelectAll = () => {
        const newGroups = [...groups];
        results.forEach(result => {
            if (!newGroups.some(g => g.id === result.id)) {
                newGroups.push(result);
            }
        });
        setGroups(newGroups);
        setSearch('');
        setIsOpen(false);
    };

    const handleReset = () => {
        setGroups([]);
        setSearch('');
        setResults([]);
    };

    return (
        <div className="w-full space-y-3" ref={containerRef}>
            <div className="relative flex items-center gap-2">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-pink-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2.5 bg-white border border-pink-100 rounded-xl focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all placeholder:text-gray-400 text-sm text-gray-900"
                        placeholder="Rechercher un groupe / molécule (ex: PARACETAMOL)..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setIsOpen(true);
                        }}
                        onFocus={() => setIsOpen(true)}
                    />

                    {/* Dropdown Results */}
                    {isOpen && (search || isLoading) && (
                        <div className="absolute z-50 mt-1 w-full bg-white rounded-xl shadow-lg border border-gray-100 max-h-60 overflow-y-auto custom-scrollbar py-2">
                            {isLoading ? (
                                <div className="flex justify-center p-4">
                                    <Loader2 className="w-5 h-5 animate-spin text-pink-500" />
                                </div>
                            ) : results.length > 0 ? (
                                <>
                                    <button
                                        onClick={handleSelectAll}
                                        className="w-full px-4 py-2 text-left text-xs font-semibold text-pink-600 bg-pink-50 hover:bg-pink-100 flex items-center gap-2 mb-1"
                                    >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        Tout sélectionner ({results.length})
                                    </button>
                                    {results.map((group) => {
                                        const isSelected = groups.some(g => g.id === group.id);
                                        return (
                                            <button
                                                key={group.id}
                                                onClick={() => handleSelect(group)}
                                                disabled={isSelected}
                                                className={`w-full px-4 py-2 text-left text-sm flex items-center justify-between hover:bg-gray-50 transition-colors ${isSelected ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Shapes className="w-4 h-4 text-gray-400" />
                                                    <div className="flex flex-col items-start">
                                                        <span className="text-gray-900 font-medium">{group.name}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {group.count !== undefined && (
                                                        <span className="text-xs text-gray-400">{group.count} produits</span>
                                                    )}
                                                    {!isSelected && <Plus className="w-4 h-4 text-gray-400" />}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </>
                            ) : (
                                <div className="p-4 text-center text-sm text-gray-500">
                                    Aucun résultat trouvé
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {groups.length > 0 && (
                    <button
                        onClick={handleReset}
                        className="px-3 py-2.5 text-sm font-medium text-pink-600 bg-pink-50 hover:bg-pink-100 border border-pink-200 rounded-xl transition-colors whitespace-nowrap"
                    >
                        Tout effacer
                    </button>
                )}
            </div>

            {/* Selected Tags */}
            {groups.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {groups.map((group) => (
                        <div key={group.id} className="inline-flex items-center gap-1.5 px-3 py-1 bg-pink-50 text-pink-700 border border-pink-100 rounded-full text-xs font-medium shadow-sm">
                            <Shapes className="w-3 h-3" />
                            <span>{group.name}</span>
                            {group.count !== undefined && (
                                <span className="text-pink-400 text-[10px] ml-1">({group.count})</span>
                            )}
                            <button
                                onClick={() => handleRemove(group.id)}
                                className="hover:bg-pink-100 rounded-full p-0.5 transition-colors ml-1"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
