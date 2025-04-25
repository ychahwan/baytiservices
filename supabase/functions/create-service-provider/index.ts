import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateServiceProviderPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  working_area_ids: string[];
  working_area_diameter: number;
  date_of_birth?: string;
  description?: string;
  referenced_by?: string;
  is_company: boolean;
  number_of_employees: number;
  status: 'active' | 'inactive' | 'paused';
  service_type_ids: string[];
  address_id?: string;
  file_url?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload = await req.json() as CreateServiceProviderPayload;

    // Create the user account
    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email: payload.email,
      password: payload.password,
      email_confirm: true
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('No user was created');

    // Add the service provider role
    const { error: roleError } = await supabaseClient
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role: 'service_provider',
        assigned_by: authData.user.id
      });

    if (roleError) throw roleError;

    // Create the service provider profile
    const { data: providerData, error: providerError } = await supabaseClient
      .from('service_providers')
      .insert({
        user_id: authData.user.id,
        first_name: payload.first_name,
        last_name: payload.last_name,
        phone_number: payload.phone_number,
        working_area_diameter: payload.working_area_diameter,
        date_of_birth: payload.date_of_birth,
        description: payload.description,
        referenced_by: payload.referenced_by,
        is_company: payload.is_company,
        number_of_employees: payload.number_of_employees,
        status: payload.status,
        address_id: payload.address_id,
        file_url: payload.file_url,
        created_by: authData.user.id,
        updated_by: authData.user.id
      })
      .select()
      .single();

    if (providerError) throw providerError;

    // Add service types
    if (payload.service_type_ids.length > 0) {
      const serviceTypeData = payload.service_type_ids.map(serviceTypeId => ({
        provider_id: providerData.id,
        service_type_id: serviceTypeId,
        created_by: authData.user.id,
      }));

      const { error: typesError } = await supabaseClient
        .from('service_provider_types')
        .insert(serviceTypeData);

      if (typesError) throw typesError;
    }

    // Add working areas
    if (payload.working_area_ids.length > 0) {
      const workingAreaData = payload.working_area_ids.map(areaId => ({
        provider_id: providerData.id,
        working_area_id: areaId,
        created_by: authData.user.id,
      }));

      const { error: areasError } = await supabaseClient
        .from('service_provider_working_areas')
        .insert(workingAreaData);

      if (areasError) throw areasError;
    }

    return new Response(
      JSON.stringify({ 
        message: 'Service provider created successfully',
        provider: providerData
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error.message 
      }),
      { 
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
});