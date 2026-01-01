'use client';

import { useEffect, useState } from 'react';

export default function DebugProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProducts(data.data);
        } else {
          setError(data.error);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-4">
      <h1>Debug Products</h1>
      <table className="border-collapse border border-slate-400 w-full">
        <thead>
          <tr>
            <th className="border border-slate-300 p-2">Name</th>
            <th className="border border-slate-300 p-2">Base UOM (Raw)</th>
            <th className="border border-slate-300 p-2">Base UOM (Length)</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td className="border border-slate-300 p-2">{product.name}</td>
              <td className="border border-slate-300 p-2">'{product.baseUOM}'</td>
              <td className="border border-slate-300 p-2">{product.baseUOM?.length}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <pre className="mt-4 bg-gray-100 p-4 rounded overflow-auto">
        {JSON.stringify(products, null, 2)}
      </pre>
    </div>
  );
}
