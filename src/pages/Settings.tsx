import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Pencil, Trash2, Settings as SettingsIcon } from 'lucide-react';

interface StoreCategory {
  id: string;
  name: string;
  created_at: string;
}

interface Country {
  id: string;
  name: string;
  code: string;
  phone_code: string;
}

interface WorkingArea {
  id: string;
  name: string;
  created_at: string;
}

type Tab = 'categories' | 'countries' | 'working-areas';

export function Settings() {
  const [activeTab, setActiveTab] = useState<Tab>('categories');
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [workingAreas, setWorkingAreas] = useState<WorkingArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showCountryForm, setShowCountryForm] = useState(false);
  const [showWorkingAreaForm, setShowWorkingAreaForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<StoreCategory | null>(null);
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [editingWorkingArea, setEditingWorkingArea] = useState<WorkingArea | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [workingAreaName, setWorkingAreaName] = useState('');
  const [countryData, setCountryData] = useState({
    name: '',
    code: '',
    phone_code: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [categoriesResponse, countriesResponse, workingAreasResponse] = await Promise.all([
        supabase.from('store_categories').select('*').order('name'),
        supabase.from('countries').select('*').order('name'),
        supabase.from('working_areas').select('*').order('name'),
      ]);

      if (categoriesResponse.error) throw categoriesResponse.error;
      if (countriesResponse.error) throw countriesResponse.error;
      if (workingAreasResponse.error) throw workingAreasResponse.error;

      setCategories(categoriesResponse.data || []);
      setCountries(countriesResponse.data || []);
      setWorkingAreas(workingAreasResponse.data || []);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error('No authenticated user');

      if (editingCategory) {
        const { error } = await supabase
          .from('store_categories')
          .update({
            name: categoryName,
            updated_by: userId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingCategory.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('store_categories')
          .insert([{
            name: categoryName,
            created_by: userId,
            updated_by: userId,
          }]);

        if (error) throw error;
      }

      setCategoryName('');
      setEditingCategory(null);
      setShowCategoryForm(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleWorkingAreaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error('No authenticated user');

      if (editingWorkingArea) {
        const { error } = await supabase
          .from('working_areas')
          .update({
            name: workingAreaName,
            updated_by: userId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingWorkingArea.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('working_areas')
          .insert([{
            name: workingAreaName,
            created_by: userId,
            updated_by: userId,
          }]);

        if (error) throw error;
      }

      setWorkingAreaName('');
      setEditingWorkingArea(null);
      setShowWorkingAreaForm(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleCountrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCountry) {
        const { error } = await supabase
          .from('countries')
          .update({
            name: countryData.name,
            code: countryData.code.toUpperCase(),
            phone_code: countryData.phone_code,
          })
          .eq('id', editingCountry.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('countries')
          .insert([{
            name: countryData.name,
            code: countryData.code.toUpperCase(),
            phone_code: countryData.phone_code,
          }]);

        if (error) throw error;
      }

      setCountryData({ name: '', code: '', phone_code: '' });
      setEditingCountry(null);
      setShowCountryForm(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;

    try {
      const { error } = await supabase
        .from('store_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDeleteWorkingArea = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this working area?')) return;

    try {
      const { error } = await supabase
        .from('working_areas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDeleteCountry = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this country?')) return;

    try {
      const { error } = await supabase
        .from('countries')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleEditCategory = (category: StoreCategory) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setShowCategoryForm(true);
  };

  const handleEditWorkingArea = (area: WorkingArea) => {
    setEditingWorkingArea(area);
    setWorkingAreaName(area.name);
    setShowWorkingAreaForm(true);
  };

  const handleEditCountry = (country: Country) => {
    setEditingCountry(country);
    setCountryData({
      name: country.name,
      code: country.code,
      phone_code: country.phone_code || '',
    });
    setShowCountryForm(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center">
              <SettingsIcon className="h-8 w-8 text-gray-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-500 text-sm">
              {error}
            </div>
          )}

          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('categories')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'categories'
                    ? 'border-b-2 border-indigo-500 text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Store Categories
              </button>
              <button
                onClick={() => setActiveTab('countries')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'countries'
                    ? 'border-b-2 border-indigo-500 text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Countries
              </button>
              <button
                onClick={() => setActiveTab('working-areas')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'working-areas'
                    ? 'border-b-2 border-indigo-500 text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Working Areas
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'categories' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Store Categories</h2>
                  <button
                    onClick={() => {
                      setShowCategoryForm(true);
                      setEditingCategory(null);
                      setCategoryName('');
                    }}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                  </button>
                </div>

                {showCategoryForm && (
                  <form onSubmit={handleCategorySubmit} className="mb-4 p-4 bg-gray-50 rounded-md">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={categoryName}
                        onChange={(e) => setCategoryName(e.target.value)}
                        placeholder="Category name"
                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        required
                      />
                      <button
                        type="submit"
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                      >
                        {editingCategory ? 'Update' : 'Add'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCategoryForm(false);
                          setEditingCategory(null);
                          setCategoryName('');
                        }}
                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                <div className="bg-white rounded-lg border">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {categories.map((category) => (
                        <tr key={category.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {category.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleEditCategory(category)}
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(category.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'working-areas' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Working Areas</h2>
                  <button
                    onClick={() => {
                      setShowWorkingAreaForm(true);
                      setEditingWorkingArea(null);
                      setWorkingAreaName('');
                    }}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Working Area
                  </button>
                </div>

                {showWorkingAreaForm && (
                  <form onSubmit={handleWorkingAreaSubmit} className="mb-4 p-4 bg-gray-50 rounded-md">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={workingAreaName}
                        onChange={(e) => setWorkingAreaName(e.target.value)}
                        placeholder="Working area name"
                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        required
                      />
                      <button
                        type="submit"
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                      >
                        {editingWorkingArea ? 'Update' : 'Add'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowWorkingAreaForm(false);
                          setEditingWorkingArea(null);
                          setWorkingAreaName('');
                        }}
                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                <div className="bg-white rounded-lg border">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {workingAreas.map((area) => (
                        <tr key={area.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {area.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleEditWorkingArea(area)}
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteWorkingArea(area.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'countries' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Countries</h2>
                  <button
                    onClick={() => {
                      setShowCountryForm(true);
                      setEditingCountry(null);
                      setCountryData({ name: '', code: '', phone_code: '' });
                    }}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Country
                  </button>
                </div>

                {showCountryForm && (
                  <form onSubmit={handleCountrySubmit} className="mb-4 p-4 bg-gray-50 rounded-md">
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <input
                        type="text"
                        value={countryData.name}
                        onChange={(e) => setCountryData({ ...countryData, name: e.target.value })}
                        placeholder="Country name"
                        className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        required
                      />
                      <input
                        type="text"
                        value={countryData.code}
                        onChange={(e) => setCountryData({ ...countryData, code: e.target.value })}
                        placeholder="Country code (e.g., US)"
                        className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        maxLength={2}
                        required
                      />
                      <input
                        type="text"
                        value={countryData.phone_code}
                        onChange={(e) => setCountryData({ ...countryData, phone_code: e.target.value })}
                        placeholder="Phone code (e.g., +1)"
                        className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="submit"
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                      >
                        {editingCountry ? 'Update' : 'Add'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCountryForm(false);
                          setEditingCountry(null);
                          setCountryData({ name: '', code: '', phone_code: '' });
                        }}
                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                <div className="bg-white rounded-lg border">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Code
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Phone Code
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {countries.map((country) => (
                        <tr key={country.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {country.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {country.code}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {country.phone_code}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleEditCountry(country)}
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCountry(country.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}