'use client';

import { Bug, Lightbulb, TrendingUp } from 'lucide-react';
import { CATEGORY_CONFIG } from './constants';

const ICONS = {
    bug: Bug,
    feature: Lightbulb,
    improvement: TrendingUp,
} as const;

export function CategoryBadge({ category }: { category: string }) {
    const config = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG];
    if (!config) return null;

    const Icon = ICONS[category as keyof typeof ICONS];

    return (
        <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
            style={{
                backgroundColor: `${config.color}20`,
                color: config.color,
            }}
        >
            {Icon && <Icon className="size-3" />}
            {config.label}
        </span>
    );
}
