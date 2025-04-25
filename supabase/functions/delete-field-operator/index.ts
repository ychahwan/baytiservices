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

    // Get the field operator's user_id first
    const { data: operator, error: getError } = await supabaseClient
      .from('field_operators')
      .select('user_id')
      .eq('id', id)
      .single();

    if (getError) throw getError;
    if (!operator?.user_id) throw new Error('Field operator not found');

    // Delete the field operator record
    const { error: deleteOperatorError } = await supabaseClient
      .from('field_operators')
      .delete()
      .eq('id', id);

    if (deleteOperatorError) throw deleteOperatorError;

    // Delete the user role
    const { error: deleteRoleError } = await supabaseClient
      .from('user_roles')
      .delete()
      .eq('user_id', operator.user_id);

    if (deleteRoleError) throw deleteRoleError;

    // Delete the user account
    const { error: deleteUserError } = await supabaseClient.auth.admin.deleteUser(
      operator.user_id
    );

    if (deleteUserError) throw deleteUserError;

    return new Response(
      JSON.stringify({ 
        message: 'Field operator deleted successfully'
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