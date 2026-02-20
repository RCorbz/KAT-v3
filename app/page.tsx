import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect the root URL to the main funnel front-door
  redirect('/get-my-card');
}
