# PaperVault

A previous-year-question-paper and class-test archive for your college — built with
Next.js and Supabase. Students browse by semester and subject; anyone can upload a
paper, and it only becomes visible to everyone once an admin approves it.

This is real, runnable source code — not a demo. Follow the steps below and you'll
have it live on the internet, for free, in about 15 minutes.

---

## 1. Create a Supabase project (free)

1. Go to https://supabase.com → **New project**.
2. Pick a name, a database password (save it somewhere), and a region close to your
   college.
3. Wait ~2 minutes for it to spin up.

## 2. Set up the database

1. In your Supabase project, open **SQL Editor** → **New query**.
2. Open `supabase/schema.sql` from this folder, copy the whole file, paste it in, and
   click **Run**.
3. This creates all the tables, security rules, the file storage bucket, and seeds it
   with the full subject list for IT, Civil, and Mechanical (semesters 1–8).

## 3. Get your API keys

1. In Supabase: **Settings → API**.
2. Copy the **Project URL** and the **anon public** key.

## 4. Configure the app

1. In this folder, copy `.env.local.example` to a new file named `.env.local`.
2. Paste in your Project URL and anon key.
3. Set `NEXT_PUBLIC_COLLEGE_EMAIL_DOMAIN` to your college's email domain (e.g.
   `mycollege.ac.in`) so only students with that email can sign up. Leave it blank to
   allow any email — not recommended once this is live.

## 5. Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 — you should see PaperVault, empty of papers but full of
subjects.

## 6. Make yourself an admin

1. On the running site, sign up for an account with your college email.
2. Check your email and confirm it (Supabase sends a confirmation link by default —
   you can turn this off in **Authentication → Providers → Email → Confirm email**
   if you'd rather skip it during testing).
3. Back in Supabase **SQL Editor**, run:
   ```sql
   update profiles set is_admin = true where email = 'you@yourcollege.ac.in';
   ```
4. Sign in on the site — you should now see a **Review queue** link in the header.

## 7. Try the full flow

1. Sign in as a normal (non-admin) test account, or just use your admin account.
2. Click **+ Upload paper**, pick a subject, choose a PDF, submit.
3. It's now `pending` — invisible to everyone except you and admins.
4. As an admin, open **Review queue**, click the check mark. It's now visible to
   everyone browsing that subject.

## 8. Deploy it for real (free)

1. Push this folder to a GitHub repository.
2. Go to https://vercel.com → **New Project** → import that repo.
3. In the Vercel project settings, add the same three environment variables from your
   `.env.local` file.
4. Deploy. You'll get a live URL (e.g. `papervault-yourname.vercel.app`) — share that
   with your college.

---

## How the approval flow works

There's no separate "request approval" step — uploading *is* the request:

1. A student uploads a paper → it's saved with `status = 'pending'`.
2. It's invisible to everyone except the uploader and admins.
3. It shows up automatically in the admin's **Review queue**.
4. Approve → visible to everyone. Reject → deleted, including the file.

## Adding more admins

Repeat the SQL from step 6 with a different email. There's no UI for this yet by
design — keeping admin promotion to direct database access is a reasonable safeguard
for a small college deployment.

## Editing the subject list

Subjects live in the `subjects` table, not in the code. To add, rename, or remove a
subject, either run SQL directly in the Supabase SQL Editor, or (once you're
comfortable with Supabase) build a small admin screen for it — the RLS policies
already restrict subject changes to admins only.

## A note on the subject codes

The course codes seeded in `schema.sql` (e.g. `IT501`, `CE403`) are ones I generated
for display purposes, not verified official university codes. The subject *names*
match what you gave me. If your department has official course codes, updating them
is a one-line SQL `update` per subject.

## Project structure

```
app/
  page.tsx              Browse page (semester tabs, search, subject grid)
  subject/[id]/page.tsx Subject detail — paper ledger, view/approve/reject
  upload/page.tsx        Upload form
  admin/page.tsx         Review queue (admin only)
  login/page.tsx          Sign in / sign up
  layout.tsx, globals.css App shell and all styling
components/
  Header.tsx              Top navigation, auth-aware
lib/
  supabase/client.ts       Browser Supabase client
  supabase/server.ts       Server Supabase client
  semesterColors.ts        The 8-colour semester palette
  types.ts                 Shared TypeScript types
supabase/
  schema.sql              Full database schema + seed data — run this first
middleware.ts              Keeps login sessions fresh
```
