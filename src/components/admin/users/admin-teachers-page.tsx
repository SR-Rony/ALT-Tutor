"use client";

import { useMemo, useState } from "react";
import {
  Ban,
  BookOpen,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  UserRound,
  UsersRound,
} from "lucide-react";
import { AdminActionsBar, AdminIconAction } from "@/components/admin/shared/admin-icon-action";
import { AdminModal } from "@/components/admin/shared/admin-modal";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useAdminUsers,
  useCreateTeacher,
  useDeleteUser,
  useUpdateTeacher,
} from "@/hooks";
import { formatShortDate } from "@/lib/format";
import { uploadService } from "@/services/upload.service";
import type { AdminUser, ApiError } from "@/types";
import { cn } from "@/utils";

type TeacherForm = {
  name: string;
  phone: string;
  address: string;
  email: string;
  password: string;
  avatar: string;
  isActive: boolean;
};

const emptyForm: TeacherForm = {
  name: "",
  phone: "",
  address: "",
  email: "",
  password: "",
  avatar: "",
  isActive: true,
};

export function AdminTeachersPage() {
  const { data: teachers = [], isLoading, error, refetch, isFetching } = useAdminUsers("TEACHER");
  const createTeacher = useCreateTeacher();
  const updateTeacher = useUpdateTeacher();
  const deleteUser = useDeleteUser();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [form, setForm] = useState<TeacherForm>(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter(
      (teacher) =>
        teacher.name.toLowerCase().includes(q) ||
        teacher.phone.toLowerCase().includes(q) ||
        (teacher.address ?? "").toLowerCase().includes(q) ||
        (teacher.email ?? "").toLowerCase().includes(q)
    );
  }, [search, teachers]);

  const activeTeachers = teachers.filter((teacher) => teacher.isActive).length;
  const totalCourses = teachers.reduce(
    (sum, teacher) => sum + Number(teacher._count?.coursesTaught ?? 0),
    0
  );
  const saving = createTeacher.isPending || updateTeacher.isPending;

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setActionError(null);
    setShowPassword(false);
    setModalOpen(true);
  };

  const openEdit = (teacher: AdminUser) => {
    setEditing(teacher);
    setForm({
      name: teacher.name,
      phone: teacher.phone,
      address: teacher.address ?? "",
      email: teacher.email ?? "",
      password: "",
      avatar: teacher.avatar ?? "",
      isActive: teacher.isActive,
    });
    setActionError(null);
    setShowPassword(false);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving || uploadProgress != null) return;
    setModalOpen(false);
    setEditing(null);
  };

  const onUploadAvatar = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setActionError("Please choose a JPEG, PNG, GIF, or WebP image");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setActionError("Avatar image must be 5MB or smaller");
      return;
    }

    setActionError(null);
    setUploadProgress(0);
    try {
      const result = await uploadService.upload(file, "avatars", setUploadProgress);
      setForm((current) => ({ ...current, avatar: result.url }));
    } catch (uploadError) {
      setActionError((uploadError as ApiError)?.message || "Avatar upload failed");
    } finally {
      setUploadProgress(null);
    }
  };

  const onSubmit = async () => {
    const name = form.name.trim();
    const phone = form.phone.trim();
    const address = form.address.trim();
    const email = form.email.trim();
    if (!name || !phone || !address) {
      setActionError("Teacher name, phone number, and address are required");
      return;
    }
    if (!editing && form.password.trim().length < 6) {
      setActionError("Password must be at least 6 characters");
      return;
    }
    if (editing && form.password && form.password.trim().length < 6) {
      setActionError("New password must be at least 6 characters");
      return;
    }

    setActionError(null);
    try {
      const password = form.password.trim();
      const payload = {
        name,
        phone,
        address,
        email: email || null,
        avatar: form.avatar.trim() || null,
        isActive: form.isActive,
        ...(password ? { password } : {}),
      };
      if (editing) {
        await updateTeacher.mutateAsync({ id: editing.id, payload });
      } else {
        await createTeacher.mutateAsync({ ...payload, password });
      }
      setModalOpen(false);
      setEditing(null);
    } catch (submitError) {
      setActionError((submitError as ApiError)?.message || "Could not save teacher");
    }
  };

  const onToggleStatus = async (teacher: AdminUser) => {
    setPendingId(teacher.id);
    setActionError(null);
    try {
      await updateTeacher.mutateAsync({
        id: teacher.id,
        payload: { isActive: !teacher.isActive },
      });
    } catch (statusError) {
      setActionError((statusError as ApiError)?.message || "Could not update teacher status");
    } finally {
      setPendingId(null);
    }
  };

  const onDelete = async (teacher: AdminUser) => {
    if (
      !window.confirm(
        `Delete teacher "${teacher.name}"? Teachers who own courses cannot be deleted.`
      )
    ) {
      return;
    }
    setPendingId(teacher.id);
    setActionError(null);
    try {
      await deleteUser.mutateAsync(teacher.id);
    } catch (deleteError) {
      setActionError((deleteError as ApiError)?.message || "Could not delete teacher");
    } finally {
      setPendingId(null);
    }
  };

  if (isLoading && teachers.length === 0) {
    return <PageLoader label="Loading teachers..." />;
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <PageHeader
            title="Teachers"
            description="Add teacher accounts and manage access from one place."
            className="mb-0"
          />
          <div className="flex items-center gap-2">
            <AdminIconAction
              label="Refresh"
              icon={RefreshCw}
              tone="primary"
              disabled={isFetching}
              onClick={() => void refetch()}
              className={isFetching ? "animate-spin" : undefined}
            />
            <Button type="button" size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4" aria-hidden />
              Add teacher
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total teachers", value: teachers.length, icon: UsersRound, tone: "text-primary bg-primary/10" },
            { label: "Active teachers", value: activeTeachers, icon: CheckCircle2, tone: "text-accent-green bg-[#ecfdf3]" },
            { label: "Courses managed", value: totalCourses, icon: BookOpen, tone: "text-accent bg-accent/10" },
          ].map(({ label, value, icon: Icon, tone }) => (
            <div key={label} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
              <span className={cn("inline-flex h-11 w-11 items-center justify-center rounded-xl", tone)}>
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="text-2xl font-bold text-foreground">{value}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, phone, address, or email..."
              className="max-w-md"
            />
            <span className="text-sm text-muted-foreground">{filtered.length} teacher(s)</span>
          </div>

          {actionError || error ? (
            <p className="border-b border-border px-5 py-3 text-sm text-accent">
              {actionError || (error as unknown as ApiError)?.message || "Something went wrong"}
            </p>
          ) : null}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-semibold">Teacher</th>
                  <th className="px-5 py-3 font-semibold">Contact</th>
                  <th className="px-5 py-3 font-semibold">Courses</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Added</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                      No teachers found.
                    </td>
                  </tr>
                ) : null}
                {filtered.map((teacher) => {
                  const rowBusy = pendingId === teacher.id;
                  return (
                    <tr key={teacher.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-primary">
                            {teacher.avatar ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={teacher.avatar} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <UserRound className="h-5 w-5" aria-hidden />
                            )}
                          </span>
                          <span className="font-semibold text-foreground">{teacher.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        <p>{teacher.phone}</p>
                        <p className="max-w-52 truncate text-xs">{teacher.address || "No address"}</p>
                        {teacher.email ? <p className="text-xs">{teacher.email}</p> : null}
                      </td>
                      <td className="px-5 py-4 font-medium text-foreground">
                        {teacher._count?.coursesTaught ?? 0}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-xs font-semibold",
                            teacher.isActive
                              ? "bg-[#ecfdf3] text-accent-green"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {teacher.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {formatShortDate(teacher.createdAt)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <AdminActionsBar>
                          <AdminIconAction
                            label="Edit teacher"
                            icon={Pencil}
                            tone="primary"
                            disabled={rowBusy}
                            onClick={() => openEdit(teacher)}
                          />
                          <AdminIconAction
                            label={teacher.isActive ? "Deactivate teacher" : "Activate teacher"}
                            icon={teacher.isActive ? Ban : CheckCircle2}
                            tone={teacher.isActive ? "warning" : "success"}
                            disabled={rowBusy}
                            onClick={() => void onToggleStatus(teacher)}
                          />
                          <AdminIconAction
                            label="Delete teacher"
                            icon={Trash2}
                            tone="danger"
                            disabled={rowBusy}
                            onClick={() => void onDelete(teacher)}
                          />
                        </AdminActionsBar>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AdminModal
        open={modalOpen}
        title={editing ? "Edit teacher" : "Add new teacher"}
        description={
          editing
            ? "Update teacher profile and account access."
            : "Create a teacher account with login credentials."
        }
        onClose={closeModal}
        className="sm:max-w-2xl"
        footer={
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" onClick={closeModal} disabled={saving || uploadProgress != null}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void onSubmit()} disabled={saving || uploadProgress != null}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              {editing ? "Save changes" : "Create teacher"}
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 p-4">
            <span className="inline-flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-primary">
              {form.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.avatar} alt="Teacher avatar" className="h-full w-full object-cover" />
              ) : (
                <UserRound className="h-8 w-8" aria-hidden />
              )}
            </span>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium">
              {uploadProgress != null ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Upload className="h-4 w-4" aria-hidden />
              )}
              {uploadProgress != null ? `Uploading ${uploadProgress}%` : "Upload photo"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadProgress != null}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void onUploadAvatar(file);
                  event.target.value = "";
                }}
              />
            </label>
            <Input
              value={form.avatar ?? ""}
              onChange={(event) => setForm((current) => ({ ...current, avatar: event.target.value }))}
              placeholder="Or paste photo URL"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-foreground">Full name *</span>
              <Input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Teacher full name"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-foreground">Phone number *</span>
              <Input
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                placeholder="+8801XXXXXXXXX"
              />
            </label>
            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-sm font-semibold text-foreground">Address *</span>
              <Input
                value={form.address ?? ""}
                onChange={(event) =>
                  setForm((current) => ({ ...current, address: event.target.value }))
                }
                placeholder="Teacher full address"
              />
            </label>
            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-sm font-semibold text-foreground">
                Email address <span className="font-normal text-muted-foreground">(optional)</span>
              </span>
              <Input
                type="email"
                value={form.email ?? ""}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="teacher@example.com"
              />
            </label>
            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-sm font-semibold text-foreground">
                {editing ? "New password (leave blank to keep current)" : "Password *"}
              </span>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="Minimum 6 characters"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>
          </div>

          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-accent-green/20 bg-[#ecfdf3] p-4">
            <div>
              <p className="font-semibold text-foreground">Active teacher</p>
              <p className="text-xs text-muted-foreground">
                Active teachers can sign in and access their dashboard.
              </p>
            </div>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
              className="h-5 w-5 accent-primary"
            />
          </label>

          {actionError ? <p className="text-sm text-accent">{actionError}</p> : null}
        </div>
      </AdminModal>
    </>
  );
}
