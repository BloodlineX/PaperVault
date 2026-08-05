'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { semStyle } from '@/lib/semesterColors';
import type { Paper, Subject } from '@/lib/types';

export default function AdminPage() {
  const supabase = createClient();
  const router = useRouter();
  const [pending, setPending] = useState<(Paper & { subject: Subject })[]>([]);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  async function loadQueue() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const { data: profileRow } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
    if (!profileRow?.is_admin) { router.push('/'); return; }
    setAllowed(true);

    const { data } = await supabase
      .from('papers')
      .select('*, subject:subjects(*)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    setPending((data as (Paper & { subject: Subject })[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { loadQueue(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function approve(p: Paper) {
    await supabase.from('papers').update({ status: 'approved' }).eq('id', p.id);
    loadQueue();
  }

  async function reject(p: Paper) {
    if (!confirm('Reject and delete this submission?')) return;
    await supabase.storage.from('papers').remove([p.file_path]);
    await supabase.from('papers').delete().eq('id', p.id);
    loadQueue();
  }

  if (loading || !allowed) return <div className="empty-state"><p>Loading...</p></div>;

  return (
    <div className="sem-panel" style={{ marginTop: 14, borderRadius: 10 }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, marginTop: 0 }}>Review queue</h2>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)', marginTop: -8 }}>
        {pending.length} submission{pending.length === 1 ? '' : 's'} waiting for approval
      </p>

      {pending.length ? (
        <div className="ledger">
          {pending.map((p, i) => (
            <div
              key={p.id}
              className={`ledger-row ${i % 2 === 1 ? 'alt' : ''}`}
              style={{ ...semStyle(p.subject.semester), gridTemplateColumns: '70px 100px 1fr auto auto auto' }}
            >
              <span className="ledger-year">{p.year}</span>
              <span className={`type-badge ${p.type === 'End-Sem' ? 'type-endsem' : 'type-classtest'}`}>
                {p.type.toUpperCase()}
              </span>
              <span className="uploader">
                {p.subject.code} &middot; {p.subject.name} &mdash; by {p.uploader_name} &middot; SEM {p.subject.semester}
              </span>
              <span className="stamp stamp-pending">PENDING</span>
              <div className="row-actions">
                <button className="icon-btn icon-approve" onClick={() => approve(p)} title="Approve">&#10003;</button>
                <button className="icon-btn icon-reject" onClick={() => reject(p)} title="Reject">&#10005;</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h3>Queue is clear</h3>
          <p>Nothing waiting for review right now.</p>
        </div>
      )}
    </div>
  );
}
