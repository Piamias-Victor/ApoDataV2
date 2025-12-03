import { useState, useEffect, useCallback } from 'react';
import { UserFilters, UsersResponse } from '@/types/user';

export function useUsers() {
    const [data, setData] = useState<UsersResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [filters, setFilters] = useState<UserFilters>({
        search: '',
        page: 1,
        limit: 20,
        includeDeleted: false
    });

    const fetchUsers = useCallback(async () => {
        console.log('🔄 [useUsers] Fetching users...', filters);
        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams();
            if (filters.search) params.append('search', filters.search);
            if (filters.role) params.append('role', filters.role);
            if (filters.includeDeleted) params.append('includeDeleted', 'true');
            if (filters.page) params.append('page', filters.page.toString());
            if (filters.limit) params.append('limit', filters.limit.toString());

            const url = `/api/admin/users?${params.toString()}`;
            console.log('🌐 [useUsers] Request URL:', url);

            const response = await fetch(url);
            console.log('📥 [useUsers] Response status:', response.status);

            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }

            const result = await response.json();
            console.log('✅ [useUsers] Data received:', result);
            setData(result);

        } catch (err) {
            console.error('❌ [useUsers] Error:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        console.log('⚡ [useUsers] Effect triggered');
        fetchUsers();
    }, [fetchUsers]);

    const setSearch = (search: string) => {
        setFilters(prev => ({ ...prev, search, page: 1 }));
    };

    const setPage = (page: number) => {
        setFilters(prev => ({ ...prev, page }));
    };

    const toggleDeleted = () => {
        setFilters(prev => ({ ...prev, includeDeleted: !prev.includeDeleted, page: 1 }));
    };

    const returnValue = {
        data,
        loading,
        error,
        filters,
        setSearch,
        setPage,
        toggleDeleted,
        refetch: fetchUsers
    };

    // Debug return value
    // console.log('📦 [useUsers] Returning:', { 
    //    hasData: !!data, 
    //    loading, 
    //    hasRefetch: !!returnValue.refetch 
    // });

    return returnValue;
}
