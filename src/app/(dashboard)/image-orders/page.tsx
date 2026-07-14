import { prisma } from "@/lib/prisma";
import { ImageOrdersAdminClient } from "./ImageOrdersAdminClient";

type ImageOrderImageRow = {
  id: string;
  url: string;
  fileName: string | null;
  contentType: string | null;
};

type ImageOrderRow = {
  id: string;
  label: string;
  submittedBy: string;
  senderPhone: string;
  itemCount: number;
  status: string;
  convertedOrderId: string | null;
  convertedOrder: { id: string; waybill: string; deliveryType: string } | null;
  images: ImageOrderImageRow[];
};

export default async function ImageOrdersPage() {
  const imageOrders = await prisma.imageOrder.findMany({ orderBy: { submittedAt: "desc" }, include: { images: true, convertedOrder: true }, take: 50 });
  return (
    <ImageOrdersAdminClient
      initialOrders={(imageOrders as ImageOrderRow[]).map((item: ImageOrderRow) => ({
        id: item.id,
        label: item.label,
        submittedBy: item.submittedBy,
        senderPhone: item.senderPhone,
        itemCount: item.itemCount,
        status: item.status,
        convertedOrderId: item.convertedOrderId,
        convertedOrder: item.convertedOrder ? {
          id: item.convertedOrder.id,
          waybill: item.convertedOrder.waybill,
          deliveryType: item.convertedOrder.deliveryType,
        } : null,
        images: item.images.map((image: ImageOrderImageRow) => ({
          id: image.id,
          url: image.url,
          fileName: image.fileName,
          contentType: image.contentType,
        })),
      }))}
    />
  );
}
