'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';

export default function Header() {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (active) { setProfile(null); setLoading(false); }
        return;
      }
      const { data: profileRow } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (!active) return;
      setProfile(profileRow as Profile);
      setLoading(false);

      if (profileRow?.is_admin) {
        const { count } = await supabase
          .from('papers')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');
        if (active) setPendingCount(count ?? 0);
      }
    }

    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, [supabase]);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  return (
    <div className="topbar">
      <Link href="/" className="brand">
        <div className="brand-mark"><span>PV</span></div>
        <div className="brand-text">
          <h1>PaperVault</h1>
          <p>Previous year papers &amp; class tests</p>
        </div>
      </Link>
      <div className="header-actions">
        {loading ? null : profile ? (
          <>
            {profile.is_admin && (
              <Link href="/admin" className="btn btn-ghost">
                Review queue
                {pendingCount > 0 && <span className="queue-count">{pendingCount}</span>}
              </Link>
            )}
            <Link href="/upload" className="btn btn-primary">+ Upload paper</Link>
            <button onClick={signOut} className="btn btn-ghost">Sign out</button>
          </>
        ) : (
          <Link href="/login" className="btn btn-primary">Sign in</Link>
        )}
      </div>
    </div>
  );
}
