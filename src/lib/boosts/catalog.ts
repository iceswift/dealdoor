export interface BoostCreditPackage {
  id: string;
  name: string;
  credits: number;
  amountMinor: number;
  currency: 'THB';
  highlight?: boolean;
}

// Prices live in one catalog so a future payment provider never trusts client input.
export const BOOST_CREDIT_PACKAGES: readonly BoostCreditPackage[] = [
  { id: 'boost-starter', name: 'Starter', credits: 3, amountMinor: 7900, currency: 'THB' },
  { id: 'boost-growth', name: 'Growth', credits: 8, amountMinor: 19900, currency: 'THB', highlight: true },
  { id: 'boost-business', name: 'Business', credits: 20, amountMinor: 44900, currency: 'THB' },
] as const;

export function getBoostCreditPackage(packageId: string) {
  return BOOST_CREDIT_PACKAGES.find((item) => item.id === packageId);
}
