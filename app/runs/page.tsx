import EmptyState from "../components/EmptyState";

export default function RunsPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Runs</h2>
      <EmptyState
        title="No Runs"
        description="History of all Hub executions will be listed here, including status and logs."
      />
    </div>
  );
}
