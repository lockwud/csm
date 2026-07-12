import { ConfigList } from "./ConfigList";

export function PackageTypesConfig({ items }: { items: Array<{ id: string; label: string; active: boolean }> }) {
  return <ConfigList title="Package Types Configuration" items={items} addLabel="Add package type" />;
}
