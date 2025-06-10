'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatCurrency } from '@/app/lib/utils';
import { createClient } from '@supabase/supabase-js'

// Types
interface AssetItem {
  id: string;
  category: string;
  amount: number;
  customCategory?: string;
}

interface LiabilityItem {
  id: string;
  category: string;
  amount: number;
  customCategory?: string;
}

interface NetWorthEntry {
  id: string;
  date: string;
  assets: AssetItem[];
  liabilities: LiabilityItem[];
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  notes?: string;
}

const ASSET_CATEGORIES = [
  'Cash',
  'Stocks',
  'Crypto',
  'Real Estate/Property',
  'Other Investments',
  'Other'
];

const LIABILITY_CATEGORIES = [
  'Credit Cards',
  'Student Loans',
  'Car Loans',
  'Mortgages',
  'Other Loans',
  'Other'
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function NetWorthPage() {
  const [entries, setEntries] = useState<NetWorthEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState<NetWorthEntry | null>(null);
  const [inputMode, setInputMode] = useState<'total' | 'breakdown'>('total');
  const [showAssetsBreakdown, setShowAssetsBreakdown] = useState(false);
  const [showLiabilitiesBreakdown, setShowLiabilitiesBreakdown] = useState(false);

  const [totalAssets, setTotalAssets] = useState<number>(0);
  const [totalLiabilities, setTotalLiabilities] = useState<number>(0);
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [liabilities, setLiabilities] = useState<LiabilityItem[]>([]);
  const [currentNetWorth, setCurrentNetWorth] = useState<number>(0);

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Load entries from localStorage
    const savedEntries = localStorage.getItem('netWorthEntries');
    if (savedEntries) {
      const parsedEntries = JSON.parse(savedEntries);
      setEntries(parsedEntries);
      
      // Set current entry to the most recent entry
      if (parsedEntries.length > 0) {
        const mostRecentEntry = parsedEntries[0]; // Entries are already sorted by date
        setCurrentEntry(mostRecentEntry);
        setCurrentNetWorth(mostRecentEntry.netWorth);
      }
    }
  }, []);

  // Update current net worth whenever assets or liabilities change
  useEffect(() => {
    const { netWorth } = calculateNetWorth(assets, liabilities);
    setCurrentNetWorth(netWorth);
  }, [assets, liabilities]);

  const calculateNetWorth = (assets: AssetItem[], liabilities: LiabilityItem[]) => {
    const totalAssets = assets.reduce((sum, item) => sum + item.amount, 0);
    const totalLiabilities = liabilities.reduce((sum, item) => sum + item.amount, 0);
    return {
      totalAssets,
      totalLiabilities,
      netWorth: totalAssets - totalLiabilities
    };
  };

  // Helper to merge and sum items by category (for both assets and liabilities)
  function mergeItems(existing: AssetItem[] | LiabilityItem[], incoming: AssetItem[] | LiabilityItem[]): (AssetItem | LiabilityItem)[] {
    const map = new Map();
    for (const item of existing) {
      const key = item.category === 'Other' ? (item.customCategory || 'Other') : item.category;
      map.set(key, { ...item });
    }
    for (const item of incoming) {
      const key = item.category === 'Other' ? (item.customCategory || 'Other') : item.category;
      if (map.has(key)) {
        map.get(key).amount += item.amount;
      } else {
        map.set(key, { ...item });
      }
    }
    return Array.from(map.values());
  }

  const saveEntry = () => {
    const today = new Date().toISOString().split('T')[0];
    const existingEntryIndex = entries.findIndex(entry => entry.date.split('T')[0] === today);

    // Prepare new assets/liabilities arrays
    const newAssets = inputMode === 'total'
      ? [{ id: '1', category: 'Total', amount: totalAssets }]
      : assets;
    const newLiabilities = inputMode === 'total'
      ? [{ id: '1', category: 'Total', amount: totalLiabilities }]
      : liabilities;

    let mergedAssets = newAssets;
    let mergedLiabilities = newLiabilities;
    let id = Date.now().toString();
    let date = new Date().toISOString();

    if (existingEntryIndex !== -1) {
      // Merge with existing entry
      const existing = entries[existingEntryIndex];
      mergedAssets = mergeItems(existing.assets, newAssets);
      mergedLiabilities = mergeItems(existing.liabilities, newLiabilities);
      id = existing.id;
      date = existing.date; // keep original timestamp for sorting
    }

    const totalAssetsValue = mergedAssets.reduce((sum, item) => sum + item.amount, 0);
    const totalLiabilitiesValue = mergedLiabilities.reduce((sum, item) => sum + item.amount, 0);
    const netWorthValue = totalAssetsValue - totalLiabilitiesValue;

    const newEntry: NetWorthEntry = {
      id,
      date,
      assets: mergedAssets,
      liabilities: mergedLiabilities,
      totalAssets: totalAssetsValue,
      totalLiabilities: totalLiabilitiesValue,
      netWorth: netWorthValue,
    };

    let updatedEntries;
    if (existingEntryIndex === -1) {
      updatedEntries = [...entries, newEntry];
    } else {
      updatedEntries = [...entries];
      updatedEntries[existingEntryIndex] = newEntry;
    }
    updatedEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setEntries(updatedEntries);
    setCurrentEntry(newEntry);
    localStorage.setItem('netWorthEntries', JSON.stringify(updatedEntries));
    if (inputMode === 'total') {
      setTotalAssets(0);
      setTotalLiabilities(0);
    } else {
      setAssets([]);
      setLiabilities([]);
    }
  };

  // Delete entry by id
  const deleteEntry = (id: string) => {
    const updatedEntries = entries.filter(entry => entry.id !== id);
    setEntries(updatedEntries);
    localStorage.setItem('netWorthEntries', JSON.stringify(updatedEntries));
    if (currentEntry && currentEntry.id === id) {
      setCurrentEntry(null);
    }
  };

  const addAssetItem = () => {
    const newItem: AssetItem = {
      id: Date.now().toString(),
      category: ASSET_CATEGORIES[0],
      amount: 0
    };
    setAssets([...assets, newItem]);
  };

  const addLiabilityItem = () => {
    const newItem: LiabilityItem = {
      id: Date.now().toString(),
      category: LIABILITY_CATEGORIES[0],
      amount: 0
    };
    setLiabilities([...liabilities, newItem]);
  };

  const updateAssetItem = (id: string, field: keyof AssetItem, value: string | number) => {
    setAssets(assets.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const updateLiabilityItem = (id: string, field: keyof LiabilityItem, value: string | number) => {
    setLiabilities(liabilities.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const removeAssetItem = (id: string) => {
    setAssets(assets.filter(item => item.id !== id));
  };

  const removeLiabilityItem = (id: string) => {
    setLiabilities(liabilities.filter(item => item.id !== id));
  };

  const getChartData = () => {
    return entries.map(entry => ({
      date: new Date(entry.date).toLocaleDateString('de-DE', { month: 'short', year: 'numeric' }),
      netWorth: entry.netWorth,
      assets: entry.totalAssets,
      liabilities: entry.totalLiabilities
    }));
  };

  const getAssetChartData = () => {
    return assets.map(item => ({
      name: item.category === 'Other' ? item.customCategory || 'Other' : item.category,
      value: item.amount
    }));
  };

  const getLiabilityChartData = () => {
    return liabilities.map(item => ({
      name: item.category === 'Other' ? item.customCategory || 'Other' : item.category,
      value: item.amount
    }));
  };

  // Helper to get the most recent entry robustly
  const sortedEntries = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const mostRecentEntry = sortedEntries[0] || null;

  // Debug logs
  if (isClient) {
    console.log('Net Worth Entries:', entries);
    console.log('Most Recent Entry:', mostRecentEntry);
  }

  if (!isClient) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Net Worth Tracker</h1>
      
      {/* Total Net Worth Card */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-6 mb-8 text-white">
        <h2 className="text-2xl font-semibold mb-2">Total Net Worth</h2>
        <div className="text-4xl font-bold mb-2">
          {mostRecentEntry ? formatCurrency(mostRecentEntry.netWorth) : '$0.00'}
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
          <div>
            <p className="text-blue-200">Total Assets</p>
            <p className="text-xl font-semibold">{mostRecentEntry ? formatCurrency(mostRecentEntry.totalAssets) : '$0.00'}</p>
          </div>
          <div>
            <p className="text-blue-200">Total Liabilities</p>
            <p className="text-xl font-semibold">{mostRecentEntry ? formatCurrency(mostRecentEntry.totalLiabilities) : '$0.00'}</p>
          </div>
        </div>
      </div>

      {/* Input Mode Selection */}
      <div className="mb-8">
        <div className="flex gap-4">
          <button
            className={`px-4 py-2 rounded ${
              inputMode === 'total' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
            onClick={() => setInputMode('total')}
          >
            Enter Total Only
          </button>
          <button
            className={`px-4 py-2 rounded ${
              inputMode === 'breakdown' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
            onClick={() => setInputMode('breakdown')}
          >
            View/Add Breakdown
          </button>
        </div>
      </div>

      {/* Input Forms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Assets Section */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4">Assets</h3>
          {inputMode === 'total' ? (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Assets
              </label>
              <input
                type="number"
                value={totalAssets}
                onChange={(e) => setTotalAssets(Number(e.target.value))}
                className="w-full p-2 border rounded"
                placeholder="Enter total assets"
              />
            </div>
          ) : (
            <div>
              {assets.map((item) => (
                <div key={item.id} className="mb-4 p-4 border rounded">
                  <div className="flex justify-between mb-2">
                    <select
                      value={item.category}
                      onChange={(e) => updateAssetItem(item.id, 'category', e.target.value)}
                      className="p-2 border rounded"
                    >
                      {ASSET_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => removeAssetItem(item.id)}
                      className="text-red-500"
                    >
                      Remove
                    </button>
                  </div>
                  {item.category === 'Other' && (
                    <input
                      type="text"
                      value={item.customCategory || ''}
                      onChange={(e) => updateAssetItem(item.id, 'customCategory', e.target.value)}
                      className="w-full p-2 border rounded mb-2"
                      placeholder="Specify category"
                    />
                  )}
                  <input
                    type="number"
                    value={item.amount}
                    onChange={(e) => updateAssetItem(item.id, 'amount', Number(e.target.value))}
                    className="w-full p-2 border rounded"
                    placeholder="Enter amount"
                  />
                </div>
              ))}
              <button
                onClick={addAssetItem}
                className="w-full p-2 bg-blue-500 text-white rounded mt-2"
              >
                Add Asset Item
              </button>
            </div>
          )}
        </div>

        {/* Liabilities Section */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4">Liabilities</h3>
          {inputMode === 'total' ? (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Liabilities
              </label>
              <input
                type="number"
                value={totalLiabilities}
                onChange={(e) => setTotalLiabilities(Number(e.target.value))}
                className="w-full p-2 border rounded"
                placeholder="Enter total liabilities"
              />
            </div>
          ) : (
            <div>
              {liabilities.map((item) => (
                <div key={item.id} className="mb-4 p-4 border rounded">
                  <div className="flex justify-between mb-2">
                    <select
                      value={item.category}
                      onChange={(e) => updateLiabilityItem(item.id, 'category', e.target.value)}
                      className="p-2 border rounded"
                    >
                      {LIABILITY_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => removeLiabilityItem(item.id)}
                      className="text-red-500"
                    >
                      Remove
                    </button>
                  </div>
                  {item.category === 'Other' && (
                    <input
                      type="text"
                      value={item.customCategory || ''}
                      onChange={(e) => updateLiabilityItem(item.id, 'customCategory', e.target.value)}
                      className="w-full p-2 border rounded mb-2"
                      placeholder="Specify category"
                    />
                  )}
                  <input
                    type="number"
                    value={item.amount}
                    onChange={(e) => updateLiabilityItem(item.id, 'amount', Number(e.target.value))}
                    className="w-full p-2 border rounded"
                    placeholder="Enter amount"
                  />
                </div>
              ))}
              <button
                onClick={addLiabilityItem}
                className="w-full p-2 bg-blue-500 text-white rounded mt-2"
              >
                Add Liability Item
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="text-center mb-8">
        <button
          onClick={saveEntry}
          className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600"
        >
          Save Entry
        </button>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Net Worth History Chart */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4">Net Worth History</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={getChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Line type="monotone" dataKey="netWorth" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Assets Breakdown Chart */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4">Assets Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={getAssetChartData()}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {getAssetChartData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Liabilities Breakdown Chart */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4">Liabilities Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={getLiabilityChartData()}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {getLiabilityChartData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4">History</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Net Worth</th>
                <th className="px-4 py-2">Assets</th>
                <th className="px-4 py-2">Liabilities</th>
                <th className="px-4 py-2">Change</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => (
                <tr key={entry.id}>
                  <td className="px-4 py-2 border">
                    {new Date(entry.date).toLocaleDateString('de-DE')}
                  </td>
                  <td className="px-4 py-2 border">{formatCurrency(entry.netWorth)}</td>
                  <td className="px-4 py-2 border">{formatCurrency(entry.totalAssets)}</td>
                  <td className="px-4 py-2 border">{formatCurrency(entry.totalLiabilities)}</td>
                  <td className="px-4 py-2 border">
                    {index > 0
                      ? formatCurrency(entry.netWorth - entries[index - 1].netWorth)
                      : '-'}
                  </td>
                  <td className="px-4 py-2 border text-center">
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      className="text-red-600 hover:text-red-800 font-bold px-2"
                      title="Delete entry"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 