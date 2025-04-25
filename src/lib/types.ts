// Add these types to the existing types.ts file

export interface Country {
  id: string;
  name: string;
  code: string;
  phone_code: string;
}

export interface Address {
  id: string;
  country_id: string;
  state: string | null;
  city: string | null;
  street_address: string | null;
  postal_code: string | null;
  building_number: string | null;
  apartment_number: string | null;
  additional_info: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string | null;
  country?: Country;
}

export interface AddressFormData {
  country_id: string;
  state: string;
  city: string;
  street_address: string;
  postal_code: string;
  building_number: string;
  apartment_number: string;
  additional_info: string;
}

export interface WorkingArea {
  id: string;
  name: string;
}

// Update existing interfaces to use address_id instead of address
export interface OperatorFormData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  address_id?: string;
  phone_number: string;
  working_area: string;
  date_of_birth: string;
  description: string;
}

export interface FieldOperatorFormData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  address_id?: string;
  phone_number: string;
  working_area: string;
  date_of_birth: string;
  description: string;
  referenced_by: string;
  domain: string;
}

export interface ServiceProviderFormData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  address_id?: string;
  phone_number: string;
  working_area_ids: string[];
  working_area_diameter: number;
  date_of_birth: string;
  description: string;
  referenced_by: string;
  is_company: boolean;
  number_of_employees: number;
  status: 'active' | 'inactive' | 'paused';
  service_type_ids: string[];
  file_url?: string;
}

export interface StoreFormData {
  email: string;
  password: string;
  name: string;
  owner_first_name: string;
  owner_last_name: string;
  category_id: string;
  address_id?: string;
  phone_number: string;
  description: string;
}