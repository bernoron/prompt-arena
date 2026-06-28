import Navigation from '@/components/Navigation';
import FeedbackButton from '@/components/FeedbackButton';

// @spec AC-11-001
export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
      <FeedbackButton />
    </>
  );
}
