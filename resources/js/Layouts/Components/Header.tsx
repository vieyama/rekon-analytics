import { Link, usePage } from '@inertiajs/react';

const Header = () => {
    const auth = usePage().props?.auth

    return (
        <header className="fixed z-30 w-full top-2 md:top-6">
            <div className="max-w-6xl px-4 mx-auto sm:px-6">
                <div className="relative flex h-14 items-center justify-between gap-3 rounded-2xl bg-white/90 px-3 shadow-lg shadow-black/[0.03] backdrop-blur-sm before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(theme(colors.gray.100),theme(colors.gray.200))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)]">
                    {/* Site branding */}
                    <div className="flex items-center flex-1">
                        <Link href="/" className="inline-flex" aria-label="Cruip">
                            <img src="/images/logo.png" alt="" className='w-14' />
                        </Link>
                    </div>

                    {/* Desktop sign in links */}
                    <ul className="flex items-center justify-end flex-1 gap-3">
                        <li key="1">
                            <Link
                                href="/login"
                                className="p-2 text-sm font-medium text-gray-800 bg-white rounded-lg shadow hover:bg-gray-50"
                            >
                                {auth.user ? 'Dashboard' : 'Login'}
                            </Link>
                        </li>
                        <li key="2">
                            <Link
                                href="/register"
                                className="p-2 text-sm font-medium text-gray-200 bg-gray-800 rounded-lg shadow hover:bg-gray-900"
                            >
                                Register
                            </Link>
                        </li>
                    </ul>
                </div>
            </div>
        </header>
    )
}

export default Header
