export const CATEGORY_CONFIG = {
    bug: { color: '#dc4e58', label: 'Bug', description: 'System functionality failure', icon: 'Bug' },
    feature: { color: '#f59220', label: 'Feature', description: 'New system resource request', icon: 'Lightbulb' },
    improvement: { color: '#674982', label: 'Improvement', description: 'Enhancement request for existing resource', icon: 'TrendingUp' },
} as const;

export const STATUS_CONFIG = {
    open: { color: '#dc4e58', label: 'Open' },
    in_progress: { color: '#f59220', label: 'In Progress' },
    resolved: { color: '#42be65', label: 'Resolved' },
    closed: { color: '#674982', label: 'Closed' },
} as const;

export const LABEL_COLORS = [
    // Normal
    '#dc4e58', '#f59220', '#f2c631', '#42be65', '#5190ff', '#674982', '#e54d8a',
    // Pastel
    '#f4a6ab', '#fac89a', '#f7e08a', '#a3dbb5', '#a3c8ff', '#b6a0cb', '#f2a3c4',
    // White
    '#ffffff',
];

export const STATUS_ORDER = ['open', 'in_progress', 'resolved', 'closed'] as const;
