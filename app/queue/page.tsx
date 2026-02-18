'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AuthorityQueueWorkbench } from '../components/queue/AuthorityQueueWorkbench';
import { deriveAuthorityItems } from '@/lib/authority_queue';
import { useStore } from '@/lib/store';

export default function QueuePage() {
  const { state, setAgentPackStatus, createDispatch } = useStore();
  const router = useRouter();

  const items = useMemo(
    () => deriveAuthorityItems(state.agentPacks, state.projectSnapshots, state.proposals, state.dispatchRecords),
    [state.agentPacks, state.projectSnapshots, state.proposals, state.dispatchRecords]
  );

  const packsById = useMemo(
    () => Object.fromEntries(state.agentPacks.map((pack) => [pack.pack_id, pack])),
    [state.agentPacks]
  );

  const onDispatch = async (pack_id: string) => {
    const dispatchId = await createDispatch(pack_id, 'manual_export');
    router.push(`/dispatch/${dispatchId}`);
  };

  if (!state.isLoaded) {
    return <div className="h-32 animate-pulse rounded-xl bg-gray-100" />;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Authority Queue</h1>
      <AuthorityQueueWorkbench items={items} packsById={packsById} onSetStatus={setAgentPackStatus} onDispatch={onDispatch} />
    </div>
  );
}
