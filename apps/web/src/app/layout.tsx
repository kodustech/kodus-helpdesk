import type { Metadata } from 'next';
import { DM_Sans, Overpass_Mono } from 'next/font/google';
import { AuthSessionProvider } from '@/core/providers/session.provider';
import { QueryProvider } from '@/core/providers/query.provider';
import './globals.css';

const dmSans = DM_Sans({
    subsets: ['latin'],
    variable: '--font-sans',
    display: 'swap',
});

const overpassMono = Overpass_Mono({
    subsets: ['latin'],
    variable: '--font-mono',
    display: 'swap',
});

export const metadata: Metadata = {
    title: 'Kodus Helpdesk',
    description: 'Kodus Enterprise Helpdesk',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html
            lang="en"
            className={`dark ${dmSans.variable} ${overpassMono.variable}`}
            style={{ colorScheme: 'dark' }}
        >
            <body className={dmSans.className}>
                <AuthSessionProvider>
                    <QueryProvider>{children}</QueryProvider>
                </AuthSessionProvider>
            </body>
        </html>
    );
}
