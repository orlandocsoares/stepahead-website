import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  // Limpa o cookie de sessão
  cookies().set("session", "", { expires: new Date(0), path: "/" });
  return NextResponse.json({ message: "Logout bem-sucedido" });
}