import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { UserProvider } from "@/contexts/user-context";
import { QueryBar } from "@/components/layout/query-bar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("users")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  return (
    <UserProvider user={profile}>
      <div className="flex h-screen">
        <Sidebar role={profile.role} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header user={profile} />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
          <QueryBar />
        </div>
      </div>
    </UserProvider>
  );
}
