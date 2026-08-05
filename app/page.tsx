'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { semStyle } from '@/lib/semesterColors';
import type { Subject } from '@/lib/types';

export default function BrowsePage() {
  const supabase = createClient();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [approvedCounts, setApprovedCounts] = useState<Record<string, number>>({});
  const [semester, setSemester] = useState(1);
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: subjectRows } = await supabase.from('subjects').select('*').order('code');
      const { data: paperRows } = await supabase.from('papers').select('subject_id').eq('status', 'approved');

      setSubjects((subjectRows as Subject[]) ?? []);

      const counts: Record<string, number> = {};
      (paperRows ?? []).forEach((p: { subject_id: string }) => {
        counts[p.subject_id] = (counts[p.subject_id] ?? 0) + 1;
      });
      setApprovedCounts(counts);
      setLoading(false);
    }
    load();
  }, [supabase]);

  const branches = useMemo(
    () => ['all', ...Array.from(new Set(subjects.map((s) => s.branch)))],
    [subjects]
  );

  const filtered = subjects.filter((s) => {
    if (s.semester !== semester) return false;
    if (branchFilter !== 'all' && s.branch !== branchFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!s.name.toLowerCase().includes(q) && !s.code.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div>
      <div className="toolbar">
        <div className="search-box">
          <span className="search-icon">&#128269;</span>
          <input
            type="text"
            placeholder="Search subject name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
        >
          {branches.map((b) => (
            <option key={b} value={b}>{b === 'all' ? 'All branches' : b}</option>
          ))}
        </select>
      </div>

      <div className="sem-tabs">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
          <div
            key={n}
            className={`sem-tab ${semester === n ? 'active' : ''}`}
            style={semStyle(n)}
            onClick={() => setSemester(n)}
          >
            SEM {n}
          </div>
        ))}
      </div>

      <div className="sem-panel" style={semStyle(semester)}>
        {loading ? (
          <div className="empty-state"><p>Loading subjects...</p></div>
        ) : filtered.length ? (
          <div className="subject-grid">
            {filtered.map((s) => (
              <Link key={s.id} href={`/subject/${s.id}`} className="subject-card" style={semStyle(s.semester)}>
                <div className="subject-code">{s.code}</div>
                <div className="subject-name">{s.name}</div>
                <div className="subject-rule" />
                <div className="subject-meta">
                  <span className="paper-count">
                    {approvedCounts[s.id] ?? 0} paper{(approvedCounts[s.id] ?? 0) === 1 ? '' : 's'}
                  </span>
                  <span className="branch-chip">{s.branch}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>No subjects here yet</h3>
            <p>Try another semester or branch, or be the first to upload a paper for this one.</p>
          </div>
        )}
      </div>
    </div>
  );
}
