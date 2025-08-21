-- Create storage bucket for receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true);

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Storage policies for receipts bucket
CREATE POLICY "Users can upload receipts" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'receipts' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can view receipts in their groups" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'receipts' AND
        auth.role() = 'authenticated' AND
        (
            -- User uploaded the receipt
            (storage.foldername(name))[1] = auth.uid()::text OR
            -- Receipt belongs to an expense in user's group
            EXISTS (
                SELECT 1 FROM expenses e
                JOIN group_members gm ON e.group_id = gm.group_id
                WHERE gm.user_id = auth.uid()
                AND e.receipt_url LIKE '%' || name || '%'
            )
        )
    );

CREATE POLICY "Users can update their own receipts" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'receipts' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can delete their own receipts" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'receipts' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Storage policies for avatars bucket
CREATE POLICY "Users can upload their own avatar" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Anyone can view avatars" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can update their own avatar" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'avatars' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can delete their own avatar" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'avatars' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );
