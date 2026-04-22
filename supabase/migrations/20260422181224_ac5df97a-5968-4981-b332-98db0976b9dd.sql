
-- Drop existing overly permissive storage policies
DROP POLICY IF EXISTS "Authenticated users can upload menu photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update menu photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete menu photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view menu photos" ON storage.objects;

-- Public read access (customers need to see menu photos)
CREATE POLICY "Anyone can view menu photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'menu-photos');

-- Only restaurant owners can upload photos to their restaurant's folder
CREATE POLICY "Restaurant owners can upload their photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'menu-photos'
  AND EXISTS (
    SELECT 1 FROM public.restaurants
    WHERE restaurants.owner_id = auth.uid()
      AND restaurants.id::text = (storage.foldername(name))[1]
  )
);

-- Only restaurant owners can update their own photos
CREATE POLICY "Restaurant owners can update their photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'menu-photos'
  AND EXISTS (
    SELECT 1 FROM public.restaurants
    WHERE restaurants.owner_id = auth.uid()
      AND restaurants.id::text = (storage.foldername(name))[1]
  )
);

-- Only restaurant owners can delete their own photos
CREATE POLICY "Restaurant owners can delete their photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'menu-photos'
  AND EXISTS (
    SELECT 1 FROM public.restaurants
    WHERE restaurants.owner_id = auth.uid()
      AND restaurants.id::text = (storage.foldername(name))[1]
  )
);
