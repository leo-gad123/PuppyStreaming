
-- Fix conversations RLS policy bug (cp.conversation_id = cp.id should be cp.conversation_id = conversations.id)
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
CREATE POLICY "Users can view their conversations"
ON public.conversations FOR SELECT
USING (EXISTS (
  SELECT 1 FROM conversation_participants cp
  WHERE cp.conversation_id = conversations.id AND cp.user_id = auth.uid()
));

-- Allow updating conversations (for last_message)
CREATE POLICY "Participants can update conversations"
ON public.conversations FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM conversation_participants cp
  WHERE cp.conversation_id = conversations.id AND cp.user_id = auth.uid()
));

-- Fix messages INSERT policy bug (cp.conversation_id = cp.conversation_id is self-referencing)
DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;
CREATE POLICY "Participants can send messages"
ON public.messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid()
  )
);

-- Allow inserting conversation participants (for creating new conversations)
CREATE POLICY "Users can add participants to their conversations"
ON public.conversation_participants FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_id AND c.created_by = auth.uid()
  )
  OR auth.uid() = user_id
);
