import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  recipients: Array<{
    type: 'user' | 'agent' | 'owner';
    id?: string;
    email?: string;
    phone?: string;
  }>;
  delivery_methods: Array<'email' | 'sms' | 'in-app'>;
  template_id?: string;
  subject?: string;
  content: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  type?: 'info' | 'warning' | 'error' | 'success';
  variables?: Record<string, string>;
  scheduled_for?: string;
  scheduled_id?: string;
}

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: NotificationRequest = await req.json();
    console.log("Processing notification request:", body);

    // Create notification record
    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert({
        title: body.subject || 'System Notification',
        content: body.content,
        type: body.type || 'info',
        priority: body.priority || 'normal',
        target_audience: 'admin',
      })
      .select()
      .single();

    // Update scheduled notification status if this is from a schedule
    if (body.scheduled_id) {
      const { error: scheduleError } = await supabase
        .from('notification_schedules')
        .update({ status: 'processing' })
        .eq('id', body.scheduled_id);
      
      if (scheduleError) {
        console.error("Error updating schedule status:", scheduleError);
      }
    }

    if (notificationError) {
      console.error("Error creating notification:", notificationError);
      throw notificationError;
    }

    console.log("Created notification:", notification.id);

    // Process each recipient
    const deliveryPromises = [];
    
    for (const recipient of body.recipients) {
      // Get recipient details if only ID provided
      let recipientData = recipient;
      if (recipient.id && (!recipient.email || !recipient.phone)) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, phone')
          .eq('id', recipient.id)
          .single();
        
        if (profile) {
          recipientData = {
            ...recipient,
            email: profile.email || recipient.email,
            phone: profile.phone || recipient.phone
          };
        }
      }

      // Process each delivery method
      for (const method of body.delivery_methods) {
        const deliveryPromise = createDeliveryRecord(
          notification.id,
          recipientData,
          method,
          body.content,
          body.subject || 'System Notification',
          body.variables
        );
        deliveryPromises.push(deliveryPromise);
      }
    }

    const deliveryResults = await Promise.allSettled(deliveryPromises);
    const successCount = deliveryResults.filter(r => r.status === 'fulfilled').length;
    const failureCount = deliveryResults.filter(r => r.status === 'rejected').length;

    console.log(`Delivery completed: ${successCount} successful, ${failureCount} failed`);

    // Final status update for scheduled notification
    if (body.scheduled_id) {
      const finalStatus = failureCount > 0 ? 'failed' : 'sent';
      await supabase
        .from('notification_schedules')
        .update({ 
          status: finalStatus, 
          sent_at: new Date().toISOString(),
          error_message: failureCount > 0 ? `${failureCount} delivery failures` : null
        })
        .eq('id', body.scheduled_id);
    }

    return new Response(
      JSON.stringify({
        notification_id: notification.id,
        success_count: successCount,
        failure_count: failureCount,
        scheduled_id: body.scheduled_id,
        message: "Notification processing completed"
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in notifications-dispatch:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

async function createDeliveryRecord(
  notificationId: string,
  recipient: any,
  method: string,
  content: string,
  subject: string,
  variables?: Record<string, string>
) {
  try {
    // Replace variables in content and subject
    let processedContent = content;
    let processedSubject = subject;
    
    if (variables) {
      Object.entries(variables).forEach(([key, value]) => {
        const placeholder = `{${key}}`;
        processedContent = processedContent.replace(new RegExp(placeholder, 'g'), value);
        processedSubject = processedSubject.replace(new RegExp(placeholder, 'g'), value);
      });
    }

    // Create delivery record
    const { data: delivery, error: deliveryError } = await supabase
      .from('notification_deliveries')
      .insert({
        notification_id: notificationId,
        recipient_id: recipient.id,
        recipient_type: recipient.type,
        delivery_method: method,
        recipient_email: recipient.email,
        recipient_phone: recipient.phone,
        status: 'pending'
      })
      .select()
      .single();

    if (deliveryError) {
      console.error("Error creating delivery record:", deliveryError);
      throw deliveryError;
    }

    // Send notification based on method
    let deliveryResult;
    switch (method) {
      case 'email':
        deliveryResult = await sendEmail(recipient.email, processedSubject, processedContent);
        break;
      case 'sms':
        deliveryResult = await sendSMS(recipient.phone, processedContent);
        break;
      case 'in-app':
        deliveryResult = { success: true, message: 'In-app notification created' };
        break;
      default:
        throw new Error(`Unsupported delivery method: ${method}`);
    }

    // Update delivery status
    await supabase
      .from('notification_deliveries')
      .update({
        status: deliveryResult.success ? 'sent' : 'failed',
        sent_at: deliveryResult.success ? new Date().toISOString() : null,
        error_message: deliveryResult.success ? null : deliveryResult.error,
        external_id: deliveryResult.external_id
      })
      .eq('id', delivery.id);

    // Create notification event for tracking
    if (deliveryResult.success) {
      await supabase
        .from('notification_events')
        .insert({
          delivery_id: delivery.id,
          event_type: 'sent',
          event_data: { external_id: deliveryResult.external_id }
        });
    }

    console.log(`${method} delivery ${deliveryResult.success ? 'successful' : 'failed'} for recipient ${recipient.id}`);
    return deliveryResult;

  } catch (error) {
    console.error(`Error processing ${method} delivery:`, error);
    throw error;
  }
}

async function sendEmail(email: string, subject: string, content: string) {
  if (!email) {
    return { success: false, error: 'No email address provided' };
  }

  if (!Deno.env.get("RESEND_API_KEY")) {
    console.warn("RESEND_API_KEY not configured, skipping email");
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const emailResult = await resend.emails.send({
      from: "Picnify <notifications@resend.dev>",
      to: [email],
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">${subject}</h2>
          <div style="color: #666; line-height: 1.6;">
            ${content.replace(/\n/g, '<br>')}
          </div>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px;">
            This is an automated message from Picnify. Please do not reply to this email.
          </p>
        </div>
      `,
    });

    return { 
      success: true, 
      external_id: emailResult.data?.id,
      message: 'Email sent successfully' 
    };
  } catch (error) {
    console.error("Email sending failed:", error);
    return { success: false, error: error.message };
  }
}

async function sendSMS(phone: string, content: string) {
  if (!phone) {
    return { success: false, error: 'No phone number provided' };
  }

  const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");

  if (!twilioSid || !twilioToken || !twilioPhone) {
    console.warn("Twilio credentials not configured, skipping SMS");
    return { success: false, error: 'SMS service not configured' };
  }

  try {
    const auth = btoa(`${twilioSid}:${twilioToken}`);
    
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: twilioPhone,
          To: phone,
          Body: content
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Twilio API error: ${error}`);
    }

    const result = await response.json();
    return { 
      success: true, 
      external_id: result.sid,
      message: 'SMS sent successfully' 
    };
  } catch (error) {
    console.error("SMS sending failed:", error);
    return { success: false, error: error.message };
  }
}

serve(handler);