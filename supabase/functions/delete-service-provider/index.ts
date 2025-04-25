import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { id } = await req.json();

    // Get the provider's user_id first
    const { data: provider, error: getError } = await supabaseClient
      .from('service_providers')
      .select('user_id')
      .eq('id', id)
      .single();

    if (getError) throw getError;
    if (!provider?.user_id) throw new Error('Service provider not found');

    // Delete service types
    const { error: deleteTypesError } = await supabaseClient
      .from('service_provider_types')
      .delete()
      .eq('provider_id', id);

    if (deleteTypesError) throw deleteTypesError;

    // Delete working areas
    const { error: deleteAreasError } = await supabaseClient
      .from('service_provider_working_areas')
      .delete()
      .eq('provider_id', id);

    if (deleteAreasError) throw deleteAreasError;

    // Delete the service provider record
    const { error: deleteProviderError } = await supabaseClient
      .from('service_providers')
      .delete()
      .eq('id', id);

    if (deleteProviderError) throw deleteProviderError;

    // Delete the user role
    const { error: deleteRoleError } = await supabaseClient
      .from('user_roles')
      .delete()
      .eq('user_id', provider.user_id);

    if (deleteRoleError) throw deleteRoleError;

    // Delete the user account
    const { error: deleteUserError } = await supabaseClient.auth.admin.deleteUser(
      provider.user_id
    );

    if (deleteUserError) throw deleteUserError;

    return new Response(
      JSON.stringify({ 
        message: 'Service provider deleted successfully'
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