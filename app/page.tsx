import ZenBackground from "@/components/ZenBackground";
import ZenTaskApp from "@/components/ZenTaskApp";
import { getTasks, getFollowedTasks, getUnreadBoksimiMessages } from "@/app/actions";

export const revalidate = 0; // Disable static rendering cache to ensure tasks are always loaded fresh

export default async function Home() {
  const tasks = await getTasks();
  const followedTasks = await getFollowedTasks();
  const unreadMessages = await getUnreadBoksimiMessages();

  return (
    <main className="relative min-h-screen">
      <ZenBackground />
      <ZenTaskApp 
        tasks={tasks} 
        followedTasks={followedTasks} 
        initialUnreadMessages={unreadMessages}
      />
    </main>
  );
}

