import { Button } from "@/Components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/Components/ui/dialog"
import { Input } from "@/Components/ui/input"
import { Label } from "@/Components/ui/label"
import { useFileUploader } from "@/hooks/use-upload-report";
import { useForm } from "react-hook-form";

export function ModalImportReport({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: React.Dispatch<React.SetStateAction<boolean>> }) {
    const {
        register,
        handleSubmit,
        getValues,
        reset
    } = useForm();

    const { status, uploadFile } = useFileUploader();

    const handleFileUpload = async () => {
        await uploadFile(getValues().file[0])
            .then(() => {
                reset()
                setIsOpen(false)
            })
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" onClick={() => setIsOpen(true)}>Upload Rapor</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Upload Rapor</DialogTitle>
                    <DialogDescription>
                        Upload file Rapor untuk proses analisis.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(handleFileUpload)}>
                    <div className="grid items-center w-full gap-3 mb-4">
                        <Label htmlFor="file">Rapor</Label>
                        <Input id="file"  {...register("file", {
                            required: "Wajib diisi!",
                        })} type="file" disabled={status !== 'idle'} />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={status !== 'idle'}>{status === 'idle' ? 'Proses' : status}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
