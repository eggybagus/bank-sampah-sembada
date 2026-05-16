import { useNavigate } from "react-router-dom";
import {
  Bell,
  Loader2,
  CheckCheck,
  ArrowLeft,
  CircleDollarSign,
  Package,
  Wallet,
  TrendingUp,
} from "lucide-react";
import ErrorState from "../common/ErrorState";
import { usePageTitle } from "../../hooks/usePageTitle";
import { useAuth } from "../../hooks/useAuth";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "../../hooks/useNotifications";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import type { Notification } from "../../types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const typeConfig: Record<
  Notification["type"],
  { label: string; icon: React.ReactNode; color: string; border: string; bg: string }
> = {
  deposit_created: {
    label: "Deposit",
    icon: <CircleDollarSign size={16} />,
    color: "text-emerald-600",
    border: "border-emerald-200",
    bg: "bg-emerald-50",
  },
  withdrawal_completed: {
    label: "Penarikan Selesai",
    icon: <Wallet size={16} />,
    color: "text-blue-600",
    border: "border-blue-200",
    bg: "bg-blue-50",
  },
  withdrawal_requested: {
    label: "Permintaan Penarikan",
    icon: <TrendingUp size={16} />,
    color: "text-amber-600",
    border: "border-amber-200",
    bg: "bg-amber-50",
  },
  price_update: {
    label: "Update Harga",
    icon: <Package size={16} />,
    color: "text-purple-600",
    border: "border-purple-200",
    bg: "bg-purple-50",
  },
};

function formatNotifDate(dateStr: string): string {
  return format(new Date(dateStr), "d MMM yyyy, HH:mm", { locale: id });
}

// ─── Skeletons ───────────────────────────────────────────────────────────────

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
      ))}
    </div>
  );
}

// ─── Notification item ───────────────────────────────────────────────────────

function NotificationItem({
  notification,
  onClick,
}: {
  notification: Notification;
  onClick: () => void;
}) {
  const config = typeConfig[notification.type];
  const isUnread = !notification.is_read;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-start gap-4 p-4 rounded-2xl border transition-all duration-200 ${
        isUnread
          ? "bg-white border-l-4 border-l-emerald-500 border-slate-100 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.04)] hover:shadow-md"
          : "bg-slate-50/50 border-slate-100 hover:bg-white hover:shadow-sm"
      }`}
    >
      {/* Icon */}
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${config.bg} ${config.border} ${config.color}`}
      >
        {config.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className={`text-[10px] font-black uppercase tracking-wider ${config.color}`}
          >
            {config.label}
          </span>
          {isUnread && (
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          )}
        </div>
        <p className="text-sm font-bold text-slate-900">{notification.title}</p>
        <p className="text-xs text-slate-500 font-medium mt-0.5 line-clamp-2">
          {notification.message}
        </p>
        <p className="text-[10px] text-slate-400 font-bold mt-1.5">
          {formatNotifDate(notification.created_at)}
        </p>
      </div>
    </button>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function NotificationCenter() {
  usePageTitle("Notifikasi");

  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id ?? "";

  const {
    data: notifications,
    isLoading,
    error,
  } = useNotifications(userId);

  const markRead = useMarkNotificationRead(userId);
  const markAll = useMarkAllNotificationsRead(userId);

  const unreadCount = notifications?.filter((n) => !n.is_read).length ?? 0;

  async function handleClick(notification: Notification) {
    if (!notification.is_read) {
      await markRead.mutateAsync(notification.id);
    }
  }

  async function handleMarkAll() {
    await markAll.mutateAsync();
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-3xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Bell size={18} className="text-brand-600" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Pusat Notifikasi
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Notifikasi
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            {unreadCount > 0
              ? `${unreadCount} notifikasi belum dibaca`
              : "Semua notifikasi telah dibaca"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-50 transition-all"
          >
            <ArrowLeft size={14} />
            Kembali
          </button>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAll}
              disabled={markAll.isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white font-bold rounded-xl text-sm hover:bg-brand-700 disabled:opacity-60 transition-all"
            >
              {markAll.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <CheckCheck size={14} />
              )}
              Tandai Semua Dibaca
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <ListSkeleton />
      ) : error ? (
        <ErrorState message="Gagal memuat notifikasi." />
      ) : !notifications || notifications.length === 0 ? (
        <div className="text-center py-16 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
          <Bell size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-400 font-medium">
            Belum ada notifikasi
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              onClick={() => handleClick(n)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
