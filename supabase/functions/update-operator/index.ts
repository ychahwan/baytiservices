import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UpdateOperatorPayload {
  id: string;
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

    const { id, first_name, last_name, phone_number, working_area, date_of_birth, description, address_id } = await req.json() as UpdateOperatorPayload;

    // Update the operator profile
    const { data: operatorData, error: operatorError } = await supabaseClient
      .from('operators')
      .update({
        first_name,
        last_name,
        phone_number,
        working_area,
        date_of_birth,
        description,
        address_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (operatorError) {
      throw operatorError;
    }

    return new Response(
      JSON.stringify({ 
        message: 'Operator updated successfully',
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