import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search as SearchIcon, MapPin, Phone, Calendar, Building2 } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  subcategories: Subcategory[];
}

interface Subcategory {
  id: string;
  name: string;
  service_types: ServiceType[];
}

interface ServiceType {
  id: string;
  name: string;
}

interface ServiceProvider {
  id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  working_area: string;
  status: 'active' | 'inactive' | 'paused';
  is_company: boolean;
  number_of_employees: number;
  description: string;
  addresses: {
    city: string;
    country: {
      name: string;
    };
  } | null;
  service_provider_types: {
    service_type: {
      id: string;
      name: string;
    };
  }[];
}

export function Search() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [selectedServiceType, setSelectedServiceType] = useState<string>('');
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      searchProviders();
    } else {
      setProviders([]);
    }
  }, [selectedCategory, selectedSubcategory, selectedServiceType]);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select(`
          id,
          name,
          subcategories (
            id,
            name,
            service_types (
              id,
              name
            )
          )
        `)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error loading categories:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const searchProviders = async () => {
    try {
      setLoading(true);

      // Build the query based on selected filters
      let query = supabase
        .from('service_providers')
        .select(`
          id,
          first_name,
          last_name,
          phone_number,
          working_area,
          status,
          is_company,
          number_of_employees,
          description,
          addresses (
            city,
            country:countries (
              name
            )
          ),
          service_provider_types (
            service_type:service_types (
              id,
              name,
              subcategory:subcategories (
                id,
                name,
                category:categories (
                  id,
                  name
                )
              )
            )
          )
        `)
        .eq('status', 'active');

      const { data, error } = await query;
      if (error) throw error;

      // Filter providers based on selected criteria
      let filteredProviders = data || [];

      // Filter by category
      if (selectedCategory) {
        filteredProviders = filteredProviders.filter(provider =>
          provider.service_provider_types.some(spt =>
            spt.service_type.subcategory.category.id === selectedCategory
          )
        );
      }

      // Filter by subcategory if selected
      if (selectedSubcategory) {
        filteredProviders = filteredProviders.filter(provider =>
          provider.service_provider_types.some(spt =>
            spt.service_type.subcategory.id === selectedSubcategory
          )
        );
      }

      // Filter by service type if selected
      if (selectedServiceType) {
        filteredProviders = filteredProviders.filter(provider =>
          provider.service_provider_types.some(spt =>
            spt.service_type.id === selectedServiceType
          )
        );
      }

      setProviders(filteredProviders);
    } catch (err) {
      console.error('Error searching providers:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedSubcategory('');
    setSelectedServiceType('');
  };

  const handleSubcategoryChange = (subcategoryId: string) => {
    setSelectedSubcategory(subcategoryId);
    setSelectedServiceType('');
  };

  const handleServiceTypeChange = (serviceTypeId: string) => {
    setSelectedServiceType(serviceTypeId);
  };

  const getSelectedCategorySubcategories = () => {
    return categories.find(c => c.id === selectedCategory)?.subcategories || [];
  };

  const getSelectedSubcategoryServiceTypes = () => {
    return getSelectedCategorySubcategories().find(s => s.id === selectedSubcategory)?.service_types || [];
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-8">
            <SearchIcon className="h-8 w-8 text-gray-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">Find Service Providers</h1>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 text-red-500 p-4 rounded-md">
              {error}
            </div>
          )}

          <div className="grid grid-cols-3 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="form-select"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subcategory (Optional)
              </label>
              <select
                value={selectedSubcategory}
                onChange={(e) => handleSubcategoryChange(e.target.value)}
                className="form-select"
                disabled={!selectedCategory}
              >
                <option value="">All Subcategories</option>
                {getSelectedCategorySubcategories().map((subcategory) => (
                  <option key={subcategory.id} value={subcategory.id}>
                    {subcategory.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Type (Optional)
              </label>
              <select
                value={selectedServiceType}
                onChange={(e) => handleServiceTypeChange(e.target.value)}
                className="form-select"
                disabled={!selectedSubcategory}
              >
                <option value="">All Service Types</option>
                {getSelectedSubcategoryServiceTypes().map((serviceType) => (
                  <option key={serviceType.id} value={serviceType.id}>
                    {serviceType.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Searching for providers...</p>
            </div>
          ) : providers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {providers.map((provider) => (
                <div key={provider.id} className="bg-white rounded-lg shadow-md border p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {provider.first_name} {provider.last_name}
                      </h3>
                      {provider.is_company && (
                        <div className="flex items-center text-gray-600 mt-1">
                          <Building2 className="h-4 w-4 mr-1" />
                          <span className="text-sm">Company ({provider.number_of_employees} employees)</span>
                        </div>
                      )}
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      provider.status === 'active' ? 'bg-green-100 text-green-800' : 
                      provider.status === 'paused' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {provider.status.charAt(0).toUpperCase() + provider.status.slice(1)}
                    </span>
                  </div>

                  {provider.addresses?.city && (
                    <div className="flex items-center text-gray-600 mb-2">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>
                        {provider.addresses.city}
                        {provider.addresses.country?.name && `, ${provider.addresses.country.name}`}
                      </span>
                    </div>
                  )}

                  {provider.phone_number && (
                    <div className="flex items-center text-gray-600 mb-2">
                      <Phone className="h-4 w-4 mr-2" />
                      <span>{provider.phone_number}</span>
                    </div>
                  )}

                  {provider.working_area && (
                    <div className="flex items-center text-gray-600 mb-4">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>{provider.working_area}</span>
                    </div>
                  )}

                  {provider.description && (
                    <p className="text-gray-600 text-sm">{provider.description}</p>
                  )}

                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Services:</h4>
                    <div className="flex flex-wrap gap-2">
                      {provider.service_provider_types.map((spt, index) => (
                        <span
                          key={`${spt.service_type.id}-${index}`}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                        >
                          {spt.service_type.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : selectedCategory ? (
            <div className="text-center py-12 text-gray-600">
              No service providers found for the selected criteria
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}