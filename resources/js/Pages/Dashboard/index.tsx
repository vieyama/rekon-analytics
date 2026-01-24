import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ModalImportReport } from './Components/ModalImportReport';
import { useState } from 'react';
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
import { TempDataType } from '@/Store/tempDataAtom';
import { toast } from '@/hooks/use-toast';

export type ParticipantProps = { name: string, email: string, gender: string }
export type EventProps = { event_name: string, id: number, event_register: { user_id: number; }[] }

export const columns: ColumnDef<TempDataType>[] = [

    {
        accessorKey: "year",
        cell: ({ row }) => (
            <div className="capitalize">{row.getValue("year")}</div>
        ),
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
        cell: ({ row }) => <div className="lowercase">{row.getValue("arkas_score")}%</div>,
    },
    {
        accessorKey: "id",
        enableHiding: false,
        cell: ({ row }) => {
            const handleDelete = (id: string) => {
                console.log(id);
                router.delete(`/report/${id}`, {
                    onSuccess: () => {
                        toast({
                            title: "Data terhapus",
                            description: "Data rapor berhasil dihapus"
                        })
                    }
                })
            }
            return (
                <div className='flex w-auto gap-2'>
                    <Button asChild>
                        <Link href={`/dashboard/report/${row.getValue("id")}`}>Detail</Link>
                    </Button>
                    <Button onClick={() => handleDelete(row.getValue("id"))}>Hapus</Button>
                </div>
            )
        },
    },
]

export default function Dashboard() {

    const [isOpen, setIsOpen] = useState(false)
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
        []
    )
    const [columnVisibility, setColumnVisibility] =
        useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = useState({})
    const report = usePage().props?.report as { data: TempDataType[] }
    const table = useReactTable({
        data: report.data,
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
        <AuthenticatedLayout>
            <Head title="Dashboard" />
            <div className="py-6">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <Card className="w-full">
                        <CardHeader className='flex justify-between sm:items-center sm:flex-row'>
                            <CardTitle className='text-2xl'>DAFTAR ANALISIS REKOMENDASI</CardTitle>
                            <ModalImportReport isOpen={isOpen} setIsOpen={setIsOpen} />
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center py-4">
                                <Input
                                    placeholder="Cari tahun..."
                                    value={(table.getColumn("year")?.getFilterValue() as string) ?? ""}
                                    onChange={(event) =>
                                        table.getColumn("year")?.setFilterValue(event.target.value)
                                    }
                                    className="max-w-sm"
                                />
                            </div>
                            <div className="border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead rowSpan={2} className="px-4 py-2 font-semibold text-center border-r border-[#e5e5e5]">
                                                Tahun
                                            </TableHead>
                                            <TableHead colSpan={3} className="px-4 py-2 font-semibold text-center border-r border-[#e5e5e5]">
                                                Prosentase Kesesuaian
                                            </TableHead>
                                            <TableHead rowSpan={2} className="px-4 py-2 font-semibold text-center">
                                                Aksi
                                            </TableHead>
                                        </TableRow>
                                        <TableRow>
                                            <TableHead className="px-4 py-2 font-semibold text-center border-r border-[#e5e5e5]">RKT Prioritas</TableHead>
                                            <TableHead className="px-4 py-2 font-semibold text-center border-r border-[#e5e5e5]">RKT Keseluruhan</TableHead>
                                            <TableHead className="px-4 py-2 font-semibold text-center border-r border-[#e5e5e5]">Arkas</TableHead>
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
