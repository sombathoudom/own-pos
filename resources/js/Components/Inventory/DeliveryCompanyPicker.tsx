import { Badge } from 'react-bootstrap';

export type DeliveryCompanyOption = {
    id: number;
    name: string;
    delivery_cost_usd: string;
};

type DeliveryCompanyPickerProps = {
    companies: DeliveryCompanyOption[];
    selectedId: number | null;
    onChange: (company: DeliveryCompanyOption | null) => void;
    customerDeliveryFee?: number;
    disabled?: boolean;
};

export default function DeliveryCompanyPicker({
    companies,
    selectedId,
    onChange,
    customerDeliveryFee = 0,
    disabled = false,
}: DeliveryCompanyPickerProps) {
    if (companies.length === 0) {
        return (
            <div className="small fst-italic text-muted">
                No delivery companies configured.{' '}
                <a href="/delivery-companies/create" target="_blank">
                    Add one
                </a>
            </div>
        );
    }

    const selected = companies.find((c) => c.id === selectedId) ?? null;
    const deliveryProfit = selected
        ? customerDeliveryFee - Number(selected.delivery_cost_usd)
        : null;

    return (
        <div>
            {/* Box grid */}
            <div
                className="d-flex mb-1 gap-1 flex-nowrap overflow-x-auto"
                style={{ scrollbarWidth: 'thin' }}
            >
                {/* None option */}
                <button
                    type="button"
                    onClick={() => onChange(null)}
                    disabled={disabled}
                    className={`btn btn-sm px-2 py-1 ${
                        selectedId === null
                            ? 'btn-secondary'
                            : 'btn-outline-secondary'
                    }`}
                    style={{ minWidth: 52, fontSize: '0.8rem' }}
                >
                    <i className="ri-close-line me-1" style={{ fontSize: '0.75rem' }}></i>
                    None
                </button>

                {companies.map((company) => {
                    const isSelected = selectedId === company.id;

                    return (
                        <button
                            key={company.id}
                            type="button"
                            onClick={() => onChange(company)}
                            disabled={disabled}
                            className={`btn btn-sm d-flex flex-column align-items-center gap-0 px-2 py-1 ${
                                isSelected
                                    ? 'btn-primary shadow'
                                    : 'btn-outline-primary'
                            }`}
                            style={{ minWidth: 60, fontSize: '0.8rem' }}
                        >
                            <span className="fw-bold">{company.name}</span>
                            <span
                                style={{ fontSize: '0.65rem' }}
                                className={
                                    isSelected ? 'text-white' : 'text-muted'
                                }
                            >
                                ${Number(company.delivery_cost_usd).toFixed(2)}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Profit hint */}
            {selected && deliveryProfit !== null && (
                <div style={{ fontSize: '0.75rem' }}>
                    <span className="me-1 text-muted">Profit:</span>
                    <Badge
                        bg={deliveryProfit >= 0 ? 'success' : 'danger'}
                        className="fw-normal"
                        style={{ fontSize: '0.7rem' }}
                    >
                        {deliveryProfit >= 0 ? '+' : ''}$
                        {deliveryProfit.toFixed(2)}
                    </Badge>
                </div>
            )}
        </div>
    );
}
