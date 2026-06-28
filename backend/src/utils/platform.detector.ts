export type PlatformType =
  | 'youtube'
  | 'instagram'
  | 'facebook'
  | 'twitter'
  | 'tiktok'
  | 'reddit'
  | 'pinterest'
  | 'threads'
  | 'vimeo'
  | 'dailymotion'
  | 'generic';

export function detectPlatform(url: string): PlatformType {
  try {
    const hostname = new URL(url).hostname.toLowerCase();

    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      return 'youtube';
    }
    if (hostname.includes('instagram.com') || hostname.includes('instagr.am')) {
      return 'instagram';
    }
    if (hostname.includes('facebook.com') || hostname.includes('fb.watch') || hostname.includes('fb.com')) {
      return 'facebook';
    }
    if (hostname.includes('twitter.com') || hostname.includes('x.com') || hostname.includes('t.co')) {
      return 'twitter';
    }
    if (hostname.includes('tiktok.com') || hostname.includes('vt.tiktok.com')) {
      return 'tiktok';
    }
    if (hostname.includes('reddit.com') || hostname.includes('redd.it')) {
      return 'reddit';
    }
    if (hostname.includes('pinterest.com') || hostname.includes('pin.it')) {
      return 'pinterest';
    }
    if (hostname.includes('threads.net')) {
      return 'threads';
    }
    if (hostname.includes('vimeo.com')) {
      return 'vimeo';
    }
    if (hostname.includes('dailymotion.com') || hostname.includes('dai.ly')) {
      return 'dailymotion';
    }
    return 'generic';
  } catch {
    return 'generic';
  }
}
