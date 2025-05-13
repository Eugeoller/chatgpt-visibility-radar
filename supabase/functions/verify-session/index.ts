
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import Stripe from 'https://esm.sh/stripe@13.4.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper for better logging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-SESSION] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS for preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  try {
    logStep("Function started");
    
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      logStep("ERROR: No authorization header");
      return new Response(JSON.stringify({ error: 'No authorization header provided' }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 });
    }

    // Get configuration values
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      logStep("ERROR: STRIPE_SECRET_KEY not found");
      throw new Error("STRIPE_SECRET_KEY not configured");
    }
    
    const supabaseUrl = 'https://kbnaromrpwermjasjevd.supabase.co';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseServiceKey) {
      logStep("ERROR: SUPABASE_SERVICE_ROLE_KEY not found");
      throw new Error("SUPABASE_SERVICE_ROLE_KEY not configured");
    }

    // Create Supabase client
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });
    logStep("Supabase client created");
    
    // Get user from auth token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      logStep("ERROR: Authentication failed", { error: userError });
      return new Response(JSON.stringify({ error: 'Authentication failed' }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 });
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });
    logStep("Stripe initialized");

    // Parse request body
    let sessionId = null;
    try {
      const body = await req.json();
      sessionId = body.sessionId;
    } catch (error) {
      logStep("No request body or invalid JSON", { error });
      // Continue without sessionId
    }
    
    // If no sessionId provided, check if user has any paid order
    if (!sessionId) {
      logStep("No sessionId provided, checking for paid orders");
      const { data: existingOrders, error: orderQueryError } = await supabaseClient
        .from('orders')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('status', 'paid')
        .limit(1);
      
      if (orderQueryError) {
        logStep("ERROR: Error querying orders", { error: orderQueryError });
        throw new Error(`Error querying orders: ${orderQueryError.message}`);
      }
      
      const hasPaid = existingOrders && existingOrders.length > 0;
      logStep("Existing paid orders check result", { 
        hasPaid, 
        orderId: hasPaid ? existingOrders[0].id : null 
      });
      
      return new Response(JSON.stringify({ 
        hasPaid,
        orderId: hasPaid ? existingOrders[0].id : null
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    logStep("Checking session", { sessionId });
    
    // Retrieve the session to check its payment status
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      logStep("Session retrieved", { paymentStatus: session.payment_status });
      
      // Find the associated order
      const { data: order, error: orderError } = await supabaseClient
        .from('orders')
        .select('*')
        .eq('stripe_session_id', sessionId)
        .eq('user_id', user.id)
        .single();
        
      if (orderError) {
        logStep("ERROR: Order not found", { error: orderError });
        return new Response(JSON.stringify({ error: 'Order not found' }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        });
      }

      logStep("Order found", { orderId: order.id, currentStatus: order.status });

      // Update order status if payment successful
      if (session.payment_status === 'paid' && order.status !== 'paid') {
        logStep("Updating order to paid status");
        const { error: updateError } = await supabaseClient
          .from('orders')
          .update({ status: 'paid', updated_at: new Date().toISOString() })
          .eq('id', order.id);
          
        if (updateError) {
          logStep("ERROR: Error updating order status", { error: updateError });
          throw new Error(`Error updating order status: ${updateError.message}`);
        }
        logStep("Order status updated to paid");
      }

      return new Response(JSON.stringify({
        success: true,
        hasPaid: session.payment_status === 'paid',
        orderId: order.id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (stripeError) {
      logStep("ERROR: Stripe error", { error: stripeError });
      throw new Error(`Stripe error: ${stripeError instanceof Error ? stripeError.message : String(stripeError)}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR: Unhandled exception", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
