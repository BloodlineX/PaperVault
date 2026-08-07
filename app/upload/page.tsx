'use client';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Subject } from '@/lib/types';

const BRANCHES = ['IT', 'Civil', 'Mechanical', 'Common'];

export default function UploadPage() {
  return (
    <Suspense fallback={<div className="empty-state"><p>Loading...</p></div>}>
      <UploadForm />
    </Suspense>
  );
}

function UploadForm() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [branch, setBranch] = useState('IT');
  const [semester, setSemester] = useState(1);
  const [subjectId, setSubjectId] = useState('');
  const [type, setType] = useState<'End/Odd-Sem' | 'Class Test'>('End/Odd-Sem');
  const [year, setYear] = useState(new Date().getFullYear());
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setCheckingAuth(false);

      const { data: subjectRows } = await supabase.from('subjects').select('*').order('code');
      setSubjects((subjectRows as Subject[]) ?? []);

      const preselect = searchParams.get('subject');
      if (preselect) {
        const match = (subjectRows as Subject[] | null)?.find((s) => s.id === preselect);
        if (match) {
          setSubjectId(match.id);
          setBranch(match.branch === 'Common' ? 'IT' : match.branch);
          setSemester(match.semester);
        }
      }
    }
    init();
  }, [supabase, router, searchParams]);

  const visibleSubjects = subjects.filter(
    (s) => s.semester === semester && (s.branch === branch || s.branch === 'Common')
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!subjectId) { setError('Pick a subject first.'); return; }
    if (!file) { setError('Choose a PDF to upload.'); return; }
    if (file.type !== 'application/pdf') { setError('Only PDF files are accepted.'); return; }

    setBusy(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('You need to be signed in.'); setBusy(false); return; }

    const { data: profileRow } = await supabase.from('profiles').select('full_name, email').eq('id', user.id).single();
    const uploaderName = profileRow?.full_name || profileRow?.email || 'Unknown';

    const path = `${subjectId}/${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from('papers').upload(path, file);
    if (uploadError) { setError(uploadError.message); setBusy(false); return; }

    const { error: insertError } = await supabase.from('papers').insert({
      subject_id: subjectId,
      year,
      type,
      file_path: path,
      uploader_id: user.id,
      uploader_name: uploaderName,
    });

    setBusy(false);
    if (insertError) { setError(insertError.message); return; }

    router.push(`/subject/${subjectId}`);
  }

  if (checkingAuth) return <div className="empty-state"><p>Checking sign-in...</p></div>;

  return (
    <div className="sem-panel form-card" style={{ marginTop: 30 }}>
      <h2 style={{ fontFamily: 'var(--font-display)', marginTop: 0 }}>Upload a paper</h2>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)', marginTop: -8 }}>
        Goes to the review queue before it&apos;s visible to everyone
      </p>

      {error && <div className="form-error">{error}</div>}

      <form onSubmit={handleSubmit} className="form-grid">
        <div className="form-group">
          <label>Branch</label>
          <select value={branch} onChange={(e) => { setBranch(e.target.value); setSubjectId(''); }}>
            {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Semester</label>
          <select value={semester} onChange={(e) => { setSemester(Number(e.target.value)); setSubjectId(''); }}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <option key={n} value={n}>Semester {n}</option>)}
          </select>
        </div>
        <div className="form-group full">
          <label>Subject</label>
          <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            <option value="">Select subject...</option>
            {visibleSubjects.map((s) => (
              <option key={s.id} value={s.id}>{s.code} — {s.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group full">
          <label>Paper type</label>
          <div className="type-radio-group">
            <div className={`type-radio ${type === 'End-Sem' ? 'selected' : ''}`} onClick={() => setType('End-Sem')}>End-Sem</div>
            <div className={`type-radio ${type === 'Class Test' ? 'selected' : ''}`} onClick={() => setType('Class Test')}>Class Test</div>
          </div>
        </div>
        <div className="form-group">
          <label>Year</label>
          <input type="number" value={year} min={2015} max={2030} onChange={(e) => setYear(Number(e.target.value))} />
        </div>
        <div className="form-group">
          <label>File (PDF)</label>
          <input
            type="file"
            accept="application/pdf"
            style={{ display: 'none' }}
            id="fileInput"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <label htmlFor="fileInput" className={`file-drop ${file ? 'has-file' : ''}`} style={{ cursor: 'pointer' }}>
            {file ? `📄 ${file.name}` : 'Click to choose a PDF'}
          </label>
        </div>
        <div className="form-group full">
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? 'Uploading...' : 'Submit for review'}
          </button>
        </div>
      </form>
    </div>
  );
}
