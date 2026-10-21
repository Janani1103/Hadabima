'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { Badge } from '@/components/common/Badge';
import {
  Users,
  UserPlus,
  Search,
  CheckCircle2,
  X,
  Shield,
  Phone,
  Calendar,
  AlertCircle,
  Eye,
  Pencil,
  MapPin,
  Banknote,
  Building2,
  Coins,
  CreditCard,
} from 'lucide-react';

interface Employee {
  employeeId: string;
  fullName: string;
  nic: string;
  contactNumber: string;
  contactNumber1?: string;
  contactNumber2?: string;
  emergencyContact?: string;
  address: string;
  employeeType: 'ADMIN' | 'CASHIER' | 'KITCHEN';
  joinDate: string;
  basicSalary: number;
  salaryPaymentMethod?: 'CASH' | 'BANK';
  bankName?: string;
  bankBranch?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  username: string;
  commissionRate: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export function EmployeeManagement() {
  const { t, tr } = useLanguage();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Add Employee Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newNic, setNewNic] = useState('');
  const [newContact1, setNewContact1] = useState('');
  const [newContact2, setNewContact2] = useState('');
  const [newEmergencyContact, setNewEmergencyContact] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newRole, setNewRole] = useState<'ADMIN' | 'CASHIER' | 'KITCHEN'>('CASHIER');
  const [newJoinDate, setNewJoinDate] = useState(new Date().toISOString().split('T')[0]);
  const [newBasicSalary, setNewBasicSalary] = useState('');
  const [newPaymentMethod, setNewPaymentMethod] = useState<'CASH' | 'BANK'>('CASH');
  const [newBankName, setNewBankName] = useState('');
  const [newBankBranch, setNewBankBranch] = useState('');
  const [newBankAccountNumber, setNewBankAccountNumber] = useState('');
  const [newBankAccountName, setNewBankAccountName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // View Profile Modal State
  const [viewingEmp, setViewingEmp] = useState<Employee | null>(null);

  // Edit Profile Modal States
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editNic, setEditNic] = useState('');
  const [editContact1, setEditContact1] = useState('');
  const [editContact2, setEditContact2] = useState('');
  const [editEmergencyContact, setEditEmergencyContact] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editRole, setEditRole] = useState<'ADMIN' | 'CASHIER' | 'KITCHEN'>('CASHIER');
  const [editJoinDate, setEditJoinDate] = useState('');
  const [editBasicSalary, setEditBasicSalary] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState<'CASH' | 'BANK'>('CASH');
  const [editBankName, setEditBankName] = useState('');
  const [editBankBranch, setEditBankBranch] = useState('');
  const [editBankAccountNumber, setEditBankAccountNumber] = useState('');
  const [editBankAccountName, setEditBankAccountName] = useState('');
  const [editCommissionRate, setEditCommissionRate] = useState('10');
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees');
      const data = await res.json();
      if (data.success) {
        setEmployees(data.employees);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Next Auto-Generated Employee ID in Sequence (EMP0001, EMP0002...)
  const nextEmployeeId = useMemo(() => {
    let maxNum = 0;
    employees.forEach((e) => {
      const match = (e.employeeId || '').match(/EMP-?(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    return `EMP${String(maxNum + 1).padStart(4, '0')}`;
  }, [employees]);

  // Open Edit Modal with Pre-filled Data
  const openEditModal = (emp: Employee) => {
    setEditingEmp(emp);
    setEditFullName(emp.fullName || '');
    setEditNic(emp.nic || '');
    setEditContact1(emp.contactNumber1 || emp.contactNumber || '');
    setEditContact2(emp.contactNumber2 || '');
    setEditEmergencyContact(emp.emergencyContact || '');
    setEditAddress(emp.address || '');
    setEditRole(emp.employeeType || 'CASHIER');
    setEditJoinDate(emp.joinDate || '');
    setEditBasicSalary(emp.basicSalary ? String(emp.basicSalary) : '');
    setEditPaymentMethod(emp.salaryPaymentMethod || 'CASH');
    setEditBankName(emp.bankName || '');
    setEditBankBranch(emp.bankBranch || '');
    setEditBankAccountNumber(emp.bankAccountNumber || '');
    setEditBankAccountName(emp.bankAccountName || emp.fullName || '');
    setEditCommissionRate(String(emp.commissionRate || 10));
    setEditStatus(emp.status || 'ACTIVE');
  };

  // Handle Save New Employee
  const handleRegisterEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const isCashier = newRole === 'CASHIER';

    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: nextEmployeeId,
          fullName: newFullName,
          nic: newNic,
          contactNumber: newContact1,
          contactNumber1: newContact1,
          contactNumber2: newContact2,
          emergencyContact: newEmergencyContact,
          address: newAddress,
          employeeType: newRole,
          joinDate: newJoinDate,
          basicSalary: isCashier ? Number(newBasicSalary) || 0 : 0,
          salaryPaymentMethod: isCashier ? newPaymentMethod : 'CASH',
          bankName: isCashier && newPaymentMethod === 'BANK' ? newBankName : '',
          bankBranch: isCashier && newPaymentMethod === 'BANK' ? newBankBranch : '',
          bankAccountNumber: isCashier && newPaymentMethod === 'BANK' ? newBankAccountNumber : '',
          bankAccountName: isCashier && newPaymentMethod === 'BANK' ? newBankAccountName : '',
          username: newUsername,
          password: newPassword,
          actorUser: 'Janani Nethma (Admin)',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to register employee' });
      } else {
        setMessage({
          type: 'success',
          text: `Employee ${newFullName} (${nextEmployeeId}) registered successfully!`,
        });
        setShowAddModal(false);
        fetchEmployees();
        // Reset form
        setNewFullName('');
        setNewNic('');
        setNewContact1('');
        setNewContact2('');
        setNewEmergencyContact('');
        setNewAddress('');
        setNewRole('CASHIER');
        setNewJoinDate(new Date().toISOString().split('T')[0]);
        setNewBasicSalary('');
        setNewPaymentMethod('CASH');
        setNewBankName('');
        setNewBankBranch('');
        setNewBankAccountNumber('');
        setNewBankAccountName('');
        setNewUsername('');
        setNewPassword('');
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  // Handle Save Edited Profile
  const handleSaveEditProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmp) return;
    setMessage(null);

    const isCashier = editRole === 'CASHIER';

    try {
      const res = await fetch('/api/employees', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: editingEmp.employeeId,
          updates: {
            fullName: editFullName,
            nic: editNic,
            contactNumber: editContact1,
            contactNumber1: editContact1,
            contactNumber2: editContact2,
            emergencyContact: editEmergencyContact,
            address: editAddress,
            employeeType: editRole,
            joinDate: editJoinDate,
            basicSalary: isCashier ? Number(editBasicSalary) || 0 : 0,
            salaryPaymentMethod: isCashier ? editPaymentMethod : 'CASH',
            bankName: isCashier && editPaymentMethod === 'BANK' ? editBankName : '',
            bankBranch: isCashier && editPaymentMethod === 'BANK' ? editBankBranch : '',
            bankAccountNumber: isCashier && editPaymentMethod === 'BANK' ? editBankAccountNumber : '',
            bankAccountName: isCashier && editPaymentMethod === 'BANK' ? editBankAccountName : '',
            commissionRate: editRole === 'KITCHEN' ? Number(editCommissionRate) || 10 : 0,
            status: editStatus,
          },
          actorUser: 'Janani Nethma (Admin)',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to update employee' });
      } else {
        setMessage({
          type: 'success',
          text: `Employee profile for ${editFullName} (${editingEmp.employeeId}) updated successfully!`,
        });
        setEditingEmp(null);
        fetchEmployees();
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleToggleStatus = async (emp: Employee) => {
    const targetStatus = emp.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const confirmMsg =
      targetStatus === 'INACTIVE'
        ? `Are you sure you want to deactivate ${emp.fullName}? (History will be preserved)`
        : `Reactivate account for ${emp.fullName}?`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch('/api/employees', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: emp.employeeId,
          updates: { status: targetStatus },
          actorUser: 'Janani Nethma (Admin)',
        }),
      });
      if (res.ok) {
        fetchEmployees();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = employees.filter((emp) => {
    const matchesSearch =
      emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.nic && emp.nic.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (emp.contactNumber && emp.contactNumber.includes(searchTerm)) ||
      (emp.bankName && emp.bankName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = roleFilter === 'ALL' || emp.employeeType === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white border border-stone-200 shadow-xs p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-extrabold text-stone-900">{tr("Employee Management")}</h2>
          </div>
          <p className="text-xs text-stone-500 mt-1 font-medium">
            {tr("Manage staff accounts, phone contacts, emergency lines, and cashier bank payment details")}
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center space-x-2 shadow-xs transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>{tr("Register Employee")}</span>
        </button>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2 border font-medium ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white border border-stone-200 shadow-xs p-4 rounded-xl flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder={tr("Search by name, ID, phone, NIC, bank...")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-900 placeholder-stone-400 focus:outline-hidden focus:border-amber-500 font-medium"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-stone-500 font-medium">{tr("Role:")}</span>
          {['ALL', 'ADMIN', 'CASHIER', 'KITCHEN'].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                roleFilter === r
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-stone-50 text-stone-600 border border-stone-200 hover:bg-stone-100'
              }`}
            >
              {tr(r)}
            </button>
          ))}
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white border border-stone-200 shadow-xs rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-stone-600 font-bold">
                <th className="py-3.5 px-4">{tr("Employee ID")}</th>
                <th className="py-3.5 px-4">{tr("Full Name & Join Date")}</th>
                <th className="py-3.5 px-4">{tr("Role & Compensation")}</th>
                <th className="py-3.5 px-4">{tr("Username")}</th>
                <th className="py-3.5 px-4">{tr("Contact Numbers & NIC")}</th>
                <th className="py-3.5 px-4">{tr("Status")}</th>
                <th className="py-3.5 px-4 text-center">{tr("Actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-400">
                    No employee records match your search criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((emp) => (
                  <tr key={emp.employeeId} className="hover:bg-amber-50/50 transition-colors">
                    {/* Employee ID */}
                    <td className="py-3 px-4 font-mono font-bold text-amber-700">
                      {emp.employeeId}
                    </td>

                    {/* Name, Join Date, Address */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-stone-900">{emp.fullName}</div>
                      <div className="text-[10px] text-stone-500 flex items-center space-x-1 mt-0.5 font-medium">
                        <Calendar className="w-3 h-3 text-stone-400 shrink-0" />
                        <span>Joined: {emp.joinDate || 'N/A'}</span>
                      </div>
                      {emp.address && emp.address !== 'N/A' && (
                        <div className="text-[10px] text-stone-400 flex items-center space-x-1 mt-0.5 truncate max-w-xs">
                          <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                          <span className="truncate">{emp.address}</span>
                        </div>
                      )}
                    </td>

                    {/* Role & Compensation */}
                    <td className="py-3 px-4">
                      <Badge status={emp.employeeType} />
                      {emp.employeeType === 'CASHIER' ? (
                        <div className="mt-1 space-y-0.5">
                          <div className="text-[11px] font-bold text-stone-900">
                            Basic: Rs. {(emp.basicSalary || 0).toLocaleString()}
                          </div>
                          <div className="text-[10px] font-semibold text-stone-600 flex items-center space-x-1">
                            {emp.salaryPaymentMethod === 'BANK' ? (
                              <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 flex items-center space-x-1">
                                <Building2 className="w-2.5 h-2.5" />
                                <span>{emp.bankName || 'Bank Transfer'}</span>
                              </span>
                            ) : (
                              <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center space-x-1">
                                <Banknote className="w-2.5 h-2.5" />
                                <span>Cash in Hand</span>
                              </span>
                            )}
                          </div>
                        </div>
                      ) : emp.employeeType === 'KITCHEN' ? (
                        <div className="text-[11px] font-bold text-amber-800 mt-1">
                          Comm: {emp.commissionRate}%
                        </div>
                      ) : (
                        <div className="text-[10px] text-stone-400 mt-0.5">Admin Access</div>
                      )}
                    </td>

                    {/* Username */}
                    <td className="py-3 px-4 font-mono text-stone-600 font-medium">
                      {emp.username}
                    </td>

                    {/* Contact Numbers & NIC */}
                    <td className="py-3 px-4 space-y-0.5">
                      <div className="font-semibold text-stone-900 flex items-center space-x-1">
                        <Phone className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>{emp.contactNumber1 || emp.contactNumber}</span>
                      </div>
                      {emp.contactNumber2 && (
                        <div className="text-[11px] text-stone-600 pl-4 font-medium">
                          Alt: {emp.contactNumber2}
                        </div>
                      )}
                      {emp.emergencyContact && (
                        <div className="text-[10px] text-rose-700 font-bold pl-4">
                          🚨 Emerg: {emp.emergencyContact}
                        </div>
                      )}
                      <div className="text-[10px] text-stone-500 font-mono pl-4">
                        NIC: {emp.nic}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <Badge status={emp.status} />
                    </td>

                    {/* Actions: View, Edit, Activate/Deactivate */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        {/* View Button */}
                        <button
                          onClick={() => setViewingEmp(emp)}
                          title="View Profile Details"
                          className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-950 transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => openEditModal(emp)}
                          title="Edit Employee Profile"
                          className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 hover:text-amber-900 border border-amber-200 transition-all cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        {/* Toggle Status Button */}
                        <button
                          onClick={() => handleToggleStatus(emp)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                            emp.status === 'ACTIVE'
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {emp.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
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

      {/* VIEW EMPLOYEE PROFILE MODAL */}
      {viewingEmp && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-lg w-full p-6 text-stone-900 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-5">
            <button
              onClick={() => setViewingEmp(null)}
              className="absolute right-4 top-4 text-stone-400 hover:text-stone-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Profile Header */}
            <div className="flex items-start justify-between border-b border-stone-100 pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-black text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    {viewingEmp.employeeId}
                  </span>
                  <Badge status={viewingEmp.employeeType} />
                  <Badge status={viewingEmp.status} />
                </div>
                <h3 className="text-xl font-black text-stone-900 mt-2">
                  {viewingEmp.fullName}
                </h3>
                <p className="text-xs text-stone-500 font-mono">@{viewingEmp.username}</p>
              </div>
            </div>

            {/* Profile Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-[10px] uppercase font-bold text-stone-500">
                  National Identity Card (NIC)
                </span>
                <div className="font-mono font-bold text-stone-900 mt-0.5">
                  {viewingEmp.nic || 'N/A'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-[10px] uppercase font-bold text-stone-500">
                  Date Joined
                </span>
                <div className="font-semibold text-stone-900 mt-0.5 flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-600" />
                  <span>{viewingEmp.joinDate || 'N/A'}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 col-span-1 sm:col-span-2">
                <span className="text-[10px] uppercase font-bold text-stone-500">
                  Residential Address
                </span>
                <div className="font-medium text-stone-900 mt-0.5 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>{viewingEmp.address || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* 3 Contact Numbers Card */}
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
              <div className="font-bold text-amber-950 text-xs flex items-center space-x-1.5">
                <Phone className="w-4 h-4 text-amber-700" />
                <span>Telephone Contacts</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="bg-white p-2.5 rounded-xl border border-amber-200/80">
                  <span className="text-[10px] text-stone-500 font-semibold block">
                    Phone 1 (Primary)
                  </span>
                  <a
                    href={`tel:${viewingEmp.contactNumber1 || viewingEmp.contactNumber}`}
                    className="font-bold text-stone-900 hover:text-amber-700 mt-0.5 block"
                  >
                    {viewingEmp.contactNumber1 || viewingEmp.contactNumber || 'N/A'}
                  </a>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-amber-200/80">
                  <span className="text-[10px] text-stone-500 font-semibold block">
                    Phone 2 (Alternative)
                  </span>
                  <span className="font-bold text-stone-900 mt-0.5 block">
                    {viewingEmp.contactNumber2 || 'None Provided'}
                  </span>
                </div>

                <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                  <span className="text-[10px] text-rose-700 font-bold block">
                    🚨 Emergency Contact
                  </span>
                  <span className="font-bold text-rose-900 mt-0.5 block">
                    {viewingEmp.emergencyContact || 'None Provided'}
                  </span>
                </div>
              </div>
            </div>

            {/* Compensation & Structure Card */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3 text-xs">
              <span className="text-[10px] uppercase font-bold text-stone-500">
                Compensation & Role Model
              </span>

              {viewingEmp.employeeType === 'CASHIER' ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-700 font-medium">Monthly Basic Salary:</span>
                    <span className="font-black text-base text-stone-900">
                      Rs. {(viewingEmp.basicSalary || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500 font-semibold">Salary Payout Mode:</span>
                      <span className="font-bold text-stone-900">
                        {viewingEmp.salaryPaymentMethod === 'BANK' ? '🏦 Direct Bank Deposit' : '💵 Cash in Hand'}
                      </span>
                    </div>

                    {viewingEmp.salaryPaymentMethod === 'BANK' && (
                      <div className="pt-2 border-t border-stone-100 grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-stone-400 block text-[10px]">Bank:</span>
                          <span className="font-bold text-stone-800">{viewingEmp.bankName || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-stone-400 block text-[10px]">Branch:</span>
                          <span className="font-bold text-stone-800">{viewingEmp.bankBranch || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-stone-400 block text-[10px]">Account Name:</span>
                          <span className="font-bold text-stone-800">{viewingEmp.bankAccountName || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-stone-400 block text-[10px]">Account Number:</span>
                          <span className="font-mono font-bold text-stone-900">{viewingEmp.bankAccountNumber || 'N/A'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : viewingEmp.employeeType === 'KITCHEN' ? (
                <div className="flex items-center justify-between">
                  <span className="text-stone-700 font-medium">Commission Rate:</span>
                  <span className="font-black text-base text-amber-800">
                    {viewingEmp.commissionRate}% per settled batch
                  </span>
                </div>
              ) : (
                <div className="text-stone-700 font-medium">
                  Administrator role with system audit, config & access privileges.
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  const emp = viewingEmp;
                  setViewingEmp(null);
                  openEditModal(emp);
                }}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 font-bold text-xs text-white shadow-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>

              <button
                type="button"
                onClick={() => setViewingEmp(null)}
                className="px-5 py-2.5 rounded-xl bg-stone-100 text-stone-700 hover:bg-stone-200 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT EMPLOYEE PROFILE MODAL */}
      {editingEmp && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-lg w-full p-6 text-stone-900 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setEditingEmp(null)}
              className="absolute right-4 top-4 text-stone-400 hover:text-stone-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-black text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  {editingEmp.employeeId}
                </span>
                <h3 className="text-base font-extrabold text-stone-900">
                  Edit Employee Profile
                </h3>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Update personal information, contact numbers, role assignments, or cashier bank payout details.
              </p>
            </div>

            <form onSubmit={handleSaveEditProfile} className="space-y-4 text-xs">
              {/* Full Name */}
              <div>
                <label className="block text-stone-700 font-bold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-hidden focus:border-amber-500 font-medium"
                />
              </div>

              {/* NIC & Join Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">NIC Number *</label>
                  <input
                    type="text"
                    required
                    value={editNic}
                    onChange={(e) => setEditNic(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-hidden focus:border-amber-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Join Date *</label>
                  <input
                    type="date"
                    required
                    value={editJoinDate}
                    onChange={(e) => setEditJoinDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-hidden focus:border-amber-500 font-semibold"
                  />
                </div>
              </div>

              {/* 3 Phone Numbers */}
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2.5">
                <div className="font-bold text-stone-800 text-[11px] flex items-center justify-between">
                  <span>Telephone Contacts (3 Phone Numbers)</span>
                  <span className="text-[10px] text-stone-500 font-normal">2 Personal + 1 Emergency</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-stone-600 font-semibold text-[11px] mb-1">
                      Personal Phone 1 (Primary) *
                    </label>
                    <input
                      type="text"
                      required
                      value={editContact1}
                      onChange={(e) => setEditContact1(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-stone-900 focus:outline-hidden focus:border-amber-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-600 font-semibold text-[11px] mb-1">
                      Personal Phone 2 (Alternative)
                    </label>
                    <input
                      type="text"
                      value={editContact2}
                      onChange={(e) => setEditContact2(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-stone-900 focus:outline-hidden focus:border-amber-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-rose-800 font-bold text-[11px] mb-1">
                    Emergency Contact Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={editEmergencyContact}
                    onChange={(e) => setEditEmergencyContact(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-rose-200 text-slate-900 focus:outline-hidden focus:border-rose-400 font-medium"
                  />
                </div>
              </div>

              {/* Residential Address */}
              <div>
                <label className="block text-stone-700 font-bold mb-1">Residential Address</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-hidden focus:border-amber-500 font-medium"
                />
              </div>

              {/* Role & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Role *</label>
                  <select
                    value={editRole}
                    onChange={(e: any) => setEditRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-hidden focus:border-amber-500 font-bold"
                  >
                    <option value="CASHIER">Cashier (Fixed Monthly Salary)</option>
                    <option value="KITCHEN">Kitchen Staff (Daily Commission Settlements)</option>
                    <option value="ADMIN">Admin (System Manager)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">Account Status</label>
                  <select
                    value={editStatus}
                    onChange={(e: any) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-hidden focus:border-amber-500 font-bold"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              {/* Basic Salary & Bank Details (Only if Cashier) */}
              {editRole === 'CASHIER' && (
                <div className="p-3.5 rounded-xl bg-orange-50 border border-orange-200 space-y-3 animate-fadeIn">
                  <div>
                    <label className="block text-orange-950 font-bold text-xs mb-1">
                      Basic Monthly Salary (Rs.) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={editBasicSalary}
                      onChange={(e) => setEditBasicSalary(e.target.value)}
                      placeholder="e.g. 45000"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-orange-300 text-stone-900 font-black text-sm focus:outline-hidden focus:border-orange-500"
                    />
                  </div>

                  {/* Payment Method Selector */}
                  <div>
                    <label className="block text-stone-700 font-bold mb-1">
                      Salary Payment Method *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setEditPaymentMethod('CASH')}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                          editPaymentMethod === 'CASH'
                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                            : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        <Banknote className="w-4 h-4" />
                        <span>Cash in Hand (අත්පිට)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditPaymentMethod('BANK');
                          if (!editBankAccountName && editFullName) {
                            setEditBankAccountName(editFullName);
                          }
                        }}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                          editPaymentMethod === 'BANK'
                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                            : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        <Building2 className="w-4 h-4" />
                        <span>Bank Account (බැංකුව)</span>
                      </button>
                    </div>
                  </div>

                  {/* Bank Details Input Fields */}
                  {editPaymentMethod === 'BANK' && (
                    <div className="p-3 bg-white rounded-xl border border-orange-200 space-y-2.5 animate-fadeIn">
                      <div className="text-[11px] font-bold text-stone-800 flex items-center space-x-1">
                        <Building2 className="w-3.5 h-3.5 text-amber-600" />
                        <span>Cashier Bank Account Details</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-stone-600 text-[11px] font-semibold mb-1">
                            Bank Name *
                          </label>
                          <input
                            type="text"
                            required={editPaymentMethod === 'BANK'}
                            value={editBankName}
                            onChange={(e) => setEditBankName(e.target.value)}
                            placeholder="e.g. Bank of Ceylon / Commercial Bank"
                            className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-hidden focus:border-amber-500 font-medium text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-stone-600 text-[11px] font-semibold mb-1">
                            Branch Name *
                          </label>
                          <input
                            type="text"
                            required={editPaymentMethod === 'BANK'}
                            value={editBankBranch}
                            onChange={(e) => setEditBankBranch(e.target.value)}
                            placeholder="e.g. Kandy Main / Colombo Fort"
                            className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-hidden focus:border-amber-500 font-medium text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-stone-600 text-[11px] font-semibold mb-1">
                            Account Holder Name *
                          </label>
                          <input
                            type="text"
                            required={editPaymentMethod === 'BANK'}
                            value={editBankAccountName}
                            onChange={(e) => setEditBankAccountName(e.target.value)}
                            placeholder="e.g. S. B. Perera"
                            className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-hidden focus:border-amber-500 font-medium text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-stone-600 text-[11px] font-semibold mb-1">
                            Account Number *
                          </label>
                          <input
                            type="text"
                            required={editPaymentMethod === 'BANK'}
                            value={editBankAccountNumber}
                            onChange={(e) => setEditBankAccountNumber(e.target.value)}
                            placeholder="e.g. 001298457632"
                            className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-hidden focus:border-amber-500 font-bold text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Commission Rate (Only if Kitchen) */}
              {editRole === 'KITCHEN' && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
                  <label className="block text-amber-950 font-bold text-xs">
                    Commission Rate (%) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    step="0.5"
                    value={editCommissionRate}
                    onChange={(e) => setEditCommissionRate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 text-stone-900 font-black text-sm focus:outline-hidden focus:border-amber-500"
                  />
                  <p className="text-[10px] text-amber-800">
                    Individual commission percentage for daily batch settlements.
                  </p>
                </div>
              )}

              <div className="flex space-x-3 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 font-bold text-xs text-white shadow-xs transition-all cursor-pointer"
                >
                  Save Changes & Audit
                </button>
                <button
                  type="button"
                  onClick={() => setEditingEmp(null)}
                  className="px-4 py-2.5 rounded-xl bg-stone-100 text-stone-700 hover:bg-stone-200 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REGISTER NEW EMPLOYEE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-lg w-full p-6 text-stone-900 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute right-4 top-4 text-stone-400 hover:text-stone-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <h3 className="text-base font-extrabold text-stone-900">Register New Employee</h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Create employee profile with auto-generated ID, 3 contact numbers, role parameters, and cashier bank details.
              </p>
            </div>

            <form onSubmit={handleRegisterEmployee} className="space-y-4 text-xs">
              {/* Auto-Generated Employee ID */}
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
                    Employee ID (Auto-Generated)
                  </div>
                  <div className="font-mono text-base font-black text-amber-800 mt-0.5">
                    {nextEmployeeId}
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-amber-200/80 text-amber-900 px-2 py-1 rounded-md">
                  Sequence: Next In Line
                </span>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-stone-700 font-bold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => {
                    setNewFullName(e.target.value);
                    if (!newBankAccountName) {
                      setNewBankAccountName(e.target.value);
                    }
                  }}
                  placeholder="e.g. Sunil Bandara"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-hidden focus:border-amber-500 font-medium"
                />
              </div>

              {/* NIC & Join Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">NIC Number *</label>
                  <input
                    type="text"
                    required
                    value={newNic}
                    onChange={(e) => setNewNic(e.target.value)}
                    placeholder="199512345678"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-hidden focus:border-amber-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Join Date *</label>
                  <input
                    type="date"
                    required
                    value={newJoinDate}
                    onChange={(e) => setNewJoinDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-hidden focus:border-amber-500 font-semibold"
                  />
                </div>
              </div>

              {/* 3 Phone Numbers Requirement */}
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2.5">
                <div className="font-bold text-stone-800 text-[11px] flex items-center justify-between">
                  <span>Telephone Contacts (3 Phone Numbers)</span>
                  <span className="text-[10px] text-stone-500 font-normal">2 Personal + 1 Emergency</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-stone-600 font-semibold text-[11px] mb-1">
                      Personal Phone 1 (Primary) *
                    </label>
                    <input
                      type="text"
                      required
                      value={newContact1}
                      onChange={(e) => setNewContact1(e.target.value)}
                      placeholder="0771234567"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-stone-900 focus:outline-hidden focus:border-amber-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-600 font-semibold text-[11px] mb-1">
                      Personal Phone 2 (Alternative)
                    </label>
                    <input
                      type="text"
                      value={newContact2}
                      onChange={(e) => setNewContact2(e.target.value)}
                      placeholder="0719876543"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-stone-900 focus:outline-hidden focus:border-amber-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-rose-800 font-bold text-[11px] mb-1">
                    Emergency Contact Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={newEmergencyContact}
                    onChange={(e) => setNewEmergencyContact(e.target.value)}
                    placeholder="0755544332 (Mother / Spouse contact)"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-rose-200 text-slate-900 focus:outline-hidden focus:border-rose-400 font-medium"
                  />
                </div>
              </div>

              {/* Residential Address */}
              <div>
                <label className="block text-stone-700 font-bold mb-1">Residential Address</label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="Street, City"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-hidden focus:border-amber-500 font-medium"
                />
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-stone-700 font-bold mb-1">Role *</label>
                <select
                  value={newRole}
                  onChange={(e: any) => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-hidden focus:border-amber-500 font-bold"
                >
                  <option value="CASHIER">Cashier (Fixed Monthly Salary)</option>
                  <option value="KITCHEN">Kitchen Staff (Daily Commission Settlements)</option>
                  <option value="ADMIN">Admin (System Manager)</option>
                </select>
              </div>

              {/* Basic Salary & Bank Details - ONLY FOR CASHIER */}
              {newRole === 'CASHIER' && (
                <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-200 space-y-3.5 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-orange-950 text-xs">
                      Cashier Compensation & Payout Method
                    </span>
                    <span className="text-[10px] font-bold text-orange-800 bg-orange-100 px-2 py-0.5 rounded-full">
                      Cashier Exclusive
                    </span>
                  </div>

                  <div>
                    <label className="block text-stone-700 font-bold mb-1">
                      Basic Monthly Salary (Rs.) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={newBasicSalary}
                      onChange={(e) => setNewBasicSalary(e.target.value)}
                      placeholder="e.g. 45000"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-orange-300 text-stone-900 font-black text-sm focus:outline-hidden focus:border-orange-500"
                    />
                  </div>

                  {/* Payment Method Selector */}
                  <div>
                    <label className="block text-stone-700 font-bold mb-1.5">
                      Salary Payment Method *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setNewPaymentMethod('CASH')}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                          newPaymentMethod === 'CASH'
                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                            : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        <Banknote className="w-4 h-4" />
                        <span>Cash in Hand (අත්පිට)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setNewPaymentMethod('BANK');
                          if (!newBankAccountName && newFullName) {
                            setNewBankAccountName(newFullName);
                          }
                        }}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                          newPaymentMethod === 'BANK'
                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                            : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        <Building2 className="w-4 h-4" />
                        <span>Bank Account (බැංකුව)</span>
                      </button>
                    </div>
                  </div>

                  {/* Bank Details Input Fields */}
                  {newPaymentMethod === 'BANK' && (
                    <div className="p-3 bg-white rounded-xl border border-orange-200 space-y-2.5 animate-fadeIn">
                      <div className="text-[11px] font-bold text-stone-800 flex items-center space-x-1">
                        <Building2 className="w-3.5 h-3.5 text-amber-600" />
                        <span>Cashier Bank Account Details</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-stone-600 text-[11px] font-semibold mb-1">
                            Bank Name *
                          </label>
                          <input
                            type="text"
                            required={newPaymentMethod === 'BANK'}
                            value={newBankName}
                            onChange={(e) => setNewBankName(e.target.value)}
                            placeholder="e.g. Bank of Ceylon / Commercial Bank"
                            className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-hidden focus:border-amber-500 font-medium text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-stone-600 text-[11px] font-semibold mb-1">
                            Branch Name *
                          </label>
                          <input
                            type="text"
                            required={newPaymentMethod === 'BANK'}
                            value={newBankBranch}
                            onChange={(e) => setNewBankBranch(e.target.value)}
                            placeholder="e.g. Kandy Main / Colombo Fort"
                            className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-hidden focus:border-amber-500 font-medium text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-stone-600 text-[11px] font-semibold mb-1">
                            Account Holder Name *
                          </label>
                          <input
                            type="text"
                            required={newPaymentMethod === 'BANK'}
                            value={newBankAccountName}
                            onChange={(e) => setNewBankAccountName(e.target.value)}
                            placeholder="e.g. S. B. Perera"
                            className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-hidden focus:border-amber-500 font-medium text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-stone-600 text-[11px] font-semibold mb-1">
                            Account Number *
                          </label>
                          <input
                            type="text"
                            required={newPaymentMethod === 'BANK'}
                            value={newBankAccountNumber}
                            onChange={(e) => setNewBankAccountNumber(e.target.value)}
                            placeholder="e.g. 001298457632"
                            className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-hidden focus:border-amber-500 font-bold text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Username & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-stone-100">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="login username"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-hidden focus:border-amber-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="login password"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 focus:outline-hidden focus:border-amber-500 font-medium"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 font-bold text-xs text-white shadow-xs transition-all cursor-pointer"
                >
                  Save Employee
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-stone-100 text-stone-700 hover:bg-stone-200 text-xs font-semibold cursor-pointer"
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
