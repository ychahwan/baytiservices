import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateOperatorPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  working_area?: string;
  date_of_birth?: string;
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

    const { email, password, first_name, last_name, phone_number, working_area, date_of_birth, description, address_id } = await req.json() as CreateOperatorPayload;

    // Create the user account
    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) {
      throw authError;
    }

    if (!authData.user) {
      throw new Error('No user was created');
    }

    // Add the operator role
    const { error: roleError } = await supabaseClient
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role: 'operator',
        assigned_by: authData.user.id
      });

    if (roleError) {
      throw roleError;
    }

    // Create the operator profile
    const { data: operatorData, error: operatorError } = await supabaseClient
      .from('operators')
      .insert({
        user_id: authData.user.id,
        first_name,
        last_name,
        phone_number,
        working_area,
        date_of_birth,
        description,
        address_id,
        created_by: authData.user.id,
        updated_by: authData.user.id
      })
      .select()
      .single();

    if (operatorError) {
      throw operatorError;
    }

    return new Response(
      JSON.stringify({ 
        message: 'Operator created successfully',
        operator: operatorData
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