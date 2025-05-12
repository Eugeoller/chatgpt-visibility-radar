
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import Stripe from 'https://esm.sh/stripe@13.4.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16', // Use the latest API version
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

    // Create Supabase client for authenticated user
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
      },
    });
    
    // Get user from auth token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Authentication failed' }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 });
    }
    
    // Get origin for success/cancel URLs
    const origin = req.headers.get('origin') || 'http://localhost:3000';
    
    // Check if user already has an active order
    const { data: existingOrders } = await supabaseClient
      .from('orders')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('status', 'paid')
      .limit(1);
    
    // If user already has a paid order, return the success URL directly
    if (existingOrders && existingOrders.length > 0) {
      return new Response(JSON.stringify({ 
        alreadyPaid: true,
        url: `${origin}/informe/formulario` 
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Informe de visibilidad en ChatGPT',
              description: 'Análisis completo de visibilidad de tu marca en ChatGPT',
            },
            unit_amount: 4900, // 49 euros in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/informe/formulario?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/informe`,
      customer_email: user.email,
    });

    // Create order record
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .insert({
        user_id: user.id,
        stripe_session_id: session.id,
        amount: 4900,
        currency: 'eur',
        status: 'pending',
      })
      .select()
      .single();
    
    if (orderError) {
      throw new Error(`Error creating order: ${orderError.message}`);
    }
    
    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing checkout:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
