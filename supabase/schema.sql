-- PaperVault database schema
-- Run this once in Supabase: Dashboard -> SQL Editor -> New query -> paste this whole file -> Run

-- ============================================================
-- 1. PROFILES  (one row per user, created automatically on signup)
-- ============================================================
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users can read all profiles"
  on profiles for select
  to authenticated
  using (true);

create policy "Users can update their own profile"
  on profiles for update
  to authenticated
  using (auth.uid() = id);

-- Automatically create a profile row whenever someone signs up.
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- To make yourself an admin after you sign up once, run in SQL Editor:
--   update profiles set is_admin = true where email = 'you@yourcollege.ac.in';

-- ============================================================
-- 2. SUBJECTS  (fixed catalogue — only admins add/edit these)
-- ============================================================
create table if not exists subjects (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  branch text not null check (branch in ('Common', 'IT', 'Civil', 'Mechanical')),
  semester int not null check (semester between 1 and 8)
);

alter table subjects enable row level security;

create policy "Anyone signed in can read subjects"
  on subjects for select
  to authenticated
  using (true);

create policy "Only admins can modify subjects"
  on subjects for all
  to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and is_admin = true))
  with check (exists (select 1 from profiles where id = auth.uid() and is_admin = true));

-- ============================================================
-- 3. PAPERS  (the actual uploaded question papers)
-- ============================================================
create table if not exists papers (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references subjects(id) on delete cascade,
  year int not null,
  type text not null check (type in ('End-Sem', 'Class Test')),
  file_path text not null,          -- path inside the 'papers' storage bucket
  uploader_id uuid not null references auth.users(id) on delete cascade,
  uploader_name text not null,
  status text not null default 'pending' check (status in ('pending', 'approved')),
  created_at timestamptz not null default now()
);

alter table papers enable row level security;

-- Everyone can see approved papers, and their own pending uploads, and
-- admins can see everything (needed for the review queue).
create policy "Read approved papers, own pending papers, or all as admin"
  on papers for select
  to authenticated
  using (
    status = 'approved'
    or uploader_id = auth.uid()
    or exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

create policy "Signed-in users can upload a paper"
  on papers for insert
  to authenticated
  with check (uploader_id = auth.uid() and status = 'pending');

create policy "Only admins can approve, reject, or edit papers"
  on papers for update
  to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));

create policy "Admins can delete papers, uploaders can delete their own pending upload"
  on papers for delete
  to authenticated
  using (
    (uploader_id = auth.uid() and status = 'pending')
    or exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

-- ============================================================
-- 4. STORAGE  (the PDF files themselves)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('papers', 'papers', false)
on conflict (id) do nothing;

-- Any signed-in user can upload into the bucket. Reading a specific file is
-- gated in the app layer: PaperVault only ever generates a signed URL for a
-- file after checking the matching `papers` row is approved (or the viewer
-- is the uploader/an admin) — see app/subject/[id]/page.tsx.
create policy "Signed-in users can upload paper files"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'papers');

create policy "Signed-in users can read paper files"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'papers');

-- ============================================================
-- 5. SEED DATA  — subjects for IT, Civil, and Mechanical, sem 1-8
-- ============================================================
INSERT INTO subjects (code, name, branch, semester) VALUES
  ('GEN101', 'Engineering Mathematics-1', 'Common', 1),
  ('GEN102', 'Engineering Physics / Engineering Chemistry', 'Common', 1),
  ('GEN103', 'Basic Electrical Engineering / Programming for Problem Solving', 'Common', 1),
  ('GEN104', 'Fundamentals of Mechanical Engineering', 'Common', 1),
  ('GEN105', 'Soft Skills', 'Common', 1),
  ('GEN201', 'Engineering Mathematics-2', 'Common', 2),
  ('GEN202', 'Engineering Chemistry / Engineering Physics', 'Common', 2),
  ('GEN203', 'Programming for Problem Solving / Basic Electrical Engineering', 'Common', 2),
  ('GEN204', 'Fundamentals of Mechanical Engineering', 'Common', 2),
  ('GEN205', 'Environment and Ecology', 'Common', 2),
  ('IT301', 'Engineering Mathematics-3', 'IT', 3),
  ('IT302', 'Data Structures', 'IT', 3),
  ('IT303', 'Computer Organization and Architecture', 'IT', 3),
  ('IT304', 'Discrete Mathematics', 'IT', 3),
  ('IT305', 'Digital Electronics', 'IT', 3),
  ('IT306', 'Cyber Security / Universal Human Values', 'IT', 3),
  ('IT401', 'Technical Communication', 'IT', 4),
  ('IT402', 'Operating Systems', 'IT', 4),
  ('IT403', 'Theory of Automata and Formal Languages (TAFL)', 'IT', 4),
  ('IT404', 'Object-Oriented Programming', 'IT', 4),
  ('IT405', 'Software Engineering', 'IT', 4),
  ('IT406', 'Universal Human Values / Cyber Security', 'IT', 4),
  ('IT501', 'Database Management Systems (DBMS)', 'IT', 5),
  ('IT502', 'Computer Networks', 'IT', 5),
  ('IT503', 'Design and Analysis of Algorithms (DAA)', 'IT', 5),
  ('IT504', 'Departmental Elective-1', 'IT', 5),
  ('IT505', 'Open Elective-1', 'IT', 5),
  ('IT601', 'Compiler Design', 'IT', 6),
  ('IT602', 'Software Testing', 'IT', 6),
  ('IT603', 'Wireless & Mobile Communication', 'IT', 6),
  ('IT604', 'Departmental Elective-2', 'IT', 6),
  ('IT605', 'Open Elective-2', 'IT', 6),
  ('IT701', 'Artificial Intelligence', 'IT', 7),
  ('IT702', 'Departmental Elective-3', 'IT', 7),
  ('IT703', 'Departmental Elective-4', 'IT', 7),
  ('IT704', 'Open Elective-3', 'IT', 7),
  ('IT801', 'Departmental Elective-5', 'IT', 8),
  ('IT802', 'Open Elective-4', 'IT', 8),
  ('CE301', 'Engineering Mathematics-3', 'Civil', 3),
  ('CE302', 'Engineering Mechanics', 'Civil', 3),
  ('CE303', 'Surveying and Geomatics', 'Civil', 3),
  ('CE304', 'Fluid Mechanics', 'Civil', 3),
  ('CE305', 'Materials, Testing and Construction Management', 'Civil', 3),
  ('CE306', 'Cyber Security / Universal Human Values', 'Civil', 3),
  ('CE401', 'Technical Communication', 'Civil', 4),
  ('CE402', 'Applied Hydraulics', 'Civil', 4),
  ('CE403', 'Structural Analysis', 'Civil', 4),
  ('CE404', 'Engineering Geology & Building Planning', 'Civil', 4),
  ('CE405', 'Disaster Management', 'Civil', 4),
  ('CE406', 'Universal Human Values / Cyber Security', 'Civil', 4),
  ('CE501', 'Geotechnical Engineering', 'Civil', 5),
  ('CE502', 'Design of Concrete Structures', 'Civil', 5),
  ('CE503', 'Environmental Engineering-1', 'Civil', 5),
  ('CE504', 'Departmental Elective-1', 'Civil', 5),
  ('CE505', 'Open Elective-1', 'Civil', 5),
  ('CE601', 'Design of Steel Structures', 'Civil', 6),
  ('CE602', 'Transportation Engineering', 'Civil', 6),
  ('CE603', 'Environmental Engineering-2', 'Civil', 6),
  ('CE604', 'Departmental Elective-2', 'Civil', 6),
  ('CE605', 'Open Elective-2', 'Civil', 6),
  ('CE701', 'Water Resources Engineering', 'Civil', 7),
  ('CE702', 'Departmental Elective-3', 'Civil', 7),
  ('CE703', 'Departmental Elective-4', 'Civil', 7),
  ('CE704', 'Open Elective-3', 'Civil', 7),
  ('CE801', 'Departmental Elective-5', 'Civil', 8),
  ('CE802', 'Open Elective-4', 'Civil', 8),
  ('ME301', 'Engineering Mathematics-3', 'Mechanical', 3),
  ('ME302', 'Thermodynamics', 'Mechanical', 3),
  ('ME303', 'Applied Thermodynamics', 'Mechanical', 3),
  ('ME304', 'Strength of Materials', 'Mechanical', 3),
  ('ME305', 'Engineering Materials', 'Mechanical', 3),
  ('ME306', 'Cyber Security / Universal Human Values', 'Mechanical', 3),
  ('ME401', 'Technical Communication', 'Mechanical', 4),
  ('ME402', 'Fluid Mechanics & Fluid Machines', 'Mechanical', 4),
  ('ME403', 'Manufacturing Processes', 'Mechanical', 4),
  ('ME404', 'Kinematics of Machines', 'Mechanical', 4),
  ('ME405', 'Theory of Machines', 'Mechanical', 4),
  ('ME406', 'Universal Human Values / Cyber Security', 'Mechanical', 4),
  ('ME501', 'Heat & Mass Transfer', 'Mechanical', 5),
  ('ME502', 'Design of Machine Elements', 'Mechanical', 5),
  ('ME503', 'Dynamics of Machines', 'Mechanical', 5),
  ('ME504', 'Departmental Elective-1', 'Mechanical', 5),
  ('ME505', 'Open Elective-1', 'Mechanical', 5),
  ('ME601', 'Refrigeration & Air Conditioning (RAC)', 'Mechanical', 6),
  ('ME602', 'Computer Aided Design & Manufacturing (CAD/CAM)', 'Mechanical', 6),
  ('ME603', 'Industrial Engineering', 'Mechanical', 6),
  ('ME604', 'Departmental Elective-2', 'Mechanical', 6),
  ('ME605', 'Open Elective-2', 'Mechanical', 6),
  ('ME701', 'Automation & Robotics', 'Mechanical', 7),
  ('ME702', 'Departmental Elective-3', 'Mechanical', 7),
  ('ME703', 'Departmental Elective-4', 'Mechanical', 7),
  ('ME704', 'Open Elective-3', 'Mechanical', 7),
  ('ME801', 'Power Plant Engineering / Elective', 'Mechanical', 8),
  ('ME802', 'Open Elective-4', 'Mechanical', 8);
