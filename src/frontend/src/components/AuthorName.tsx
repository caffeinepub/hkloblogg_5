import type { Principal } from "@icp-sdk/core/principal";
import { useGetUser } from "../hooks/useQueries";

interface AuthorNameProps {
  principal: Principal;
  className?: string;
}

export default function AuthorName({ principal, className }: AuthorNameProps) {
  const { data: profile } = useGetUser(principal);
  const display = profile?.alias ?? shortenPrincipal(principal.toString());
  return <span className={className}>{display}</span>;
}

function shortenPrincipal(p: string): string {
  if (p.length <= 16) return p;
  return `${p.slice(0, 5)}…${p.slice(-5)}`;
}
