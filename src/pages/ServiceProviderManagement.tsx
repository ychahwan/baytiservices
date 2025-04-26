import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Plus, Pencil, Trash2, Search, ArrowUpDown, Loader, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const PAGE_SIZE = 10;

export function ServiceProviderManagement() {
  const navigate = useNavigate();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [providerToDelete, setProviderToDelete] = useState(null);

  useEffect(() => {
    loadServiceProviders();
  }, [sortField, sortDirection]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadServiceProviders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('service_providers')
        .select(`*, addresses (city, country:countries (name)), service_provider_types (service_type:service_types (id, name, subcategory:subcategories (id, name, category:categories (id, name)))), service_provider_working_areas (working_area:working_areas (id, name))`)
        .order(sortField, { ascending: sortDirection === 'asc' });

      if (error) throw error;
      setProviders(data || []);
    } catch (error) {
      console.error('Error fetching service providers:', error);
      toast.error('Failed to load service providers.');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (id) => {
    setProviderToDelete(id);
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!providerToDelete) return;
    
    setLoading(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) throw new Error('User session not found');
  
      const accessToken = session.access_token;
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-service-provider`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ id: providerToDelete }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete service provider');
      }

      toast.success('Service provider deleted successfully!');
      await loadServiceProviders();
    } catch (error) {
      console.error('Error deleting service provider:', error);
      toast.error('Failed to delete service provider.');
    } finally {
      setProviderToDelete(null);
      setShowModal(false);
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredProviders = providers.filter((provider) => {
    const searchLower = debouncedSearch.toLowerCase();
    return (
      `${provider.first_name} ${provider.last_name}`.toLowerCase().includes(searchLower) ||
      (provider.phone_number || '').toLowerCase().includes(searchLower) ||
      provider.service_provider_working_areas.some((area) => area.working_area.name.toLowerCase().includes(searchLower)) ||
      (provider.addresses?.city || '').toLowerCase().includes(searchLower) ||
      provider.status.toLowerCase().includes(searchLower) ||
      (provider.is_company ? 'company' : 'individual').includes(searchLower) ||
      provider.service_provider_types.some((spt) =>
        spt.service_type.name.toLowerCase().includes(searchLower) ||
        spt.service_type.subcategory.name.toLowerCase().includes(searchLower) ||
        spt.service_type.subcategory.category.name.toLowerCase().includes(searchLower)
      )
    );
  });

  const paginatedProviders = filteredProviders.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const totalPages = Math.ceil(filteredProviders.length / PAGE_SIZE);

  const getSortIcon = (field) => {
    if (sortField !== field) return null;
    return (
      <ArrowUpDown className={`h-4 w-4 inline ml-1 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} />
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl shadow-xl px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-800">Service Providers</h1>
              <p className="text-gray-500">Manage your service provider profiles easily.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/service-providers/new')}
                className="flex items-center px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
              >
                <Plus className="h-4 w-4 mr-2" /> Add Provider
              </button>
            </div>
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
                placeholder="Search providers..."
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
              {filteredProviders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-100">
                      <tr>
                        {['first_name', 'phone_number', 'working_area', 'type', 'city', 'status', 'created_at'].map((field) => (
                          <th
                            key={field}
                            onClick={() => handleSort(field)}
                            className="px-6 py-3 text-left text-sm font-bold text-gray-700 hover:bg-gray-200 cursor-pointer"
                          >
                            {field.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                            {getSortIcon(field)}
                          </th>
                        ))}
                        <th className="px-6 py-3 text-right text-sm font-bold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      <AnimatePresence>
                        {paginatedProviders.map((provider) => (
                          <motion.tr
                            key={provider.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-gray-900">{provider.first_name} {provider.last_name}</td>
                            <td className="px-6 py-4 text-gray-600">{provider.phone_number}</td>
                            <td className="px-6 py-4 text-gray-600">{provider.service_provider_working_areas.map(a => a.working_area.name).join(', ')}</td>
                            <td className="px-6 py-4 text-gray-600">{provider.is_company ? 'Company' : 'Individual'}</td>
                            <td className="px-6 py-4 text-gray-600">{provider.addresses?.city}</td>
                            <td className="px-6 py-4 text-gray-600">{provider.status}</td>
                            <td className="px-6 py-4 text-gray-600">{new Date(provider.created_at).toLocaleDateString()}</td>

                            <td className="px-6 py-4 flex justify-end gap-3">
                              <button
                                onClick={() => navigate(`/service-providers/${provider.id}`)}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                <Pencil className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => confirmDelete(provider.id)}
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
                  <h2 className="text-gray-700 font-semibold text-xl">No service providers found</h2>
                  <p className="text-gray-500">Try adjusting your search or adding new providers.</p>
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

        <AnimatePresence>
          {showModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white p-8 rounded-lg shadow-lg">
                <h2 className="text-lg font-semibold mb-4">Confirm Deletion</h2>
                <p className="mb-6">Are you sure you want to delete this provider?</p>
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