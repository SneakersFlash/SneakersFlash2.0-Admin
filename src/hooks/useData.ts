'use client';
/**
 * src/hooks/useProducts.ts
 * Generic data-fetching hook pattern used by all modules.
 * Each hook owns its own state: data, loading, error, pagination.
 */

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/api';
import ProductService from '@/services/products.service';
import OrderService from '@/services/orders.service';
import { VoucherService } from '@/services/other.service';
import type { Product, ProductFilters } from '@/types/product.types';
import type { Order, OrderFilters } from '@/types/order.types';
import type { Voucher } from '@/types';
import type { PaginationMeta, PaginationParams } from '@/types/api.types';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';

// ─── Generic hook factory ────────────────────────────────────────────────────

interface UseListState<T> {
  data: T[];
  meta: PaginationMeta | null;
  isLoading: boolean;
  error: string | null;
  page: number;
  pageSize: number;
  setPage: (p: number) => void;
  setPageSize: (s: number) => void;
  refresh: () => void;
}

// ─── useProducts ─────────────────────────────────────────────────────────────

export function useProducts(filters?: ProductFilters): UseListState<Product> {
  const [data, setData] = useState<Product[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    ProductService.getAll({ page, limit: pageSize, ...filters })
      .then((res) => {
        if (cancelled) return;
        setData(res.data);
        setMeta(res.meta);
      })
      .catch((err) => {
        if (cancelled) return;
        const msg = getErrorMessage(err);
        setError(msg);
        toast.error(msg);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, tick, JSON.stringify(filters)]);

  return { data, meta, isLoading, error, page, pageSize, setPage, setPageSize, refresh };
}

// ─── useOrders ───────────────────────────────────────────────────────────────

export function useOrders(filters?: OrderFilters): UseListState<Order> {
  const [data, setData] = useState<Order[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    OrderService.getAll({ page, limit: pageSize, ...filters })
      .then((res) => {
        if (!cancelled) { setData(res.data); setMeta(res.meta); }
      })
      .catch((err) => {
        if (!cancelled) toast.error(getErrorMessage(err));
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, tick, JSON.stringify(filters)]);

  return { data, meta, isLoading, error, page, pageSize, setPage, setPageSize, refresh };
}

// ─── useVouchers ─────────────────────────────────────────────────────────────

export function useVouchers(): UseListState<Voucher> {
  const [data, setData] = useState<Voucher[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    VoucherService.getAll({ page, limit: pageSize })
      .then((res) => {
        if (!cancelled) { setData(res.data); setMeta(res.meta); }
      })
      .catch((err) => {
        if (!cancelled) toast.error(getErrorMessage(err));
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, [page, pageSize, tick]);

  return { data, meta, isLoading, error, page, pageSize, setPage, setPageSize, refresh };
}
