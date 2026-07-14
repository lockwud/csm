import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { prisma } from "@/lib/prisma";

type RewardLedgerRow = {
  id: string;
  points: number;
  type: string;
  client: { businessName: string };
};

export default async function RewardsPage() {
  const ledger = await prisma.rewardLedger.findMany({ include: { client: true }, orderBy: { createdAt: "desc" }, take: 50 });
  return <div className="grid gap-5"><h1 className="text-2xl font-bold">Rewards</h1><Card><CardHeader><CardTitle>Reward Ledger</CardTitle></CardHeader><CardContent className="grid gap-2">{(ledger as RewardLedgerRow[]).map((entry: RewardLedgerRow) => <p key={entry.id} className="rounded-md bg-slate-50 p-3">{entry.client.businessName} · {entry.points} points · {entry.type}</p>)}</CardContent></Card></div>;
}
