import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2, FolderTree, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Category, Subcategory, ServiceType } from '../lib/types';

interface EditingState {
  type: 'category' | 'subcategory' | 'service_type';
  id: string;
  name: string;
}

export function ServiceCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form states
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showSubcategoryForm, setShowSubcategoryForm] = useState<string | null>(null);
  const [showServiceTypeForm, setShowServiceTypeForm] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [editingItem, setEditingItem] = useState<EditingState | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (categoriesError) throw categoriesError;

      const { data: subcategories, error: subcategoriesError } = await supabase
        .from('subcategories')
        .select('*')
        .order('name');

      if (subcategoriesError) throw subcategoriesError;

      const { data: serviceTypes, error: serviceTypesError } = await supabase
        .from('service_types')
        .select('*')
        .order('name');

      if (serviceTypesError) throw serviceTypesError;

      // Build the hierarchical structure
      const categoriesWithChildren = categories.map(category => ({
        ...category,
        subcategories: subcategories
          .filter(sub => sub.category_id === category.id)
          .map(sub => ({
            ...sub,
            service_types: serviceTypes.filter(type => type.subcategory_id === sub.id)
          }))
      }));

      setCategories(categoriesWithChildren);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('categories').insert([
        {
          name: newItemName,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }
      ]);
      if (error) throw error;
      setNewItemName('');
      setShowCategoryForm(false);
      loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleAddSubcategory = async (e: React.FormEvent, categoryId: string) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('subcategories').insert([
        {
          category_id: categoryId,
          name: newItemName,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }
      ]);
      if (error) throw error;
      setNewItemName('');
      setShowSubcategoryForm(null);
      loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleAddServiceType = async (e: React.FormEvent, subcategoryId: string) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('service_types').insert([
        {
          subcategory_id: subcategoryId,
          name: newItemName,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }
      ]);
      if (error) throw error;
      setNewItemName('');
      setShowServiceTypeForm(null);
      loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const updateData = {
        name: editingItem.name,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      };

      let error;
      switch (editingItem.type) {
        case 'category':
          ({ error } = await supabase
            .from('categories')
            .update(updateData)
            .eq('id', editingItem.id));
          break;
        case 'subcategory':
          ({ error } = await supabase
            .from('subcategories')
            .update(updateData)
            .eq('id', editingItem.id));
          break;
        case 'service_type':
          ({ error } = await supabase
            .from('service_types')
            .update(updateData)
            .eq('id', editingItem.id));
          break;
      }

      if (error) throw error;
      setEditingItem(null);
      loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDelete = async (table: string, id: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    try {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const startEditing = (type: 'category' | 'subcategory' | 'service_type', id: string, name: string) => {
    setEditingItem({ type, id, name });
  };

  const filterCategories = (categories: Category[], searchTerm: string): Category[] => {
    if (!searchTerm) return categories;
    
    const lowercaseSearch = searchTerm.toLowerCase();
    
    return categories.map(category => {
      const categoryMatches = category.name.toLowerCase().includes(lowercaseSearch);
      
      const filteredSubcategories = category.subcategories?.map(subcategory => {
        const subcategoryMatches = subcategory.name.toLowerCase().includes(lowercaseSearch);
        
        const filteredServiceTypes = subcategory.service_types?.filter(serviceType =>
          serviceType.name.toLowerCase().includes(lowercaseSearch)
        );
        
        if (subcategoryMatches || (filteredServiceTypes && filteredServiceTypes.length > 0)) {
          return {
            ...subcategory,
            service_types: filteredServiceTypes
          };
        }
        return null;
      }).filter((sub): sub is Subcategory => sub !== null);
      
      if (categoryMatches || (filteredSubcategories && filteredSubcategories.length > 0)) {
        return {
          ...category,
          subcategories: filteredSubcategories
        };
      }
      return null;
    }).filter((cat): cat is Category => cat !== null);
  };

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleSubcategory = (subcategoryId: string) => {
    const newExpanded = new Set(expandedSubcategories);
    if (newExpanded.has(subcategoryId)) {
      newExpanded.delete(subcategoryId);
    } else {
      newExpanded.add(subcategoryId);
    }
    setExpandedSubcategories(newExpanded);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value) {
      const newExpandedCategories = new Set<string>();
      const newExpandedSubcategories = new Set<string>();
      
      categories.forEach(category => {
        if (category.name.toLowerCase().includes(value.toLowerCase())) {
          newExpandedCategories.add(category.id);
        }
        category.subcategories?.forEach(subcategory => {
          if (subcategory.name.toLowerCase().includes(value.toLowerCase())) {
            newExpandedCategories.add(category.id);
            newExpandedSubcategories.add(subcategory.id);
          }
          subcategory.service_types?.forEach(serviceType => {
            if (serviceType.name.toLowerCase().includes(value.toLowerCase())) {
              newExpandedCategories.add(category.id);
              newExpandedSubcategories.add(subcategory.id);
            }
          });
        });
      });
      
      setExpandedCategories(newExpandedCategories);
      setExpandedSubcategories(newExpandedSubcategories);
    }
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

  const filteredCategories = filterCategories(categories, searchTerm);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <FolderTree className="h-6 w-6 mr-2" />
                Service Categories
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your service categories, subcategories, and service types
              </p>
            </div>
            <button
              onClick={() => setShowCategoryForm(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </button>
          </div>

          <div className="mb-6 relative">
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearch}
                placeholder="Search categories, subcategories, and service types..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 text-red-500 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {showCategoryForm && (
            <form onSubmit={handleAddCategory} className="mb-4 p-4 bg-gray-50 rounded-md">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Category name"
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryForm(false);
                    setNewItemName('');
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {filteredCategories.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No results found for "{searchTerm}"
              </div>
            ) : (
              filteredCategories.map((category) => (
                <div key={category.id} className="border rounded-md">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-t-md">
                    <div className="flex items-center flex-1">
                      <button
                        onClick={() => toggleCategory(category.id)}
                        className="mr-2 text-gray-500 hover:text-gray-700"
                      >
                        {expandedCategories.has(category.id) ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                      </button>
                      {editingItem?.id === category.id ? (
                        <form onSubmit={handleUpdateItem} className="flex-1 flex gap-2">
                          <input
                            type="text"
                            value={editingItem.name}
                            onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            autoFocus
                          />
                          <button
                            type="submit"
                            className="bg-indigo-600 text-white px-3 py-1 rounded-md hover:bg-indigo-700 text-sm"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingItem(null)}
                            className="bg-gray-300 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-400 text-sm"
                          >
                            Cancel
                          </button>
                        </form>
                      ) : (
                        <span className="font-medium">{category.name}</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setShowSubcategoryForm(category.id)}
                        className="text-indigo-600 hover:text-indigo-800"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => startEditing('category', category.id, category.name)}
                        className="text-indigo-600 hover:text-indigo-800"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete('categories', category.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {expandedCategories.has(category.id) && (
                    <div className="p-4 border-t">
                      {showSubcategoryForm === category.id && (
                        <form onSubmit={(e) => handleAddSubcategory(e, category.id)} className="mb-4 p-4 bg-gray-50 rounded-md">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newItemName}
                              onChange={(e) => setNewItemName(e.target.value)}
                              placeholder="Subcategory name"
                              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                            <button
                              type="submit"
                              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                            >
                              Add
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowSubcategoryForm(null);
                                setNewItemName('');
                              }}
                              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      )}

                      <div className="space-y-2 ml-6">
                        {category.subcategories?.map((subcategory) => (
                          <div key={subcategory.id} className="border rounded-md">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-t-md">
                              <div className="flex items-center flex-1">
                                <button
                                  onClick={() => toggleSubcategory(subcategory.id)}
                                  className="mr-2 text-gray-500 hover:text-gray-700"
                                >
                                  {expandedSubcategories.has(subcategory.id) ? (
                                    <ChevronDown className="h-5 w-5" />
                                  ) : (
                                    <ChevronRight className="h-5 w-5" />
                                  )}
                                </button>
                                {editingItem?.id === subcategory.id ? (
                                  <form onSubmit={handleUpdateItem} className="flex-1 flex gap-2">
                                    <input
                                      type="text"
                                      value={editingItem.name}
                                      onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                      autoFocus
                                    />
                                    <button
                                      type="submit"
                                      className="bg-indigo-600 text-white px-3 py-1 rounded-md hover:bg-indigo-700 text-sm"
                                    >
                                      Save
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingItem(null)}
                                      className="bg-gray-300 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-400 text-sm"
                                    >
                                      Cancel
                                    </button>
                                  </form>
                                ) : (
                                  <span>{subcategory.name}</span>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => setShowServiceTypeForm(subcategory.id)}
                                  className="text-indigo-600 hover:text-indigo-800"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => startEditing('subcategory', subcategory.id, subcategory.name)}
                                  className="text-indigo-600 hover:text-indigo-800"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete('subcategories', subcategory.id)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>

                            {expandedSubcategories.has(subcategory.id) && (
                              <div className="p-3 border-t">
                                {showServiceTypeForm === subcategory.id && (
                                  <form onSubmit={(e) => handleAddServiceType(e, subcategory.id)} className="mb-4 p-4 bg-gray-50 rounded-md">
                                    <div className="flex gap-2">
                                      <input
                                        type="text"
                                        value={newItemName}
                                        onChange={(e) => setNewItemName(e.target.value)}
                                        placeholder="Service type name"
                                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                      />
                                      <button
                                        type="submit"
                                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                                      >
                                        Add
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setShowServiceTypeForm(null);
                                          setNewItemName('');
                                        }}
                                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </form>
                                )}

                                <div className="space-y-2 ml-6">
                                  {subcategory.service_types?.map((serviceType) => (
                                    <div key={serviceType.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50">
                                      {editingItem?.id === serviceType.id ? (
                                        <form onSubmit={handleUpdateItem} className="flex-1 flex gap-2">
                                          <input
                                            type="text"
                                            value={editingItem.name}
                                            onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            autoFocus
                                          />
                                          <button
                                            type="submit"
                                            className="bg-indigo-600 text-white px-3 py-1 rounded-md hover:bg-indigo-700 text-sm"
                                          >
                                            Save
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setEditingItem(null)}
                                            className="bg-gray-300 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-400 text-sm"
                                          >
                                            Cancel
                                          </button>
                                        </form>
                                      ) : (
                                        <span>{serviceType.name}</span>
                                      )}
                                      <div className="flex items-center space-x-2">
                                        <button
                                          onClick={() => startEditing('service_type', serviceType.id, serviceType.name)}
                                          className="text-indigo-600 hover:text-indigo-800"
                                        >
                                          <Pencil className="h-4 w-4" />
                                        </button>
                                        <button
                                          onClick={() => handleDelete('service_types', serviceType.id)}
                                          className="text-red-600 hover:text-red-800"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}