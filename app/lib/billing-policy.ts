export function accessForSubscription(status: string, price: string, monthly: string, annual: string, blocked = false) {
  const entitled = !blocked && ["active", "trialing"].includes(status) && [monthly, annual].includes(price);
  return { entitled, plan: entitled ? price === annual ? "premium-plus" : "premium" : "basic" };
}

export function canStartCheckout(blocked: boolean, subscriptions: { status: string; priceIds: string[] }[], allowedPrices: string[]) {
  return !blocked && !subscriptions.some((item) => !["canceled", "incomplete_expired"].includes(item.status) && item.priceIds.some((price) => allowedPrices.includes(price)));
}
