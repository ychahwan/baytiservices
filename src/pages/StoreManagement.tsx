import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Plus, Edit2, Trash2, Store as StoreIcon, Search } from 'lucide-react';
import type { Store } from '../lib/types';

export function StoreManagement() {
  const navigate = useNavigate();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('stores')
        .select(`
          *,
          category:store_categories(name),
          addresses(
            city,
            country:countries(name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStores(data || []);
    } catch (err) {
      console.error('Error loading stores:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this store?')) return;

    try {
      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadStores();
    } catch (err) {
      console.error('Error deleting store:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const filteredStores = stores.filter(store => {
    const searchLower = searchTerm.toLowerCase();
    
    // Search in store name
    const nameMatch = store.name.toLowerCase().includes(searchLower);
    
    // Search in owner's full name
    const ownerNameMatch = `${store.owner_first_name} ${store.owner_last_name}`.toLowerCase().includes(searchLower);
    
    // Search in category
    const categoryMatch = store.category?.name.toLowerCase().includes(searchLower);
    
    // Search in phone number
    const phoneMatch = store.phone_number?.toLowerCase().includes(searchLower);
    
    // Search in city
    const cityMatch = store.addresses?.city?.toLowerCase().includes(searchLower);

    return nameMatch || ownerNameMatch || categoryMatch || phoneMatch || cityMatch;
  });

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow px-5 py-6 sm:px-6">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
                <StoreIcon className="h-8 w-8 mr-2" />
                Stores
              </h1>
              <p className="mt-2 text-sm text-gray-700">
                Manage store information and categories
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <button
                onClick={() => navigate('/stores/new')}
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Store
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
                placeholder="Search by store name, owner name, category, phone number, or city..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 text-red-500 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="mt-8 flex flex-col">
            <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Store Name
                        </th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Owner
                        </th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Category
                        </th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Phone
                        </th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Location
                        </th>
                        <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {loading ? (
                        <tr>
                          <td colSpan={6} className="px-3 py-4 text-sm text-gray-500 text-center">
                            Loading...
                          </td>
                        </tr>
                      ) : filteredStores.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-3 py-4 text-sm text-gray-500 text-center">
                            {searchTerm ? 'No stores found matching your search' : 'No stores found'}
                          </td>
                        </tr>
                      ) : (
                        filteredStores.map((store) => (
                          <tr key={store.id}>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                              {store.name}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {store.owner_first_name} {store.owner_last_name}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {store.category?.name}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {store.phone_number}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {store.addresses?.city && (
                                <span>
                                  {store.addresses.city}
                                  {store.addresses.country?.name && `, ${store.addresses.country.name}`}
                                </span>
                              )}
                            </td>
                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                              <button
                                onClick={() => navigate(`/stores/${store.id}`)}
                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(store.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))
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