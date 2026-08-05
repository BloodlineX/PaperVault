'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { semStyle } from '@/lib/semesterColors';
import type { Paper, Profile, Subject } from '@/lib/types';

export default function SubjectDetailPage() {
  const supabase = createClient();
  const params = useParams();
  const router = useRouter();
  const subjectId = params.id as string;

  const [subject, setSubject] = useState<Subject | null>(null);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadAll() {
    const { data: subjectRow } = await supabase.from('subjects').select('*').eq('id', subjectId).single();
    setSubject(subjectRow as Subject);

    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id ?? null);

    if (user) {
      const { data: profileRow } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(profileRow as Profile);
    }

    const { data: paperRows } = await supabase
      .from('papers')
      .select('*')
      .eq('subject_id', subjectId)
      .order('year', { ascending: false });
    setPapers((paperRows as Paper[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, [subjectId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function viewPaper(p: Paper) {
    const { data, error } = await supabase.storage.from('papers').createSignedUrl(p.file_path, 60 * 5);
    if (error || !data) { alert('Could not open the file — it may have been removed.'); return; }
    window.open(data.signedUrl, '_blank');
  }

  async function approve(p: Paper) {
    await supabase.from('papers').update({ status: 'approved' }).eq('id', p.id);
    loadAll();
  }

  async function reject(p: Paper) {
    if (!confirm('Reject and delete this submission?')) return;
    await supabase.storage.from('papers').remove([p.file_path]);
    await supabase.from('papers').delete().eq('id', p.id);
    loadAll();
  }

  if (loading) return <div className="empty-state"><p>Loading...</p></div>;
  if (!subject) return <div className="empty-state"><h3>Subject not found</h3></div>;

  const isAdmin = profile?.is_admin ?? false;

  return (
    <div style={semStyle(subject.semester)}>
      <button className="btn btn-ghost" style={{ marginBottom: 14 }} onClick={() => router.push('/')}>
        &larr; Back to browse
      </button>

      <div className="sem-panel">
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, margin: '0 0 3px', color: 'var(--sc-dark)' }}>
          {subject.name}
        </h2>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)', marginBottom: 18 }}>
          {subject.code} &middot; Semester {subject.semester} &middot; {subject.branch}
        </div>

        {papers.length ? (
          <div className="ledger">
            {papers.map((p, i) => (
              <div key={p.id} className={`ledger-row ${i % 2 === 1 ? 'alt' : ''}`}>
                <span className="ledger-year">{p.year}</span>
                <span className={`type-badge ${p.type === 'End-Sem' ? 'type-endsem' : 'type-classtest'}`}>
                  {p.type.toUpperCase()}
                </span>
                <span className="uploader">{p.uploader_name}</span>
                {p.status === 'approved' ? (
                  <span className="stamp stamp-approved">APPROVED</span>
                ) : (
                  <span className="stamp stamp-pending">PENDING</span>
                )}
                {isAdmin && p.status === 'pending' ? (
                  <div className="row-actions">
                    <button className="icon-btn icon-approve" onClick={() => approve(p)} title="Approve">&#10003;</button>
                    <button className="icon-btn icon-reject" onClick={() => reject(p)} title="Reject">&#10005;</button>
                  </div>
                ) : (
                  <a className="view-link" onClick={() => viewPaper(p)}>View</a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>No papers yet</h3>
            <p>Be the first to upload one for {subject.code}.</p>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
          {userId ? (
            <Link href={`/upload?subject=${subject.id}`} className="btn btn-primary">
              + Upload for this subject
            </Link>
          ) : (
            <Link href="/login" className="btn btn-primary">Sign in to upload</Link>
          )}
        </div>
      </div>
    </div>
  );
}
