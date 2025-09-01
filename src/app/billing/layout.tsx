import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Billing & Subscriptions | GoLoco',
  description: 'Manage your GoLoco subscription, view transaction history, and upgrade your plan.',
};

export default function BillingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen">{children}</main>
  );
}
