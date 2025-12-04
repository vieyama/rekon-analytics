import {
    forwardRef,
    InputHTMLAttributes,
    useImperativeHandle,
    useRef,
} from 'react';

export default forwardRef(function SelectInput(
    {
        className = '',
        options,
        ...props
    }: InputHTMLAttributes<HTMLSelectElement> & { options: { text: string, value: string }[] },
    ref,
) {
    const localRef = useRef<HTMLSelectElement>(null);

    useImperativeHandle(ref, () => ({
        focus: () => localRef.current?.focus(),
    }));

    return (
        <select
            {...props}
            className={
                'rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ' +
                className
            }
            ref={localRef}
        >
            {options.map(item => (
                <option value={item.value} key={item.value}>{item.text}</option>
            ))}
        </select>
    );
});
