"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminModal } from "@/components/admin/shared/admin-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminGrantPracticeAccess } from "@/hooks/use-payments";
import { useAdminUsers } from "@/hooks/use-admin-dashboard";
import { useAdminSubjectsTree } from "@/hooks/use-subjects";
import { tierLabel } from "@/lib/access-tier";
import type { ApiError } from "@/types";

type ProductTier = "SILVER" | "GOLD" | "DIAMOND";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function AdminGrantPracticeAccessModal({ open, onClose }: Props) {
  const { data: students = [], isLoading: studentsLoading } = useAdminUsers("STUDENT");
  const { data: tree = [], isLoading: programsLoading } = useAdminSubjectsTree();
  const grantAccess = useAdminGrantPracticeAccess();

  const [studentId, setStudentId] = useState("");
  const [programId, setProgramId] = useState("");
  const [tier, setTier] = useState<ProductTier>("GOLD");
  const [durationDays, setDurationDays] = useState("30");
  const [studentQuery, setStudentQuery] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setStudentId("");
    setProgramId("");
    setTier("GOLD");
    setDurationDays("30");
    setStudentQuery("");
    setFormError(null);
  }, [open]);

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

  const onSubmit = async () => {
    if (!studentId) {
      setFormError("Select a student.");
      return;
    }
    const days = durationDays.trim()
      ? Number.parseInt(durationDays.trim(), 10)
      : null;
    if (days != null && (!Number.isFinite(days) || days < 1)) {
      setFormError("Enter valid access days, or leave blank for lifetime.");
      return;
    }

    setFormError(null);
    try {
      await grantAccess.mutateAsync({
        studentId,
        programId: programId || null,
        accessTier: tier,
        durationDays: days,
      });
      onClose();
    } catch (err) {
      setFormError((err as ApiError)?.message || "Failed to grant practice access");
    }
  };

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title="Grant practice access"
      description="Unlock Questionbank, Key Concepts, Practice Exams, and Past Papers for a student. Payment is skipped."
      className="sm:max-w-lg"
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={grantAccess.isPending}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void onSubmit()}
            disabled={grantAccess.isPending || !studentId}
          >
            {grantAccess.isPending ? "Granting…" : "Grant access"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
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
            className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
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

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Subject program</label>
          <select
            value={programId}
            onChange={(e) => setProgramId(e.target.value)}
            disabled={programsLoading}
            className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
          >
            <option value="">
              {programsLoading ? "Loading subjects…" : "All subjects (global)"}
            </option>
            {programs.map((program) => (
              <option key={program.id} value={program.id}>
                {program.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Leave as global to unlock every subject, or pick one program (e.g. SSC Mathematics).
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Access tier</label>
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value as ProductTier)}
            className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
          >
            <option value="SILVER">{tierLabel("SILVER")} — Free + Silver</option>
            <option value="GOLD">{tierLabel("GOLD")} — through Gold</option>
            <option value="DIAMOND">{tierLabel("DIAMOND")} — full unlock</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Duration (days)</label>
          <Input
            value={durationDays}
            onChange={(e) => setDurationDays(e.target.value)}
            placeholder="Leave blank for lifetime"
            inputMode="numeric"
          />
          <p className="text-xs text-muted-foreground">
            Blank = lifetime. If the student already has an admin grant, days extend from the current expiry.
          </p>
        </div>

        {formError ? (
          <p className="rounded-lg border border-[#fecdca] bg-[#fef3f2] px-3 py-2 text-sm text-[#b42318]">
            {formError}
          </p>
        ) : null}
      </div>
    </AdminModal>
  );
}
