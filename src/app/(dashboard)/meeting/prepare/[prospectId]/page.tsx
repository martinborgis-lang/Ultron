import { MeetingPrepContent } from '@/components/meeting/MeetingPrepContent';

interface PageProps {
  params: Promise<{ prospectId: string }>;
}

export default async function MeetingPrepPage({ params }: PageProps) {
  const { prospectId } = await params;
  return <MeetingPrepContent prospectId={prospectId} />;
}
