import { IssueDetail } from "@/components/IssueDetail/IssueDetail";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function IssueDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <IssueDetail issueId={id} />;
}
