
-- Update handle_new_user to auto-assign admin role for admin@gmail.com
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  -- Auto-assign admin role for admin@gmail.com, otherwise user role
  IF NEW.email = 'admin@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;
  RETURN NEW;
END;
$$;

-- Create storage bucket for movie covers
INSERT INTO storage.buckets (id, name, public) VALUES ('movie-covers', 'movie-covers', true);

-- Allow admins to upload movie covers
CREATE POLICY "Admins can upload movie covers"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'movie-covers' AND public.has_role(auth.uid(), 'admin'));

-- Allow admins to update movie covers
CREATE POLICY "Admins can update movie covers"
ON storage.objects FOR UPDATE
USING (bucket_id = 'movie-covers' AND public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete movie covers
CREATE POLICY "Admins can delete movie covers"
ON storage.objects FOR DELETE
USING (bucket_id = 'movie-covers' AND public.has_role(auth.uid(), 'admin'));

-- Allow public read access to movie covers
CREATE POLICY "Movie covers are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'movie-covers');

-- Create storage bucket for post images
INSERT INTO storage.buckets (id, name, public) VALUES ('post-images', 'post-images', true);

-- Users can upload post images
CREATE POLICY "Users can upload post images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'post-images' AND auth.uid() IS NOT NULL);

-- Public read for post images
CREATE POLICY "Post images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-images');

-- Users can delete their own post images
CREATE POLICY "Users can delete own post images"
ON storage.objects FOR DELETE
USING (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create storage bucket for story images
INSERT INTO storage.buckets (id, name, public) VALUES ('stories', 'stories', true);

CREATE POLICY "Users can upload stories"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'stories' AND auth.uid() IS NOT NULL);

CREATE POLICY "Stories are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'stories');

CREATE POLICY "Users can delete own stories"
ON storage.objects FOR DELETE
USING (bucket_id = 'stories' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create stories table
CREATE TABLE public.stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  image_url text NOT NULL,
  caption text,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '24 hours')
);

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stories are publicly viewable"
ON public.stories FOR SELECT USING (expires_at > now());

CREATE POLICY "Users can create stories"
ON public.stories FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own stories"
ON public.stories FOR DELETE USING (auth.uid() = user_id);
