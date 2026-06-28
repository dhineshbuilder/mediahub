import { Provider } from './provider.interface';
import { YouTubeProvider } from './youtube.provider';
import { InstagramProvider } from './instagram.provider';
import { FacebookProvider } from './facebook.provider';
import { TwitterProvider } from './twitter.provider';
import { TikTokProvider } from './tiktok.provider';
import { RedditProvider } from './reddit.provider';
import { PinterestProvider } from './pinterest.provider';
import { ThreadsProvider } from './threads.provider';
import { VimeoProvider } from './vimeo.provider';
import { DailymotionProvider } from './dailymotion.provider';
import { GenericProvider } from './generic.provider';

export class ProviderFactory {
  private static providers: Provider[] = [
    new YouTubeProvider(),
    new InstagramProvider(),
    new FacebookProvider(),
    new TwitterProvider(),
    new TikTokProvider(),
    new RedditProvider(),
    new PinterestProvider(),
    new ThreadsProvider(),
    new VimeoProvider(),
    new DailymotionProvider(),
  ];

  private static genericProvider = new GenericProvider();

  public static getProvider(url: string): Provider {
    for (const provider of this.providers) {
      if (provider.canHandle(url)) {
        return provider;
      }
    }
    return this.genericProvider;
  }
}
export default ProviderFactory;
