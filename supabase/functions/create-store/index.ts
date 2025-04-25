import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateStorePayload {
  email: string;
  password: string;
  name: string;
  owner_first_name: string;
  owner_last_name: string;
  category_id: string;
  phone_number?: string;
  description?: string;
  address_id?: string;
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

    const payload = await req.json() as CreateStorePayload;

    // Create the user account
    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email: payload.email,
      password: payload.password,
      email_confirm: true
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('No user was created');

    // Add the store role
    const { error: roleError } = await supabaseClient
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role: 'store',
        assigned_by: authData.user.id
      });

    if (roleError) throw roleError;

    // Create the store profile
    const { data: storeData, error: storeError } = await supabaseClient
      .from('stores')
      .insert({
        user_id: authData.user.id,
        name: payload.name,
        owner_first_name: payload.owner_first_name,
        owner_last_name: payload.owner_last_name,
        category_id: payload.category_id,
        phone_number: payload.phone_number,
        description: payload.description,
        address_id: payload.address_id,
        created_by: authData.user.id,
        updated_by: authData.user.id
      })
      .select()
      .single();

    if (storeError) throw storeError;

    return new Response(
      JSON.stringify({ 
        message: 'Store created successfully',
        store: storeData
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