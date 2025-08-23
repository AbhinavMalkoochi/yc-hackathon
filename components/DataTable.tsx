"use client";

import { useState } from 'react';
import { ChevronUp, ChevronDown, MoreHorizontal, Eye, Edit, Trash2, Plus } from 'lucide-react';

export interface Column<T> {
    key: keyof T | string;
    label: string;
    sortable?: boolean;
    render?: (value: any, item: T) => React.ReactNode;
    width?: string;
}

export interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    title?: string;
    loading?: boolean;
    error?: string;
    onView?: (item: T) => void;
    onEdit?: (item: T) => void;
    onDelete?: (item: T) => void;
    onCreate?: () => void;
    searchable?: boolean;
    emptyMessage?: string;
    actions?: boolean;
}

export default function DataTable<T extends Record<string, any>>({
    data,
    columns,
    title,
    loading = false,
    error,
    onView,
    onEdit,
    onDelete,
    onCreate,
    searchable = true,
    emptyMessage = "No data available",
    actions = true,
}: DataTableProps<T>) {
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

    // Filter data based on search term
    const filteredData = searchable ? data.filter(item => {
        const searchLower = searchTerm.toLowerCase();
        return Object.values(item).some(value =>
            String(value).toLowerCase().includes(searchLower)
        );
    }) : data;

    // Sort data
    const sortedData = [...filteredData].sort((a, b) => {
        if (!sortColumn) return 0;

        const aValue = a[sortColumn];
        const bValue = b[sortColumn];

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    const handleSort = (columnKey: string) => {
        const column = columns.find(col => col.key === columnKey);
        if (!column?.sortable) return;

        if (sortColumn === columnKey) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(columnKey);
            setSortDirection('asc');
        }
    };

    const toggleSelectItem = (itemId: string) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(itemId)) {
            newSelected.delete(itemId);
        } else {
            newSelected.add(itemId);
        }
        setSelectedItems(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedItems.size === sortedData.length) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(sortedData.map(item => item._id || item.id)));
        }
    };

    const getValue = (item: T, columnKey: string | keyof T) => {
        return item[columnKey as keyof T];
    };

    if (error) {
        return (
            <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
                <div className="text-red-800 dark:text-red-200 font-medium">Error loading data</div>
                <div className="text-red-600 dark:text-red-400 text-sm mt-1">{error}</div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <div>
                        {title && (
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
                        )}
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {loading ? 'Loading...' : `${filteredData.length} items`}
                            {selectedItems.size > 0 && ` (${selectedItems.size} selected)`}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {searchable && (
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            />
                        )}

                        {onCreate && (
                            <button
                                onClick={onCreate}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm flex items-center gap-2 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Create
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                            {/* Select all checkbox */}
                            <th className="w-12 px-6 py-3 text-left">
                                <input
                                    type="checkbox"
                                    checked={selectedItems.size === sortedData.length && sortedData.length > 0}
                                    onChange={toggleSelectAll}
                                    className="rounded border-gray-300 dark:border-gray-600"
                                />
                            </th>

                            {columns.map((column) => (
                                <th
                                    key={String(column.key)}
                                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${column.sortable ? 'cursor-pointer hover:text-gray-700 dark:hover:text-gray-200' : ''
                                        }`}
                                    style={{ width: column.width }}
                                    onClick={() => column.sortable && handleSort(String(column.key))}
                                >
                                    <div className="flex items-center gap-1">
                                        {column.label}
                                        {column.sortable && (
                                            <div className="flex flex-col">
                                                <ChevronUp
                                                    className={`w-3 h-3 ${sortColumn === column.key && sortDirection === 'asc'
                                                            ? 'text-blue-500'
                                                            : 'text-gray-400'
                                                        }`}
                                                />
                                                <ChevronDown
                                                    className={`w-3 h-3 -mt-1 ${sortColumn === column.key && sortDirection === 'desc'
                                                            ? 'text-blue-500'
                                                            : 'text-gray-400'
                                                        }`}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </th>
                            ))}

                            {actions && (onView || onEdit || onDelete) && (
                                <th className="w-24 px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Actions
                                </th>
                            )}
                        </tr>
                    </thead>

                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {loading ? (
                            <tr>
                                <td colSpan={columns.length + 2} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                                        <span className="ml-2">Loading...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : sortedData.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length + 2} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            sortedData.map((item, index) => {
                                const itemId = item._id || item.id || index;
                                const isSelected = selectedItems.has(String(itemId));

                                return (
                                    <tr
                                        key={String(itemId)}
                                        className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                            }`}
                                    >
                                        {/* Select checkbox */}
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleSelectItem(String(itemId))}
                                                className="rounded border-gray-300 dark:border-gray-600"
                                            />
                                        </td>

                                        {columns.map((column) => (
                                            <td key={String(column.key)} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                {column.render
                                                    ? column.render(getValue(item, column.key), item)
                                                    : String(getValue(item, column.key) || '-')
                                                }
                                            </td>
                                        ))}

                                        {actions && (onView || onEdit || onDelete) && (
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                <div className="flex items-center justify-end gap-2">
                                                    {onView && (
                                                        <button
                                                            onClick={() => onView(item)}
                                                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 transition-colors"
                                                            title="View details"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                    )}

                                                    {onEdit && (
                                                        <button
                                                            onClick={() => onEdit(item)}
                                                            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                    )}

                                                    {onDelete && (
                                                        <button
                                                            onClick={() => onDelete(item)}
                                                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer with selected items count */}
            {selectedItems.size > 0 && (
                <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            {selectedItems.size} item{selectedItems.size === 1 ? '' : 's'} selected
                        </span>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setSelectedItems(new Set())}
                                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                            >
                                Clear selection
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
