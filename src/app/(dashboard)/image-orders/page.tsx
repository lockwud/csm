import { prisma } from "@/lib/prisma";
import { ImageOrdersAdminClient } from "./ImageOrdersAdminClient";

export default async function ImageOrdersPage() {
  const imageOrders = await prisma.imageOrder.findMany({ orderBy: { submittedAt: "desc" }, include: { images: true }, take: 50 });
  return (
    <ImageOrdersAdminClient
      initialOrders={imageOrders.map((item) => ({
        id: item.id,
        label: item.label,
        submittedBy: item.submittedBy,
        senderPhone: item.senderPhone,
        itemCount: item.itemCount,
        status: item.status,
        convertedOrderId: item.convertedOrderId,
        images: item.images.map((image) => ({
          id: image.id,
          url: image.url,
          fileName: image.fileName,
          contentType: image.contentType,
        })),
      }))}
    />
  );
}
