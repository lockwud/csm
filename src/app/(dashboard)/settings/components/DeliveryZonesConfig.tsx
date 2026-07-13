import { ConfigList } from "./ConfigList";

export function DeliveryZonesConfig({ items }: { items: Array<{ id: string; label: string; active: boolean }> }) {
  return <ConfigList title="Delivery Zones Configuration" items={items} addLabel="Add delivery zone" />;
}
