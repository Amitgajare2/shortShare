# ShortShare

A real-time file, text, and code sharing app (like ShareIt/Xender, but web-based) built with React + Vite and Supabase.

## Features
- Upload and share files (max 50MB, auto-deletes after 2 hours)
- Share text and code (with syntax highlighting)
- Anonymous uploads (no auth)
- Unique share URLs
- Real-time viewer count
- View/download stats
- Countdown timer for auto-delete

## Setup Instructions

### 1. Clone the repository
```sh
npm install
```

### 2. Create a Supabase project
- Go to [Supabase](https://supabase.com/) and create a new project.
- In your Supabase dashboard, create the required tables using the provided SQL schema (see below).

### 3. Configure Environment Variables
- Create a `.env` file in the project root:
  ```sh
  touch .env
  ```
- Add your Supabase credentials to `.env`:
  ```env
  VITE_SUPABASE_URL=your-supabase-url-here
  VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here
  ```
- Replace the placeholders with your actual Supabase project URL and anon key (find these in your Supabase project settings).

### 4. Start the development server
```sh
npm run dev
```

The app will be available at [http://localhost:5173](http://localhost:5173) by default.

## Supabase SQL Schema
```
-- Create shares table for shared content
CREATE TABLE public.shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  share_id TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('files', 'text', 'code')),
  content TEXT,
  language TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '2 hours'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  view_count INTEGER NOT NULL DEFAULT 0,
  download_count INTEGER NOT NULL DEFAULT 0
);

-- Create share_files table for file metadata
CREATE TABLE public.share_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  share_id UUID NOT NULL REFERENCES public.shares(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  size BIGINT NOT NULL,
  type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create storage bucket for uploaded files
INSERT INTO storage.buckets (id, name, public) VALUES ('share-files', 'share-files', true);

-- Enable Row Level Security
ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_files ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since shares are meant to be accessible)
CREATE POLICY "Anyone can view shares" 
ON public.shares 
FOR SELECT 
USING (expires_at > now());

CREATE POLICY "Anyone can create shares" 
ON public.shares 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update share stats" 
ON public.shares 
FOR UPDATE 
USING (expires_at > now());

CREATE POLICY "Anyone can view share files" 
ON public.share_files 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.shares 
  WHERE shares.id = share_files.share_id 
  AND shares.expires_at > now()
));

CREATE POLICY "Anyone can create share files" 
ON public.share_files 
FOR INSERT 
WITH CHECK (true);

-- Create storage policies for file uploads
CREATE POLICY "Anyone can view share files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'share-files');

CREATE POLICY "Anyone can upload share files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'share-files');

-- Create function to auto-delete expired shares
CREATE OR REPLACE FUNCTION public.cleanup_expired_shares()
RETURNS void AS $$
BEGIN
  -- Delete storage files for expired shares
  DELETE FROM storage.objects 
  WHERE bucket_id = 'share-files' 
  AND name LIKE ANY(
    SELECT storage_path FROM public.share_files sf
    JOIN public.shares s ON sf.share_id = s.id
    WHERE s.expires_at <= now()
  );
  
  -- Delete expired shares (will cascade to share_files)
  DELETE FROM public.shares WHERE expires_at <= now();
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance
CREATE INDEX idx_shares_share_id ON public.shares(share_id);
CREATE INDEX idx_shares_expires_at ON public.shares(expires_at);
CREATE INDEX idx_share_files_share_id ON public.share_files(share_id);
```

## Environment Variables
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anon/public key

## Running Locally
```sh
npm run dev
```


