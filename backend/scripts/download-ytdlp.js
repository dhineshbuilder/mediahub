const fs = require('fs');
const path = require('path');
const https = require('https');

const binDir = path.join(__dirname, '..', 'bin');
const isWin = process.platform === 'win32';
const filename = isWin ? 'yt-dlp.exe' : 'yt-dlp';
const filePath = path.join(binDir, filename);

// URL for the latest official release
const url = isWin
  ? 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe'
  : 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';

function downloadFile(downloadUrl) {
  return new Promise((resolve, reject) => {
    https.get(downloadUrl, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Handle redirect
        downloadFile(response.headers.location).then(resolve).catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: Server responded with ${response.statusCode}`));
        return;
      }

      const fileStream = fs.createWriteStream(filePath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        if (!isWin) {
          fs.chmodSync(filePath, '755'); // Make executable on Linux/macOS
        }
        console.log(`✅ yt-dlp binary successfully saved to ${filePath}`);
        resolve();
      });

      fileStream.on('error', (err) => {
        fs.unlink(filePath, () => {});
        reject(err);
      });
    }).on('error', reject);
  });
}

async function main() {
  try {
    const shouldRefreshExistingBinary =
      process.env.RENDER === 'true' ||
      process.env.NODE_ENV === 'production' ||
      process.env.FORCE_YTDLP_DOWNLOAD === 'true';

    if (fs.existsSync(filePath) && !shouldRefreshExistingBinary) {
      console.log(`ℹ️ yt-dlp binary already exists at ${filePath}. Skipping download.`);
      return;
    }

    if (!fs.existsSync(binDir)) {
      fs.mkdirSync(binDir, { recursive: true });
    }

    console.log(`📥 Downloading yt-dlp for ${process.platform} from official source...`);
    await downloadFile(url);
  } catch (error) {
    console.error(`❌ Failed to set up yt-dlp: ${error.message}`);
    process.exit(1);
  }
}

main();
