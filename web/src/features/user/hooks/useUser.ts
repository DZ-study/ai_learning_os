import { useState } from "react";
import type { User } from "../types";

export function useUser() {
  const [user] = useState<User | null>(null);
  const [loading] = useState(false);
  return { user, loading };
}
