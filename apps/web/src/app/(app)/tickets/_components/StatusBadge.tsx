'use client';

import { STATUS_CONFIG } from './constants';

export function StatusBadge({ status }: { status: string }) {
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
    if (!config) return null;

    return (
        <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
            style={{
                backgroundColor: `${config.color}20`,
                color: config.color,
            }}
        >
            <span
                className="size-1.5 rounded-full"
                style={{ backgroundColor: config.color }}
            />
            {config.label}
        </span>
    );
}
