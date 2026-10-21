import { redirect } from 'next/navigation';

export default function PassRedirect() {
  redirect('/register?lookup=1');
}
