'use client';

import { getPolicies } from '../../lib/policy';

export default function PoliciesPage() {
  const policies = getPolicies();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Policy Engine</h1>
        <p className="text-gray-600">
          The following policies govern actions in the Diviora Console. All policies are deterministic and evaluated locally.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Policies</h2>
          <div className="space-y-4">
            {policies.map((policy) => (
              <div key={policy.id} className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm font-bold text-blue-600">{policy.id}</span>
                </div>
                <p className="text-gray-700 text-sm">{policy.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Policy Enforcement</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• All policies are evaluated before actions execute</li>
          <li>• If any policy denies an action, it will be blocked</li>
          <li>• Policy violations are shown inline with clear reasons</li>
          <li>• Policies are fail-closed: errors result in denial</li>
        </ul>
      </div>
    </div>
  );
}
