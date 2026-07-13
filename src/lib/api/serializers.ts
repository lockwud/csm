import { Prisma } from "@prisma/client";

type OrderWithRelations = Prisma.OrderGetPayload<{
  include: {
    senderAddress: true;
    receiverAddress: true;
    rider: true;
    client: true;
    items: true;
    trackingEvents: true;
  };
}>;

type ImageOrderWithImages = Prisma.ImageOrderGetPayload<{
  include: { images: true; client: true };
}>;

type DispatchManifestWithRelations = Prisma.DispatchManifestGetPayload<{
  include: { rider: true; stops: { include: { order: true } } };
}>;

type SupportTicketWithRelations = Prisma.SupportTicketGetPayload<{
  include: { order: true; client: true; owner: true };
}>;

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

export function serializeRider(rider: Prisma.RiderGetPayload<object>) {
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

export function serializeClient(client: Prisma.ClientGetPayload<{ include: { _count: { select: { orders: true } } } }>) {
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

export function serializeFinanceEntry(entry: Prisma.FinanceEntryGetPayload<object>) {
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
