import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/actions';
import Sidebar from '@/components/navigation/Sidebar';
import BottomBar from '@/components/navigation/BottomBar';

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-[#070A13] flex text-slate-100 pb-16 md:pb-0 overflow-x-hidden">
      <Sidebar />
      <main className="flex-1 min-h-screen min-w-0 md:pl-64 flex flex-col">
        <div className="w-full flex-grow">{children}</div>
      </main>
      <BottomBar />
    </div>
  );
}