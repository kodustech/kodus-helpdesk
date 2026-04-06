'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { NotificationBell } from './_components/NotificationBell';

const CUSTOMER_ROLES = ['customer_owner', 'customer_admin', 'customer_editor'];

const NAV_ITEMS = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/tickets', label: 'Tickets' },
    { href: '/customers', label: 'Customers', managementOnly: true },
    { href: '/users', label: 'Users' },
    { href: '/settings', label: 'Settings' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const role = session?.user?.role || '';
    const isCustomer = CUSTOMER_ROLES.includes(role);

    return (
        <div className="flex h-full w-full flex-col overflow-hidden">
            {/* Navbar - matching kodus-ai pattern */}
            <nav className="flex h-16 shrink-0 items-center gap-4 border-b-2 border-primary-dark bg-card-lv1 px-6 z-50">
                <Link
                    href="/customers"
                    className="flex items-center text-lg font-bold text-primary-light"
                >
                    Kodus Helpdesk
                </Link>

                <div className="flex h-full items-center gap-0 ml-4">
                    {NAV_ITEMS.filter((item) => !item.managementOnly || !isCustomer).map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex h-full flex-row items-center gap-2 border-b-2 px-4 text-sm transition ${
                                    isActive
                                        ? 'border-primary-light font-semibold text-white'
                                        : 'border-transparent text-text-tertiary hover:text-white'
                                }`}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </div>

                <div className="ml-auto flex items-center gap-4">
                    <NotificationBell />
                    <span className="text-sm text-text-secondary">
                        {session?.user?.email}
                    </span>
                    <button
                        onClick={() => signOut({ callbackUrl: '/sign-in' })}
                        className="inline-flex items-center rounded-xl bg-card-lv2 px-4 py-2 text-sm text-text-secondary ring-1 ring-card-lv3 transition hover:brightness-120 hover:text-text-primary"
                    >
                        Sign out
                    </button>
                </div>
            </nav>

            {/* Page Content */}
            <div className="flex flex-1 flex-col relative w-full overflow-auto">
                <div className="flex flex-col w-full flex-1 gap-6 pt-10 pb-16">
                    <main className="mx-auto w-full max-w-7xl px-8 flex flex-col gap-6">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}
