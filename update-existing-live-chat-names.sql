    -- ✨ ENHANCED Live Chat Ticket Customer Name Update Script
    -- This script fixes tickets that show "Anonymous" and improves the overall data quality

    -- Step 1: Update tickets with proper customer names from profiles
    UPDATE public.support_tickets 
    SET 
    subject = CONCAT('Live Chat Session - ', p.full_name),
    customer_email = COALESCE(support_tickets.customer_email, p.email),
    description = CASE 
        WHEN description IS NOT NULL AND description != '' AND description != 'Live chat conversation initiated by user' THEN 
        -- Try to parse existing JSON and update it
        CASE 
            WHEN description::text ~ '^{.*}$' THEN
            -- Valid JSON, update it
            jsonb_set(
                COALESCE(description::jsonb, '{}'::jsonb), 
                '{customer_details,name}', 
                to_jsonb(p.full_name),
                true
            )::text
            ELSE
            -- Not JSON, create new structure
            jsonb_build_object(
                'customer_details', jsonb_build_object(
                'name', p.full_name,
                'email', p.email
                ),
                'conversation_summary', '[]'::jsonb,
                'original_description', description
            )::text
        END
        ELSE 
        -- Create new JSON structure
        jsonb_build_object(
            'customer_details', jsonb_build_object(
            'name', p.full_name,
            'email', p.email
            ),
            'conversation_summary', '[]'::jsonb
        )::text
    END,
    updated_at = NOW()
    FROM public.profiles p
    WHERE support_tickets.created_by = p.id
    AND support_tickets.subject LIKE '%Live Chat%'
    AND (
        support_tickets.subject = 'Live Chat Session' 
        OR support_tickets.subject LIKE '%Anonymous%'
        OR support_tickets.subject LIKE '%Test Customer%'
        OR support_tickets.subject LIKE '%Test User%'
        OR NOT support_tickets.subject LIKE '% - %'
    )
    AND p.full_name IS NOT NULL
    AND p.full_name != ''
    AND LENGTH(TRIM(p.full_name)) > 0;

    -- Step 2: Update tickets where we have email but no full_name
    UPDATE public.support_tickets 
    SET 
    subject = CONCAT('Live Chat Session - ', SPLIT_PART(p.email, '@', 1)),
    customer_email = p.email,
    description = CASE 
        WHEN description IS NOT NULL AND description != '' AND description != 'Live chat conversation initiated by user' THEN 
        CASE 
            WHEN description::text ~ '^{.*}$' THEN
            jsonb_set(
                COALESCE(description::jsonb, '{}'::jsonb), 
                '{customer_details,name}', 
                to_jsonb(SPLIT_PART(p.email, '@', 1)),
                true
            )::text
            ELSE
            jsonb_build_object(
                'customer_details', jsonb_build_object(
                'name', SPLIT_PART(p.email, '@', 1),
                'email', p.email
                ),
                'conversation_summary', '[]'::jsonb,
                'original_description', description
            )::text
        END
        ELSE 
        jsonb_build_object(
            'customer_details', jsonb_build_object(
            'name', SPLIT_PART(p.email, '@', 1),
            'email', p.email
            ),
            'conversation_summary', '[]'::jsonb
        )::text
    END,
    updated_at = NOW()
    FROM public.profiles p
    WHERE support_tickets.created_by = p.id
    AND support_tickets.subject LIKE '%Live Chat%'
    AND (
        support_tickets.subject = 'Live Chat Session' 
        OR support_tickets.subject LIKE '%Anonymous%'
        OR support_tickets.subject LIKE '%Test Customer%'
        OR support_tickets.subject LIKE '%Test User%'
        OR NOT support_tickets.subject LIKE '% - %'
    )
    AND (p.full_name IS NULL OR p.full_name = '' OR LENGTH(TRIM(p.full_name)) = 0)
    AND p.email IS NOT NULL
    AND p.email != '';

    -- Step 3: Show results
    SELECT 
    COUNT(*) as total_updated_tickets,
    'Live chat tickets updated with customer names!' as message
    FROM public.support_tickets 
    WHERE subject LIKE '%Live Chat%' 
    AND subject LIKE '% - %'
    AND updated_at >= NOW() - INTERVAL '1 minute';

    -- Step 4: Show summary of live chat tickets
    SELECT 
    CASE 
        WHEN subject LIKE '% - %' THEN 'Has Customer Name'
        ELSE 'Needs Update'
    END as ticket_status,
    COUNT(*) as count
    FROM public.support_tickets 
    WHERE subject LIKE '%Live Chat%'
    GROUP BY 
    CASE 
        WHEN subject LIKE '% - %' THEN 'Has Customer Name'
        ELSE 'Needs Update'
    END
    ORDER BY count DESC;
