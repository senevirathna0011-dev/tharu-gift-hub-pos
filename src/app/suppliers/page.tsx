'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Supplier } from '@/lib/types';
import { formatDate } from '@/lib/formatters';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import SupplierFormModal from '@/components/inventory/SupplierFormModal';
import { 
  Building2, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw, 
  Phone, 
  Mail, 
  MapPin, 
  Package, 
  Boxes,
  ShieldCheck,
  Lock,
  User
} from 'lucide-react';

export default function SuppliersPage() {
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchSuppliers = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('q', searchQuery.trim());

      const res = await fetch(`/api/suppliers?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setSuppliers(data.suppliers);
      } else {
        toast(data.error || 'Failed to load suppliers', 'error');
      }
    } catch (err) {
      toast('Network error loading suppliers', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, toast]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleSaveSupplier = async (supplierData: Partial<Supplier>): Promise<boolean> => {
    try {
      const isEdit = !!editingSupplier;
      const url = isEdit ? `/api/suppliers/${editingSupplier.id}` : '/api/suppliers';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplierData),
      });

      const data = await res.json();
      if (data.success) {
        toast(
          isEdit
            ? `Updated "${supplierData.company}" successfully!`
            : `Added "${supplierData.company}" to suppliers!`,
          'success'
        );
        fetchSuppliers();
        return true;
      } else {
        toast(data.error || 'Failed to save supplier', 'error');
        return false;
      }
    } catch (err) {
      toast('Network error saving supplier', 'error');
      return false;
    }
  };

  const handleDeleteSupplier = async (supplierId: string) => {
    try {
      const res = await fetch(`/api/suppliers/${supplierId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setSuppliers((prev) => prev.filter((s) => s.id !== supplierId));
        toast('Supplier deleted. Associated products are now unassigned.', 'success');
      } else {
        toast(data.error || 'Failed to delete supplier', 'error');
      }
    } catch (err) {
      toast('Error deleting supplier', 'error');
    }
  };

  const totalProductsSupplied = suppliers.reduce(
    (sum, s) => sum + (s._count?.products || 0),
    0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 font-display tracking-tight flex items-center gap-2">
            <span>Supplier Management</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold">
              {suppliers.length} Vendors
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Manage wholesale boutique suppliers, vendor contacts, and catalog supply channels.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchSuppliers}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 transition-colors shadow-2xs"
            title="Refresh Suppliers"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-pink-600' : ''}`} />
          </button>

          {isAdmin ? (
            <button
              onClick={() => {
                setEditingSupplier(null);
                setIsFormOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-rose-600/25 transition-all font-display"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Supplier</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 border border-stone-200 text-xs text-stone-600 font-medium">
              <Lock className="w-3.5 h-3.5 text-stone-400" />
              <span>Admin Only</span>
            </div>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-500 font-semibold uppercase tracking-wider">
              Total Suppliers
            </span>
            <div className="text-2xl font-black text-stone-900 font-display mt-0.5">
              {suppliers.length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-500 font-semibold uppercase tracking-wider">
              Products Sourced
            </span>
            <div className="text-2xl font-black text-stone-900 font-display mt-0.5">
              {totalProductsSupplied}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-500 font-semibold uppercase tracking-wider">
              Active Vendor Channels
            </span>
            <div className="text-2xl font-black text-stone-900 font-display mt-0.5">
              {suppliers.filter((s) => (s._count?.products || 0) > 0).length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Boxes className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-3xl border border-stone-200 p-4 sm:p-5 flex items-center justify-between gap-4 shadow-xs">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search suppliers by Company, Contact Name, Phone..."
            className="w-full pl-10 pr-4 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs font-medium focus:outline-hidden focus:border-rose-500"
          />
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/70 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Company / Vendor</th>
                <th className="py-3.5 px-4">Contact Representative</th>
                <th className="py-3.5 px-4">Phone & Email</th>
                <th className="py-3.5 px-4">Address / Notes</th>
                <th className="py-3.5 px-4 text-center">Linked Products</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {suppliers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400">
                    <Building2 className="w-8 h-8 mx-auto mb-2 text-stone-300" />
                    <p className="font-semibold text-stone-700">No suppliers registered</p>
                    <p className="text-xs text-stone-400 mt-0.5">Click &quot;Add New Supplier&quot; to create your first vendor.</p>
                  </td>
                </tr>
              ) : (
                suppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-stone-50/80 transition-colors">
                    {/* Company */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 font-bold flex items-center justify-center font-display shrink-0">
                          {supplier.company.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-stone-900 line-clamp-1">{supplier.company}</div>
                          <div className="text-[10px] text-stone-400 font-mono">
                            Added {formatDate(supplier.createdAt)}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact Name */}
                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-stone-100 font-medium text-stone-800 text-xs">
                        <User className="w-3.5 h-3.5 text-stone-400" />
                        <span>{supplier.name}</span>
                      </div>
                    </td>

                    {/* Phone & Email */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 text-stone-800 font-mono font-medium">
                        <Phone className="w-3 h-3 text-stone-400" />
                        <a href={`tel:${supplier.phone}`} className="hover:text-rose-600 transition-colors">
                          {supplier.phone}
                        </a>
                      </div>
                      {supplier.email && (
                        <div className="flex items-center gap-1 text-[11px] text-stone-500 mt-0.5">
                          <Mail className="w-3 h-3 text-stone-400" />
                          <a href={`mailto:${supplier.email}`} className="hover:text-rose-600 transition-colors truncate max-w-[160px]">
                            {supplier.email}
                          </a>
                        </div>
                      )}
                    </td>

                    {/* Address & Notes */}
                    <td className="py-3.5 px-4 max-w-xs">
                      {supplier.address ? (
                        <div className="text-stone-700 truncate flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                          <span className="truncate">{supplier.address}</span>
                        </div>
                      ) : (
                        <span className="text-stone-400 italic text-[11px]">No address</span>
                      )}
                      {supplier.notes && (
                        <div className="text-[10px] text-stone-400 truncate mt-0.5">
                          {supplier.notes}
                        </div>
                      )}
                    </td>

                    {/* Linked Products Count */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-pink-100 text-pink-700">
                        <Package className="w-3 h-3" />
                        <span>{supplier._count?.products || 0} product(s)</span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      {isAdmin ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingSupplier(supplier);
                              setIsFormOpen(true);
                            }}
                            title="Edit supplier"
                            className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-600 hover:text-stone-900 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setDeletingId(supplier.id)}
                            title="Delete supplier"
                            className="p-1.5 rounded-lg hover:bg-rose-100 text-stone-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-stone-400 italic">Read-only</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supplier Add / Edit Form Modal */}
      <SupplierFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingSupplier(null);
        }}
        onSave={handleSaveSupplier}
        initialSupplier={editingSupplier}
      />

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-xl border border-stone-200 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-stone-900 text-base font-display">Delete Supplier?</h4>
            <p className="text-xs text-stone-500 mt-1">
              Are you sure you want to remove this supplier? Products linked to this supplier will remain in inventory and become unassigned.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDeleteSupplier(deletingId);
                  setDeletingId(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow-md shadow-rose-600/20"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
