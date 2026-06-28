'use client';

import Navbar from '../../components/Navbar';
import SubtitleWizard from '../../components/SubtitleWizard';
import Footer from '../../components/Footer';

export default function CaptionPage() {
  return (
    <div className="flex flex-col min-h-screen text-white transition-colors duration-300">
      {/* Upgraded unified Navigation */}
      <Navbar />

      {/* Main Tool Content Area */}
      <main className="flex-1 flex flex-col justify-center items-center py-10">
        <SubtitleWizard />
      </main>

      {/* Shared Footer */}
      <Footer />
    </div>
  );
}
