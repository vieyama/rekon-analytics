import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head } from '@inertiajs/react';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import { ParticipantProps } from '../Dashboard';

export default function Edit({
    mustVerifyEmail,
    status,
    participant
}: PageProps<{ mustVerifyEmail: boolean; status?: string, participant: ParticipantProps }>) {

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Profil
                </h2>
            }
        >
            <Head title="Profil" />

            <div className="py-12">
                <div className="mx-auto space-y-6 max-w-7xl sm:px-6 lg:px-8">
                    <div className="p-4 bg-white shadow sm:rounded-lg sm:p-8">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            participant={participant}
                            className="max-w-xl"
                        />
                    </div>

                    <div className="p-4 bg-white shadow sm:rounded-lg sm:p-8">
                        <UpdatePasswordForm className="max-w-xl" />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
