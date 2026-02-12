import EmptyState from "../components/EmptyState";

export default function SettingsPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>
      <EmptyState
        title="Settings Unavailable"
        description="Configuration for Diviora Hub connection and application preferences will be available here soon."
      />
    </div>
  );
}
