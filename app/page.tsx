export default function Home() {
  return (
    <div className="space-y-8">
      {/* Chat Input Panel */}
      <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Chat</h2>
        <div className="flex flex-col space-y-4">
          <textarea
            className="w-full min-h-[120px] p-4 text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-y"
            placeholder="Type your message to Diviora Hub..."
          />
          <div className="flex justify-end">
            <button
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              type="submit"
            >
              Submit
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Latest Proposal Placeholder */}
        <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Latest Proposal</h2>
          <div className="flex flex-col items-center justify-center min-h-[200px] text-gray-400 border-2 border-dashed border-gray-100 rounded-lg">
            <p className="text-sm">No proposal to display yet</p>
          </div>
        </section>

        {/* Timeline Placeholder */}
        <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h2>
          <div className="flex flex-col items-center justify-center min-h-[200px] text-gray-400 border-2 border-dashed border-gray-100 rounded-lg">
            <p className="text-sm">No activity recorded yet</p>
          </div>
        </section>
      </div>
    </div>
  );
}
