import EmptyState from "../components/EmptyState";

export default function ApprovalsPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Approvals</h2>
      <EmptyState
        title="No Pending Approvals"
        description="When the Hub requires your approval for an action, it will show up here for review."
      />
    </div>
  );
}
