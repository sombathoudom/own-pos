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
};

export default function DeliveryCompanyPicker({
    companies,
    selectedId,
    onChange,
    customerDeliveryFee = 0,
}: DeliveryCompanyPickerProps) {
    if (companies.length === 0) {
        return (
            <div className="small text-muted fst-italic">
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
            <div className="d-flex flex-wrap gap-2 mb-2">
                {/* None option */}
                <button
                    type="button"
                    onClick={() => onChange(null)}
                    className={`btn btn-sm px-3 py-2 ${
                        selectedId === null
                            ? 'btn-secondary'
                            : 'btn-outline-secondary'
                    }`}
                    style={{ minWidth: 64 }}
                >
                    <i className="ri-close-line me-1"></i>
                    None
                </button>

                {companies.map((company) => {
                    const isSelected = selectedId === company.id;
                    return (
                        <button
                            key={company.id}
                            type="button"
                            onClick={() => onChange(company)}
                            className={`btn btn-sm px-3 py-2 d-flex flex-column align-items-center gap-1 ${
                                isSelected
                                    ? 'btn-primary shadow'
                                    : 'btn-outline-primary'
                            }`}
                            style={{ minWidth: 72 }}
                        >
                            <span className="fw-bold">{company.name}</span>
                            <span
                                style={{ fontSize: '0.7rem' }}
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
                <div className="small">
                    <span className="text-muted me-1">Delivery profit:</span>
                    <Badge
                        bg={deliveryProfit >= 0 ? 'success' : 'danger'}
                        className="fw-normal"
                    >
                        {deliveryProfit >= 0 ? '+' : ''}$
                        {deliveryProfit.toFixed(2)}
                    </Badge>
                    <span className="text-muted ms-2">
                        (${customerDeliveryFee.toFixed(2)} charged −{' '}
                        ${Number(selected.delivery_cost_usd).toFixed(2)} cost)
                    </span>
                </div>
            )}
        </div>
    );
}
