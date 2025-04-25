import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UpdateStorePayload {
  id: string;
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

    const payload = await req.json() as UpdateStorePayload;

    // Update the store profile
    const { data: storeData, error: storeError } = await supabaseClient
      .from('stores')
      .update({
        name: payload.name,
        owner_first_name: payload.owner_first_name,
        owner_last_name: payload.owner_last_name,
        category_id: payload.category_id,
        phone_number: payload.phone_number,
        description: payload.description,
        address_id: payload.address_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payload.id)
      .select()
      .single();

    if (storeError) throw storeError;

    return new Response(
      JSON.stringify({ 
        message: 'Store updated successfully',
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