import { Plans } from "../../components/plans";
export default async function ChoosePlanPage({ searchParams }: { searchParams: Promise<{ plan?: string; checkout?: string }> }) {
  const query = await searchParams;
  return <Plans initialPlan={query.plan} checkoutStatus={query.checkout} />;
}
