import { useMemo } from 'react';
import AsyncSelect from 'react-select/async';

import { search as customersSearch } from '@/routes/customers';
import type { InventoryCustomer } from '@/types';

type CustomerSelectProps = {
    customers: InventoryCustomer[];
    value: number | null;
    onChange: (customerId: number | null) => void;
    inputId?: string;
    placeholder?: string;
    isClearable?: boolean;
    disabled?: boolean;
};

type CustomerOption = {
    value: number;
    label: string;
    customer: InventoryCustomer;
};

const toOption = (customer: InventoryCustomer): CustomerOption => ({
    value: customer.id,
    label: customer.phone
        ? `${customer.name} | ${customer.phone}`
        : customer.name,
    customer,
});

export default function CustomerSelect({
    customers,
    value,
    onChange,
    inputId,
    placeholder = 'Search customer...',
    isClearable = true,
    disabled = false,
}: CustomerSelectProps) {
    const defaultOptions = useMemo(() => customers.map(toOption), [customers]);
    const selectedOption = useMemo(
        () => defaultOptions.find((option) => option.value === value) ?? null,
        [defaultOptions, value],
    );

    const loadOptions = async (
        inputValue: string,
    ): Promise<CustomerOption[]> => {
        const response = await fetch(
            customersSearch.url({ query: { search: inputValue || undefined } }),
            {
                headers: {
                    Accept: 'application/json',
                },
                credentials: 'same-origin',
            },
        );

        if (!response.ok) {
            return defaultOptions;
        }

        const payload = (await response.json()) as {
            data: InventoryCustomer[];
        };

        const options = payload.data.map(toOption);

        if (
            selectedOption &&
            !options.some((option) => option.value === selectedOption.value)
        ) {
            return [selectedOption, ...options];
        }

        return options;
    };

    return (
        <AsyncSelect<CustomerOption, false>
            inputId={inputId}
            cacheOptions
            defaultOptions={defaultOptions}
            loadOptions={loadOptions}
            value={selectedOption}
            onChange={(option) => onChange(option?.value ?? null)}
            placeholder={placeholder}
            isClearable={isClearable}
            isDisabled={disabled}
            noOptionsMessage={() => 'No customers found'}
            loadingMessage={() => 'Searching customers...'}
            formatOptionLabel={(option) => <span>{option.label}</span>}
            styles={{
                control: (base) => ({
                    ...base,
                    minHeight: 38,
                    borderColor: '#ced4da',
                    boxShadow: 'none',
                }),
                valueContainer: (base) => ({
                    ...base,
                    padding: '2px 12px',
                }),
                input: (base) => ({
                    ...base,
                    margin: 0,
                    padding: 0,
                }),
                placeholder: (base) => ({
                    ...base,
                    color: '#6c757d',
                }),
                menu: (base) => ({
                    ...base,
                    zIndex: 1055,
                }),
            }}
        />
    );
}
