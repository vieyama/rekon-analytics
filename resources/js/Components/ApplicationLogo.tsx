import { ClassAttributes, ImgHTMLAttributes } from 'react';
import { JSX } from 'react/jsx-runtime';

export default function ApplicationLogo(props: JSX.IntrinsicAttributes & ClassAttributes<HTMLImageElement> & ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <div className='flex items-center gap-2'>
            <img src="/images/atom.png" className='!w-3' {...props} alt="Example Image" />
            <h1 className='text-xl font-extrabold uppercase'>Edu Jatim</h1>
        </div>
    );
}
