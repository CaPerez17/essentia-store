"use client";

import { useState, useEffect, useCallback } from "react";

const ADMIN_KEY_STORAGE = "essentia_admin_key";

type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  stock: number;
};

export function AdminProductsClient({
  initialProducts,
}: {
  initialProducts: Product[];
}) {
  const [products, setProducts] = useState(initialProducts);
  const [edits, setEdits] = useState<Record<string, { stock?: number; price?: number }>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adminKey, setAdminKey] = useState("");
  const [keyPrompt, setKeyPrompt] = useState(true);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? sessionStorage.getItem(ADMIN_KEY_STORAGE) : null;
    if (stored) {
      setAdminKey(stored);
      setKeyPrompt(false);
    }
  }, []);

  const saveKey = useCallback(() => {
    if (adminKey.trim()) {
      sessionStorage.setItem(ADMIN_KEY_STORAGE, adminKey.trim());
      setKeyPrompt(false);
    }
  }, [adminKey]);

  const handleEdit = useCallback((productId: string, field: "stock" | "price", value: number) => {
    setEdits((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value,
      },
    }));
  }, []);

  const handleSave = useCallback(
    async (productId: string) => {
      const edit = edits[productId];
      if (!edit || (edit.stock === undefined && edit.price === undefined)) return;

      const key = sessionStorage.getItem(ADMIN_KEY_STORAGE);
      if (!key) {
        setError("Admin key required");
        setKeyPrompt(true);
        return;
      }

      setSaving(productId);
      setError(null);
      try {
        const res = await fetch("/api/admin/products/update", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-key": key,
          },
          body: JSON.stringify({
            productId,
            ...(edit.stock !== undefined && { stock: edit.stock }),
            ...(edit.price !== undefined && { price: edit.price }),
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Error");
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId
              ? {
                  ...p,
                  stock: edit.stock ?? p.stock,
                  price: edit.price ?? p.price,
                }
              : p
          )
        );
        setEdits((prev) => {
          const next = { ...prev };
          delete next[productId];
          return next;
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save");
      } finally {
        setSaving(null);
      }
    },
    [edits]
  );

  if (keyPrompt) {
    return (
      <div className="max-w-md mx-auto mt-12 p-6 border border-[var(--border)]">
        <h2 className="text-lg font-medium mb-4">Admin key</h2>
        <p className="text-sm text-[var(--text-muted)] mb-4">
          Enter your admin API key. It will be stored in sessionStorage for this session.
        </p>
        <input
          type="password"
          value={adminKey}
          onChange={(e) => setAdminKey(e.target.value)}
          placeholder="ADMIN_API_KEY"
          className="w-full border border-[var(--border)] px-3 py-2 mb-4"
        />
        <button
          type="button"
          onClick={saveKey}
          className="w-full border border-[var(--accent)] bg-[var(--accent)] text-white py-2 px-4"
        >
          Continue
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {error && (
        <p className="mb-4 text-sm text-red-600">{error}</p>
      )}
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-[var(--border)]">
            <th className="py-3 px-4 font-medium">Slug</th>
            <th className="py-3 px-4 font-medium">Name</th>
            <th className="py-3 px-4 font-medium">Brand</th>
            <th className="py-3 px-4 font-medium">Price</th>
            <th className="py-3 px-4 font-medium">Stock</th>
            <th className="py-3 px-4 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => {
            const edit = edits[p.id];
            const stockVal = edit?.stock ?? p.stock;
            const priceVal = edit?.price ?? p.price;
            const hasChanges =
              (edit?.stock !== undefined && edit.stock !== p.stock) ||
              (edit?.price !== undefined && edit.price !== p.price);

            return (
              <tr key={p.id} className="border-b border-[var(--border)]">
                <td className="py-3 px-4 text-sm text-[var(--text-muted)]">{p.slug}</td>
                <td className="py-3 px-4">{p.name}</td>
                <td className="py-3 px-4 text-sm">{p.brand}</td>
                <td className="py-3 px-4">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={priceVal}
                    onChange={(e) =>
                      handleEdit(p.id, "price", parseFloat(e.target.value) || 0)
                    }
                    className="w-24 border border-[var(--border)] px-2 py-1 text-sm"
                  />
                </td>
                <td className="py-3 px-4">
                  <input
                    type="number"
                    min="0"
                    value={stockVal}
                    onChange={(e) =>
                      handleEdit(p.id, "stock", parseInt(e.target.value, 10) || 0)
                    }
                    className="w-20 border border-[var(--border)] px-2 py-1 text-sm"
                  />
                </td>
                <td className="py-3 px-4">
                  <button
                    type="button"
                    onClick={() => handleSave(p.id)}
                    disabled={!hasChanges || saving === p.id}
                    className="border border-[var(--accent)] px-3 py-1 text-sm disabled:opacity-50"
                  >
                    {saving === p.id ? "Saving..." : "Save"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
