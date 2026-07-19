"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants";
import { paymentsService, type CheckoutInput } from "@/services/payments.service";

export function useAccessProducts() {
  return useQuery({
    queryKey: queryKeys.payments.products,
    queryFn: () => paymentsService.listProducts(),
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
