'use client';

import {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useState,
} from 'react';

interface MentionUser {
    uuid: string;
    name: string;
    email: string;
    role: string;
}

interface MentionListProps {
    items: MentionUser[];
    command: (item: { id: string; label: string }) => void;
}

export const MentionList = forwardRef<any, MentionListProps>(
    function MentionList({ items, command }, ref) {
        const [selectedIndex, setSelectedIndex] = useState(0);

        useEffect(() => {
            setSelectedIndex(0);
        }, [items]);

        useImperativeHandle(ref, () => ({
            onKeyDown: ({ event }: { event: KeyboardEvent }) => {
                if (event.key === 'ArrowUp') {
                    setSelectedIndex((prev) =>
                        prev <= 0 ? items.length - 1 : prev - 1,
                    );
                    return true;
                }
                if (event.key === 'ArrowDown') {
                    setSelectedIndex((prev) =>
                        prev >= items.length - 1 ? 0 : prev + 1,
                    );
                    return true;
                }
                if (event.key === 'Enter') {
                    const item = items[selectedIndex];
                    if (item) {
                        command({ id: item.uuid, label: item.name || item.email });
                    }
                    return true;
                }
                return false;
            },
        }));

        if (items.length === 0) {
            return (
                <div className="rounded-lg bg-card-lv2 p-2 text-xs text-text-tertiary shadow-lg ring-1 ring-card-lv3">
                    No users found
                </div>
            );
        }

        return (
            <div className="flex flex-col overflow-hidden rounded-lg bg-card-lv2 shadow-lg ring-1 ring-card-lv3 max-h-48 overflow-y-auto">
                {items.map((item, index) => (
                    <button
                        key={item.uuid}
                        type="button"
                        onClick={() =>
                            command({ id: item.uuid, label: item.name || item.email })
                        }
                        className={`flex items-center gap-2 px-3 py-2 text-left text-sm transition ${
                            index === selectedIndex
                                ? 'bg-primary-light/10 text-text-primary'
                                : 'text-text-secondary hover:bg-card-lv3/50'
                        }`}
                    >
                        <span className="flex size-6 items-center justify-center rounded-full bg-primary-light/20 text-xs font-bold text-primary-light">
                            {(item.name || item.email || '?')[0].toUpperCase()}
                        </span>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">
                                {item.name || item.email}
                            </span>
                            {item.name && (
                                <span className="text-xs text-text-tertiary">
                                    {item.email}
                                </span>
                            )}
                        </div>
                    </button>
                ))}
            </div>
        );
    },
);
