'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { NotificationBell } from './_components/NotificationBell';

const CUSTOMER_ROLES = ['customer_owner', 'customer_admin', 'customer_editor'];

const NAV_ITEMS = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/tickets', label: 'Tickets' },
    { href: '/customers', label: 'Customers', managementOnly: true },
    { href: '/users', label: 'Users' },
    { href: '/settings', label: 'Settings' },
];

function useIsIframe() {
    const [isIframe, setIsIframe] = useState(false);

    useEffect(() => {
        setIsIframe(window.self !== window.top);
    }, []);

    return isIframe;
}

function CompactHeader({
    navItems,
    pathname,
    email,
}: {
    navItems: typeof NAV_ITEMS;
    pathname: string;
    email?: string;
}) {
    return (
        <nav className="flex h-10 shrink-0 items-center gap-0 border-b border-card-lv3 bg-card-lv1 px-4 z-50">
            <div className="flex h-full items-center gap-0">
                {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex h-full items-center border-b-2 px-3 text-xs font-medium transition ${
                                isActive
                                    ? 'border-primary-light text-white'
                                    : 'border-transparent text-text-tertiary hover:text-white'
                            }`}
                        >
                            {item.label}
                        </Link>
                    );
                })}
            </div>
            <span className="ml-auto text-xs text-text-tertiary">{email}</span>
        </nav>
    );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const role = session?.user?.role || '';
    const isCustomer = CUSTOMER_ROLES.includes(role);
    const isIframe = useIsIframe();

    const filteredNavItems = NAV_ITEMS.filter(
        (item) => !item.managementOnly || !isCustomer,
    );

    return (
        <div className="flex h-full w-full flex-col overflow-hidden">
            {isIframe ? (
                <CompactHeader
                    navItems={filteredNavItems}
                    pathname={pathname}
                    email={session?.user?.email ?? undefined}
                />
            ) : (
                <nav className="flex h-16 shrink-0 items-center gap-4 border-b-2 border-primary-dark bg-card-lv1 px-6 z-50">
                    <Link
                        href="/customers"
                        className="flex items-center text-lg font-bold text-primary-light"
                    >
                        Kodus Helpdesk
                    </Link>

                    <div className="flex h-full items-center gap-0 ml-4">
                        {filteredNavItems.map((item) => {
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
            )}

            {/* Page Content */}
            <div className="flex flex-1 flex-col relative w-full overflow-auto">
                <div className={`flex flex-col w-full flex-1 gap-6 ${isIframe ? 'pt-4 pb-4' : 'pt-10 pb-16'}`}>
                    <main className={`mx-auto w-full max-w-7xl ${isIframe ? 'px-4' : 'px-8'} flex flex-col gap-6`}>
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}
