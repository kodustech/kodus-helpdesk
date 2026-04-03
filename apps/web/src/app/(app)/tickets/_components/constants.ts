export const CATEGORY_CONFIG = {
    bug: { color: '#dc4e58', label: 'Bug', description: 'System functionality failure', icon: 'Bug' },
    feature: { color: '#f59220', label: 'Feature', description: 'New system resource request', icon: 'Lightbulb' },
    improvement: { color: '#674982', label: 'Improvement', description: 'Enhancement request for existing resource', icon: 'TrendingUp' },
} as const;

export const STATUS_CONFIG = {
    open: { color: '#5190ff', label: 'Open' },
    in_progress: { color: '#f2c631', label: 'In Progress' },
    resolved: { color: '#42be65', label: 'Resolved' },
    closed: { color: '#cdcddf', label: 'Closed' },
} as const;

export const LABEL_COLORS = [
    '#dc4e58', '#f59220', '#f2c631', '#42be65',
    '#5190ff', '#674982', '#f8b76d', '#fdbfbf',
    '#c9bbf2', '#ff8b40', '#cdcddf', '#30304b',
];

export const STATUS_ORDER = ['open', 'in_progress', 'resolved', 'closed'] as const;
