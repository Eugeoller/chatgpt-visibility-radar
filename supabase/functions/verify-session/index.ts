
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import Stripe from 'https://esm.sh/stripe@13.4.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const supabaseUrl = 'https://kbnaromrpwermjasjevd.supabase.co';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

serve(async (req) => {
  // Handle CORS for preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header provided' }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 });
    }

    // Create Supabase client
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });
    
    // Get user from auth token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Authentication failed' }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 });
    }

    // Parse request body
    const { sessionId } = await req.json();
    
    // If no sessionId provided, check if user has any paid order
    if (!sessionId) {
      const { data: existingOrders } = await supabaseClient
        .from('orders')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('status', 'paid')
        .limit(1);
      
      return new Response(JSON.stringify({ 
        hasPaid: existingOrders && existingOrders.length > 0,
        orderId: existingOrders && existingOrders.length > 0 ? existingOrders[0].id : null
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Retrieve the session to check its payment status
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    // Find the associated order
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('stripe_session_id', sessionId)
      .eq('user_id', user.id)
      .single();
      
    if (orderError || !order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404 
      });
    }

    // Update order status if payment successful
    if (session.payment_status === 'paid' && order.status !== 'paid') {
      const { error: updateError } = await supabaseClient
        .from('orders')
        .update({ status: 'paid', updated_at: new Date().toISOString() })
        .eq('id', order.id);
        
      if (updateError) {
        throw new Error(`Error updating order status: ${updateError.message}`);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      hasPaid: session.payment_status === 'paid',
      orderId: order.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error verifying session:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
