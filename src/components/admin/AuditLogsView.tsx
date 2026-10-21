'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { Badge } from '@/components/common/Badge';
import { ScrollText, Search, Clock, User, ShieldAlert } from 'lucide-react';

interface AuditLog {
  auditId: string;
  user: string;
  role: string;
  action: string;
  module: string;
  recordId: string;
  previousValue?: string;
  newValue?: string;
  details?: string;
  createdAt: string;
}

export function AuditLogsView() {
  const { t } = useLanguage();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/audit-logs');
      const data = await res.json();
      if (data.success) {
        setLogs(data.auditLogs);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.recordId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesModule = moduleFilter === 'ALL' || log.module === moduleFilter;
    return matchesSearch && matchesModule;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 shadow-xs p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <ScrollText className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-extrabold text-slate-900">{t.nav.auditLogs}</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Tamper-evident audit trail for financial transactions, price updates, voids, and settlements
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search audit trail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-amber-500"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-slate-200 shadow-xs rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">User & Role</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Module / Target</th>
                <th className="py-3 px-4">Previous Value</th>
                <th className="py-3 px-4">New Value</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredLogs.map((log) => (
                <tr key={log.auditId} className="hover:bg-amber-50/50 transition-colors">
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{log.user}</div>
                    <Badge status={log.role} className="mt-0.5" />
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-amber-700 text-[11px]">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-slate-900 font-bold">{log.module}</div>
                    <div className="font-mono text-[10px] text-slate-500">{log.recordId}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-[11px]">
                    {log.previousValue || '-'}
                  </td>
                  <td className="py-3 px-4 font-bold text-emerald-700 text-[11px]">
                    {log.newValue || '-'}
                  </td>
                  <td className="py-3 px-4 text-slate-600 text-[11px] max-w-xs truncate">
                    {log.details || '-'}
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
