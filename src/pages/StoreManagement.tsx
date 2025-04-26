import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Plus, Pencil, Trash2, Search, ArrowUpDown, Loader, ChevronLeft, ChevronRight, Store as StoreIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import type { Store } from '../lib/types';

const PAGE_SIZE = 10;

type SortField = 'name' | 'owner' | 'category' | 'phone_number' | 'city';
type SortDirection = 'asc' | 'desc';

export function StoreManagement() {
  const navigate = useNavigate();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadStores();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadStores = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stores')
        .select(`*, category:store_categories(name), addresses(city, country:countries(name))`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setStores(data || []);
    } catch (error) {
      console.error('Error loading stores:', error);
      toast.error('Failed to load stores.');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (id: string) => {
    setStoreToDelete(id);
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!storeToDelete) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('id', storeToDelete);

      if (error) throw error;

      toast.success('Store deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting store:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete store.';
      toast.error(errorMessage);
    } finally {
      await loadStores();
      setStoreToDelete(null);
      setShowModal(false);
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredStores = stores.filter(store => {
    const searchLower = debouncedSearch.toLowerCase();
    const nameMatch = store.name.toLowerCase().includes(searchLower);
    const ownerMatch = `${store.owner_first_name} ${store.owner_last_name}`.toLowerCase().includes(searchLower);
    const categoryMatch = store.category?.name.toLowerCase().includes(searchLower);
    const phoneMatch = store.phone_number?.toLowerCase().includes(searchLower);
    const cityMatch = store.addresses?.city?.toLowerCase().includes(searchLower);

    return nameMatch || ownerMatch || categoryMatch || phoneMatch || cityMatch;
  });

  const sortedStores = [...filteredStores].sort((a, b) => {
    let aField: string = '';
    let bField: string = '';
    switch (sortField) {
      case 'name':
        aField = a.name;
        bField = b.name;
        break;
      case 'owner':
        aField = `${a.owner_first_name} ${a.owner_last_name}`;
        bField = `${b.owner_first_name} ${b.owner_last_name}`;
        break;
      case 'category':
        aField = a.category?.name || '';
        bField = b.category?.name || '';
        break;
      case 'phone_number':
        aField = a.phone_number || '';
        bField = b.phone_number || '';
        break;
      case 'city':
        aField = a.addresses?.city || '';
        bField = b.addresses?.city || '';
        break;
    }
    return sortDirection === 'asc' ? aField.localeCompare(bField) : bField.localeCompare(aField);
  });

  const paginatedStores = sortedStores.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const totalPages = Math.ceil(sortedStores.length / PAGE_SIZE);

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return <ArrowUpDown className={`h-4 w-4 inline ml-1 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} />;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl shadow-xl px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 flex items-center">
                <StoreIcon className="h-8 w-8 mr-2" /> Stores
              </h1>
              <p className="text-gray-500">Manage your store information and categories.</p>
            </div>
            <button
              onClick={() => navigate('/stores/new')}
              className="flex items-center px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Store
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
                placeholder="Search by name, owner, category, phone or city..."
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
              {sortedStores.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-100">
                      <tr>
                        {['name', 'owner', 'category', 'phone_number', 'city'].map((field) => (
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
                        {paginatedStores.map((store) => (
                          <motion.tr key={store.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <td className="px-6 py-4 text-gray-900 whitespace-nowrap">{store.name}</td>
                            <td className="px-6 py-4 text-gray-600">{store.owner_first_name} {store.owner_last_name}</td>
                            <td className="px-6 py-4 text-gray-600">{store.category?.name}</td>
                            <td className="px-6 py-4 text-gray-600">{store.phone_number}</td>
                            <td className="px-6 py-4 text-gray-600">{store.addresses?.city}</td>
                            <td className="px-6 py-4 flex justify-end gap-3">
                              <button onClick={() => navigate(`/stores/${store.id}`)} className="text-indigo-600 hover:text-indigo-900">
                                <Pencil className="h-5 w-5" />
                              </button>
                              <button onClick={() => confirmDelete(store.id)} className="text-red-600 hover:text-red-900">
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
                  <h2 className="text-gray-700 font-semibold text-xl">No stores found</h2>
                  <p className="text-gray-500">Try adjusting your search or adding new stores.</p>
                </div>
              )}

              {/* Pagination */}
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white p-8 rounded-lg shadow-lg">
                <h2 className="text-lg font-semibold mb-4">Confirm Deletion</h2>
                <p className="mb-6">Are you sure you want to delete this store?</p>
                <div className="flex justify-end gap-3">
                  <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
                    Cancel
                  </button>
                  <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
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
