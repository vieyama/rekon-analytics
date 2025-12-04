import { TableCell, TableRow } from "@/Components/ui/table"
import { Inbox } from "lucide-react"

interface EmptyTableProps {
    colSpan?: number
    title?: string
    description?: string
    children?: React.ReactNode
}

export function EmptyTable({
    colSpan = 1,
    title = "No results found",
    description = "There are no items to display at the moment.",
    children,
}: EmptyTableProps) {
    return (
        <TableRow>
            <TableCell colSpan={colSpan} className="h-[400px] text-center">
                <div className="flex flex-col items-center justify-center">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted">
                        <Inbox className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                    <p className="max-w-sm mt-2 mb-4 text-sm text-muted-foreground">
                        {description}
                    </p>
                    {children}
                </div>
            </TableCell>
        </TableRow>
    )
}
