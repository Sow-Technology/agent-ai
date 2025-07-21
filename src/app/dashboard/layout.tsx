import DashboardLayoutContentWrapper from "./dashboard-layout-content";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayoutContentWrapper>{children}</DashboardLayoutContentWrapper>
  );
}
