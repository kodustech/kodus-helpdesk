'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils/date';
import {
    useUnreadCount,
    useNotifications,
    useMarkAsRead,
    useMarkAllAsRead,
} from '@/core/hooks/useNotifications';

const TYPE_ICONS: Record<string, string> = {
    new_ticket: '🎫',
    ticket_assigned: '👤',
    status_changed: '🔄',
    new_comment: '💬',
    mentioned: '@',
};

export function NotificationBell() {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const { data: unreadCount = 0 } = useUnreadCount();
    const { data: notifications = [] } = useNotifications();
    const markAsRead = useMarkAsRead();
    const markAllAsRead = useMarkAllAsRead();

    // Close dropdown on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        }
        if (open) {
            document.addEventListener('mousedown', handleClick);
            return () => document.removeEventListener('mousedown', handleClick);
        }
    }, [open]);

    const handleNotificationClick = (notification: any) => {
        if (!notification.read) {
            markAsRead.mutate(notification.uuid);
        }
        setOpen(false);
        // Navigate to ticket if available
        if (notification.ticket?.uuid) {
            // Use query param or state to open ticket detail
            window.location.href = `/tickets?ticket=${notification.ticket.uuid}`;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="relative flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary transition hover:text-text-primary hover:bg-card-lv2"
            >
                <Bell className="size-5" />
                {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-80 overflow-hidden rounded-xl bg-card-lv2 shadow-lg ring-1 ring-card-lv3 z-50">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-card-lv3 px-4 py-3">
                        <span className="text-sm font-semibold text-text-primary">
                            Notifications
                        </span>
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={() => markAllAsRead.mutate()}
                                className="text-xs text-primary-light hover:underline"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-6 text-center text-sm text-text-tertiary">
                                No notifications
                            </div>
                        ) : (
                            notifications.map((n: any) => (
                                <button
                                    key={n.uuid}
                                    type="button"
                                    onClick={() => handleNotificationClick(n)}
                                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-card-lv3/30 ${
                                        !n.read ? 'bg-card-lv3/10' : ''
                                    }`}
                                >
                                    <span className="mt-0.5 text-base">
                                        {TYPE_ICONS[n.type] || '📌'}
                                    </span>
                                    <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-text-primary truncate">
                                                {n.title}
                                            </span>
                                            {!n.read && (
                                                <span className="size-1.5 shrink-0 rounded-full bg-primary-light" />
                                            )}
                                        </div>
                                        {n.body && (
                                            <span className="text-xs text-text-secondary truncate">
                                                {n.body}
                                            </span>
                                        )}
                                        <span className="text-[10px] text-text-tertiary">
                                            {formatRelativeTime(n.createdAt)}
                                        </span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

