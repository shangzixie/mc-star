import { getDb } from '@/db/index';
import { shipments } from '@/db/schema';
import { ApiError } from '@/lib/api/http';
import type { createShipmentSchema } from '@/lib/freight/schemas';
import { and, desc, eq, ilike, or } from 'drizzle-orm';
import type { z } from 'zod';

type CreateShipmentInput = z.infer<typeof createShipmentSchema>;
type UpdateShipmentInput = Partial<Omit<CreateShipmentInput, 'jobNo'>>;

function toShipmentValues(input: CreateShipmentInput | UpdateShipmentInput) {
  return {
    mblNo: input.mblNo,
    hblNo: input.hblNo,
    clientId: input.clientId,
    shipperId: input.shipperId,
    consigneeId: input.consigneeId,
    agentId: input.agentId,
    carrierId: input.carrierId,
    polId: input.polId,
    podId: input.podId,
    transportMode: input.transportMode,
    status: input.status,
    etd: input.etd ? new Date(input.etd) : undefined,
    eta: input.eta ? new Date(input.eta) : undefined,
    remarks: input.remarks,
    extraData: input.extraData,
  };
}

export async function listShipments(input: { q?: string; status?: string }) {
  const db = await getDb();
  const query = db.select().from(shipments);
  const conditions = [
    input.q && input.q.length > 0
      ? or(
          ilike(shipments.jobNo, `%${input.q}%`),
          ilike(shipments.mblNo, `%${input.q}%`),
          ilike(shipments.hblNo, `%${input.q}%`)
        )
      : undefined,
    input.status ? eq(shipments.status, input.status) : undefined,
  ].filter(Boolean);

  return conditions.length > 0
    ? query.where(and(...conditions)).orderBy(desc(shipments.createdAt))
    : query.orderBy(desc(shipments.createdAt));
}

export async function createShipment(input: CreateShipmentInput) {
  const db = await getDb();
  const [created] = await db
    .insert(shipments)
    .values({
      jobNo: input.jobNo,
      ...toShipmentValues({
        ...input,
        transportMode: input.transportMode ?? 'SEA',
        status: input.status ?? 'DRAFT',
        extraData: input.extraData ?? {},
      }),
    })
    .returning();

  return created;
}

export async function getShipmentById(shipmentId: string) {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(shipments)
    .where(eq(shipments.id, shipmentId));
  if (!row) {
    throw new ApiError({
      status: 404,
      code: 'SHIPMENT_NOT_FOUND',
      message: 'Shipment not found',
    });
  }

  return row;
}

export async function updateShipment(
  shipmentId: string,
  input: UpdateShipmentInput
) {
  const db = await getDb();
  const [updated] = await db
    .update(shipments)
    .set({
      ...toShipmentValues(input),
      updatedAt: new Date(),
    })
    .where(eq(shipments.id, shipmentId))
    .returning();

  if (!updated) {
    throw new ApiError({
      status: 404,
      code: 'SHIPMENT_NOT_FOUND',
      message: 'Shipment not found',
    });
  }

  return updated;
}
