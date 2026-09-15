export type LiveClassStatus = "SCHEDULED" | "LIVE" | "ENDED" | "CANCELLED";
export type LiveClassProvider = "ZOOM" | "GOOGLE_MEET" | "JITSI" | "OTHER";

export type LiveClassCourseRef = {
  id: string;
  title: string;
  slug: string;
  thumbnail?: string | null;
};

export type LiveClassHostRef = {
  id: string;
  name: string;
  avatar?: string | null;
};

export type LiveClass = {
  id: string;
  title: string;
  description?: string | null;
  provider: LiveClassProvider;
  joinUrl: string;
  hostUrl?: string | null;
  startsAt: string;
  endsAt: string;
  timezone: string;
  status: LiveClassStatus;
  recordingUrl?: string | null;
  isActive: boolean;
  courseId: string;
  hostId: string;
  course: LiveClassCourseRef;
  host: LiveClassHostRef;
  _count?: { attendance: number };
  createdAt?: string;
  updatedAt?: string;
};

export type StudentLiveClass = Omit<LiveClass, "hostUrl"> & {
  attended: boolean;
  canJoin: boolean;
  joinBlockedReason?: string | null;
};

export type CreateLiveClassInput = {
  courseId: string;
  title: string;
  description?: string;
  provider?: LiveClassProvider;
  joinUrl: string;
  hostUrl?: string;
  startsAt: string;
  endsAt: string;
  timezone?: string;
};

export type UpdateLiveClassInput = {
  title?: string;
  description?: string | null;
  provider?: LiveClassProvider;
  joinUrl?: string;
  hostUrl?: string | null;
  startsAt?: string;
  endsAt?: string;
  timezone?: string;
  status?: LiveClassStatus;
  recordingUrl?: string | null;
};

export type LiveClassJoinResult = {
  joinUrl: string;
  title: string;
  provider: LiveClassProvider;
};

export type LiveClassAttendanceRecord = {
  id: string;
  joinedAt: string;
  leftAt?: string | null;
  student: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    avatar?: string | null;
  };
};

export type LiveClassAttendanceResponse = {
  liveClass: LiveClass;
  total: number;
  enrolledCount: number;
  /** Percentage of enrolled students who joined (null when no enrollments). */
  attendanceRate: number | null;
  firstJoinedAt?: string | null;
  lastJoinedAt?: string | null;
  records: LiveClassAttendanceRecord[];
};

export type StaffLiveClassQuery = {
  courseId?: string;
  status?: LiveClassStatus;
  q?: string;
};
