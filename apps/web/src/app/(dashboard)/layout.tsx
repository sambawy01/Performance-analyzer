import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { UserProvider } from "@/contexts/user-context";
import { QueryBar } from "@/components/layout/query-bar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
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
          <main className="flex-1 overflow-y-auto p-6 pb-28">{children}</main>
          <QueryBar />
        </div>
      </div>
    </UserProvider>
  );
}
