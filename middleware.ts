import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "zen-task-jwt-secret-key-calm-mindfulness-app"
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get("session")?.value;

  let isAuthenticated = false;
  let userRole: string | null = null;

  if (sessionToken) {
    try {
      const { payload } = await jwtVerify(sessionToken, JWT_SECRET);
      isAuthenticated = true;
      userRole = payload.role as string;
    } catch {
      isAuthenticated = false;
    }
  }

  // 로그인 페이지 접속 시
  if (pathname === "/login") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // 보호된 경로 접속 시 로그인하지 않았다면 리다이렉트
  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 관리자 전용 경로 (/admin) 진입 제어
  if (pathname.startsWith("/admin")) {
    if (userRole !== "ADMIN") {
      // 일반 회원은 메인 ToDo 화면으로 리다이렉트
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 다음 경로들을 제외한 모든 요청 경로에 대해 매칭:
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화 파일)
     * - favicon.ico (파비콘)
     * - public 폴더 산하 정적 리소스 파일들 (png, jpg, svg 등)
     */
    "/((?!_next/static|_next/image|favicon.ico|login|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)",
  ],
};
