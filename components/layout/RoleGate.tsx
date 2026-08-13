export function RoleGate({ allow, children }: { allow: boolean; children: React.ReactNode }) {
  if (!allow) return null;
  return <>{children}</>;
}
