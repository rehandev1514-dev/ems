import { useState, useEffect, useCallback, useMemo, useRef } from "react";

type QueryKey = string[];

// Global event emitter for query invalidation
const queryEvents = new EventTarget();

export function useQueryClient() {
  return useMemo(
    () => ({
      invalidateQueries: ({ queryKey }: { queryKey: QueryKey }) => {
        const eventName = queryKey[0] ?? JSON.stringify(queryKey); // simplistic invalidation matching the first key part
        queryEvents.dispatchEvent(new Event(`invalidate-${eventName}`));
      },
    }),
    [],
  );
}

export function useQuery<T>({
  queryKey,
  queryFn,
}: {
  queryKey: QueryKey;
  queryFn: () => Promise<T>;
}) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const queryFnRef = useRef(queryFn);
  const requestIdRef = useRef(0);
  const mountedRef = useRef(false);
  const queryKeyHash = JSON.stringify(queryKey);
  const eventName = queryKey[0] ?? queryKeyHash;

  queryFnRef.current = queryFn;

  const fetchData = useCallback(async () => {
    if (!mountedRef.current) return;

    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    try {
      const result = await queryFnRef.current();
      if (!mountedRef.current || requestId !== requestIdRef.current) return;

      setData(result);
      setError(null);
    } catch (err: unknown) {
      if (!mountedRef.current || requestId !== requestIdRef.current) return;

      setError(err instanceof Error ? err : new Error("Query failed"));
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();

    // Listen for invalidations
    const listener = () => fetchData();
    queryEvents.addEventListener(`invalidate-${eventName}`, listener);

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
      queryEvents.removeEventListener(`invalidate-${eventName}`, listener);
    };
  }, [eventName, fetchData, queryKeyHash]);

  return { data, isLoading, error, refetch: fetchData };
}

export function useMutation<TData, TVariables>({
  mutationFn,
  onSuccess,
  onError,
}: {
  mutationFn: (vars: TVariables) => Promise<TData>;
  onSuccess?: (data: TData) => void;
  onError?: (err: Error) => void;
}) {
  const [isPending, setIsPending] = useState(false);

  const mutate = async (vars?: TVariables) => {
    setIsPending(true);
    try {
      const data = await mutationFn(vars as TVariables);
      onSuccess?.(data);
    } catch (err: any) {
      onError?.(err);
    } finally {
      setIsPending(false);
    }
  };

  return { mutate, isPending };
}
