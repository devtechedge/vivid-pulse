import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/actions';

export default async function IndexPage() {
  const currentUser = await getCurrentUser();

  if (currentUser) {
    redirect('/feed');
  } else {
    redirect('/login');
  }
}
