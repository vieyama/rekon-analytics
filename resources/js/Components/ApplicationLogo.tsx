import { ClassAttributes, ImgHTMLAttributes } from 'react';
import { JSX } from 'react/jsx-runtime';

export default function ApplicationLogo(props: JSX.IntrinsicAttributes & ClassAttributes<HTMLImageElement> & ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <div className='flex items-center gap-2'>
            <img src="/images/logo.png" className='w-full h-20' {...props} alt="Edu Jatim Logo" />
        </div>
    );
}
