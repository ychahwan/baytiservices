import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { FieldOperatorFormData, AddressFormData } from '../lib/types';
import { ArrowLeft, Save } from 'lucide-react';
import { AddressForm } from '../components/AddressForm';

type TabType = 'account' | 'profile' | 'address' | 'domain';

export function FieldOperatorForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<TabType>('account');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FieldOperatorFormData>({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    working_area: '',
    date_of_birth: '',
    description: '',
    referenced_by: '',
    domain: '',
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
    if (id) {
      loadFieldOperator();
    }
  }, [id]);

  const loadFieldOperator = async () => {
    try {
      const { data, error } = await supabase
        .from('field_operators')
        .select(`
          *,
          addresses (
            *,
            countries (*)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          email: '',
          password: '',
          first_name: data.first_name,
          last_name: data.last_name,
          phone_number: data.phone_number || '',
          working_area: data.working_area || '',
          date_of_birth: data.date_of_birth || '',
          description: data.description || '',
          referenced_by: data.referenced_by || '',
          domain: data.domain || '',
          address_id: data.address_id || null,
        });

        if (data.addresses) {
          setAddressData({
            country_id: data.addresses.country_id || '',
            state: data.addresses.state || '',
            city: data.addresses.city || '',
            street_address: data.addresses.street_address || '',
            postal_code: data.addresses.postal_code || '',
            building_number: data.addresses.building_number || '',
            apartment_number: data.addresses.apartment_number || '',
            additional_info: data.addresses.additional_info || '',
          });
        }
      }
    } catch (err) {
      console.error('Error loading field operator:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const callEdgeFunction = async (
    endpoint: string,
    payload: any,
    token: string
  ) => {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${endpoint}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed API call');
    }

    return await response.json();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

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
          }
        }
      }

      if (id) {
        // Update Field Operator via Edge Function
        await callEdgeFunction(
          'update-field-operator',
          {
            id,
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone_number: formData.phone_number,
            working_area: formData.working_area,
            date_of_birth: formData.date_of_birth,
            description: formData.description,
            referenced_by: formData.referenced_by,
            domain: formData.domain,
            address_id: addressId,
          },
          userAccessToken
        );
      } else {
        // Create Field Operator via Edge Function
        await callEdgeFunction(
          'create-field-operator',
          {
            email: formData.email,
            password: formData.password,
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone_number: formData.phone_number,
            working_area: formData.working_area,
            date_of_birth: formData.date_of_birth,
            description: formData.description,
            referenced_by: formData.referenced_by,
            domain: formData.domain,
            address_id: addressId,
          },
          userAccessToken
        );
      }

      navigate('/field-operators');
    } catch (err) {
      console.error('Error submitting field operator:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'account':
        return !id ? (
          <div className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="form-input"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                id="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="form-input"
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
                </label>
                <input
                  type="text"
                  id="first_name"
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="form-input"
                />
              </div>
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  type="text"
                  id="last_name"
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone_number"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="form-input"
                />
              </div>
              <div>
                <label htmlFor="working_area" className="block text-sm font-medium text-gray-700">
                  Working Area
                </label>
                <input
                  type="text"
                  id="working_area"
                  value={formData.working_area}
                  onChange={(e) => setFormData({ ...formData, working_area: e.target.value })}
                  className="form-input"
                />
              </div>
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

      case 'domain':
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="referenced_by" className="block text-sm font-medium text-gray-700">
                Referenced By
              </label>
              <input
                type="text"
                id="referenced_by"
                value={formData.referenced_by}
                onChange={(e) => setFormData({ ...formData, referenced_by: e.target.value })}
                className="form-input"
              />
            </div>
            <div>
              <label htmlFor="domain" className="block text-sm font-medium text-gray-700">
                Domain
              </label>
              <input
                type="text"
                id="domain"
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                className="form-input"
              />
            </div>
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
                  onClick={() => navigate('/field-operators')}
                  className="mr-4 text-gray-500 hover:text-gray-700"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <h1 className="text-3xl font-semibold text-gray-900">
                  {id ? 'Edit Field Operator' : 'Create Field Operator'}
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
                onClick={() => setActiveTab('domain')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'domain'
                    ? 'border-b-2 border-indigo-500 text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Domain
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