import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UpdateFieldOperatorPayload {
  id: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  working_area?: string;
  date_of_birth?: string;
  description?: string;
  referenced_by?: string;
  domain?: string;
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

    const payload = await req.json() as UpdateFieldOperatorPayload;

    // Update the field operator profile
    const { data: operatorData, error: operatorError } = await supabaseClient
      .from('field_operators')
      .update({
        first_name: payload.first_name,
        last_name: payload.last_name,
        phone_number: payload.phone_number,
        working_area: payload.working_area,
        date_of_birth: payload.date_of_birth,
        description: payload.description,
        referenced_by: payload.referenced_by,
        domain: payload.domain,
        address_id: payload.address_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payload.id)
      .select()
      .single();

    if (operatorError) throw operatorError;

    return new Response(
      JSON.stringify({ 
        message: 'Field operator updated successfully',
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