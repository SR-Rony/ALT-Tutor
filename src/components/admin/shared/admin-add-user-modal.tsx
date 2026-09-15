"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { AdminModal } from "@/components/admin/shared/admin-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminCourses, useAdminEnrollStudent, useAdminUsers, useCreateStudent } from "@/hooks";
import { useAdminGrantPracticeAccess } from "@/hooks/use-payments";
import { useAdminSubjectsTree } from "@/hooks/use-subjects";
import { tierLabel } from "@/lib/access-tier";
import { formatCoursePrice } from "@/lib/course-format";
import type { ApiError } from "@/types";
import { cn } from "@/utils";

type ProductTier = "SILVER" | "GOLD" | "DIAMOND";
type StudentMode = "new" | "existing";

const selectClass =
  "h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15";

export type AdminAddUserModalProps = {
  open: boolean;
  onClose: () => void;
  defaultGrantPractice?: boolean;
  defaultEnrollCourse?: boolean;
  defaultProgramId?: string;
  defaultCourseId?: string;
};

export function AdminAddUserModal({
  open,
  onClose,
  defaultGrantPractice = true,
  defaultEnrollCourse = false,
  defaultProgramId = "",
  defaultCourseId = "",
}: AdminAddUserModalProps) {
  const { data: students = [], isLoading: studentsLoading } = useAdminUsers("STUDENT");
  const { data: courses = [], isLoading: coursesLoading } = useAdminCourses();
  const { data: tree = [], isLoading: programsLoading } = useAdminSubjectsTree();
  const createStudent = useCreateStudent();
  const grantAccess = useAdminGrantPracticeAccess();
  const enrollStudent = useAdminEnrollStudent();

  const [mode, setMode] = useState<StudentMode>("new");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [studentQuery, setStudentQuery] = useState("");
  const [grantPractice, setGrantPractice] = useState(true);
  const [enrollCourse, setEnrollCourse] = useState(false);
  const [programId, setProgramId] = useState("");
  const [tier, setTier] = useState<ProductTier>("GOLD");
  const [durationDays, setDurationDays] = useState("30");
  const [courseId, setCourseId] = useState("");
  const [courseQuery, setCourseQuery] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setMode("new");
    setName("");
    setPhone("");
    setPassword("");
    setEmail("");
    setShowPassword(false);
    setStudentId("");
    setStudentQuery("");
    setGrantPractice(defaultGrantPractice);
    setEnrollCourse(defaultEnrollCourse || Boolean(defaultCourseId));
    setProgramId(defaultProgramId);
    setTier("GOLD");
    setDurationDays("30");
    setCourseId(defaultCourseId);
    setCourseQuery("");
    setFormError(null);
  }, [open, defaultGrantPractice, defaultEnrollCourse, defaultProgramId, defaultCourseId]);

  const programs = useMemo(() => {
    const rows: { id: string; label: string }[] = [];
    for (const category of tree) {
      for (const subject of category.subjects ?? []) {
        for (const program of subject.programs ?? []) {
          if (program.isActive === false) continue;
          rows.push({
            id: program.id,
            label: `${subject.name} · ${program.name}`,
          });
        }
      }
    }
    return rows.sort((a, b) => a.label.localeCompare(b.label));
  }, [tree]);

  const filteredStudents = useMemo(() => {
    const q = studentQuery.trim().toLowerCase();
    const active = students.filter((s) => s.isActive);
    if (!q) return active;
    return active.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.phone.toLowerCase().includes(q) ||
        (s.email ?? "").toLowerCase().includes(q)
    );
  }, [students, studentQuery]);

  const filteredCourses = useMemo(() => {
    const q = courseQuery.trim().toLowerCase();
    const available = courses.filter((c) => String(c.status).toUpperCase() !== "ARCHIVED");
    if (!q) return available;
    return available.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        c.teacher?.name?.toLowerCase().includes(q)
    );
  }, [courses, courseQuery]);

  const busy = createStudent.isPending || grantAccess.isPending || enrollStudent.isPending;

  const onSubmit = async () => {
    if (mode === "existing" && !grantPractice && !enrollCourse) {
      setFormError("Choose practice access and/or a course enrollment.");
      return;
    }
    if (grantPractice) {
      const days = durationDays.trim() ? Number.parseInt(durationDays.trim(), 10) : null;
      if (days != null && (!Number.isFinite(days) || days < 1)) {
        setFormError("Enter valid access days, or leave blank for lifetime.");
        return;
      }
    }
    if (enrollCourse && !courseId) {
      setFormError("Select a course to enroll the student.");
      return;
    }

    setFormError(null);
    try {
      let targetStudentId = studentId;
      if (mode === "new") {
        const trimmedName = name.trim();
        const trimmedPhone = phone.trim();
        const trimmedPassword = password.trim();
        if (!trimmedName || !trimmedPhone || trimmedPassword.length < 6) {
          setFormError("Name, phone, and a password of at least 6 characters are required.");
          return;
        }
        const created = await createStudent.mutateAsync({
          name: trimmedName,
          phone: trimmedPhone,
          password: trimmedPassword,
          email: email.trim() || undefined,
        });
        targetStudentId = created.id;
        setMode("existing");
        setStudentId(created.id);
      } else if (!targetStudentId) {
        setFormError("Select an existing student.");
        return;
      }

      const days = durationDays.trim() ? Number.parseInt(durationDays.trim(), 10) : null;
      if (grantPractice) {
        await grantAccess.mutateAsync({
          studentId: targetStudentId,
          programId: programId || null,
          accessTier: tier,
          durationDays: days,
        });
      }
      if (enrollCourse && courseId) {
        await enrollStudent.mutateAsync({ studentId: targetStudentId, courseId });
      }
      onClose();
    } catch (err) {
      setFormError((err as ApiError)?.message || "Failed to add user access");
    }
  };

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title="Add user"
      description="Create a student or pick an existing one, then unlock Questionbank / Past Papers and/or enroll them in a course. Payment is skipped."
      className="sm:max-w-lg"
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void onSubmit()} disabled={busy}>
            {busy ? "Saving…" : mode === "new" ? "Add user" : "Grant access"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex rounded-xl border border-border bg-muted/40 p-1">
          {(
            [
              { id: "new", label: "New student" },
              { id: "existing", label: "Existing student" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMode(tab.id)}
              className={cn(
                "flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors",
                mode === tab.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {mode === "new" ? (
          <div className="space-y-3">
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold text-foreground">Name</span>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Student name" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold text-foreground">Phone</span>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01712345678"
                inputMode="tel"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold text-foreground">Password</span>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold text-foreground">Email (optional)</span>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                type="email"
              />
            </label>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Student</label>
            <Input
              value={studentQuery}
              onChange={(e) => setStudentQuery(e.target.value)}
              placeholder="Filter by name, phone, or email…"
            />
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              disabled={studentsLoading}
              className={selectClass}
            >
              <option value="">{studentsLoading ? "Loading students…" : "Select a student"}</option>
              {filteredStudents.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} · {student.phone}
                  {student.email ? ` · ${student.email}` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        <label className="flex items-start gap-2 rounded-xl border border-border bg-muted/20 px-3 py-3">
          <input
            type="checkbox"
            className="mt-1"
            checked={grantPractice}
            onChange={(e) => setGrantPractice(e.target.checked)}
          />
          <span>
            <span className="block text-sm font-semibold text-foreground">
              Practice access (all study products)
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Unlocks Questionbank, Past Papers, Key Concepts, and Practice Exams.
            </span>
          </span>
        </label>

        {grantPractice ? (
          <div className="space-y-3 rounded-xl border border-border px-3 py-3">
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold text-foreground">Subject program</span>
              <select
                value={programId}
                onChange={(e) => setProgramId(e.target.value)}
                disabled={programsLoading}
                className={selectClass}
              >
                <option value="">{programsLoading ? "Loading subjects…" : "All subjects"}</option>
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-foreground">Access tier</span>
                <select
                  value={tier}
                  onChange={(e) => setTier(e.target.value as ProductTier)}
                  className={selectClass}
                >
                  <option value="SILVER">{tierLabel("SILVER")}</option>
                  <option value="GOLD">{tierLabel("GOLD")}</option>
                  <option value="DIAMOND">{tierLabel("DIAMOND")}</option>
                </select>
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-foreground">Duration (days)</span>
                <Input
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  placeholder="Blank = lifetime"
                  inputMode="numeric"
                />
              </label>
            </div>
          </div>
        ) : null}

        <label className="flex items-start gap-2 rounded-xl border border-border bg-muted/20 px-3 py-3">
          <input
            type="checkbox"
            className="mt-1"
            checked={enrollCourse}
            onChange={(e) => setEnrollCourse(e.target.checked)}
          />
          <span>
            <span className="block text-sm font-semibold text-foreground">Enroll in a course</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Gives course lessons and any linked questionbank access.
            </span>
          </span>
        </label>

        {enrollCourse ? (
          <div className="space-y-2 rounded-xl border border-border px-3 py-3">
            <Input
              value={courseQuery}
              onChange={(e) => setCourseQuery(e.target.value)}
              placeholder="Filter by title, slug, or teacher…"
            />
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              disabled={coursesLoading}
              className={selectClass}
            >
              <option value="">{coursesLoading ? "Loading courses…" : "Select a course"}</option>
              {filteredCourses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title} · {String(course.status)} · {formatCoursePrice(course.price)}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {formError ? (
          <p className="rounded-lg border border-[#fecdca] bg-[#fef3f2] px-3 py-2 text-sm text-[#b42318]">
            {formError}
          </p>
        ) : null}
      </div>
    </AdminModal>
  );
}

export function AdminAddUserButton({
  label = "Add user",
  variant = "outline",
  ...modalProps
}: Omit<AdminAddUserModalProps, "open" | "onClose"> & {
  label?: string;
  variant?: "outline" | "default";
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" size="sm" variant={variant} onClick={() => setOpen(true)}>
        <UserPlus className="h-4 w-4" aria-hidden />
        {label}
      </Button>
      <AdminAddUserModal open={open} onClose={() => setOpen(false)} {...modalProps} />
    </>
  );
}
