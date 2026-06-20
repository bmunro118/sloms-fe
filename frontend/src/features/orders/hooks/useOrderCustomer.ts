import { useEffect, useState } from 'react';
import { getCustomer } from '@src/features/customers/api';

type UseOrderCustomerResult = {
  customerName: string | null;
  customerAccountNumber: string | null;
  isLoading: boolean;
};

export function useOrderCustomer(customerId: number | undefined): UseOrderCustomerResult {
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [customerAccountNumber, setCustomerAccountNumber] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!customerId) {
      setCustomerName(null);
      setCustomerAccountNumber(null);
      return;
    }
    const controller = new AbortController();
    setIsLoading(true);
    getCustomer(customerId, { signal: controller.signal })
      .then((customer) => {
        if (!controller.signal.aborted) {
          setCustomerName(customer.companyName ?? null);
          setCustomerAccountNumber(customer.accountNumber ?? null);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          if (__DEV__) console.log('[order-detail] customer fetch failed', err);
          setCustomerName(null);
          setCustomerAccountNumber(null);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => { controller.abort(); };
  }, [customerId]);

  return { customerName, customerAccountNumber, isLoading };
}
