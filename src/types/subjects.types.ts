export type SubjectResourceType =
  | "QUESTIONBANK"
  | "KEY_CONCEPTS"
  | "PRACTICE_EXAMS"
  | "PAST_PAPERS"
  | "BOOTCAMPS"
  | "FLASHCARDS"
  | "PAPER_3"
  | "OTHER";

export interface SubjectMenuResource {
  id: string;
  title: string;
  slug: string;
  resourceType: SubjectResourceType | string;
  href?: string | null;
  order: number;
  isActive: boolean;
}

export interface SubjectMenuProgram {
  id: string;
  name: string;
  slug: string;
  order: number;
  isActive: boolean;
  resources: SubjectMenuResource[];
}

export interface SubjectMenuSubject {
  id: string;
  name: string;
  slug: string;
  iconName?: string | null;
  order: number;
  isActive: boolean;
  programs: SubjectMenuProgram[];
  teachers?: {
    teacher: { id: string; name: string; email?: string | null; phone: string };
  }[];
}

export interface SubjectMenuCategory {
  id: string;
  name: string;
  slug: string;
  iconTone?: string | null;
  iconName?: string | null;
  order: number;
  isActive: boolean;
  subjects: SubjectMenuSubject[];
}

export type SubjectCategoryInput = {
  name: string;
  slug: string;
  iconTone?: string;
  iconName?: string;
  order?: number;
  isActive?: boolean;
};

export type SubjectInput = {
  categoryId: string;
  name: string;
  slug: string;
  iconName?: string;
  order?: number;
  isActive?: boolean;
};

export type SubjectProgramInput = {
  name: string;
  slug: string;
  order?: number;
  isActive?: boolean;
};

export type SubjectResourceInput = {
  title: string;
  slug: string;
  resourceType?: SubjectResourceType;
  href?: string;
  order?: number;
  isActive?: boolean;
};
