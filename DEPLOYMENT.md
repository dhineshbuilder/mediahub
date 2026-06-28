# MediaHub Deployment Guide

This guide provides step-by-step instructions for deploying the MediaHub project. The architecture consists of a Next.js frontend (deployed on Vercel) and a Node.js/Express backend (deployed on Render).

---

## 1. Backend Deployment (Render)

Render is used to host the Express backend because it supports long-running processes, file streaming, and custom binary execution (required for `yt-dlp` and `ffmpeg`).

### Step-by-Step Instructions:
1. Sign in to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** and select **Web Service**.
3. Connect your GitHub/GitLab repository.
4. Configure the Web Service settings:
   - **Name**: `mediahub-backend` (or your preferred name)
   - **Region**: Select the region closest to your target users.
   - **Branch**: `main` (or your active development branch)
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`  *(This will automatically download the correct Linux `yt-dlp` binary and compile the TypeScript code)*
   - **Start Command**: `npm start`
   - **Instance Type**: `Free` (or any paid tier for faster processing)

5. Under **Advanced**, click **Add Environment Variable** and add the following keys:
   - `PORT`: `5000` (Render will bind this port automatically, but it is good practice to specify it)
   - `NODE_ENV`: `production`
   - `GROQ_API_KEY`: `your_actual_groq_api_key`
   - `FRONTEND_URL`: `https://your-frontend-domain.vercel.app` (You can update this after deploying the frontend on Vercel)
   - `DOWNLOAD_TIMEOUT`: `0` (Disables timeout limits for larger downloads)
   - `MAX_FILE_SIZE`: `53687091200` (Max allowed download size in bytes)
   - Optional YouTube auth helpers if public downloads start hitting bot checks:
     - `YOUTUBE_API_KEY`: `your_youtube_data_api_key` for metadata lookups
     - `YTDLP_COOKIES_FILE`: `/path/to/cookies.txt` if you have an exported cookie jar
     - `YTDLP_COOKIES_BASE64`: paste the full `cookies.txt` contents encoded as base64
     - `YTDLP_COOKIES_FROM_BROWSER`: `chrome` or `firefox` if the backend runs on a machine with browser cookies available
     - `YTDLP_USE_OAUTH2`: `true` only if you intentionally want yt-dlp to use OAuth2 auth
     - `YTDLP_CACHE_DIR`: optional cache location if you want yt-dlp to reuse extractor state

   - Recommended deployment setup:
     - Local development on your PC: `YTDLP_COOKIES_FILE=cookies.txt`
     - Render: `YTDLP_COOKIES_BASE64=<base64-encoded cookies.txt>` so no cookie file has to live in the repository or on disk
     - Vercel frontend: no cookie env vars are needed there, because the frontend never talks to yt-dlp directly

6. Click **Create Web Service**. Render will build and deploy your backend. Copy the generated URL (e.g., `https://mediahub-backend.onrender.com`).

---

## 2. Frontend Deployment (Vercel)

Vercel is the recommended platform for hosting the Next.js frontend. It offers zero-config deployment and global edge caching.

### Step-by-Step Instructions:
1. Sign in to your [Vercel Dashboard](https://vercel.com/).
2. Click **Add New** and select **Project**.
3. Import your Git repository.
4. In the configuration screen:
   - **Project Name**: `mediahub`
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click *Edit* and select **`frontend`**.
5. Expand the **Environment Variables** section and add:
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://your-backend-domain.onrender.com` (Paste the URL of your deployed Render backend)
6. Click **Deploy**. Vercel will build your Next.js project and provide a public URL.

---

## 3. Post-Deployment Checklist

1. **CORS Configuration**:
   - Once your Vercel frontend is deployed, go back to your **Render Backend Dashboard**.
   - Update the `FRONTEND_URL` environment variable to match your production Vercel URL (e.g. `https://mediahub.vercel.app`).
   - Redeploy the backend service to apply the updated CORS origin safety rules.

2. **Verify Tool Functionality**:
   - Visit your Vercel URL.
   - Test the **Media Downloader** tool by pasting a YouTube link.
   - Test the **AI Subtitle Generator** tool by uploading a short audio file.
