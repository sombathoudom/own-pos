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
            <div className="d-flex mb-2 flex-wrap gap-2">
                {/* None option */}
                <button
                    type="button"
                    onClick={() => onChange(null)}
                    disabled={disabled}
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
                            disabled={disabled}
                            className={`btn btn-sm d-flex flex-column align-items-center gap-1 px-3 py-2 ${
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
                    <span className="me-1 text-muted">Delivery profit:</span>
                    <Badge
                        bg={deliveryProfit >= 0 ? 'success' : 'danger'}
                        className="fw-normal"
                    >
                        {deliveryProfit >= 0 ? '+' : ''}$
                        {deliveryProfit.toFixed(2)}
                    </Badge>
                    <span className="ms-2 text-muted">
                        (${customerDeliveryFee.toFixed(2)} charged − $
                        {Number(selected.delivery_cost_usd).toFixed(2)} cost)
                    </span>
                </div>
            )}
        </div>
    );
}
