type StatusKey = keyof typeof statusMap;

type AddressRow = {
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
};

type OrderWithRelations = {
  id: string;
  waybill: string;
  trackingCode: string;
  status: StatusKey;
  deliveryType: string;
  paymentStatus: string;
  createdAt: Date;
  updatedAt: Date;
  senderAddress: AddressRow & { city?: string | null };
  receiverAddress: AddressRow & { city?: string | null };
  amountToCollect: unknown;
  amountCollected: unknown;
  weightKg: unknown;
  itemValue: unknown;
  rider?: { name: string } | null;
  riderId?: string | null;
  client?: { businessName: string } | null;
  clientId?: string | null;
  city: string;
  items: Array<{ id: string; name: string; quantity: number; weightKg?: unknown; declaredValue?: unknown }>;
  trackingEvents: Array<{ id: string; status: StatusKey; location: string | null; note: string | null; happenedAt: Date }>;
};

type ImageOrderWithImages = {
  id: string;
  label: string;
  submittedBy: string;
  submittedAt: Date;
  itemCount: number;
  senderPhone: string;
  images: Array<{ url: string }>;
  status: string;
  client?: { businessName: string } | null;
};

type DispatchManifestWithRelations = {
  id: string;
  code: string;
  riderId: string | null;
  rider?: { name: string } | null;
  zone: string;
  vehicle: string;
  shift: string;
  capacity: number;
  stops: Array<{ orderId: string; order: { id: string; waybill: string; status: StatusKey } }>;
  status: string;
  plannedDistanceKm: unknown;
  estimatedMinutes: number;
};

type SupportTicketWithRelations = {
  id: string;
  reference: string;
  orderId: string | null;
  order?: { waybill: string } | null;
  customer: string;
  channel: string;
  category: string;
  priority: string;
  status: string;
  owner?: { name: string } | null;
  openedAt: Date;
  lastUpdate: string | null;
};

type RiderRow = {
  id: string;
  name: string;
  phone: string;
  zone: string;
  status: string;
  vehicleType: string;
  completedToday: number;
  onTimeRate: unknown;
  rating: unknown;
  walletBalance: unknown;
};

type ClientWithOrderCount = {
  id: string;
  businessName: string;
  contactName: string;
  phone: string;
  email: string | null;
  _count: { orders: number };
  outstandingBalance: unknown;
  tier: string;
};

type FinanceEntryRow = {
  id: string;
  reference: string;
  type: string;
  party: string;
  amount: unknown;
  currency: string;
  status: string;
  date: Date;
};

const statusMap = {
  PENDING: "pending",
  PICKED_UP: "picked_up",
  IN_TRANSIT: "in_transit",
  OUT_FOR_DELIVERY: "out_for_delivery",
  DELIVERED: "delivered",
  FAILED: "failed",
  RETURNED: "returned",
  CANCELLED: "cancelled",
} as const;

export function toNumber(value: unknown) {
  return typeof value === "object" && value !== null && "toNumber" in value
    ? (value as { toNumber: () => number }).toNumber()
    : Number(value ?? 0);
}

export function serializeOrder(order: OrderWithRelations) {
  return {
    id: order.id,
    waybill: order.waybill,
    trackingCode: order.trackingCode,
    status: statusMap[order.status],
    deliveryType: order.deliveryType.toLowerCase(),
    paymentStatus: order.paymentStatus.toLowerCase(),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    sender: {
      name: order.senderAddress.name,
      phone: order.senderAddress.phone,
      addressLine1: order.senderAddress.addressLine1,
      addressLine2: order.senderAddress.addressLine2 ?? undefined,
    },
    receiver: {
      name: order.receiverAddress.name,
      phone: order.receiverAddress.phone,
      addressLine1: order.receiverAddress.addressLine1,
      addressLine2: order.receiverAddress.addressLine2 ?? undefined,
    },
    amountToCollect: toNumber(order.amountToCollect),
    amountCollected: toNumber(order.amountCollected),
    weightKg: toNumber(order.weightKg),
    itemValue: toNumber(order.itemValue),
    rider: order.rider?.name,
    riderId: order.riderId,
    client: order.client?.businessName,
    clientId: order.clientId,
    city: order.city,
    items: order.items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      weightKg: item.weightKg ? toNumber(item.weightKg) : undefined,
      declaredValue: item.declaredValue ? toNumber(item.declaredValue) : undefined,
    })),
    trackingEvents: order.trackingEvents.map((event) => ({
      id: event.id,
      status: statusMap[event.status],
      location: event.location,
      note: event.note,
      happenedAt: event.happenedAt.toISOString(),
    })),
  };
}

export function serializeImageOrder(order: ImageOrderWithImages) {
  return {
    id: order.id,
    label: order.label,
    submittedBy: order.submittedBy,
    submittedAt: order.submittedAt.toISOString(),
    itemCount: order.itemCount,
    senderPhone: order.senderPhone,
    images: order.images.map((image) => image.url),
    status: order.status.toLowerCase(),
    client: order.client?.businessName,
  };
}

export function serializeRider(rider: RiderRow) {
  return {
    id: rider.id,
    name: rider.name,
    phone: rider.phone,
    zone: rider.zone,
    status: rider.status.toLowerCase(),
    vehicleType: rider.vehicleType.toLowerCase(),
    completedToday: rider.completedToday,
    onTimeRate: toNumber(rider.onTimeRate),
    rating: toNumber(rider.rating),
    walletBalance: toNumber(rider.walletBalance),
  };
}

export function serializeClient(client: ClientWithOrderCount) {
  return {
    id: client.id,
    businessName: client.businessName,
    contactName: client.contactName,
    phone: client.phone,
    email: client.email,
    ordersThisMonth: client._count.orders,
    outstandingBalance: toNumber(client.outstandingBalance),
    tier: client.tier.toLowerCase(),
  };
}

export function serializeFinanceEntry(entry: FinanceEntryRow) {
  return {
    id: entry.id,
    reference: entry.reference,
    type: entry.type.toLowerCase(),
    party: entry.party,
    amount: toNumber(entry.amount),
    currency: entry.currency,
    status: entry.status.toLowerCase(),
    date: entry.date.toISOString().slice(0, 10),
  };
}

export function serializeDispatchManifest(manifest: DispatchManifestWithRelations) {
  return {
    id: manifest.id,
    code: manifest.code,
    riderId: manifest.riderId,
    rider: manifest.rider?.name,
    zone: manifest.zone,
    vehicle: manifest.vehicle.toLowerCase(),
    shift: manifest.shift.toLowerCase(),
    capacity: manifest.capacity,
    assignedOrderIds: manifest.stops.map((stop) => stop.orderId),
    orders: manifest.stops.map((stop) => ({
      id: stop.order.id,
      waybill: stop.order.waybill,
      status: statusMap[stop.order.status],
    })),
    status: manifest.status.toLowerCase(),
    plannedDistanceKm: toNumber(manifest.plannedDistanceKm),
    estimatedMinutes: manifest.estimatedMinutes,
  };
}

export function serializeSupportTicket(ticket: SupportTicketWithRelations) {
  return {
    id: ticket.id,
    reference: ticket.reference,
    orderId: ticket.orderId,
    waybill: ticket.order?.waybill,
    customer: ticket.customer,
    channel: ticket.channel.toLowerCase(),
    category: ticket.category.toLowerCase(),
    priority: ticket.priority.toLowerCase(),
    status: ticket.status.toLowerCase(),
    owner: ticket.owner?.name ?? "Unassigned",
    openedAt: ticket.openedAt.toISOString(),
    lastUpdate: ticket.lastUpdate ?? "",
  };
}
