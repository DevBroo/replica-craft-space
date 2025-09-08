-- 🚨 URGENT FIX: AI Messages UUID Error
-- This script fixes the UUID error for AI assistant messages

-- Step 1: Fix any existing AI messages - Simple Safe Approach
UPDATE public.support_ticket_messages 
SET 
  author_id = NULL,
  author_role = 'ai_assistant'
WHERE (
  -- AI-like content patterns
  content ILIKE '%AI Assistant%' 
  OR content ILIKE '%How can I help%'
  OR content ILIKE '%Thank you for contacting%'
  OR content ILIKE '%I understand%'
  OR content ILIKE '%Hello! 👋 Welcome to Picnify%'
  OR content ILIKE '%Nice to meet you%'
  OR content ILIKE '%I would be happy to help%'
  OR content ILIKE '%ai-assistant%'
  OR content ILIKE '%ai assistant%'
)
AND (author_role = 'agent' OR author_role IS NULL);

-- Step 2: Clean up any duplicate or invalid entries
DELETE FROM public.support_ticket_messages 
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY ticket_id, content, created_at 
      ORDER BY created_at
    ) as rn
    FROM public.support_ticket_messages 
    WHERE author_role = 'ai_assistant'
  ) t 
  WHERE t.rn > 1
);

-- Step 3: Show results
SELECT 
  'AI Messages Fixed!' as status,
  COUNT(*) as total_ai_messages
FROM public.support_ticket_messages 
WHERE author_role = 'ai_assistant';

-- Step 4: Show sample of fixed messages
SELECT 
  id,
  ticket_id,
  author_id,
  author_role,
  LEFT(content, 50) || '...' as content_preview,
  created_at
FROM public.support_ticket_messages 
WHERE author_role = 'ai_assistant'
ORDER BY created_at DESC
LIMIT 5;
