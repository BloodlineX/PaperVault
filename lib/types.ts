export type Branch = 'Common' | 'IT' | 'Civil' | 'Mechanical';
export type PaperType = 'End-Sem' | 'Class Test';
export type PaperStatus = 'pending' | 'approved';

export type Subject = {
  id: string;
  code: string;
  name: string;
  branch: Branch;
  semester: number;
};

export type Paper = {
  id: string;
  subject_id: string;
  year: number;
  type: PaperType;
  file_path: string;
  uploader_id: string;
  uploader_name: string;
  status: PaperStatus;
  created_at: string;
};

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  is_admin: boolean;
};
