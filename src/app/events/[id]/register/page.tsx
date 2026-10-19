import { redirect } from 'next/navigation';

export default async function EventRegisterRedirect({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/register?event=${id}`);
}
