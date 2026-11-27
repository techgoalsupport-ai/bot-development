import React, { useState, useEffect, useMemo } from "react";
import {
  KeyRound,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Power,
  Activity,
  BookOpen,
  ShieldCheck,
  Ban,
  Ticket,
  UserPlus,
} from "lucide-react";
import {
  CollaboratorApiKey,
  CollaboratorLog,
} from "../../../types/admin.types.ts";
import { CreatePartnerKeyModal } from "../../modals/CreatePartnerKeyModal.tsx";
import { PartnerKeyCreatedModal } from "../../modals/PartnerKeyCreatedModal.tsx";
import { DeletePartnerKeyModal } from "../../modals/DeletePartnerKeyModal.tsx";
import { adminFetch } from "../../../utils/adminAuth.ts";

interface TabPartnerApiProps {
  showToast: (msg: string) => void;
}

type PartnerSubView = "keys" | "logs";

export const TabPartnerApi: React.FC<TabPartnerApiProps> = ({
  showToast,
}) => {
  const publicApiDocsHref =
    typeof window !== "undefined" && window.location.pathname.startsWith("/admin/")
      ? "/admin/docs?tab=api"
      : "/docs?tab=api";
  const [keys, setKeys] = useState<CollaboratorApiKey[]>([]);
  const [logs, setLogs] = useState<CollaboratorLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [subView, setSubViewState] = useState<PartnerSubView>(() => {
    try {
      const saved = window.sessionStorage.getItem("wanzt_admin_partner_subview");
      if (saved === "keys" || saved === "logs") {
        return saved;
      }
    } catch {}
    return "keys";
  });
  const setSubView = (next: PartnerSubView) => {
    try {
      window.sessionStorage.setItem("wanzt_admin_partner_subview", next);
    } catch {}
    setSubViewState(next);
  };
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "suspended"
  >("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [logSearchQuery, setLogSearchQuery] = useState<string>("");

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [createdKeyModal, setCreatedKeyModal] = useState<{
    name: string;
    rawKey: string;
  } | null>(null);
  const [keyToDelete, setKeyToDelete] = useState<CollaboratorApiKey | null>(
    null,
  );
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const fetchPartnerData = async () => {
    try {
      setIsLoading(true);
      const res = await adminFetch("/api/admin/partners");
      const json = await res.json();
      if (json.success && json.data) {
        setKeys(Array.isArray(json.data.keys) ? json.data.keys : []);
        setLogs(Array.isArray(json.data.logs) ? json.data.logs : []);
      } else {
        showToast(json.message || "Gagal memuat data Partner API.");
      }
    } catch (err: any) {
      showToast("Gagal memuat data Partner API: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPartnerData();
  }, []);

  const handleCreateKey = async (name: string) => {
    try {
      const res = await adminFetch("/api/admin/partners/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();

      if (json.success && json.data) {
        setKeys((prev) => [json.data.key, ...prev]);
        setIsCreateModalOpen(false);
        setCreatedKeyModal({
          name: json.data.key.name,
          rawKey: json.data.raw_api_key,
        });
        showToast(`API Key untuk "${json.data.key.name}" berhasil dibuat.`);
      } else {
        showToast(json.message || "Gagal membuat API Key partner.");
      }
    } catch (err: any) {
      showToast("Error membuat API Key: " + err.message);
    }
  };

  const handleToggleStatus = async (keyItem: CollaboratorApiKey) => {
    const nextStatus = keyItem.status === "active" ? "suspended" : "active";
    setTogglingId(keyItem.id);
    try {
      const res = await adminFetch(`/api/admin/partners/${keyItem.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = await res.json();

      if (json.success && json.data) {
        setKeys((prev) =>
          prev.map((k) => (k.id === keyItem.id ? json.data : k)),
        );
        showToast(json.message || "Status API Key berhasil diperbarui.");
      } else {
        showToast(json.message || "Gagal memperbarui status API Key.");
      }
    } catch (err: any) {
      showToast("Error mengubah status API Key: " + err.message);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteKey = async (id: number) => {
    try {
      const res = await adminFetch(`/api/admin/partners/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (json.success) {
        setKeys((prev) => prev.filter((k) => k.id !== id));
        setLogs((prev) => prev.filter((l) => l.collaborator_id !== id));
        setKeyToDelete(null);
        showToast("API Key partner berhasil dihapus.");
      } else {
        showToast(json.message || "Gagal menghapus API Key partner.");
      }
    } catch (err: any) {
      showToast("Error menghapus API Key: " + err.message);
    }
  };

  const filteredKeys = useMemo(() => {
    return keys.filter((k) => {
      if (statusFilter !== "all" && k.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          k.name.toLowerCase().includes(q) ||
          k.prefix_key.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [keys, statusFilter, searchQuery]);

  const filteredLogs = useMemo(() => {
    if (!logSearchQuery.trim()) return logs;
    const q = logSearchQuery.toLowerCase().trim();
    return logs.filter(
      (l) =>
        l.collaborator_name.toLowerCase().includes(q) ||
        l.target_id.toLowerCase().includes(q) ||
        l.duration_label.toLowerCase().includes(q) ||
        l.request_ip.toLowerCase().includes(q),
    );
  }, [logs, logSearchQuery]);

  const totalKeys = keys.length;
  const activeKeysCount = keys.filter((k) => k.status === "active").length;
  const totalRequestsCount = keys.reduce(
    (sum, k) => sum + (k.usage_count || 0),
    0,
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0084D1]/10 text-[#0084D1] flex items-center justify-center shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Partner & Reseller REST API
            </h2>
            <p className="text-xs text-slate-500">
              API Key unlimited selama aktif untuk membuat akun bot tenant dan
              token perpanjangan otomatis
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={fetchPartnerData}
            disabled={isLoading}
            aria-label="Muat ulang data Partner API"
            title="Muat Ulang Data"
            className="w-10 h-10 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center transition-colors cursor-pointer"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? "animate-spin text-[#0084D1]" : ""}`}
            />
          </button>

          <a
            href={publicApiDocsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs transition-colors whitespace-nowrap shrink-0"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#0084D1]" />
            <span>Dokumentasi API</span>
          </a>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0084D1] hover:bg-[#0073B7] active:scale-[0.98] text-white font-bold text-xs transition-all whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Buat API Key</span>
          </button>
        </div>
      </div>

      {/* 3 Kartu Metrik */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        <div className="p-5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">
              Total Partner Key
            </span>
            <span className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
              {totalKeys}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-sky-50 text-[#0084D1] flex items-center justify-center">
            <KeyRound className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">
              API Key Aktif
            </span>
            <span className="text-2xl font-extrabold text-emerald-600 font-mono tabular-nums">
              {activeKeysCount}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">
              Total Request Sukses
            </span>
            <span className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
              {totalRequestsCount}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Sub-Navigasi Tab Partner API */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 border border-slate-200 rounded-xl w-full sm:w-fit">
        <button
          type="button"
          onClick={() => setSubView("keys")}
          className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
            subView === "keys"
              ? "bg-white text-slate-900 shadow-2xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Daftar API Key ({totalKeys})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubView("logs")}
          className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
            subView === "logs"
              ? "bg-white text-slate-900 shadow-2xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Log Aktivitas ({logs.length})</span>
        </button>
      </div>

      {/* VIEW 1: DAFTAR API KEY PARTNER */}
      {subView === "keys" && (
        <div className="space-y-4">
          <div className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                  statusFilter === "all"
                    ? "bg-[#0084D1] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Semua ({totalKeys})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("active")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                  statusFilter === "active"
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Aktif ({activeKeysCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("suspended")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                  statusFilter === "suspended"
                    ? "bg-amber-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Suspend ({totalKeys - activeKeysCount})
              </button>
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama partner atau prefix..."
                className="w-full h-10 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-[#0084D1] focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-3.5 px-4 sm:px-5 whitespace-nowrap">
                      Partner / Kolaborator
                    </th>
                    <th className="py-3.5 px-4 sm:px-5 whitespace-nowrap">Prefix API Key</th>
                    <th className="py-3.5 px-4 sm:px-5 whitespace-nowrap">Status</th>
                    <th className="py-3.5 px-4 sm:px-5 text-right whitespace-nowrap">
                      Penggunaan
                    </th>
                    <th className="py-3.5 px-4 sm:px-5 whitespace-nowrap">Terakhir Dipakai</th>
                    <th className="py-3.5 px-4 sm:px-5 text-center whitespace-nowrap">Kontrol</th>
                    <th className="py-3.5 px-4 sm:px-5 text-center whitespace-nowrap">Hapus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-12 text-center text-slate-400"
                      >
                        <RefreshCw className="w-6 h-6 mx-auto animate-spin text-[#0084D1] mb-2" />
                        <span>Memuat daftar API Key...</span>
                      </td>
                    </tr>
                  ) : filteredKeys.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-12 text-center text-slate-500 space-y-3"
                      >
                        <KeyRound className="w-8 h-8 mx-auto text-slate-300" />
                        <p className="text-xs">
                          {keys.length === 0
                            ? "Belum ada API Key partner. Buat API Key pertama untuk memulai integrasi reseller."
                            : "Tidak ada API Key yang cocok dengan filter pencarian."}
                        </p>
                        {keys.length === 0 && (
                          <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0084D1] text-white text-xs font-bold hover:bg-[#0073B7] cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Buat API Key Pertama</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredKeys.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="py-3.5 px-4 sm:px-5 whitespace-nowrap">
                          <div className="font-bold text-slate-900">
                            {item.name}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                            Dibuat: {item.created_at}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 sm:px-5 whitespace-nowrap">
                          <code className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-mono text-[11px] font-semibold">
                            {item.prefix_key}
                          </code>
                        </td>
                        <td className="py-3.5 px-4 sm:px-5 whitespace-nowrap">
                          {item.status === "active" ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Aktif (Unlimited)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                              <Ban className="w-3.5 h-3.5" />
                              <span>Suspend</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 sm:px-5 text-right font-mono tabular-nums font-bold text-slate-900 whitespace-nowrap">
                          {item.usage_count || 0}x
                        </td>
                        <td className="py-3.5 px-4 sm:px-5 font-mono tabular-nums text-slate-600 whitespace-nowrap">
                          {item.last_used_at || "Belum dipakai"}
                        </td>
                        <td className="py-3.5 px-4 sm:px-5 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(item)}
                            disabled={togglingId === item.id}
                            aria-label={
                              item.status === "active"
                                ? `Suspend API Key ${item.name}`
                                : `Aktifkan API Key ${item.name}`
                            }
                            className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                              item.status === "active"
                                ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                                : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                            <span>
                              {item.status === "active"
                                ? "Suspend"
                                : "Aktifkan"}
                            </span>
                          </button>
                        </td>
                        <td className="py-3.5 px-4 sm:px-5 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setKeyToDelete(item)}
                            aria-label={`Hapus API Key ${item.name}`}
                            title="Hapus API Key"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-rose-600 bg-rose-50/70 hover:bg-rose-100 border border-rose-200 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: RIWAYAT LOG AKTIVITAS API */}
      {subView === "logs" && (
        <div className="space-y-4">
          <div className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-600">
              Menampilkan riwayat pembuatan tenant dan token voucher yang dipicu
              melalui Partner API.
            </p>
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={logSearchQuery}
                onChange={(e) => setLogSearchQuery(e.target.value)}
                placeholder="Cari partner, tenant ID, atau token..."
                className="w-full h-10 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-[#0084D1] focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-3.5 px-4 sm:px-5">Waktu</th>
                    <th className="py-3.5 px-4 sm:px-5">Nama Partner</th>
                    <th className="py-3.5 px-4 sm:px-5">Jenis Aksi</th>
                    <th className="py-3.5 px-4 sm:px-5">
                      Target ID / Kode Token
                    </th>
                    <th className="py-3.5 px-4 sm:px-5">Durasi</th>
                    <th className="py-3.5 px-4 sm:px-5">IP Pengirim</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-12 text-center text-slate-500"
                      >
                        <Activity className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        <p className="text-xs">
                          Belum ada aktivitas request Partner API yang tercatat.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr
                        key={log.id}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="py-3.5 px-4 sm:px-5 font-mono tabular-nums text-slate-600 whitespace-nowrap">
                          {log.created_at}
                        </td>
                        <td className="py-3.5 px-4 sm:px-5 font-bold text-slate-900">
                          {log.collaborator_name}
                        </td>
                        <td className="py-3.5 px-4 sm:px-5">
                          {log.action_type === "create_tenant" ? (
                            <span className="inline-flex items-center gap-1.5 text-[#0084D1] font-semibold">
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>Buat Akun Tenant</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold">
                              <Ticket className="w-3.5 h-3.5" />
                              <span>Buat Token Sewa</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 sm:px-5 font-mono font-semibold text-slate-900">
                          {log.target_id}
                        </td>
                        <td className="py-3.5 px-4 sm:px-5 font-mono tabular-nums text-slate-700">
                          {log.duration_label}
                        </td>
                        <td className="py-3.5 px-4 sm:px-5 font-mono tabular-nums text-slate-500">
                          {log.request_ip}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreatePartnerKeyModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onConfirm={handleCreateKey}
      />

      {createdKeyModal && (
        <PartnerKeyCreatedModal
          isOpen={Boolean(createdKeyModal)}
          partnerName={createdKeyModal.name}
          rawApiKey={createdKeyModal.rawKey}
          onClose={() => setCreatedKeyModal(null)}
          showToast={showToast}
        />
      )}

      <DeletePartnerKeyModal
        isOpen={Boolean(keyToDelete)}
        partnerKey={keyToDelete}
        onClose={() => setKeyToDelete(null)}
        onConfirm={handleDeleteKey}
      />
    </div>
  );
};
