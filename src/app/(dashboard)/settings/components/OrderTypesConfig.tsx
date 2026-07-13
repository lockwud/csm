import { ConfigList } from "./ConfigList";

export function OrderTypesConfig({ items }: { items: Array<{ id: string; label: string; active: boolean }> }) {
  return <ConfigList title="Order Types Configuration" items={items} addLabel="Add order type" />;
}
