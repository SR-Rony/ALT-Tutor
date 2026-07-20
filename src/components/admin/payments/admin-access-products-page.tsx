"use client";

import { useMemo, useState } from "react";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { AdminIconAction } from "@/components/admin/shared/admin-icon-action";
import { AdminModal } from "@/components/admin/shared/admin-modal";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  useAdminAccessProducts,
  useAdminSubjectsTree,
  useCreateAccessProduct,
  useDeactivateAccessProduct,
  useUpdateAccessProduct,
} from "@/hooks";
import { formatMoney } from "@/lib/format";
import { richTextToPlain, serializeRichText } from "@/lib/rich-text";
import type { ApiError } from "@/types";
import type { AccessProduct } from "@/types/student-dashboard.types";
import { cn } from "@/utils";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function AdminAccessProductsPage() {
  const { data: products = [], isLoading, error, refetch, isFetching } = useAdminAccessProducts();
  const { data: subjectsTree = [] } = useAdminSubjectsTree();
  const createProduct = useCreateAccessProduct();
  const updateProduct = useUpdateAccessProduct();
  const deactivateProduct = useDeactivateAccessProduct();

  const programs = useMemo(
    () =>
      subjectsTree.flatMap((cat) =>
        (cat.subjects ?? []).flatMap((sub) =>
          (sub.programs ?? []).map((p) => ({
            id: p.id,
            label: `${cat.name} / ${sub.name} / ${p.name}`,
          }))
        )
      ),
    [subjectsTree]
  );

  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editItem, setEditItem] = useState<AccessProduct | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("0");
  const [durationDays, setDurationDays] = useState("");
  const [programId, setProgramId] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const busy =
    createProduct.isPending || updateProduct.isPending || deactivateProduct.isPending;

  const openCreate = () => {
    setEditItem(null);
    setTitle("");
    setSlug("");
    setDescription("");
    setPrice("499");
    setDurationDays("30");
    setProgramId("");
    setActionError(null);
    setModal("create");
  };

  const openEdit = (item: AccessProduct) => {
    setEditItem(item);
    setTitle(item.title);
    setSlug(item.slug);
    setDescription(item.description ?? "");
    setPrice(String(item.price ?? 0));
    setDurationDays(item.durationDays != null ? String(item.durationDays) : "");
    setProgramId(item.programId ?? item.program?.id ?? "");
    setActionError(null);
    setModal("edit");
  };

  const onSave = async () => {
    setActionError(null);
    if (!title.trim() || !slug.trim()) {
      setActionError("Title and slug are required");
      return;
    }
    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      description: serializeRichText(description) || undefined,
      price: Number.parseFloat(price) || 0,
      durationDays: durationDays.trim() ? Number.parseInt(durationDays, 10) : null,
      programId: programId || null,
    };
    try {
      if (modal === "edit" && editItem) {
        await updateProduct.mutateAsync({ id: editItem.id, payload });
      } else {
        await createProduct.mutateAsync(payload);
      }
      setModal(null);
    } catch (err) {
      setActionError((err as ApiError)?.message || "Save failed");
    }
  };

  if (isLoading && products.length === 0) {
    return <PageLoader label="Loading access products..." />;
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-6">
          <PageHeader
            title="Access products"
            description="Practice Pass catalog for questionbank access."
            className="mb-0"
          />
          <div className="flex gap-2">
            <AdminIconAction
              label="Refresh"
              icon={RefreshCw}
              tone="primary"
              disabled={isFetching}
              onClick={() => void refetch()}
              className={isFetching ? "animate-spin" : undefined}
            />
            <Button type="button" size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              New product
            </Button>
          </div>
        </div>
        {error ? (
          <p className="px-5 py-3 text-sm text-accent">{(error as unknown as ApiError)?.message}</p>
        ) : null}
        <div className="divide-y divide-border">
          {products.length === 0 ? (
            <p className="px-5 py-10 text-center text-muted-foreground">No access products yet.</p>
          ) : null}
          {products.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div>
                <h3 className="font-semibold text-foreground">{p.title}</h3>
                <p className="text-sm text-muted-foreground">{richTextToPlain(p.description) || p.slug}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-md bg-muted px-2 py-0.5">{formatMoney(Number(p.price))}</span>
                  <span className="rounded-md bg-muted px-2 py-0.5">
                    {p.durationDays != null ? `${p.durationDays} days` : "Lifetime"}
                  </span>
                  <span className="rounded-md bg-muted px-2 py-0.5">
                    {p.program?.name ?? "All programs"}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 font-semibold",
                      p.isActive === false
                        ? "bg-muted text-muted-foreground"
                        : "bg-[#ecfdf3] text-accent-green"
                    )}
                  >
                    {p.isActive === false ? "Inactive" : "Active"}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => openEdit(p)}>
                  Edit
                </Button>
                {p.isActive !== false ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-accent"
                    onClick={() => {
                      if (window.confirm(`Deactivate "${p.title}"?`)) {
                        void deactivateProduct.mutateAsync(p.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      <AdminModal
        open={modal != null}
        title={modal === "edit" ? "Edit access product" : "New access product"}
        onClose={() => !busy && setModal(null)}
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" disabled={busy} onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button type="button" disabled={busy} onClick={() => void onSave()}>
              {busy ? "Saving..." : "Save"}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Input
            placeholder="Title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (modal === "create") setSlug(slugify(e.target.value));
            }}
          />
          <Input placeholder="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
          <RichTextEditor
            placeholder="Description"
            value={description}
            onChange={setDescription}
            minHeight="100px"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="font-semibold">Price (BDT)</span>
              <Input value={price} onChange={(e) => setPrice(e.target.value)} />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-semibold">Duration days (blank = lifetime)</span>
              <Input value={durationDays} onChange={(e) => setDurationDays(e.target.value)} />
            </label>
          </div>
          <label className="block space-y-1 text-sm">
            <span className="font-semibold">Program scope</span>
            <select
              value={programId}
              onChange={(e) => setProgramId(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
            >
              <option value="">All programs</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          {actionError ? <p className="text-sm text-accent">{actionError}</p> : null}
        </div>
      </AdminModal>
    </>
  );
}
