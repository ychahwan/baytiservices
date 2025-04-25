import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Plus, Pencil, Trash2, Search, ArrowUpDown } from 'lucide-react';
import type { FieldOperator } from '../lib/types';

type SortField = 'name' | 'working_area' | 'phone_number' | 'domain' | 'created_at';
type SortDirection = 'asc' | 'desc';

export function FieldOperatorManagement() {
  const navigate = useNavigate();
  const [fieldOperators, setFieldOperators] = useState<FieldOperator[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  useEffect(() => {
    loadFieldOperators();
  }, [sortField, sortDirection]);

  const loadFieldOperators = async () => {
    const { data, error } = await supabase
      .from('field_operators')
      .select('*')
      .order(sortField === 'name' ? 'first_name' : sortField, { ascending: sortDirection === 'asc' });

    if (error) {
      console.error('Error loading field operators:', error);
      return;
    }

    setFieldOperators(data || []);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this field operator?')) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('field_operators')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await loadFieldOperators();
    } catch (err) {
      console.error('Error deleting field operator:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredFieldOperators = fieldOperators.filter(operator => {
    const searchLower = searchTerm.toLowerCase();
    return (
      operator.first_name.toLowerCase().includes(searchLower) ||
      operator.last_name.toLowerCase().includes(searchLower) ||
      (operator.phone_number && operator.phone_number.toLowerCase().includes(searchLower)) ||
      (operator.working_area && operator.working_area.toLowerCase().includes(searchLower)) ||
      (operator.domain && operator.domain.toLowerCase().includes(searchLower))
    );
  });

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return (
      <ArrowUpDown className={`h-4 w-4 inline ml-1 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} />
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow px-5 py-6 sm:px-6">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-3xl font-semibold text-gray-900">Field Operators</h1>
              <p className="mt-2 text-sm text-gray-700">
                Manage your field operators and their information
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <button
                onClick={() => navigate('/field-operators/new')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Field Operator
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
                placeholder="Search by name, phone, working area, or domain..."
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
                        <th 
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('name')}
                        >
                          Name {getSortIcon('name')}
                        </th>
                        <th 
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('working_area')}
                        >
                          Working Area {getSortIcon('working_area')}
                        </th>
                        <th 
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('domain')}
                        >
                          Domain {getSortIcon('domain')}
                        </th>
                        <th 
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('phone_number')}
                        >
                          Phone {getSortIcon('phone_number')}
                        </th>
                        <th 
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('created_at')}
                        >
                          Created At {getSortIcon('created_at')}
                        </th>
                        <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {filteredFieldOperators.map((operator) => (
                        <tr key={operator.id}>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                            {operator.first_name} {operator.last_name}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {operator.working_area}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {operator.domain}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {operator.phone_number}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {new Date(operator.created_at).toLocaleDateString()}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <button
                              onClick={() => navigate(`/field-operators/${operator.id}`)}
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
                      ))}
                      {filteredFieldOperators.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-3 py-4 text-sm text-gray-500 text-center">
                            No field operators found
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