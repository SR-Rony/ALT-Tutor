"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants";
import {
  paymentsService,
  type AccessProductInput,
  type CheckoutInput,
} from "@/services/payments.service";

export function useAccessProducts() {
  return useQuery({
    queryKey: queryKeys.payments.products,
    queryFn: () => paymentsService.listProducts(),
  });
}

export function useAdminAccessProducts() {
  return useQuery({
    queryKey: [...queryKeys.payments.products, "admin"] as const,
    queryFn: () => paymentsService.adminListProducts(),
  });
}

export function useCheckout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CheckoutInput) => paymentsService.checkout(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.student.payments });
    },
  });
}

export function useConfirmStubPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      transactionId: string;
      status: "SUCCESS" | "FAILED" | "CANCELLED";
    }) => paymentsService.confirmStub(payload.transactionId, payload.status),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.student.payments });
      void qc.invalidateQueries({ queryKey: queryKeys.student.courses });
    },
  });
}

export function usePaymentByTransaction(transactionId?: string) {
  return useQuery({
    queryKey: ["payments", "transaction", transactionId ?? ""],
    queryFn: () => paymentsService.getByTransaction(transactionId!),
    enabled: Boolean(transactionId),
    refetchInterval: (query) => {
      const status = String(query.state.data?.status ?? "").toUpperCase();
      const fulfilled = Boolean(query.state.data?.fulfilledAt);
      if (status === "SUCCESS" && fulfilled) return false;
      if (status === "FAILED" || status === "REFUNDED" || status === "CANCELLED") return false;
      return 2000;
    },
  });
}

export function useCreateAccessProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AccessProductInput) => paymentsService.createProduct(payload),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.payments.products }),
  });
}

export function useUpdateAccessProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<AccessProductInput> }) =>
      paymentsService.updateProduct(id, payload),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.payments.products }),
  });
}

export function useDeactivateAccessProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => paymentsService.deactivateProduct(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.payments.products }),
  });
}
