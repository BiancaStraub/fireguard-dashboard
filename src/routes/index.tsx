import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useApp } from "@/lib/fireguard/store";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const user = useApp((s) => s.user);
  return <Navigate to={user ? "/dashboard" : "/login"} />;
}
