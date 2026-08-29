"use client";

import { useEffect, useMemo, useState } from "react";

export const STUDENT_LIST_PAGE_SIZE = 10;

export function useClientPagination<T>(items: T[], pageSize = STUDENT_LIST_PAGE_SIZE) {
  const [page, setPage] = useState(1);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return {
    page,
    setPage,
    pageItems,
    pageSize,
    total,
    totalPages,
    from,
    to,
    showPagination: total > pageSize,
  };
}
