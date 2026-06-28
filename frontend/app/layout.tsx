import './globals.css';
import type { Metadata, Viewport } from 'next';
import ToastContainer from '../components/Toast';

export const metadata: Metadata = {
  title: 'MediaHub - Free High-Speed Media Downloader & Analyzer',
  description: 'Stateless online video and audio downloader. Paste any public link from YouTube, Instagram, TikTok, Reddit, Vimeo, and download instantly.',
  keywords: ['downloader', 'video downloader', 'youtube downloader', 'instagram reels downloader', 'tiktok downloader', 'stateless', 'media downloader', 'mp3 converter'],
  authors: [{ name: 'MediaHub Team' }],
  robots: 'index, follow',
  openGraph: {
    title: 'MediaHub - Free High-Speed Media Downloader & Analyzer',
    description: 'Stateless online video and audio downloader. Paste any public link from YouTube, Instagram, TikTok, Reddit, Vimeo, and download instantly.',
    url: 'https://mediahub.vercel.app',
    siteName: 'MediaHub',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop',
        width: 800,
        height: 600,
        alt: 'MediaHub Platform Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MediaHub - Free High-Speed Media Downloader & Analyzer',
    description: 'Stateless online video and audio downloader. Paste any public link from YouTube, Instagram, TikTok, Reddit, Vimeo, and download instantly.',
    images: ['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop'],
  },
};

export const viewport: Viewport = {
  themeColor: '#7C3AED',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth dark">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="antialiased min-h-screen relative overflow-x-hidden transition-colors duration-300">
        {/* Floating gradient blobs behind hero */}
        <div className="absolute top-0 inset-x-0 h-[650px] overflow-hidden pointer-events-none -z-10">
          {/* Blob 1 */}
          <div className="absolute top-[-20%] left-[10%] w-[450px] h-[450px] rounded-full bg-primary/20 dark:bg-primary/10 light:bg-primary/5 blur-[120px] animate-blob" />
          {/* Blob 2 */}
          <div className="absolute top-[-10%] right-[10%] w-[500px] h-[500px] rounded-full bg-secondary/20 dark:bg-secondary/10 light:bg-secondary/5 blur-[120px] animate-blob animation-delay-2000" />
          {/* Blob 3 */}
          <div className="absolute top-[30%] left-[30%] w-[350px] h-[350px] rounded-full bg-accent/20 dark:bg-accent/10 light:bg-accent/5 blur-[100px] animate-blob animation-delay-4000" />
        </div>

        {children}
        
        {/* Global Toasts */}
        <ToastContainer />
      </body>
    </html>
  );
}
