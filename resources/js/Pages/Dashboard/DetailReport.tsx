import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { ModalImportReport } from './Components/ModalImportReport';
import { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"

import { Button } from "@/Components/ui/button"

import { Input } from "@/Components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { AnalyticDetailType, Rkts, tempDataAtom, TempDataType } from '@/Store/tempDataAtom';

export const columns: ColumnDef<Rkts>[] = [
    {
        accessorKey: "identification",
        cell: ({ row }) => {
            return (
                <div className="capitalize">{row.getValue("identification")}</div>
            )
        },
    },
    {
        accessorKey: "priorities_score",
        cell: ({ row }) => <div className="lowercase">{row.getValue("priorities_score")}%</div>,
    },
    {
        accessorKey: "aggregates_score",
        cell: ({ row }) => <div className="lowercase">{row.getValue("aggregates_score")}%</div>,
    },
    {
        accessorKey: "arkas_score",
        cell: ({ row }) => <div className="lowercase">-</div>,
    },
    {
        accessorKey: "priorities_indicator",
        cell: ({ row }) => <div className="lowercase">{row.getValue("priorities_indicator") ?? '-'}</div>,
    },
    {
        accessorKey: "aggregates_indicator",
        cell: ({ row }) => <div className="lowercase">{row.getValue("aggregates_indicator") ?? '-'}</div>,
    },
    {
        accessorKey: "arkas_indicator",
        cell: ({ row }) => <div className="lowercase">{row.getValue("arkas_indicator") ?? '-'}</div>,
    },
]

const parsePageId = (path: string) => path.substring(path.lastIndexOf('/') + 1)

export default function DetailReport() {
    const rkts = usePage().props?.rkts as Rkts[]
    const report = usePage().props?.report as { year: string }

    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
        []
    )
    const [columnVisibility, setColumnVisibility] =
        useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = useState({})

    const table = useReactTable({
        data: rkts,
        columns,

        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        initialState: {
            pagination: {
                pageIndex: 0, //custom initial page index
                pageSize: 5, //custom default page size
            },
        },
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
    })

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Dashboard
                </h2>
            }
        >
            <Head title="Dashboard" />
            <div className="py-6">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <Card className="w-full">
                        <CardHeader className='flex justify-between sm:items-center sm:flex-row'>
                            <CardTitle className='text-2xl'>Detail Rapor Tahun {report?.year}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center py-4">
                                <Input
                                    placeholder="Cari identifikasi..."
                                    value={(table.getColumn("identification")?.getFilterValue() as string) ?? ""}
                                    onChange={(event) =>
                                        table.getColumn("identification")?.setFilterValue(event.target.value)
                                    }
                                    className="max-w-sm"
                                />
                            </div>
                            <div className="border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead rowSpan={3} className="px-4 py-2 align-middle border border-[#e5e5e5]">Identifikasi Masalah</TableHead>
                                            <TableHead colSpan={3} className="px-4 py-2 border border-[#e5e5e5]">Prosentase Kesesuaian</TableHead>
                                            <TableHead colSpan={3} className="px-4 py-2 border border-[#e5e5e5]">Indikator yang belum terpenuhi</TableHead>
                                        </TableRow>
                                        <TableRow>
                                            <TableHead colSpan={2} className="px-4 py-2 border border-[#e5e5e5]">RKT</TableHead>
                                            <TableHead rowSpan={2} className="px-4 py-2 align-middle border border-[#e5e5e5]">Arkas</TableHead>
                                            <TableHead colSpan={2} className="px-4 py-2 border border-[#e5e5e5]">RKT</TableHead>
                                            <TableHead rowSpan={2} className="px-4 py-2 border border-[#e5e5e5]">Arkas</TableHead>
                                        </TableRow>
                                        <TableRow>
                                            <TableHead className="px-4 py-2 border border-[#e5e5e5]">Prioritas</TableHead>
                                            <TableHead className="px-4 py-2 border border-[#e5e5e5]">Keseluruhan</TableHead>
                                            <TableHead className="px-4 py-2 border border-[#e5e5e5]">Prioritas</TableHead>
                                            <TableHead className="px-4 py-2 border border-[#e5e5e5]">Keseluruhan</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {table.getRowModel().rows?.length ? (
                                            table.getRowModel().rows.map((row) => (
                                                <TableRow
                                                    key={row.id}
                                                    data-state={row.getIsSelected() && "selected"}
                                                >
                                                    {row.getVisibleCells().map((cell) => (
                                                        <TableCell className='border-r border-[#e5e5e5]' align='center' key={cell.id}>
                                                            {flexRender(
                                                                cell.column.columnDef.cell,
                                                                cell.getContext()
                                                            )}
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={columns.length}
                                                    className="h-24 text-center"
                                                >
                                                    Tidak ada data.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                            <div className="flex items-center justify-end py-4 space-x-2">
                                <div className="space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => table.previousPage()}
                                        disabled={!table.getCanPreviousPage()}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => table.nextPage()}
                                        disabled={!table.getCanNextPage()}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
