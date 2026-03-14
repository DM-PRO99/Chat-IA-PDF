import { redirect } from "next/navigation";

import { getServerAuthUser } from "@/lib/auth";

export default async function HomePage(): Promise<never> {
  const user = await getServerAuthUser();
  if (user) redirect("/dashboard");
  redirect("/login");
}


