'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

const NAV_ITEMS = [
    { href: '/customers', label: 'Customers' },
    { href: '/users', label: 'Users' },
    { href: '/settings', label: 'Settings' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { data: session } = useSession();

    return (
        <div className="min-h-screen bg-background">
            {/* Top Navbar */}
            <nav className="border-b border-border bg-card-lv1">
                <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
                    <div className="flex items-center gap-8">
                        <Link
                            href="/customers"
                            className="text-lg font-bold text-primary"
                        >
                            Kodus Helpdesk
                        </Link>

                        <div className="flex gap-1">
                            {NAV_ITEMS.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                                        pathname.startsWith(item.href)
                                            ? 'bg-card-lv3 text-text-primary'
                                            : 'text-text-secondary hover:text-text-primary'
                                    }`}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="text-sm text-text-secondary">
                            {session?.user?.email}
                        </span>
                        <button
                            onClick={() => signOut({ callbackUrl: '/sign-in' })}
                            className="rounded-lg px-3 py-1.5 text-sm text-text-secondary transition hover:text-danger"
                        >
                            Sign out
                        </button>
                    </div>
                </div>
            </nav>

            {/* Content */}
            <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
        </div>
    );
}
