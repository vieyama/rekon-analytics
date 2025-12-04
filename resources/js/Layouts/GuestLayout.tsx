import { PropsWithChildren } from 'react';
import Header from './Components/Header';
import Footer from './Components/Footer';

export default function Guest({ children }: PropsWithChildren) {
    return (
        <>
            <Header />
            <main className="grow">{children}</main>
            <Footer />
        </>
    );
}
