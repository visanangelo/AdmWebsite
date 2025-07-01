-- Migration to create likes table for real-time like feature
CREATE TABLE IF NOT EXISTS public.likes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_id text NOT NULL, -- e.g., dashboard, post, etc.
    created_at timestamp with time zone DEFAULT timezone('utc', now()),
    CONSTRAINT unique_like_per_user_target UNIQUE (user_id, target_id)
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_likes_target_id ON public.likes(target_id); 