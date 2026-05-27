import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function TestData() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: categories, error: catError } = await supabase
          .from('menu_categories')
          .select('*')
          .order('display_order');

        const { data: items, error: itemsError } = await supabase
          .from('menu_items')
          .select('*')
          .order('display_order')
          .limit(10);

        const { data: locations, error: locError } = await supabase
          .from('locations')
          .select('*');

        setData({
          categories: categories || [],
          items: items || [],
          locations: locations || [],
          errors: {
            catError,
            itemsError,
            locError
          }
        });
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-4">Loading Database Data...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold mb-6 text-green-600">Database Connection Test</h1>

        <div className="mb-6">
          <h2 className="text-xl font-bold mb-2">Categories ({data?.categories?.length || 0})</h2>
          <div className="bg-gray-50 p-4 rounded overflow-auto max-h-60">
            <pre className="text-sm">{JSON.stringify(data?.categories, null, 2)}</pre>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-bold mb-2">Menu Items (first 10 of {data?.items?.length || 0})</h2>
          <div className="bg-gray-50 p-4 rounded overflow-auto max-h-60">
            <pre className="text-sm">{JSON.stringify(data?.items, null, 2)}</pre>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-bold mb-2">Locations ({data?.locations?.length || 0})</h2>
          <div className="bg-gray-50 p-4 rounded overflow-auto max-h-60">
            <pre className="text-sm">{JSON.stringify(data?.locations, null, 2)}</pre>
          </div>
        </div>

        {data?.errors && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2 text-red-600">Errors</h2>
            <div className="bg-red-50 p-4 rounded">
              <pre className="text-sm">{JSON.stringify(data?.errors, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
