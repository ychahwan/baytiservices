import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Plus, Pencil, Trash2, Search, ArrowUpDown } from 'lucide-react';
import type { Operator } from '../lib/types';

type SortField = 'name' | 'working_area' | 'phone_number' | 'created_at';
type SortDirection = 'asc' | 'desc';

export function OperatorManagement() {
  const navigate = useNavigate();
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  useEffect(() => {
    loadOperators();
  }, [sortField, sortDirection]);

  const loadOperators = async () => {
    setLoading(true);
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('User session not found');
      }

      const accessToken = session.access_token;
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/operators?select=*`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch operators');
      }

      const data = await response.json();
      setOperators(data || []);
    } catch (error) {
      console.error('Error loading operators:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this operator?'))
      return;

    setLoading(true);
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('User session not found');
      }

      const accessToken = session.access_token;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-operator`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ id }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete operator');
      }

      await loadOperators();
    } catch (error) {
      console.error('Error deleting operator:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredOperators = operators.filter((operator) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      operator.first_name.toLowerCase().includes(searchLower) ||
      operator.last_name.toLowerCase().includes(searchLower) ||
      (operator.phone_number &&
        operator.phone_number.toLowerCase().includes(searchLower)) ||
      (operator.working_area &&
        operator.working_area.toLowerCase().includes(searchLower))
    );
  });

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return (
      <ArrowUpDown
        className={`h-4 w-4 inline ml-1 ${
          sortDirection === 'asc' ? 'transform rotate-180' : ''
        }`}
      />
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow px-5 py-6 sm:px-6">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-3xl font-semibold text-gray-900">
                Operators
              </h1>
              <p className="mt-2 text-sm text-gray-700">
                Manage your operators and their information.
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <button
                onClick={() => navigate('/operators/new')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Operator
              </button>
            </div>
          </div>

          <div className="mt-4 relative">
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, phone, or working area..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="mt-8 flex flex-col">
            <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        {[
                          'name',
                          'working_area',
                          'phone_number',
                          'created_at',
                        ].map((field) => (
                          <th
                            key={field}
                            onClick={() => handleSort(field as SortField)}
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                          >
                            {field
                              .replace('_', ' ')
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                            {getSortIcon(field as SortField)}
                          </th>
                        ))}
                        <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {filteredOperators.length > 0 ? (
                        filteredOperators.map((operator) => (
                          <tr key={operator.id}>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                              {operator.first_name} {operator.last_name}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {operator.working_area}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {operator.phone_number}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {new Date(
                                operator.created_at
                              ).toLocaleDateString()}
                            </td>
                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                              <button
                                onClick={() =>
                                  navigate(`/operators/${operator.id}`)
                                }
                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(operator.id)}
                                disabled={loading}
                                className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-3 py-4 text-sm text-gray-500 text-center"
                          >
                            No operators found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
