'use client';

export function LabelBadge({
    name,
    color,
    onRemove,
}: {
    name: string;
    color: string;
    onRemove?: () => void;
}) {
    return (
        <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
            style={{
                backgroundColor: `${color}20`,
                color,
            }}
        >
            <span
                className="size-1.5 rounded-full"
                style={{ backgroundColor: color }}
            />
            {name}
            {onRemove && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                    className="ml-0.5 hover:opacity-70"
                >
                    &times;
                </button>
            )}
        </span>
    );
}
