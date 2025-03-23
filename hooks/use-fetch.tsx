"use client"

import {useState} from "react";

type FetchCallback<TData, TArgs extends unknown[]> = (options: Record<string, unknown>, ...args: TArgs) => Promise<TData>;

const useFetch = <TData, TArgs extends unknown[] = unknown[]>(
  cb: FetchCallback<TData, TArgs>,
  options: Record<string, unknown> = {}
) => {
  const [data, setData] = useState<TData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fn = async (...args: TArgs) => {
    setLoading(true);
    setError(null);
    try {
      const response = await cb(options, ...args);
      setData(response);
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error : new Error('An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  return {data, loading, error, fn};
};

export default useFetch;