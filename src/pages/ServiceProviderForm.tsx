import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, ChevronDown, ChevronRight, Save } from 'lucide-react';
import type { ServiceProviderFormData, ServiceType, Category, Subcategory, AddressFormData, WorkingArea } from '../lib/types';
import { AddressForm } from '../components/AddressForm';
import { FileUpload } from '../components/FileUpload';
import { toast } from 'react-hot-toast';

type TabType = 'account' | 'profile' | 'address' | 'services' | 'documents';

export function ServiceProviderForm() {
  const [invalidFields, setInvalidFields] = useState<string[]>([]);

  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<TabType>('account');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [workingAreas, setWorkingAreas] = useState<WorkingArea[]>([]);
  const [selectedServiceTypes, setSelectedServiceTypes] = useState<Set<string>>(new Set());
  const [selectedWorkingAreas, setSelectedWorkingAreas] = useState<Set<string>>(new Set());
  const [isWorkingAreasExpanded, setIsWorkingAreasExpanded] = useState(false);

  const [formData, setFormData] = useState<ServiceProviderFormData>({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    working_area_ids: [],
    working_area_diameter: 0,
    date_of_birth: '',
    description: '',
    referenced_by: '',
    is_company: false,
    number_of_employees: 0,
    status: 'inactive',
    service_type_ids: [],
  });

  const [addressData, setAddressData] = useState<AddressFormData>({
    country_id: '',
    state: '',
    city: '',
    street_address: '',
    postal_code: '',
    building_number: '',
    apartment_number: '',
    additional_info: '',
  });

  useEffect(() => {
    loadCategories();
    loadWorkingAreas();
    if (id) {
      loadServiceProvider();
    }
  }, [id]);

  const loadCategories = async () => {
    try {
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select(`
          id,
          name,
          subcategories:subcategories (
            id,
            name,
            service_types:service_types (
              id,
              name
            )
          )
        `)
        .order('name');

      if (categoriesError) throw categoriesError;
      setCategories(categories || []);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const loadWorkingAreas = async () => {
    try {
      const { data, error } = await supabase
        .from('working_areas')
        .select('*')
        .order('name');

      if (error) throw error;
      setWorkingAreas(data || []);
    } catch (err) {
      console.error('Error loading working areas:', err);
    }
  };

  const loadServiceProvider = async () => {
    try {
      const { data: provider, error: providerError } = await supabase
        .from('service_providers')
        .select(`
          *,
          addresses (
            *,
            countries (*)
          ),
          service_provider_types (
            service_type_id
          ),
          service_provider_working_areas (
            working_area_id
          )
        `)
        .eq('id', id)
        .single();

      if (providerError) throw providerError;

      if (provider) {
        setFormData({
          ...formData,
          first_name: provider.first_name,
          last_name: provider.last_name,
          phone_number: provider.phone_number || '',
          working_area_ids: provider.service_provider_working_areas.map(wa => wa.working_area_id),
          working_area_diameter: provider.working_area_diameter || 0,
          date_of_birth: provider.date_of_birth || '',
          description: provider.description || '',
          referenced_by: provider.referenced_by || '',
          is_company: provider.is_company || false,
          number_of_employees: provider.number_of_employees || 0,
          status: provider.status || 'inactive',
          service_type_ids: provider.service_provider_types.map(spt => spt.service_type_id),
          file_url: provider.file_url,
          address_id: provider.address_id || null,
        });

        setSelectedServiceTypes(new Set(provider.service_provider_types.map(spt => spt.service_type_id)));
        setSelectedWorkingAreas(new Set(provider.service_provider_working_areas.map(wa => wa.working_area_id)));
      }
    } catch (err) {
      console.error('Error loading service provider:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };
  const validateForm = () => {
    const errors: string[] = [];
  
    if (!formData.first_name.trim()) {
      errors.push('first_name');
    }
  
    if (!formData.last_name.trim()) {
      errors.push('last_name');
    }
    if (!formData.phone_number.trim()) {
      errors.push('phone_number');
    }
  
    if (!id) {
      if (!formData.email.trim()) {
        errors.push('email');
      }
      if (!formData.password.trim()) {
        errors.push('password');
      }
    }
  
    if (formData.date_of_birth && isNaN(Date.parse(formData.date_of_birth))) {
      errors.push('date_of_birth');
    }
  
    setInvalidFields(errors);
  
    if (errors.length > 0) {
      setError('Please fill all required fields correctly.');
      return false;
    }
  
    return true;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return; // Stop submit if validation fails
    }
    setLoading(true);
    setError(null);
    let newlyCreatedAddressId: string | null = null;

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('No authenticated user');
  
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userAccessToken = session?.access_token;
      if (!userAccessToken) throw new Error('User access token not found');
  
      let addressId = formData.address_id;
  
      // Handle address creation/update
      if (addressData.country_id) {
        if (addressId) {
          const { error: addressError } = await supabase
            .from('addresses')
            .update({
              ...addressData,
              updated_by: user.id,
              updated_at: new Date().toISOString(),
            })
            .eq('id', addressId);
  
          if (addressError) throw addressError;
        } else {
          const { data: newAddress, error: addressError } = await supabase
            .from('addresses')
            .insert([
              {
                ...addressData,
                created_by: user.id,
                updated_by: user.id,
              },
            ])
            .select()
            .single();
  
          if (addressError) throw addressError;
          if (newAddress) {
            addressId = newAddress.id;
            newlyCreatedAddressId = newAddress.id;
          }
        }
      }
  
      const payload = {
        ...formData,
        address_id: addressId,
        working_area_ids: Array.from(selectedWorkingAreas),
        service_type_ids: Array.from(selectedServiceTypes),
      };
  
      if (id) {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-service-provider`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userAccessToken}`,
          },
          body: JSON.stringify({ id, ...payload }),
        });
  
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update service provider');
        }
      } else {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-service-provider`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userAccessToken}`,
          },
          body: JSON.stringify(payload),
        });
  
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create service provider');
        }
      }
      toast.success(id ? 'Service Provider updated successfully!' : 'Service Provider created successfully!');

      navigate('/service-providers');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred.';
      if (newlyCreatedAddressId) {
        try {
          await supabase
            .from('addresses')
            .delete()
            .eq('id', newlyCreatedAddressId);
          console.info('Rolled back newly created address.');
        } catch (rollbackError) {
          console.error('Failed to rollback address:', rollbackError);
        }
      }
      setError(errorMessage);
      toast.error(errorMessage);

    } finally {
      setLoading(false);
    }
  };
  

  const toggleServiceType = (serviceTypeId: string) => {
    const newSelected = new Set(selectedServiceTypes);
    if (newSelected.has(serviceTypeId)) {
      newSelected.delete(serviceTypeId);
    } else {
      newSelected.add(serviceTypeId);
    }
    setSelectedServiceTypes(newSelected);
    setFormData({
      ...formData,
      service_type_ids: Array.from(newSelected),
    });
  };

  const toggleWorkingArea = (areaId: string) => {
    const newSelected = new Set(selectedWorkingAreas);
    if (newSelected.has(areaId)) {
      newSelected.delete(areaId);
    } else {
      newSelected.add(areaId);
    }
    setSelectedWorkingAreas(newSelected);
    setFormData({
      ...formData,
      working_area_ids: Array.from(newSelected),
    });
  };

  const handleSubcategoryDoubleClick = (subcategory: Subcategory) => {
    const newSelected = new Set(selectedServiceTypes);
    const allServiceTypeIds = subcategory.service_types?.map(st => st.id) || [];
    
    // Check if all service types in this subcategory are already selected
    const allSelected = allServiceTypeIds.every(id => newSelected.has(id));
    
    if (allSelected) {
      // If all are selected, unselect all
      allServiceTypeIds.forEach(id => newSelected.delete(id));
    } else {
      // If not all are selected, select all
      allServiceTypeIds.forEach(id => newSelected.add(id));
    }
    
    setSelectedServiceTypes(newSelected);
    setFormData({
      ...formData,
      service_type_ids: Array.from(newSelected),
    });
  };

  const handleCategoryDoubleClick = (category: Category) => {
    const newSelected = new Set(selectedServiceTypes);
    const allServiceTypeIds = category.subcategories?.flatMap(
      sub => sub.service_types?.map(st => st.id) || []
    ) || [];
    
    // Check if all service types in this category are already selected
    const allSelected = allServiceTypeIds.every(id => newSelected.has(id));
    
    if (allSelected) {
      // If all are selected, unselect all
      allServiceTypeIds.forEach(id => newSelected.delete(id));
    } else {
      // If not all are selected, select all
      allServiceTypeIds.forEach(id => newSelected.add(id));
    }
    
    setSelectedServiceTypes(newSelected);
    setFormData({
      ...formData,
      service_type_ids: Array.from(newSelected),
    });
  };

  const handleFileUpload = (url: string) => {
    setFormData({
      ...formData,
      file_url: url,
    });
  };

  const handleFileRemove = () => {
    setFormData({
      ...formData,
      file_url: undefined,
    });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'account':
        return !id ? (
          <div className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
                <span className="text-red-500">*</span>    </label>
              <input
                type="email"
                id="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`form-input ${
                  invalidFields.includes('email') ? 'border-red-500' : ''
                }`}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
                <span className="text-red-500">*</span> </label>
              <input
                type="password"
                id="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`form-input ${
                  invalidFields.includes('password') ? 'border-red-500' : ''
                }`}
              />
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            Account information cannot be modified after creation
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                  First Name
                  <span className="text-red-500">*</span>  </label>
                <input
                  type="text"
                  id="first_name"
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className={`form-input ${
                    invalidFields.includes('first_name') ? 'border-red-500' : ''
                  }`}
                />
              </div>
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                  Last Name
                  <span className="text-red-500">*</span>    </label>
                <input
                  type="text"
                  id="last_name"
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className={`form-input ${
                    invalidFields.includes('last_name') ? 'border-red-500' : ''
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">
                  Phone Number
                  <span className="text-red-500">*</span> </label>
                <input
                  type="tel"
                  id="phone_number"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className={`form-input ${
                    invalidFields.includes('phone_number') ? 'border-red-500' : ''
                  }`}
                />
              </div>
              <div>
                <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700">
                  Date of Birth
                </label>
                <input
                  type="date"
                  id="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="form-input"
              />
            </div>

            <div>
              <button
                type="button"
                onClick={() => setIsWorkingAreasExpanded(!isWorkingAreasExpanded)}
                className="w-full flex items-center justify-between p-4 text-left border rounded-lg hover:bg-gray-50"
              >
                <span className="text-sm font-medium text-gray-700">
                  Working Areas
                </span>
                {isWorkingAreasExpanded ? (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                )}
              </button>

              {isWorkingAreasExpanded && (
                <div className="mt-4 space-y-2 border rounded-lg p-4">
                  {workingAreas.map((area) => (
                    <label key={area.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedWorkingAreas.has(area.id)}
                        onChange={() => toggleWorkingArea(area.id)}
                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-sm text-gray-600">{area.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="working_area_diameter" className="block text-sm font-medium text-gray-700">
                Working Area Diameter (km)
              </label>
              <input
                type="number"
                id="working_area_diameter"
                min="0"
                value={formData.working_area_diameter}
                onChange={(e) => setFormData({ ...formData, working_area_diameter: parseInt(e.target.value) })}
                className="form-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Company Information</label>
                <div className="mt-2">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_company}
                      onChange={(e) => setFormData({ ...formData, is_company: e.target.checked })}
                      className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <span className="ml-2">Is Company</span>
                  </label>
                </div>
              </div>
              {formData.is_company && (
                <div>
                  <label htmlFor="number_of_employees" className="block text-sm font-medium text-gray-700">
                    Number of Employees
                  </label>
                  <input
                    type="number"
                    id="number_of_employees"
                    min="0"
                    value={formData.number_of_employees}
                    onChange={(e) => setFormData({ ...formData, number_of_employees: parseInt(e.target.value) })}
                    className="form-input"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' | 'paused' })}
                className="form-input"
              >
                <option value="inactive">Inactive</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </select>
            </div>
          </div>
        );

      case 'address':
        return (
          <div>
            <AddressForm
              onAddressChange={setAddressData}
              existingAddressId={formData.address_id}
            />
          </div>
        );

      case 'services':
        return (
          <div>
            <p className="text-sm text-gray-500 mb-4">
              Double-click on a category or subcategory to select/deselect all service types within it.
            </p>
            <div className="space-y-4">
              {categories.map((category) => (
                <div key={category.id} className="border rounded-md p-4">
                  <h3 
                    className="font-medium text-gray-900 mb-2 cursor-pointer hover:text-indigo-600"
                    onDoubleClick={() => handleCategoryDoubleClick(category)}
                  >
                    {category.name}
                  </h3>
                  <div className="space-y-2">
                    {category.subcategories?.map((subcategory) => (
                      <div key={subcategory.id} className="ml-4">
                        <h4 
                          className="text-sm font-medium text-gray-700 mb-1 cursor-pointer hover:text-indigo-600"
                          onDoubleClick={() => handleSubcategoryDoubleClick(subcategory)}
                        >
                          {subcategory.name}
                        </h4>
                        <div className="space-y-1 ml-4">
                          {subcategory.service_types?.map((serviceType) => (
                            <label key={serviceType.id} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={selectedServiceTypes.has(serviceType.id)}
                                onChange={() => toggleServiceType(serviceType.id)}
                                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                              />
                              <span className="ml-2 text-sm text-gray-600">{serviceType.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'documents':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Document
            </label>
            <FileUpload
  onFilesUpload={(urls) => {
    handleFileUpload(urls[0]); // if you only care about the first file
  }}
  existingFileUrls={formData.file_url ? [formData.file_url] : []}
  onRemove={(index) => handleFileRemove()} // assuming you still remove one file
/>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => navigate('/service-providers')}
                  className="mr-4 text-gray-500 hover:text-gray-700"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <h1 className="text-3xl font-semibold text-gray-900">
                  {id ? 'Edit Service Provider' : 'Create Service Provider'}
                </h1>
              </div>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : id ? 'Update' : 'Create'}
              </button>
            </div>

            {error && (
              <div className="mt-4 bg-red-50 text-red-500 p-3 rounded-md text-sm">
                {error}
              </div>
            )}
          </div>

          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {!id && (
                <button
                  onClick={() => setActiveTab('account')}
                  className={`py-4 px-6 text-sm font-medium ${
                    activeTab === 'account'
                      ? 'border-b-2 border-indigo-500 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Account
                </button>
              )}
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'profile'
                    ? 'border-b-2 border-indigo-500 text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveTab('address')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'address'
                    ? 'border-b-2 border-indigo-500 text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Address
              </button>
              <button
                onClick={() => setActiveTab('services')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'services'
                    ? 'border-b-2 border-indigo-500 text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Services
              </button>
              <button
                onClick={() => setActiveTab('documents')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'documents'
                    ? 'border-b-2 border-indigo-500 text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Documents
              </button>
            </nav>
          </div>

          <div className="p-6">
            <form className="space-y-6">
              {renderTabContent()}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}