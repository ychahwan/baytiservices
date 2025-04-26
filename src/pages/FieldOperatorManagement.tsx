import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Plus, Pencil, Trash2, Search, ArrowUpDown, Loader, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import type { FieldOperator } from '../lib/types';

const PAGE_SIZE = 10;

type SortField = 'name' | 'working_area' | 'phone_number' | 'domain' | 'created_at';
type SortDirection = 'asc' | 'desc';

export function FieldOperatorManagement() {
  const navigate = useNavigate();
  const [fieldOperators, setFieldOperators] = useState<FieldOperator[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [operatorToDelete, setOperatorToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadFieldOperators();
  }, [sortField, sortDirection]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadFieldOperators = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('field_operators')
        .select('*')
        .order(sortField === 'name' ? 'first_name' : sortField, { ascending: sortDirection === 'asc' });

      if (error) throw error;

      setFieldOperators(data || []);
    } catch (error) {
      console.error('Error loading field operators:', error);
      toast.error('Failed to load field operators.');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (id: string) => {
    setOperatorToDelete(id);
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!operatorToDelete) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('field_operators')
        .delete()
        .eq('id', operatorToDelete);

      if (error) throw error;

      toast.success('Field operator deleted successfully!');
    } catch (error) {
      console.error('Error deleting field operator:', error);
      toast.error('Failed to delete field operator.');
    } finally {
      await loadFieldOperators();
      setShowModal(false);
      setOperatorToDelete(null);
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

  const filteredFieldOperators = fieldOperators.filter((operator) => {
    const searchLower = debouncedSearch.toLowerCase();
    return (
      operator.first_name.toLowerCase().includes(searchLower) ||
      operator.last_name.toLowerCase().includes(searchLower) ||
      (operator.phone_number && operator.phone_number.toLowerCase().includes(searchLower)) ||
      (operator.working_area && operator.working_area.toLowerCase().includes(searchLower)) ||
      (operator.domain && operator.domain.toLowerCase().includes(searchLower))
    );
  });

  const paginatedOperators = filteredFieldOperators.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const totalPages = Math.ceil(filteredFieldOperators.length / PAGE_SIZE);

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return (
      <ArrowUpDown
        className={`h-4 w-4 inline ml-1 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`}
      />
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl shadow-xl px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-800">Field Operators</h1>
              <p className="text-gray-500">Manage your field operators easily.</p>
            </div>
            <button
              onClick={() => navigate('/field-operators/new')}
              className="flex items-center px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Field Operator
            </button>
          </div>

          <div className="mt-6 relative">
            <div className="relative rounded-lg shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, phone, working area, or domain..."
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center mt-10">
              <Loader className="animate-spin h-10 w-10 text-indigo-600" />
            </div>
          ) : (
            <div className="mt-8">
              {filteredFieldOperators.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-100">
                      <tr>
                        {['name', 'working_area', 'domain', 'phone_number', 'created_at'].map((field) => (
                          <th
                            key={field}
                            onClick={() => handleSort(field as SortField)}
                            className="px-6 py-3 text-left text-sm font-bold text-gray-700 hover:bg-gray-200 cursor-pointer"
                          >
                            {field.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                            {getSortIcon(field as SortField)}
                          </th>
                        ))}
                        <th className="px-6 py-3 text-right text-sm font-bold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      <AnimatePresence>
                        {paginatedOperators.map((operator) => (
                          <motion.tr
                            key={operator.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-gray-900">{operator.first_name} {operator.last_name}</td>
                            <td className="px-6 py-4 text-gray-600">{operator.working_area}</td>
                            <td className="px-6 py-4 text-gray-600">{operator.domain}</td>
                            <td className="px-6 py-4 text-gray-600">{operator.phone_number}</td>
                            <td className="px-6 py-4 text-gray-600">{new Date(operator.created_at).toLocaleDateString()}</td>
                            <td className="px-6 py-4 flex justify-end gap-3">
                              <button
                                onClick={() => navigate(`/field-operators/${operator.id}`)}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                <Pencil className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => confirmDelete(operator.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16">
                  <h2 className="text-gray-700 font-semibold text-xl">No field operators found</h2>
                  <p className="text-gray-500">Try adjusting your search or adding new operators.</p>
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 mt-6">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    className="px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="font-semibold">Page {currentPage} of {totalPages}</span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    className="px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50"
            >
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white p-8 rounded-lg shadow-lg">
                <h2 className="text-lg font-semibold mb-4">Confirm Deletion</h2>
                <p className="mb-6">Are you sure you want to delete this field operator?</p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
