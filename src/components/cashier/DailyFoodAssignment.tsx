'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import {
  CalendarDays,
  Plus,
  User,
  Utensils,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
} from 'lucide-react';

interface FoodItem {
  foodItemId: string;
  name: string;
  status: string;
}

interface Employee {
  employeeId: string;
  fullName: string;
  employeeType: string;
  status: string;
}

interface Assignment {
  assignmentId: string;
  date: string;
  foodItemId: string;
  foodItemName: string;
  kitchenStaffId: string;
  kitchenStaffName: string;
  assignedQuantity: number;
  createdBy: string;
}

interface DailyFoodAssignmentProps {
  currentCashier: {
    fullName: string;
  };
}

export function DailyFoodAssignment({ currentCashier }: DailyFoodAssignmentProps) {
  const { t, tr } = useLanguage();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [kitchenStaff, setKitchenStaff] = useState<Employee[]>([]);

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedFoodId, setSelectedFoodId] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [assignedQty, setAssignedQty] = useState('');

  // Modals state
  const [viewingAssignment, setViewingAssignment] = useState<Assignment | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [deletingAssignment, setDeletingAssignment] = useState<Assignment | null>(null);

  // Edit form state
  const [editFoodId, setEditFoodId] = useState('');
  const [editStaffId, setEditStaffId] = useState('');
  const [editQty, setEditQty] = useState('');
  const [editDate, setEditDate] = useState('');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    try {
      const [asgRes, itemsRes, empsRes] = await Promise.all([
        fetch(`/api/assignments?date=${selectedDate}`),
        fetch('/api/food-items'),
        fetch('/api/employees'),
      ]);

      const asgData = await asgRes.json();
      const itemsData = await itemsRes.json();
      const empsData = await empsRes.json();

      if (asgData.success) setAssignments(asgData.assignments);
      if (itemsData.success) setFoodItems(itemsData.foodItems.filter((f: any) => f.status === 'ACTIVE'));
      if (empsData.success) {
        const staff = empsData.employees.filter(
          (e: any) => e.employeeType === 'KITCHEN' && e.status === 'ACTIVE'
        );
        setKitchenStaff(staff);
        if (staff.length > 0 && !selectedStaffId) setSelectedStaffId(staff[0].employeeId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFoodId || !selectedStaffId || !assignedQty) {
      setMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          foodItemId: selectedFoodId,
          kitchenStaffId: selectedStaffId,
          assignedQuantity: Number(assignedQty),
          createdBy: currentCashier.fullName,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to assign' });
      } else {
        setMessage({ type: 'success', text: 'Daily assignment recorded successfully!' });
        setAssignedQty('');
        fetchData();
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (asg: Assignment) => {
    setEditingAssignment(asg);
    setEditFoodId(asg.foodItemId);
    setEditStaffId(asg.kitchenStaffId);
    setEditQty(String(asg.assignedQuantity));
    setEditDate(asg.date);
  };

  const handleUpdateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAssignment || !editFoodId || !editStaffId || !editQty) return;

    setIsUpdating(true);

    try {
      const res = await fetch('/api/assignments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: editingAssignment.assignmentId,
          date: editDate,
          foodItemId: editFoodId,
          kitchenStaffId: editStaffId,
          assignedQuantity: Number(editQty),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to update assignment' });
      } else {
        setMessage({ type: 'success', text: `Assignment for ${data.assignment.foodItemName} updated successfully!` });
        setEditingAssignment(null);
        fetchData();
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAssignment = async () => {
    if (!deletingAssignment) return;

    setIsDeleting(true);

    try {
      const res = await fetch(`/api/assignments?assignmentId=${encodeURIComponent(deletingAssignment.assignmentId)}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to delete assignment' });
      } else {
        setMessage({ type: 'success', text: `Assignment for ${deletingAssignment.foodItemName} deleted successfully!` });
        setDeletingAssignment(null);
        fetchData();
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <CalendarDays className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-bold text-stone-900">{t.nav.foodAssignment}</h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Rule 9: Assignments are daily, not permanent. Accurately links preparation & sales to staff.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200">
          <span className="text-xs text-stone-500 font-medium">Date:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent text-xs text-stone-900 font-medium focus:outline-hidden"
          />
        </div>
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
          <button onClick={() => setMessage(null)} className="text-stone-400 hover:text-stone-600 p-0.5 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Assignment Form & Current List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assignment Form Card */}
        <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-xs space-y-4">
          <h3 className="font-bold text-stone-900 text-sm">{tr("New Daily Assignment")}</h3>

          <form onSubmit={handleCreateAssignment} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-stone-700 font-semibold mb-1">
                {tr("Select Food Item *")}
              </label>
              <select
                required
                value={selectedFoodId}
                onChange={(e) => setSelectedFoodId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-hidden focus:border-amber-600"
              >
                <option value="">{tr("-- Choose Food Item --")}</option>
                {foodItems.map((f) => (
                  <option key={f.foodItemId} value={f.foodItemId}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-stone-700 font-semibold mb-1">
                {tr("Assign To Kitchen Staff *")}
              </label>
              <select
                required
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-hidden focus:border-amber-600"
              >
                <option value="">{tr("-- Choose Kitchen Staff --")}</option>
                {kitchenStaff.map((k) => (
                  <option key={k.employeeId} value={k.employeeId}>
                    {k.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-stone-700 font-semibold mb-1">
                {tr("Prepared Qty (Units) *")}
              </label>
              <input
                type="number"
                min="1"
                required
                placeholder="e.g. 50"
                value={assignedQty}
                onChange={(e) => setAssignedQty(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 font-bold focus:outline-hidden focus:border-amber-600"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md shadow-amber-600/20 cursor-pointer transition-all disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{tr("Assign to Kitchen Staff")}</span>
            </button>
          </form>
        </div>

        {/* Assignments Table */}
        <div className="lg:col-span-2 bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <h3 className="font-bold text-stone-900 text-sm">
              {tr("Assigned Items for")} {selectedDate}
            </h3>
            <span className="text-xs text-stone-500">{assignments.length} {tr("assignments")}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-stone-600 font-semibold">
                  <th className="py-2.5 px-3">{tr("Food Item")}</th>
                  <th className="py-2.5 px-3">{tr("Kitchen Staff")}</th>
                  <th className="py-2.5 px-3 text-center">{tr("Prepared Qty")}</th>
                  <th className="py-2.5 px-3">{tr("Assigned By")}</th>
                  <th className="py-2.5 px-3 text-center">{tr("Actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {assignments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-stone-400">
                      {tr("No assignments recorded for this date.")}
                    </td>
                  </tr>
                ) : (
                  assignments.map((a) => (
                    <tr key={a.assignmentId} className="hover:bg-amber-50/50 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-stone-900">{a.foodItemName}</td>
                      <td className="py-2.5 px-3 font-semibold text-amber-800">
                        {a.kitchenStaffName}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-stone-900">
                        {a.assignedQuantity}
                      </td>
                      <td className="py-2.5 px-3 text-stone-500">{a.createdBy}</td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          {/* View Button */}
                          <button
                            type="button"
                            onClick={() => setViewingAssignment(a)}
                            className="p-1.5 rounded-lg text-stone-500 hover:text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => openEditModal(a)}
                            className="p-1.5 rounded-lg text-stone-500 hover:text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
                            title="Edit Assignment"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => setDeletingAssignment(a)}
                            className="p-1.5 rounded-lg text-stone-500 hover:text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                            title="Delete Assignment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* VIEW DETAILS MODAL */}
      {viewingAssignment && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center space-x-2">
                <Utensils className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-stone-900 text-base">{tr("Assignment Details")}</h3>
              </div>
              <button
                onClick={() => setViewingAssignment(null)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-stone-100">
                <span className="text-stone-500">{tr("Assignment ID")}:</span>
                <span className="font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {viewingAssignment.assignmentId}
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-stone-100">
                <span className="text-stone-500">{tr("Date")}:</span>
                <span className="font-mono font-semibold text-stone-800">{viewingAssignment.date}</span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-stone-100">
                <span className="text-stone-500">{tr("Food Item")}:</span>
                <span className="font-bold text-stone-900 text-sm">{viewingAssignment.foodItemName}</span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-stone-100">
                <span className="text-stone-500">{tr("Kitchen Staff")}:</span>
                <span className="font-bold text-amber-700">{viewingAssignment.kitchenStaffName}</span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-stone-100">
                <span className="text-stone-500">{tr("Prepared Qty")}:</span>
                <span className="font-black text-stone-900 text-sm">{viewingAssignment.assignedQuantity} {tr("Units")}</span>
              </div>

              <div className="flex justify-between items-center py-1.5">
                <span className="text-stone-500">{tr("Assigned By")}:</span>
                <span className="font-semibold text-stone-700">{viewingAssignment.createdBy}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingAssignment(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs cursor-pointer transition-colors"
              >
                {tr("Close")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingAssignment && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center space-x-2">
                <Edit2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-stone-900 text-base">{tr("Edit Assignment")}</h3>
              </div>
              <button
                onClick={() => setEditingAssignment(null)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateAssignment} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  {tr("Date")} *
                </label>
                <input
                  type="date"
                  required
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-hidden focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  {tr("Select Food Item *")}
                </label>
                <select
                  required
                  value={editFoodId}
                  onChange={(e) => setEditFoodId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-hidden focus:border-blue-600"
                >
                  <option value="">{tr("-- Choose Food Item --")}</option>
                  {foodItems.map((f) => (
                    <option key={f.foodItemId} value={f.foodItemId}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  {tr("Assign To Kitchen Staff *")}
                </label>
                <select
                  required
                  value={editStaffId}
                  onChange={(e) => setEditStaffId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 focus:outline-hidden focus:border-blue-600"
                >
                  <option value="">{tr("-- Choose Kitchen Staff --")}</option>
                  {kitchenStaff.map((k) => (
                    <option key={k.employeeId} value={k.employeeId}>
                      {k.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  {tr("Prepared Qty (Units) *")}
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={editQty}
                  onChange={(e) => setEditQty(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 font-bold focus:outline-hidden focus:border-blue-600"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingAssignment(null)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs cursor-pointer transition-colors"
                >
                  {tr("Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-blue-600/20 cursor-pointer transition-all disabled:opacity-50"
                >
                  <span>{isUpdating ? tr("Loading...") : tr("Save")}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingAssignment && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4 border border-rose-200">
            <div className="flex items-center space-x-2.5 text-rose-600">
              <div className="p-2 bg-rose-50 rounded-xl border border-rose-100">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-sm">{tr("Delete Assignment")}?</h3>
                <span className="font-mono text-xs font-bold text-rose-700">{deletingAssignment.foodItemName}</span>
              </div>
            </div>

            <p className="text-xs text-stone-600">
              Are you sure you want to delete this assignment of{' '}
              <strong className="text-stone-900">{deletingAssignment.assignedQuantity} units</strong> to{' '}
              <strong className="text-stone-900">{deletingAssignment.kitchenStaffName}</strong>?
            </p>

            <div className="pt-2 flex justify-end space-x-2 text-xs">
              <button
                type="button"
                onClick={() => setDeletingAssignment(null)}
                className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold cursor-pointer transition-colors"
              >
                {tr("Cancel")}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteAssignment}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer transition-all disabled:opacity-50"
              >
                {isDeleting ? tr("Loading...") : tr("Delete Assignment")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
