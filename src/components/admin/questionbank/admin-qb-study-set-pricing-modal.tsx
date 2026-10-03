"use client";

import { useEffect, useMemo, useState } from "react";
import { BadgeDollarSign, CheckCircle2, Loader2, Search, UserPlus, XCircle } from "lucide-react";
import { AdminModal } from "@/components/admin/shared/admin-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useAdminGrantStudySetAccess,
  useAdminRevokeStudySetAccess,
  useAdminStudySetAccess,
  useAdminUsers,
  useUpdateQbSubtopic,
} from "@/hooks";
import { normalizeAccessBadge } from "@/lib/access-tier";
import { formatDurationUntil, formatMoney, formatShortDate } from "@/lib/format";
import {
  MANUAL_PAYMENT_METHODS,
  manualPaymentMethodLabel,
  studySetAccessSourceLabel,
  studySetPrice,
  studySetRegularPrice,
} from "@/lib/study-set-pricing";
import type { ApiError } from "@/types";
import type { ManualPaymentMethod, QbSubtopic, StudySetAccessRow } from "@/types/qb.types";
import { cn } from "@/utils";
import { AccessBadgePill } from "./qb-admin-shared";

const PRICE_PRESETS = [99, 199, 299, 499, 999];
const DURATION_PRESETS: { label: string; days: number | null }[] = [
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
  { label: "6 months", days: 180 },
  { label: "1 year", days: 365 },
  { label: "Lifetime", days: null },
];

type Props = {
  open: boolean;
  onClose: () => void;
  subtopic: QbSubtopic | null;
  /** e.g. "1.1 Physical Quantities & Units" */
  displayTitle: string;
};

function parseMoney(raw: string): number | null | "invalid" {
  const value = raw.trim();
  if (!value) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return "invalid";
  return Number(value);
}

function parseDays(raw: string): number | null | "invalid" {
  const value = raw.trim();
  if (!value) return null;
  if (!/^\d+$/.test(value)) return "invalid";
  const days = Number(value);
  return days >= 1 && days <= 3650 ? days : "invalid";
}

function accessStatus(row: StudySetAccessRow) {
  if (row.status === "CANCELLED") return { label: "Revoked", tone: "muted" as const };
  if (row.isQueued) return { label: "Starts later", tone: "info" as const };
  if (row.isCurrent) return { label: "Active", tone: "success" as const };
  return { label: "Expired", tone: "muted" as const };
}

export function AdminQbStudySetPricingModal({ open, onClose, subtopic, displayTitle }: Props) {
  const updateSubtopic = useUpdateQbSubtopic();
  const grantAccess = useAdminGrantStudySetAccess();
  const revokeAccess = useAdminRevokeStudySetAccess();
  const { data: accessRows = [], isLoading: accessLoading } = useAdminStudySetAccess(
    open ? subtopic?.id : null
  );
  const { data: students = [], isLoading: studentsLoading } = useAdminUsers("STUDENT");

  const [price, setPrice] = useState("");
  const [regularPrice, setRegularPrice] = useState("");
  const [durationDays, setDurationDays] = useState("");
  const [pricingError, setPricingError] = useState<string | null>(null);
  const [pricingSaved, setPricingSaved] = useState(false);

  const [studentQuery, setStudentQuery] = useState("");
  const [studentId, setStudentId] = useState("");
  const [grantMode, setGrantMode] = useState<"paid" | "free">("paid");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<ManualPaymentMethod>("CASH");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [grantDays, setGrantDays] = useState("");
  const [grantError, setGrantError] = useState<string | null>(null);
  const [grantSuccess, setGrantSuccess] = useState<string | null>(null);

  const subtopicId = subtopic?.id;
  const isGold = normalizeAccessBadge(subtopic?.badge) !== "FREE";
  const savedPrice = subtopic ? studySetPrice(subtopic) : null;
  const savedRegular = subtopic ? studySetRegularPrice(subtopic) : null;

  useEffect(() => {
    if (!open || !subtopic) return;
    const current = studySetPrice(subtopic);
    setPrice(current != null ? String(current) : "");
    const regular = studySetRegularPrice(subtopic);
    setRegularPrice(regular != null ? String(regular) : "");
    setDurationDays(subtopic.accessDurationDays ? String(subtopic.accessDurationDays) : "");
    setPricingError(null);
    setPricingSaved(false);
    setStudentQuery("");
    setStudentId("");
    setGrantMode("paid");
    setAmount(current != null ? String(current) : "");
    setMethod("CASH");
    setReference("");
    setNote("");
    setGrantDays(subtopic.accessDurationDays ? String(subtopic.accessDurationDays) : "");
    setGrantError(null);
    setGrantSuccess(null);
    // Re-init only when a different study set is opened, not on every refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, subtopicId]);

  const filteredStudents = useMemo(() => {
    const q = studentQuery.trim().toLowerCase();
    const active = students.filter((s) => s.isActive);
    const matches = q
      ? active.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.phone.toLowerCase().includes(q) ||
            (s.email ?? "").toLowerCase().includes(q)
        )
      : active;
    return matches.slice(0, 100);
  }, [students, studentQuery]);

  const selectedStudent = students.find((s) => s.id === studentId) ?? null;
  const currentHolderIds = useMemo(
    () => new Set(accessRows.filter((r) => r.isCurrent).map((r) => r.studentId)),
    [accessRows]
  );

  const stats = useMemo(() => {
    const holders = new Set<string>();
    let revenue = 0;
    for (const row of accessRows) {
      if (row.isCurrent) holders.add(row.studentId);
      if (row.payment && String(row.payment.status).toUpperCase() === "SUCCESS") {
        revenue += Number(row.payment.amount) || 0;
      }
    }
    return { holders: holders.size, revenue };
  }, [accessRows]);

  const savePricing = async (overrides?: { badge?: "GOLD" }) => {
    if (!subtopic) return;
    const nextPrice = parseMoney(price);
    const nextRegular = parseMoney(regularPrice);
    const nextDays = parseDays(durationDays);
    if (nextPrice === "invalid") return setPricingError("Enter a valid price, e.g. 199 or 199.50.");
    if (nextRegular === "invalid") return setPricingError("Enter a valid regular price.");
    if (nextDays === "invalid") return setPricingError("Access days must be 1–3650, or blank for lifetime.");
    if (nextRegular != null && nextPrice != null && nextRegular <= nextPrice) {
      return setPricingError("Regular price should be higher than the selling price (or leave it blank).");
    }

    setPricingError(null);
    setPricingSaved(false);
    try {
      await updateSubtopic.mutateAsync({
        id: subtopic.id,
        payload: {
          ...(overrides ?? {}),
          price: nextPrice,
          regularPrice: nextRegular,
          accessDurationDays: nextDays,
        },
      });
      setPricingSaved(true);
      if (nextPrice != null && !amount.trim()) setAmount(String(nextPrice));
      if (!grantDays.trim() && nextDays != null) setGrantDays(String(nextDays));
    } catch (err) {
      setPricingError((err as ApiError)?.message || "Failed to save pricing");
    }
  };

  const submitGrant = async () => {
    if (!subtopic) return;
    if (!studentId) return setGrantError("Select a student.");
    const days = parseDays(grantDays);
    if (days === "invalid") return setGrantError("Access days must be 1–3650, or blank for lifetime.");

    let paidAmount = 0;
    if (grantMode === "paid") {
      const parsed = parseMoney(amount);
      if (parsed === "invalid" || parsed == null || parsed <= 0) {
        return setGrantError("Enter the amount the student paid.");
      }
      paidAmount = parsed;
    }

    if (
      currentHolderIds.has(studentId) &&
      !window.confirm(
        "This student already has access. Adding again will extend their access after the current period ends. Continue?"
      )
    ) {
      return;
    }

    setGrantError(null);
    setGrantSuccess(null);
    try {
      await grantAccess.mutateAsync({
        subtopicId: subtopic.id,
        payload: {
          studentId,
          ...(grantMode === "paid"
            ? { amount: paidAmount, method, reference: reference.trim() || undefined }
            : {}),
          note: note.trim() || undefined,
          durationDays: days,
        },
      });
      setGrantSuccess(
        grantMode === "paid"
          ? `Recorded ${formatMoney(paidAmount)} from ${selectedStudent?.name ?? "student"} — access unlocked.`
          : `${selectedStudent?.name ?? "Student"} can now open this study set.`
      );
      setStudentId("");
      setStudentQuery("");
      setReference("");
      setNote("");
    } catch (err) {
      setGrantError((err as ApiError)?.message || "Failed to unlock access");
    }
  };

  const revoke = async (row: StudySetAccessRow) => {
    if (
      !window.confirm(
        `Remove ${row.student.name}'s access to this study set now?${
          row.payment ? " The payment stays in the records." : ""
        }`
      )
    ) {
      return;
    }
    try {
      await revokeAccess.mutateAsync(row.id);
    } catch (err) {
      window.alert((err as ApiError)?.message || "Failed to revoke access");
    }
  };

  const pricePreview = parseMoney(price);
  const regularPreview = parseMoney(regularPrice);
  const daysPreview = parseDays(durationDays);

  return (
    <AdminModal
      open={open && Boolean(subtopic)}
      onClose={onClose}
      title="Pricing & access"
      description={displayTitle}
      className="sm:max-w-2xl"
    >
      {subtopic ? (
        <div className="space-y-6">
          {/* Pricing */}
          <section className="space-y-4 rounded-xl border border-[#f5d48a] bg-[#fffbeb]/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BadgeDollarSign className="h-4 w-4 text-[#b45309]" aria-hidden />
                <h3 className="text-sm font-bold text-foreground">Price for this study set</h3>
                <AccessBadgePill badge={subtopic.badge} />
              </div>
              {savedPrice != null ? (
                <p className="text-xs font-semibold text-[#92400e]">
                  Now selling at {formatMoney(savedPrice)}
                  {savedRegular != null ? (
                    <span className="ml-1 font-normal text-muted-foreground line-through">
                      {formatMoney(savedRegular)}
                    </span>
                  ) : null}
                </p>
              ) : isGold ? (
                <p className="text-xs font-semibold text-accent">No price yet — students can’t buy it</p>
              ) : null}
            </div>

            {!isGold ? (
              <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
                This study set is <strong className="text-foreground">Free</strong>. Set a price and
                click <strong className="text-foreground">Make Gold &amp; save</strong> to start selling it.
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-foreground">Price (৳)</span>
                <Input
                  value={price}
                  onChange={(e) => {
                    setPrice(e.target.value);
                    setPricingSaved(false);
                  }}
                  inputMode="decimal"
                  placeholder="e.g. 199"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-foreground">
                  Regular price (৳) <span className="font-normal text-muted-foreground">optional</span>
                </span>
                <Input
                  value={regularPrice}
                  onChange={(e) => {
                    setRegularPrice(e.target.value);
                    setPricingSaved(false);
                  }}
                  inputMode="decimal"
                  placeholder="Shown struck through"
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRICE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setPrice(String(preset));
                    setPricingSaved(false);
                  }}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs font-semibold transition",
                    pricePreview === preset
                      ? "border-[#d4a017] bg-[#d4a017] text-white"
                      : "border-border bg-card text-foreground hover:border-[#d4a017]/60"
                  )}
                >
                  {formatMoney(preset)}
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-foreground">Access after purchase</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {DURATION_PRESETS.map((preset) => {
                  const active =
                    preset.days == null ? !durationDays.trim() : durationDays.trim() === String(preset.days);
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setDurationDays(preset.days == null ? "" : String(preset.days));
                        setPricingSaved(false);
                      }}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs font-semibold transition",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-foreground hover:border-primary/40"
                      )}
                    >
                      {preset.label}
                    </button>
                  );
                })}
                <Input
                  value={durationDays}
                  onChange={(e) => {
                    setDurationDays(e.target.value);
                    setPricingSaved(false);
                  }}
                  inputMode="numeric"
                  placeholder="Custom days"
                  className="h-8 w-28 text-xs"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                {daysPreview === "invalid"
                  ? "Enter 1–3650 days, or choose Lifetime."
                  : `A purchase today gives: ${formatDurationUntil(daysPreview)}`}
              </p>
            </div>

            {pricingError ? (
              <p role="alert" className="text-sm text-accent">
                {pricingError}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] text-muted-foreground">
                Students who buy this set unlock <strong className="text-foreground">only this set</strong>.
                Other Gold sets are bought separately.
              </p>
              <div className="flex items-center gap-2">
                {pricingSaved ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent-green">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Saved
                  </span>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  disabled={updateSubtopic.isPending}
                  onClick={() => void savePricing(isGold ? undefined : { badge: "GOLD" })}
                >
                  {updateSubtopic.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  {isGold ? "Save price" : "Make Gold & save"}
                </Button>
              </div>
            </div>
            {pricePreview != null && pricePreview !== "invalid" && regularPreview != null && regularPreview !== "invalid" && regularPreview > pricePreview ? (
              <p className="text-[11px] font-semibold text-[#067647]">
                Students see a {Math.round((1 - pricePreview / regularPreview) * 100)}% discount.
              </p>
            ) : null}
          </section>

          {/* Manual payment / grant */}
          <section className="space-y-4 rounded-xl border border-border p-4">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary" aria-hidden />
              <h3 className="text-sm font-bold text-foreground">Add payment / unlock for a student</h3>
            </div>
            <p className="-mt-2 text-xs text-muted-foreground">
              Use this when a student paid by cash, bKash, Nagad, etc. — or to give access for free.
            </p>

            <div className="space-y-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={studentQuery}
                  onChange={(e) => setStudentQuery(e.target.value)}
                  placeholder="Search student by name, phone, or email…"
                  className="pl-9"
                />
              </div>
              <select
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                disabled={studentsLoading}
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
              >
                <option value="">
                  {studentsLoading
                    ? "Loading students…"
                    : filteredStudents.length
                      ? "Select a student"
                      : "No matching students"}
                </option>
                {filteredStudents.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} · {student.phone}
                    {currentHolderIds.has(student.id) ? " · has access" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="inline-flex rounded-lg border border-border p-0.5 text-xs font-semibold">
              {(
                [
                  { key: "paid", label: "Student paid" },
                  { key: "free", label: "Free access" },
                ] as const
              ).map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setGrantMode(option.key)}
                  className={cn(
                    "rounded-md px-3 py-1.5 transition",
                    grantMode === option.key
                      ? "bg-foreground text-white"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {grantMode === "paid" ? (
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-foreground">Amount paid (৳)</span>
                  <Input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    inputMode="decimal"
                    placeholder={savedPrice != null ? String(savedPrice) : "e.g. 199"}
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-foreground">Method</span>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value as ManualPaymentMethod)}
                    className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
                  >
                    {MANUAL_PAYMENT_METHODS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-foreground">
                    Txn / receipt no. <span className="font-normal text-muted-foreground">optional</span>
                  </span>
                  <Input
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="e.g. 9BX7…"
                    maxLength={120}
                  />
                </label>
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-foreground">Access days</span>
                <Input
                  value={grantDays}
                  onChange={(e) => setGrantDays(e.target.value)}
                  inputMode="numeric"
                  placeholder="Blank = lifetime"
                />
                <span className="block text-[11px] text-muted-foreground">
                  {parseDays(grantDays) === "invalid"
                    ? "Enter 1–3650 days, or leave blank."
                    : formatDurationUntil(parseDays(grantDays) as number | null)}
                </span>
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-foreground">
                  Note <span className="font-normal text-muted-foreground">optional</span>
                </span>
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Visible to admins only"
                  maxLength={500}
                />
              </label>
            </div>

            {grantError ? (
              <p role="alert" className="text-sm text-accent">
                {grantError}
              </p>
            ) : null}
            {grantSuccess ? (
              <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-green">
                <CheckCircle2 className="h-4 w-4" /> {grantSuccess}
              </p>
            ) : null}

            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                disabled={grantAccess.isPending || !studentId}
                onClick={() => void submitGrant()}
              >
                {grantAccess.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {grantMode === "paid" ? "Record payment & unlock" : "Unlock for free"}
              </Button>
            </div>
          </section>

          {/* Holders */}
          <section className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <h3 className="text-sm font-bold text-foreground">Students with access</h3>
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">{stats.holders}</strong> active ·{" "}
                <strong className="text-foreground">{formatMoney(stats.revenue)}</strong> collected
              </p>
            </div>
            {accessLoading ? (
              <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </div>
            ) : accessRows.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                Nobody has bought this study set yet.
              </p>
            ) : (
              <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                {accessRows.map((row) => {
                  const status = accessStatus(row);
                  const paid = row.payment ? Number(row.payment.amount) : null;
                  const canRevoke = row.status === "ACTIVE" && (row.isCurrent || row.isQueued);
                  return (
                    <li
                      key={row.id}
                      className="flex flex-col gap-2 bg-card px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {row.student.name}
                          </p>
                          <span className="text-xs text-muted-foreground">{row.student.phone}</span>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                              status.tone === "success" && "bg-[#ecfdf3] text-accent-green",
                              status.tone === "info" && "bg-primary-muted text-primary",
                              status.tone === "muted" && "bg-muted text-muted-foreground"
                            )}
                          >
                            {status.label}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {studySetAccessSourceLabel(row.source)}
                          {paid != null ? ` · ${formatMoney(paid)}` : ""}
                          {row.payment?.method ? ` via ${manualPaymentMethodLabel(row.payment.method)}` : ""}
                          {row.payment?.reference ? ` · Ref ${row.payment.reference}` : ""}
                          {row.grantedBy ? ` · by ${row.grantedBy.name}` : ""}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {formatShortDate(row.startsAt)} →{" "}
                          {row.expiresAt ? formatShortDate(row.expiresAt) : "Lifetime"}
                          {row.note ? ` · ${row.note}` : ""}
                        </p>
                      </div>
                      {canRevoke ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="shrink-0 self-start text-accent sm:self-center"
                          disabled={revokeAccess.isPending}
                          onClick={() => void revoke(row)}
                        >
                          <XCircle className="h-4 w-4" />
                          Revoke
                        </Button>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      ) : null}
    </AdminModal>
  );
}
