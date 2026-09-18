import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload = await req.json();
    const { name, email, phone, subject, message } = payload;

    if (!name || !email || !subject || !message) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // 1. Insert into DB
    const { error: dbError } = await supabase.from('contact_messages').insert({
      name, email, phone, subject, message
    });
    
    if (dbError) throw dbError;

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const adminEmail = Deno.env.get('ADMIN_EMAIL') || 'admin@example.com';

    // 2. Send emails via Resend (if API key is provided)
    if (resendApiKey) {
      // Send to Admin
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`
        },
        body: JSON.stringify({
          from: 'AgriFlow <onboarding@resend.dev>',
          to: [adminEmail],
          subject: `New Contact Request - ${subject}`,
          html: `
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
            <p><strong>Message:</strong> ${message}</p>
            <p><strong>Submitted At:</strong> ${new Date().toISOString()}</p>
          `
        })
      });

      // Send to User
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`
        },
        body: JSON.stringify({
          from: 'AgriFlow Admin <onboarding@resend.dev>',
          to: [email],
          subject: 'We received your message',
          html: `
            <p>Hello ${name},</p>
            <p>Thank you for contacting us.</p>
            <p>We have received your message and our team will respond as soon as possible.</p>
            <br/>
            <p>Regards,<br/>Admin Team</p>
          `
        })
      });
    }

    return new Response(JSON.stringify({ message: 'Message sent successfully' }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
