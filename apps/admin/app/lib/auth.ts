import { createHash, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const adminCookieName = "campus_admin_session";

function getAdminPassword(): string {
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    throw new Error("ADMIN_PASSWORD is required for admin access");
  }

  return password;
}

function sessionValue(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

function safeEquals(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function isAdminAuthenticated(): boolean {
  const cookieValue = cookies().get(adminCookieName)?.value;

  if (!cookieValue) {
    return false;
  }

  return safeEquals(cookieValue, sessionValue(getAdminPassword()));
}

export function requireAdmin(): void {
  if (!isAdminAuthenticated()) {
    redirect("/login");
  }
}

export function createAdminSession(): void {
  cookies().set(adminCookieName, sessionValue(getAdminPassword()), {
    httpOnly: true,
    maxAge: 60 * 60 * 8,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });
}

export function clearAdminSession(): void {
  cookies().delete(adminCookieName);
}
