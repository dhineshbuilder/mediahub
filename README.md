# MediaHub

A production-quality, stateless media downloader and analyzer. Paste a public video or audio URL from any supported platform, preview metadata (title, thumbnail, uploader, duration), select a format, and stream-download the file directly to your device.

---

## Tech Stack

### Frontend
- **Next.js 15** (App Router) + **React 19**
- **TypeScript** (strict mode)
- **Tailwind CSS** with custom design tokens
- **Framer Motion** for page transitions and micro-animations
- **Lucide React** for iconography
- **React Hook Form** + **Zod** for input validation

### Backend
- **Node.js** + **Express**
- **TypeScript** (strict mode)
- **Helmet** / **CORS** / **Compression** / **Morgan**
- **express-rate-limit** for abuse protection
- **Winston** for structured logging
- **Zod** for request validation
- **Axios** for upstream HTTP requests

---

## Folder Structure

```
mediahub/
├── frontend/
│   ├── app/                  # Next.js App Router pages & layouts
│   │   ├── globals.css       # Tailwind directives + custom styles
│   │   ├── layout.tsx        # Root layout with SEO metadata
│   │   └── page.tsx          # Landing page (Hero, Platforms, Features, FAQ)
│   ├── components/           # Reusable UI components
│   ├── hooks/                # Custom React hooks (useMedia, useToast)
│   ├── lib/                  # API client & utility helpers
│   ├── types/                # TypeScript interfaces
│   ├── public/               # Static assets (robots.txt, sitemap, manifest)
│   ├── tailwind.config.ts
│   ├── postcss.config.mjs
│   ├── next.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── config/           # Environment variable parsing (Zod)
│   │   ├── controllers/      # Request handlers (analyze, download)
│   │   ├── middlewares/       # Error, logger, rate-limit, validation
│   │   ├── providers/        # Platform-specific media extractors
│   │   ├── routes/           # Express route definitions
│   │   ├── types/            # Shared TypeScript types
│   │   ├── utils/            # Logger, formatters, validators
│   │   ├── app.ts            # Express app configuration
│   │   └── server.ts         # Entry point
│   ├── temp/                 # Temporary file storage (auto-cleaned)
│   ├── downloads/            # Transient download staging
│   ├── tsconfig.json
│   └── package.json
│
└── README.md
```

---

## Supported Platforms

| Platform     | Metadata | Download |
|--------------|----------|----------|
| YouTube      | ✅       | ✅       |
| Instagram    | ✅       | ✅       |
| Facebook     | ✅       | ✅       |
| Twitter / X  | ✅       | ✅       |
| TikTok       | ✅       | ✅       |
| Reddit       | ✅       | ✅       |
| Pinterest    | ✅       | ✅       |
| Threads      | ✅       | ✅       |
| Vimeo        | ✅       | ✅       |
| Dailymotion  | ✅       | ✅       |
| Direct Links | ✅       | ✅       |

Each platform has its own provider module under `backend/src/providers/`. New platforms can be added by implementing the `Provider` interface and registering in the factory.

---

## Getting Started

### Prerequisites
- **Node.js** >= 18
- **npm** >= 9

### Backend Setup

```bash
cd mediahub/backend
npm install
npm run dev
```

The server starts on `http://localhost:5000`.

### Frontend Setup

```bash
cd mediahub/frontend
npm install
npm run dev
```

The app starts on `http://localhost:3000`.

---

## Environment Variables

### Frontend (`frontend/.env.local`)

| Variable              | Description                | Default                  |
|-----------------------|----------------------------|--------------------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL       | `http://localhost:5000`  |

### Backend (`backend/.env`)

| Variable           | Description                          | Default                  |
|--------------------|--------------------------------------|--------------------------|
| `PORT`             | Server listen port                   | `5000`                   |
| `NODE_ENV`         | Environment mode                     | `development`            |
| `FRONTEND_URL`     | Allowed CORS origin                  | `http://localhost:3000`  |
| `MAX_FILE_SIZE`    | Max download size in bytes           | `104857600` (100 MB)     |
| `DOWNLOAD_TIMEOUT` | Download timeout in ms               | `60000` (60 s)           |
| `YTDLP_COOKIES_FROM_BROWSER` | Browser for yt-dlp cookies       | `chrome`                 |
| `YTDLP_COOKIES_FILE` | Exported cookies.txt path           | unset                    |

---

## API Endpoints

### `POST /api/analyze`

Analyze a media URL and return metadata.

**Request:**
```json
{ "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }
```

**Response:**
```json
{
  "success": true,
  "platform": "YouTube",
  "title": "Rick Astley - Never Gonna Give You Up",
  "thumbnail": "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
  "duration": "03:33",
  "uploader": "Rick Astley",
  "formats": [
    { "quality": "720p", "type": "both", "url": "...", "ext": "mp4" },
    { "quality": "Audio 128kbps", "type": "audio", "url": "...", "ext": "mp3" }
  ]
}
```

### `POST /api/download`

Stream a media file to the client.

**Request:**
```json
{ "url": "...", "quality": "720p", "type": "both" }
```

**Response:** Binary stream with `Content-Disposition: attachment`.

---

## Production Build

### Backend

```bash
cd mediahub/backend
npm run build    # Compiles TypeScript to dist/
npm start        # Runs dist/server.js
```

### Frontend

```bash
cd mediahub/frontend
npm run build    # Generates optimised .next/ bundle
npm start        # Starts production server on port 3000
```

---

## Deployment

### Frontend → Vercel

1. Push to GitHub.
2. Import the repository in [Vercel](https://vercel.com).
3. Set the **Root Directory** to `mediahub/frontend`.
4. Set the environment variable `NEXT_PUBLIC_API_URL` to your Render backend URL (e.g. `https://mediahub-api.onrender.com`).
5. Deploy.

### Backend → Render

1. Push to GitHub.
2. Create a new **Web Service** on [Render](https://render.com).
3. Set the **Root Directory** to `mediahub/backend`.
4. Set the **Build Command** to `npm install && npm run build`.
5. Set the **Start Command** to `npm start`.
6. Add environment variables:
   - `PORT=5000`
   - `NODE_ENV=production`
   - `FRONTEND_URL=https://your-mediahub-frontend.vercel.app`
7. Deploy.

---

## License

This project is intended for **educational purposes only**. Downloading copyrighted media without authorization from the content owner is prohibited and may violate applicable laws and platform terms of service.
