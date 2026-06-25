"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "zen-task-jwt-secret-key-calm-mindfulness-app"
);

// --- 인증 헬퍼 함수 ---

export async function getUserIdFromSession(): Promise<string | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("session")?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.userId as string;
  } catch {
    return null;
  }
}

export async function getUserRoleFromSession(): Promise<string | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("session")?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.role as string;
  } catch {
    return null;
  }
}

// --- 회원가입 / 로그인 / 로그아웃 서버 액션 ---

export async function signUp(email: string, password: string) {
  if (!email || !email.includes("@")) {
    return { error: "유효한 이메일 주소를 입력해 주세요." };
  }
  if (!password || password.length < 6) {
    return { error: "비밀번호는 최소 6자 이상이어야 합니다." };
  }

  const normalizedEmail = email.trim().toLowerCase();
  // allaskadain@naver.com 계정은 가입 시 자동으로 ADMIN 권한 부여
  const isAdminEmail = normalizedEmail === "allaskadain@naver.com";

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingUser) {
      return { error: "이미 가입된 이메일 주소입니다." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        role: isAdminEmail ? "ADMIN" : "USER",
      },
    });

    // 가입 성공 시 세션 생성 후 자동 로그인 (페이로드에 role 추가)
    const token = await new SignJWT({ userId: user.id, role: user.role })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(JWT_SECRET);

    cookies().set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
      sameSite: "lax",
    });

    return { success: true };
  } catch (error) {
    console.error("SignUp error:", error);
    return { error: "회원가입 중 오류가 발생했습니다." };
  }
}

export async function signIn(email: string, password: string) {
  if (!email || !password) {
    return { error: "이메일과 비밀번호를 모두 입력해 주세요." };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (!user) {
      return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };
    }

    // 만약 기존 가입 유저가 allaskadain@naver.com 인데 role이 ADMIN이 아닌 경우 자동 보정
    let userRole = user.role;
    if (user.email === "allaskadain@naver.com" && user.role !== "ADMIN") {
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { role: "ADMIN" },
      });
      userRole = updatedUser.role;
    }

    // 로그인 시 JWT 페이로드에 role 주입
    const token = await new SignJWT({ userId: user.id, role: userRole })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(JWT_SECRET);

    cookies().set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
      sameSite: "lax",
    });

    return { success: true };
  } catch (error) {
    console.error("SignIn error:", error);
    return { error: "로그인 중 오류가 발생했습니다." };
  }
}

export async function signOut() {
  try {
    cookies().delete("session");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("SignOut error:", error);
    return { error: "로그아웃 중 오류가 발생했습니다." };
  }
}

// --- 관리자(ADMIN) 전용 서버 액션 ---

export async function adminGetStats() {
  const role = await getUserRoleFromSession();
  if (role !== "ADMIN") {
    return { error: "권한이 없습니다." };
  }

  try {
    const totalUsers = await prisma.user.count();
    const totalTasks = await prisma.task.count();
    const completedTasks = await prisma.task.count({
      where: { completed: true },
    });

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      success: true,
      stats: {
        totalUsers,
        totalTasks,
        completionRate,
      },
    };
  } catch (error) {
    console.error("Admin stats fetch error:", error);
    return { error: "통계 데이터를 불러오는데 실패했습니다." };
  }
}

export async function adminGetUsers() {
  const role = await getUserRoleFromSession();
  if (role !== "ADMIN") {
    return [];
  }

  try {
    return await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Admin users fetch error:", error);
    return [];
  }
}

export async function adminDeleteUser(targetUserId: string) {
  const currentUserId = await getUserIdFromSession();
  const role = await getUserRoleFromSession();
  if (role !== "ADMIN") {
    return { error: "권한이 없습니다." };
  }

  if (currentUserId === targetUserId) {
    return { error: "자기 자신은 탈퇴 처리할 수 없습니다." };
  }

  try {
    await prisma.user.delete({
      where: { id: targetUserId },
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Admin user delete error:", error);
    return { error: "회원 탈퇴 처리에 실패했습니다." };
  }
}

// --- 할 일(Task) CRUD 서버 액션 (로그인 필수) ---

export async function getTasks() {
  const userId = await getUserIdFromSession();
  if (!userId) return [];

  try {
    return await prisma.task.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Failed to fetch tasks:", error);
    return [];
  }
}

export async function addTask(
  text: string,
  isFocus: boolean = false,
  dueDate?: string | null,
  memo?: string | null,
  repeat?: string | null
) {
  const userId = await getUserIdFromSession();
  if (!userId) return { error: "로그인이 필요합니다." };

  if (!text || text.trim() === "") {
    return { error: "할 일 내용을 입력해 주세요." };
  }

  try {
    if (isFocus) {
      const focusCount = await prisma.task.count({
        where: { userId, focus: true, completed: false },
      });
      if (focusCount >= 5) {
        return { error: "오늘의 집중 할 일은 최대 5개까지만 등록할 수 있습니다." };
      }
    }

    await prisma.task.create({
      data: {
        text: text.trim(),
        focus: isFocus,
        dueDate: dueDate ? new Date(dueDate) : null,
        memo: memo?.trim() || null,
        repeat: repeat || null,
        userId,
      },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to add task:", error);
    return { error: "할 일 추가에 실패했습니다." };
  }
}

export async function updateTask(
  id: string,
  data: { text?: string; memo?: string | null; dueDate?: string | null; repeat?: string | null }
) {
  const userId = await getUserIdFromSession();
  if (!userId) return { error: "로그인이 필요합니다." };

  try {
    // 본인의 Task인지 확인
    const task = await prisma.task.findFirst({
      where: { id, userId },
    });
    if (!task) return { error: "할 일을 찾을 수 없거나 권한이 없습니다." };

    await prisma.task.update({
      where: { id },
      data: {
        ...(data.text !== undefined && { text: data.text.trim() }),
        ...(data.memo !== undefined && { memo: data.memo?.trim() || null }),
        ...(data.dueDate !== undefined && { dueDate: data.dueDate ? new Date(data.dueDate) : null }),
        ...(data.repeat !== undefined && { repeat: data.repeat || null }),
      },
    });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to update task:", error);
    return { error: "수정에 실패했습니다." };
  }
}

export async function toggleTaskComplete(id: string) {
  const userId = await getUserIdFromSession();
  if (!userId) return { error: "로그인이 필요합니다." };

  try {
    const task = await prisma.task.findFirst({
      where: { id, userId },
    });
    if (!task) return { error: "할 일을 찾을 수 없거나 권한이 없습니다." };

    await prisma.task.update({
      where: { id },
      data: { completed: !task.completed },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to toggle task complete status:", error);
    return { error: "상태 변경에 실패했습니다." };
  }
}

export async function toggleTaskFocus(id: string) {
  const userId = await getUserIdFromSession();
  if (!userId) return { error: "로그인이 필요합니다." };

  try {
    const task = await prisma.task.findFirst({
      where: { id, userId },
    });
    if (!task) return { error: "할 일을 찾을 수 없거나 권한이 없습니다." };

    // 활성화할 때만 5개 한도 체크
    if (!task.focus && !task.completed) {
      const focusCount = await prisma.task.count({
        where: { userId, focus: true, completed: false },
      });
      if (focusCount >= 5) {
        return { error: "오늘의 집중 할 일은 최대 5개까지만 등록할 수 있습니다." };
      }
    }

    await prisma.task.update({
      where: { id },
      data: { focus: !task.focus },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to toggle task focus status:", error);
    return { error: "집중 상태 변경에 실패했습니다." };
  }
}

export async function deleteTask(id: string) {
  const userId = await getUserIdFromSession();
  if (!userId) return { error: "로그인이 필요합니다." };

  try {
    const task = await prisma.task.findFirst({
      where: { id, userId },
    });
    if (!task) return { error: "할 일을 찾을 수 없거나 권한이 없습니다." };

    await prisma.task.delete({
      where: { id },
    });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete task:", error);
    return { error: "할 일 삭제에 실패했습니다." };
  }
}

export async function clearCompletedTasks() {
  const userId = await getUserIdFromSession();
  if (!userId) return { error: "로그인이 필요합니다." };

  try {
    await prisma.task.deleteMany({
      where: { completed: true, userId },
    });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to clear completed tasks:", error);
    return { error: "완료 항목 삭제에 실패했습니다." };
  }
}

export async function searchUsers(query: string) {
  const currentUserId = await getUserIdFromSession();
  if (!currentUserId) return [];

  const trimmedQuery = query.trim().toLowerCase();
  if (!trimmedQuery) return [];

  try {
    const users = await prisma.user.findMany({
      where: {
        email: {
          contains: trimmedQuery,
          mode: "insensitive",
        },
        id: {
          not: currentUserId,
        },
      },
      select: {
        id: true,
        email: true,
        followers: {
          where: {
            followerId: currentUserId,
          },
        },
      },
      take: 10,
    });

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      isFollowing: user.followers.length > 0,
    }));
  } catch (error) {
    console.error("Failed to search users:", error);
    return [];
  }
}

export async function toggleFollow(targetUserId: string) {
  const currentUserId = await getUserIdFromSession();
  if (!currentUserId) return { error: "로그인이 필요합니다." };

  if (currentUserId === targetUserId) {
    return { error: "자기 자신을 팔로우할 수 없습니다." };
  }

  try {
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
      },
    });

    if (existingFollow) {
      // 언팔로우
      await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: targetUserId,
          },
        },
      });
      revalidatePath("/");
      return { success: true, isFollowing: false };
    } else {
      // 팔로우
      await prisma.follow.create({
        data: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
      });
      revalidatePath("/");
      return { success: true, isFollowing: true };
    }
  } catch (error) {
    console.error("Failed to toggle follow:", error);
    return { error: "팔로우 처리 중 오류가 발생했습니다." };
  }
}

export async function getFollowedTasks() {
  const currentUserId = await getUserIdFromSession();
  if (!currentUserId) return [];

  try {
    // 내가 팔로우하고 있는 사람들의 ID 리스트
    const follows = await prisma.follow.findMany({
      where: { followerId: currentUserId },
      select: { followingId: true },
    });

    const followingIds = follows.map((f) => f.followingId);
    if (followingIds.length === 0) return [];

    // 그 사람들의 할 일(일정)을 가져옴 (사용자 이메일 포함)
    const tasks = await prisma.task.findMany({
      where: {
        userId: { in: followingIds },
      },
      include: {
        user: {
          select: { email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return tasks.map((task) => ({
      id: task.id,
      text: task.text,
      memo: task.memo,
      completed: task.completed,
      focus: task.focus,
      dueDate: task.dueDate ? task.dueDate.toISOString() : null,
      repeat: task.repeat,
      createdAt: task.createdAt.toISOString(),
      userEmail: task.user.email,
    }));
  } catch (error) {
    console.error("Failed to fetch followed tasks:", error);
    return [];
  }
}

export async function sendBoksimiMessage(receiverId: string, message: string) {
  const currentUserId = await getUserIdFromSession();
  if (!currentUserId) return { error: "로그인이 필요합니다." };

  if (currentUserId === receiverId) {
    return { error: "자기 자신에게는 보낼 수 없습니다." };
  }

  const trimmed = message.trim();
  if (!trimmed) {
    return { error: "메시지 내용을 입력해 주세요." };
  }

  try {
    await prisma.boksimiMessage.create({
      data: {
        senderId: currentUserId,
        receiverId,
        message: trimmed,
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send Boksimi message:", error);
    return { error: "메시지 전송에 실패했습니다." };
  }
}

export async function getUnreadBoksimiMessages() {
  const currentUserId = await getUserIdFromSession();
  if (!currentUserId) return [];

  try {
    const messages = await prisma.boksimiMessage.findMany({
      where: {
        receiverId: currentUserId,
        read: false,
      },
      include: {
        sender: {
          select: { email: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return messages.map((m) => ({
      id: m.id,
      message: m.message,
      createdAt: m.createdAt.toISOString(),
      senderEmail: m.sender.email,
    }));
  } catch (error) {
    console.error("Failed to fetch unread Boksimi messages:", error);
    return [];
  }
}

export async function markMessageAsRead(messageId: string) {
  const currentUserId = await getUserIdFromSession();
  if (!currentUserId) return { error: "로그인이 필요합니다." };

  try {
    await prisma.boksimiMessage.update({
      where: {
        id: messageId,
        receiverId: currentUserId, // 타인 메시지 읽음 처리 방지
      },
      data: { read: true },
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to mark message as read:", error);
    return { error: "메시지 상태 업데이트 실패" };
  }
}

export async function getFollows() {
  const currentUserId = await getUserIdFromSession();
  if (!currentUserId) return { following: [], followers: [] };

  try {
    const following = await prisma.follow.findMany({
      where: { followerId: currentUserId },
      select: {
        following: {
          select: { id: true, email: true },
        },
      },
    });

    const followers = await prisma.follow.findMany({
      where: { followingId: currentUserId },
      select: {
        follower: {
          select: { id: true, email: true },
        },
      },
    });

    return {
      following: following.map((f) => f.following),
      followers: followers.map((f) => f.follower),
    };
  } catch (error) {
    console.error("Failed to fetch follows:", error);
    return { following: [], followers: [] };
  }
}
