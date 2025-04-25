import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Plus, Edit2, Trash2, Download, Search } from 'lucide-react';

interface ServiceProvider {
  id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  working_area_diameter: number;
  status: 'active' | 'inactive' | 'paused';
  is_company: boolean;
  number_of_employees: number;
  addresses: {
    city: string;
    country: {
      name: string;
    };
  } | null;
  date_of_birth: string;
  description: string;
  referenced_by: string;
  created_at: string;
  file_url: string | null;
  service_provider_types: {
    service_type: {
      id: string;
      name: string;
      subcategory: {
        id: string;
        name: string;
        category: {
          id: string;
          name: string;
        };
      };
    };
  }[];
  service_provider_working_areas: {
    working_area: {
      id: string;
      name: string;
    };
  }[];
}

export function ServiceProviderManagement() {
  const navigate = useNavigate();
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadServiceProviders();
  }, []);

  async function loadServiceProviders() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('service_providers')
        .select(`
          *,
          addresses (
            city,
            country:countries (name)
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
          ),
          service_provider_working_areas (
            working_area:working_areas (
              id,
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProviders(data || []);
    } catch (error) {
      console.error('Error fetching service providers:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Are you sure you want to delete this service provider?')) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-service-provider`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete service provider');
      }

      await loadServiceProviders();
    } catch (error) {
      console.error('Error deleting service provider:', error);
    }
  }

  const filteredProviders = providers.filter(provider => {
    const searchLower = searchTerm.toLowerCase();
    
    // Search in provider's full name
    const nameMatch = `${provider.first_name} ${provider.last_name}`.toLowerCase().includes(searchLower);
    
    // Search in phone number
    const phoneMatch = provider.phone_number?.toLowerCase().includes(searchLower);
    
    // Search in working areas
    const areaMatch = provider.service_provider_working_areas.some(area => 
      area.working_area.name.toLowerCase().includes(searchLower)
    );
    
    // Search in city
    const cityMatch = provider.addresses?.city?.toLowerCase().includes(searchLower);
    
    // Search in status
    const statusMatch = provider.status.toLowerCase().includes(searchLower);
    
    // Search in type (company/individual)
    const typeMatch = (provider.is_company ? 'company' : 'individual').includes(searchLower);

    // Search in service categories and types
    const serviceMatch = provider.service_provider_types.some(spt => 
      spt.service_type.name.toLowerCase().includes(searchLower) ||
      spt.service_type.subcategory.name.toLowerCase().includes(searchLower) ||
      spt.service_type.subcategory.category.name.toLowerCase().includes(searchLower)
    );

    return nameMatch || phoneMatch || areaMatch || cityMatch || statusMatch || typeMatch || serviceMatch;
  });

  const exportToCSV = () => {
    const headers = [
      'First Name',
      'Last Name',
      'Phone Number',
      'Working Areas',
      'Working Area Diameter',
      'Status',
      'Type',
      'Number of Employees',
      'Location',
      'Date of Birth',
      'Description',
      'Referenced By',
      'Services',
      'Created At'
    ];

    const csvData = providers.map(provider => [
      provider.first_name,
      provider.last_name,
      provider.phone_number || '',
      provider.service_provider_working_areas.map(area => area.working_area.name).join('; '),
      provider.working_area_diameter + ' km',
      provider.status,
      provider.is_company ? 'Company' : 'Individual',
      provider.is_company ? provider.number_of_employees : '',
      provider.addresses ? `${provider.addresses.city}${provider.addresses.country ? `, ${provider.addresses.country.name}` : ''}` : '',
      provider.date_of_birth || '',
      provider.description || '',
      provider.referenced_by || '',
      provider.service_provider_types.map(spt => 
        `${spt.service_type.subcategory.category.name} > ${spt.service_type.subcategory.name} > ${spt.service_type.name}`
      ).join('; '),
      new Date(provider.created_at).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `service-providers-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Service Providers</h1>
        <div className="flex gap-4">
          <button
            onClick={exportToCSV}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors"
          >
            <Download size={20} />
            Export to CSV
          </button>
          <button
            onClick={() => navigate('/service-providers/new')}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            <Plus size={20} />
            Add Service Provider
          </button>
        </div>
      </div>

      <div className="mb-6 relative">
        <div className="relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, phone, working areas, city, status, type, or services..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Working Areas</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Services</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : filteredProviders.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                  {searchTerm ? 'No service providers found matching your search' : 'No service providers found'}
                </td>
              </tr>
            ) : (
              filteredProviders.map((provider) => (
                <tr key={provider.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {provider.first_name} {provider.last_name}
                    </div>
                    {provider.file_url && (
                      <a 
                        href={provider.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-600 hover:text-indigo-900"
                      >
                        View Document
                      </a>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{provider.phone_number}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">
                      <div className="flex flex-wrap gap-1">
                        {provider.service_provider_working_areas.map((area, index) => (
                          <span
                            key={`${area.working_area.id}-${index}`}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                          >
                            {area.working_area.name}
                          </span>
                        ))}
                      </div>
                      <div className="text-xs mt-1">
                        Diameter: {provider.working_area_diameter} km
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {provider.is_company ? `Company (${provider.number_of_employees} employees)` : 'Individual'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {provider.addresses?.city && (
                        <span>
                          {provider.addresses.city}
                          {provider.addresses.country?.name && `, ${provider.addresses.country.name}`}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {provider.service_provider_types.map((spt, index) => (
                        <span
                          key={`${spt.service_type.id}-${index}`}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {spt.service_type.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${provider.status === 'active' ? 'bg-green-100 text-green-800' : 
                        provider.status === 'paused' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'}`}>
                      {provider.status.charAt(0).toUpperCase() + provider.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-3">
                      <button
                        onClick={() => navigate(`/service-providers/${provider.id}`)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(provider.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}