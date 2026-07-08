import { useCallback, useEffect, useMemo, useState } from 'react';
import { Address, CustomerRecord, listAddresses, listCustomers } from '@src/features/customers/api';
import { PriceListItem, listPriceListItems } from '@src/features/price-list/api';

export interface CreateOrderData {
  customers: CustomerRecord[];
  customerOptions: { value: number; label: string }[];
  isLoadingCustomers: boolean;
  deliveryAddresses: Address[];
  deliveryAddressOptions: { value: number; label: string }[];
  isLoadingDeliveryAddresses: boolean;
  priceList: PriceListItem[];
  isLoadingPriceList: boolean;
  selectedCustomer: CustomerRecord | undefined;
}

export function useCreateOrderData(customerAccount: number | null): CreateOrderData {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [deliveryAddresses, setDeliveryAddresses] = useState<Address[]>([]);
  const [isLoadingDeliveryAddresses, setIsLoadingDeliveryAddresses] = useState(false);
  const [priceList, setPriceList] = useState<PriceListItem[]>([]);
  const [isLoadingPriceList, setIsLoadingPriceList] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoadingCustomers(true);
    listCustomers({ limit: 100 }, { signal: controller.signal })
      .then((res) => {
        if (!controller.signal.aborted) {
          setCustomers(res.data ?? []);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingCustomers(false);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (customerAccount === null) {
      setDeliveryAddresses([]);
      return;
    }
    const controller = new AbortController();
    setIsLoadingDeliveryAddresses(true);
    listAddresses(customerAccount, { signal: controller.signal })
      .then((response) => {
        if (controller.signal.aborted) return;
        const nextAddresses = Array.isArray(response.data) ? response.data : [];
        setDeliveryAddresses(nextAddresses);
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          console.error('[OrderCreate] Failed to load customer addresses:', err);
          setDeliveryAddresses([]);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingDeliveryAddresses(false);
      });

    return () => controller.abort();
  }, [customerAccount]);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoadingPriceList(true);
    listPriceListItems(undefined, { signal: controller.signal })
      .then((plResponse) => {
        if (!controller.signal.aborted) {
          const plData = Array.isArray(plResponse) ? plResponse : plResponse.data ?? [];
          setPriceList(plData);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingPriceList(false);
      });
    return () => controller.abort();
  }, []);

  const customerOptions = useMemo(
    () =>
      customers.map((c) => ({
        value: c.customerId,
        label: c.accountNumber ? `${c.accountNumber} — ${c.companyName}` : c.companyName,
      })),
    [customers]
  );

  const deliveryAddressOptions = useMemo(() => {
    return deliveryAddresses.map((address, index) => {
      const line = address.delAddressLn1 ?? address.delPostCode ?? `Address ${index + 1}`;
      const city = address.delTownOrCity ? `, ${address.delTownOrCity}` : '';
      const defaultBadge = address.defaultAddress ? ' (Default)' : '';
      return {
        value: address.addressId,
        label: `${line}${city}${defaultBadge}`,
      };
    });
  }, [deliveryAddresses]);

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.customerId === customerAccount),
    [customers, customerAccount]
  );

  return useMemo(
    () => ({
      customers,
      customerOptions,
      isLoadingCustomers,
      deliveryAddresses,
      deliveryAddressOptions,
      isLoadingDeliveryAddresses,
      priceList,
      isLoadingPriceList,
      selectedCustomer,
    }),
    [
      customers,
      customerOptions,
      isLoadingCustomers,
      deliveryAddresses,
      deliveryAddressOptions,
      isLoadingDeliveryAddresses,
      priceList,
      isLoadingPriceList,
      selectedCustomer,
    ]
  );
}
