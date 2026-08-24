import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/actions';
import Sidebar from '@/components/navigation/Sidebar';
import BottomBar from '@/components/navigation/BottomBar';

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const currentUser = await getCurrentUser();

  // Route protection - Force redirect to login if session token is missing or corrupted
  if (!currentUser) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-[#070A13] flex text-slate-100 pb-16 md:pb-0">
      
      {/* Persistent Desktop Sidebar */}
      <Sidebar />

      {/* Primary Scrollable Core Stage Content */}
      <main className="flex-1 min-h-screen md:pl-64 flex flex-col justify-between">
        <div className="w-full flex-grow">
          {children}
        </div>
      </main>

      {/* Persistent Mobile Bottom Action Bar */}
      <BottomBar />

    </div>
  );
}
