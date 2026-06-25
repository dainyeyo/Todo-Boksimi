import { redirect } from "next/navigation";
import { adminGetStats, adminGetUsers, getUserIdFromSession, getUserRoleFromSession } from "@/app/actions";
import ZenBackground from "@/components/ZenBackground";
import AdminDashboard from "./AdminDashboard";

export const revalidate = 0; // 항상 실시간 데이터를 가져오도록 설정

export default async function AdminPage() {
  const role = await getUserRoleFromSession();
  
  // 미들웨어에서도 차단하지만, 이중 안전 장치로 비관리자 접근 시 메인 페이지로 리다이렉트
  if (role !== "ADMIN") {
    redirect("/");
  }

  const currentUserId = await getUserIdFromSession();
  const statsRes = await adminGetStats();
  const users = await adminGetUsers();

  const stats = statsRes.success && statsRes.stats
    ? statsRes.stats
    : { totalUsers: 0, totalTasks: 0, completionRate: 0 };

  return (
    <main className="relative min-h-screen">
      <ZenBackground />
      <AdminDashboard
        initialStats={stats}
        initialUsers={users}
        currentUserId={currentUserId}
      />
    </main>
  );
}
