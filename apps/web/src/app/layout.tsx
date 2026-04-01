import type { Metadata } from 'next';
import './globals.css';

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
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
