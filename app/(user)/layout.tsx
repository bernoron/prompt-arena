import Navigation from '@/components/Navigation';
import FeedbackButton from '@/components/FeedbackButton';
import OnboardingFunnel from '@/components/OnboardingFunnel';
import { SessionProvider } from '@/components/SessionProvider';
import { getSessionUser } from '@/lib/session';

// @spec AC-11-001
export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  return (
    <SessionProvider user={user}>
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {children}
      </main>
      <FeedbackButton />
      <OnboardingFunnel />
    </SessionProvider>
  );
}
