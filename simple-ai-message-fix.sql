-- 🚀 SIMPLE AI MESSAGE FIX - No UUID Regex Issues
-- This script safely fixes AI messages without complex pattern matching

-- Step 1: Update any messages that are clearly AI responses
UPDATE public.support_ticket_messages 
SET 
  author_id = NULL,
  author_role = 'ai_assistant'
WHERE 
  -- Look for AI-like content
  (
    content ILIKE '%How can I help%'
    OR content ILIKE '%Thank you for contacting%'
    OR content ILIKE '%I understand%'
    OR content ILIKE '%Welcome to Picnify%'
    OR content ILIKE '%Nice to meet you%'
    OR content ILIKE '%I would be happy to help%'
    OR content ILIKE '%AI Assistant%'
  )
  AND (
    author_role = 'agent' 
    OR author_role IS NULL
  );

-- Step 2: Also update any messages in recent live chat tickets that look like AI
UPDATE public.support_ticket_messages 
SET 
  author_id = NULL,
  author_role = 'ai_assistant'
WHERE ticket_id IN (
  SELECT id FROM public.support_tickets 
  WHERE subject ILIKE '%Live Chat%'
  AND created_at > NOW() - INTERVAL '7 days'
)
AND author_role = 'agent'
AND (
  content ILIKE '%help%'
  OR content ILIKE '%assist%'
  OR content ILIKE '%provide%'
  OR LENGTH(content) > 50 -- AI responses are usually longer
);

-- Step 3: Show what we fixed
SELECT 
  'AI Messages Fixed!' as status,
  COUNT(*) as total_ai_messages
FROM public.support_ticket_messages 
WHERE author_role = 'ai_assistant';

-- Step 4: Show recent AI messages to verify
SELECT 
  ticket_id,
  LEFT(content, 60) || '...' as message_preview,
  author_role,
  created_at
FROM public.support_ticket_messages 
WHERE author_role = 'ai_assistant'
ORDER BY created_at DESC
LIMIT 5;
