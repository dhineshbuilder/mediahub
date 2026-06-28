'use client';

import Navbar from '../../components/Navbar';
import DownloaderWizard from '../../components/DownloaderWizard';
import Footer from '../../components/Footer';

export default function DownloaderPage() {
  return (
    <div className="flex flex-col min-h-screen text-white transition-colors duration-300">
      {/* Upgraded unified Navigation */}
      <Navbar />

      {/* Main Tool Content Area */}
      <main className="flex-1 flex flex-col justify-center items-center py-10">
        <DownloaderWizard />
      </main>

      {/* Shared Footer */}
      <Footer />
    </div>
  );
}
