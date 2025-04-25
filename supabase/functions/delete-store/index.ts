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

    // Get the store's user_id first
    const { data: store, error: getError } = await supabaseClient
      .from('stores')
      .select('user_id')
      .eq('id', id)
      .single();

    if (getError) throw getError;
    if (!store?.user_id) throw new Error('Store not found');

    // Delete the store record
    const { error: deleteStoreError } = await supabaseClient
      .from('stores')
      .delete()
      .eq('id', id);

    if (deleteStoreError) throw deleteStoreError;

    // Delete the user role
    const { error: deleteRoleError } = await supabaseClient
      .from('user_roles')
      .delete()
      .eq('user_id', store.user_id);

    if (deleteRoleError) throw deleteRoleError;

    // Delete the user account
    const { error: deleteUserError } = await supabaseClient.auth.admin.deleteUser(
      store.user_id
    );

    if (deleteUserError) throw deleteUserError;

    return new Response(
      JSON.stringify({ 
        message: 'Store deleted successfully'
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