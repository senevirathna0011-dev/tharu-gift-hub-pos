import { redirect } from 'next/navigation';

export default function HomePage() {
  // Always redirect to Login on initial launch
  redirect('/login');
}
