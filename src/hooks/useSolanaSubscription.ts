import { useEffect, useState, useCallback } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, AccountInfo } from "@solana/web3.js";

interface UseAccountSubscriptionOptions {
  onAccountChange?: (accountInfo: AccountInfo<Buffer> | null) => void;
}

export function useAccountSubscription(
  publicKey: PublicKey | null,
  options: UseAccountSubscriptionOptions = {}
) {
  const { connection } = useConnection();
  const [accountInfo, setAccountInfo] = useState<AccountInfo<Buffer> | null>(null);
  const [loading, setLoading] = useState(false);

  const { onAccountChange } = options;

  useEffect(() => {
    if (!publicKey) {
      setAccountInfo(null);
      return;
    }

    setLoading(true);

    // Fetch initial account info
    connection.getAccountInfo(publicKey).then((info) => {
      setAccountInfo(info);
      setLoading(false);
      onAccountChange?.(info);
    }).catch((error) => {
      console.error("Error fetching account info:", error);
      setLoading(false);
    });

    // Subscribe to account changes
    const subscriptionId = connection.onAccountChange(
      publicKey,
      (updatedAccountInfo) => {
        setAccountInfo(updatedAccountInfo);
        onAccountChange?.(updatedAccountInfo);
      },
      "confirmed"
    );

    return () => {
      connection.removeAccountChangeListener(subscriptionId);
    };
  }, [connection, publicKey?.toString(), onAccountChange]);

  return { accountInfo, loading };
}

// Hook for subscribing to multiple accounts
export function useMultipleAccountsSubscription(
  publicKeys: PublicKey[],
  onUpdate?: (pubkey: PublicKey, info: AccountInfo<Buffer> | null) => void
) {
  const { connection } = useConnection();
  const [accountsMap, setAccountsMap] = useState<Map<string, AccountInfo<Buffer> | null>>(new Map());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (publicKeys.length === 0) {
      setAccountsMap(new Map());
      return;
    }

    setLoading(true);
    const subscriptionIds: number[] = [];

    // Fetch initial account info for all
    Promise.all(
      publicKeys.map(async (pubkey) => {
        const info = await connection.getAccountInfo(pubkey);
        return { pubkey: pubkey.toString(), info };
      })
    ).then((results) => {
      const newMap = new Map<string, AccountInfo<Buffer> | null>();
      results.forEach(({ pubkey, info }) => {
        newMap.set(pubkey, info);
      });
      setAccountsMap(newMap);
      setLoading(false);
    }).catch((error) => {
      console.error("Error fetching accounts:", error);
      setLoading(false);
    });

    // Subscribe to each account
    publicKeys.forEach((pubkey) => {
      const subId = connection.onAccountChange(
        pubkey,
        (updatedInfo) => {
          setAccountsMap((prev) => {
            const newMap = new Map(prev);
            newMap.set(pubkey.toString(), updatedInfo);
            return newMap;
          });
          onUpdate?.(pubkey, updatedInfo);
        },
        "confirmed"
      );
      subscriptionIds.push(subId);
    });

    return () => {
      subscriptionIds.forEach((id) => {
        connection.removeAccountChangeListener(id);
      });
    };
  }, [connection, JSON.stringify(publicKeys.map(p => p.toString())), onUpdate]);

  return { accountsMap, loading };
}
