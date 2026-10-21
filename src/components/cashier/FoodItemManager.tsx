'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { Badge } from '@/components/common/Badge';
import {
  Utensils,
  Plus,
  Edit2,
  Search,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Tag,
  ImageIcon,
  Upload,
  ShieldCheck,
} from 'lucide-react';

interface FoodItem {
  foodItemId: string;
  name: string;
  sellingPrice: number;
  staffPrice: number;
  unit: string;
  shelfLifeDays: number;
  imageUrl?: string;
  priceHistory?: Array<{
    sellingPrice: number;
    staffPrice: number;
    effectiveDate: string;
    changedBy?: string;
  }>;
  status: 'ACTIVE' | 'INACTIVE';
}

interface FoodItemManagerProps {
  currentCashier: {
    fullName: string;
    employeeType: string;
  };
}

const UNIT_OPTIONS = [
  'Piece',
  'Portion',
  'Packet',
  'Plate',
  'Cup',
  'Bottle',
  'Box',
  'Kg',
  'g',
  'L',
  'ml',
  'Loaf',
  'Slice',
  'Set',
  'Roll',
  'Bun',
  'Tin',
  'Tray',
];

export function FoodItemManager({ currentCashier }: FoodItemManagerProps) {
  const { t, tr } = useLanguage();
  const [items, setItems] = useState<FoodItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Add Item Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSellingPrice, setNewSellingPrice] = useState('');
  const [newStaffPrice, setNewStaffPrice] = useState('');
  const [newUnit, setNewUnit] = useState('Piece');
  const [newShelfLife, setNewShelfLife] = useState('2');
  const [newImageUrl, setNewImageUrl] = useState('');

  // Edit Item Modal
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editSellingPrice, setEditSellingPrice] = useState('');
  const [editStaffPrice, setEditStaffPrice] = useState('');
  const [editUnit, setEditUnit] = useState('Piece');
  const [editShelfLife, setEditShelfLife] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchFoodItems();
  }, []);

  const fetchFoodItems = async () => {
    try {
      const res = await fetch('/api/food-items');
      const data = await res.json();
      if (data.success) {
        setItems(data.foodItems || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image file is too large (max 2MB).' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      if (isEdit) {
        setEditImageUrl(result);
      } else {
        setNewImageUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    try {
      const res = await fetch('/api/food-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          sellingPrice: Number(newSellingPrice),
          staffPrice: Number(newStaffPrice),
          unit: newUnit,
          shelfLifeDays: Number(newShelfLife),
          imageUrl: newImageUrl,
          actorUser: currentCashier.fullName,
          actorRole: currentCashier.employeeType,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to add item' });
      } else {
        setMessage({ type: 'success', text: `Food item "${newName}" added successfully!` });
        setShowAddModal(false);
        fetchFoodItems();
        setNewName('');
        setNewSellingPrice('');
        setNewStaffPrice('');
        setNewUnit('Piece');
        setNewShelfLife('2');
        setNewImageUrl('');
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleOpenEdit = (item: FoodItem) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditSellingPrice(String(item.sellingPrice));
    setEditStaffPrice(String(item.staffPrice));
    setEditShelfLife(String(item.shelfLifeDays));
    setEditUnit(item.unit || 'Piece');
    setEditImageUrl(item.imageUrl || '');
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      const res = await fetch('/api/food-items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          foodItemId: editingItem.foodItemId,
          updates: {
            name: editName,
            sellingPrice: Number(editSellingPrice),
            staffPrice: Number(editStaffPrice),
            unit: editUnit,
            shelfLifeDays: Number(editShelfLife),
            imageUrl: editImageUrl,
          },
          actorUser: currentCashier.fullName,
          actorRole: currentCashier.employeeType,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error });
      } else {
        setMessage({ type: 'success', text: `Food item "${editName}" updated successfully!` });
        setEditingItem(null);
        fetchFoodItems();
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleToggleStatus = async (item: FoodItem) => {
    const nextStatus = item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await fetch('/api/food-items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          foodItemId: item.foodItemId,
          updates: { status: nextStatus },
          actorUser: currentCashier.fullName,
          actorRole: currentCashier.employeeType,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({
          type: 'success',
          text: `Item "${item.name}" is now ${nextStatus.toLowerCase()}!`,
        });
        fetchFoodItems();
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.foodItemId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Utensils className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-bold text-stone-900">{t.nav.foodItems}</h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Configure bakery products, item photos, customer & staff prices, and shelf life parameters.
          </p>
        </div>

        <button
          onClick={() => {
            setNewName('');
            setNewSellingPrice('');
            setNewStaffPrice('');
            setNewUnit('Piece');
            setNewShelfLife('2');
            setNewImageUrl('');
            setShowAddModal(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center space-x-2 shadow-md shadow-amber-600/20 cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{t.foodItems.addItem}</span>
        </button>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between gap-2 border ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-stone-400 hover:text-stone-600 p-0.5 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white border border-stone-200 p-4 rounded-xl shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder={tr("Search by food item or code...")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-900 placeholder-stone-400 focus:outline-hidden focus:border-amber-500 focus:bg-white"
          />
        </div>
        <span className="text-xs text-stone-500">{filtered.length} {tr("items configured")}</span>
      </div>

      {/* Items Table */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-stone-600 font-semibold">
                <th className="py-3 px-4">{tr("Item Code")}</th>
                <th className="py-3 px-4">{tr("Food Item")}</th>
                <th className="py-3 px-4">{tr("Normal Price")}</th>
                <th className="py-3 px-4">{tr("Staff Price")}</th>
                <th className="py-3 px-4 text-center">{tr("Unit")}</th>
                <th className="py-3 px-4">{tr("Shelf Life")}</th>
                <th className="py-3 px-4">{tr("Status")}</th>
                <th className="py-3 px-4 text-right">{tr("Actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {filtered.map((item) => (
                <tr key={item.foodItemId} className="hover:bg-amber-50/50 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-amber-800">
                    {item.foodItemId}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200 overflow-hidden flex items-center justify-center shrink-0">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Utensils className="w-4 h-4 text-stone-400" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-stone-900">{tr(item.name)}</div>
                        <div className="text-[10px] text-stone-400 font-mono">
                          {item.foodItemId}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-black text-stone-900">
                    Rs. {item.sellingPrice}
                  </td>
                  <td className="py-3 px-4 font-bold text-orange-700">
                    Rs. {item.staffPrice}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold">
                      {tr(item.unit)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-stone-600 font-medium">
                    {item.shelfLifeDays} {tr("day(s)")}
                  </td>
                  <td className="py-3 px-4">
                    <Badge status={item.status} />
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-700 cursor-pointer"
                      title={tr("Edit Item & Photo")}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(item)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                        item.status === 'ACTIVE'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      {item.status === 'ACTIVE' ? tr("Deactivate") : tr("Activate")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD ITEM MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-lg w-full p-6 text-stone-900 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute right-4 top-4 text-stone-400 hover:text-stone-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-stone-900 mb-4">{t.foodItems.addItem}</h3>

            <form onSubmit={handleAddItem} className="space-y-4 text-xs">
              {/* Item Name */}
              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  {t.foodItems.name} *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Fish Pastry"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-hidden focus:border-amber-600"
                />
              </div>

              {/* Food Item Image Input & Live Preview */}
              <div className="space-y-2">
                <label className="block text-stone-700 font-semibold">
                  Food Item Image (Photo)
                </label>
                
                <div className="flex items-center gap-3">
                  <div className="w-20 h-20 rounded-xl bg-stone-100 border border-stone-300 overflow-hidden flex items-center justify-center shrink-0">
                    {newImageUrl ? (
                      <img src={newImageUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center text-stone-400 p-1">
                        <ImageIcon className="w-6 h-6 mx-auto opacity-50" />
                        <span className="text-[9px]">No photo</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      placeholder="Paste image URL (https://...)"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-hidden focus:border-amber-600 text-xs"
                    />

                    <div className="flex items-center space-x-2">
                      <label className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold cursor-pointer border border-stone-200 flex items-center space-x-1.5 text-xs transition-colors">
                        <Upload className="w-3.5 h-3.5 text-amber-600" />
                        <span>Upload File</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageFileChange(e, false)}
                          className="hidden"
                        />
                      </label>
                      {newImageUrl && (
                        <button
                          type="button"
                          onClick={() => setNewImageUrl('')}
                          className="text-[11px] text-rose-600 hover:underline cursor-pointer"
                        >
                          Remove photo
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Prices Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    {t.foodItems.sellingPrice} *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newSellingPrice}
                    onChange={(e) => setNewSellingPrice(e.target.value)}
                    placeholder="150"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-hidden focus:border-amber-600 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    {t.foodItems.staffPrice} *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newStaffPrice}
                    onChange={(e) => setNewStaffPrice(e.target.value)}
                    placeholder="100"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-hidden focus:border-amber-600 font-bold"
                  />
                </div>
              </div>

              {/* Unit Dropdown & Shelf Life */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    {t.foodItems.unit} *
                  </label>
                  <select
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 font-semibold focus:outline-hidden focus:border-amber-600 cursor-pointer"
                  >
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    {t.foodItems.shelfLifeDays} (Days) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newShelfLife}
                    onChange={(e) => setNewShelfLife(e.target.value)}
                    placeholder="2"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-hidden focus:border-amber-600"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-stone-100">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 font-bold text-xs text-white shadow-md shadow-amber-600/20 cursor-pointer transition-all"
                >
                  Save Food Item
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs cursor-pointer transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ITEM MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-lg w-full p-6 text-stone-900 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setEditingItem(null)}
              className="absolute right-4 top-4 text-stone-400 hover:text-stone-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-sm font-bold text-stone-900 mb-1">
              Edit Food Item: {editingItem.name}
            </h3>
            <p className="text-xs text-stone-500 mb-4 font-mono">
              Item Code: {editingItem.foodItemId}
            </p>

            <form onSubmit={handleUpdateItem} className="space-y-4 text-xs">
              {/* Name */}
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Food Item Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-hidden focus:border-amber-600"
                />
              </div>

              {/* Photo Input & Preview */}
              <div className="space-y-2">
                <label className="block text-stone-700 font-semibold">Food Item Image (Photo)</label>
                <div className="flex items-center gap-3">
                  <div className="w-20 h-20 rounded-xl bg-stone-100 border border-stone-300 overflow-hidden flex items-center justify-center shrink-0">
                    {editImageUrl ? (
                      <img src={editImageUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center text-stone-400 p-1">
                        <ImageIcon className="w-6 h-6 mx-auto opacity-50" />
                        <span className="text-[9px]">No photo</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      placeholder="Paste image URL (https://...)"
                      value={editImageUrl}
                      onChange={(e) => setEditImageUrl(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-hidden focus:border-amber-600 text-xs"
                    />

                    <div className="flex items-center space-x-2">
                      <label className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold cursor-pointer border border-stone-200 flex items-center space-x-1.5 text-xs transition-colors">
                        <Upload className="w-3.5 h-3.5 text-amber-600" />
                        <span>Upload File</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageFileChange(e, true)}
                          className="hidden"
                        />
                      </label>
                      {editImageUrl && (
                        <button
                          type="button"
                          onClick={() => setEditImageUrl('')}
                          className="text-[11px] text-rose-600 hover:underline cursor-pointer"
                        >
                          Remove photo
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Prices */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Selling Price (Customer) Rs. *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editSellingPrice}
                    onChange={(e) => setEditSellingPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 font-bold focus:outline-hidden focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Staff Price (Employee) Rs. *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editStaffPrice}
                    onChange={(e) => setEditStaffPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 font-bold focus:outline-hidden focus:border-amber-600"
                  />
                </div>
              </div>

              {/* Unit Dropdown & Shelf Life */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Unit *</label>
                  <select
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 font-semibold focus:outline-hidden focus:border-amber-600 cursor-pointer"
                  >
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Shelf Life (Days) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editShelfLife}
                    onChange={(e) => setEditShelfLife(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-hidden focus:border-amber-600"
                  />
                </div>
              </div>

              {/* Price Protection Policy Notice */}
              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-start space-x-2.5 text-xs text-amber-950">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold">Historical Price Protection:</span> Price adjustments only apply to future sales. All completed bills, historical sales records, and settlement summaries permanently retain the exact selling price applied at the time of sale.
                </div>
              </div>

              <div className="flex space-x-3 pt-3 border-t border-stone-100">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 font-bold text-xs text-white shadow-md shadow-amber-600/20 cursor-pointer transition-all"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs cursor-pointer transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
