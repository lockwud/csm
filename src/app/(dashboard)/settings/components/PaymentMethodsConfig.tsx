import { ConfigList } from "./ConfigList";

export function PaymentMethodsConfig({ items }: { items: Array<{ id: string; label: string; active: boolean }> }) {
  return <ConfigList title="Payment Methods Configuration" items={items} addLabel="Add payment method" />;
}
