import { NextResponse } from "next/server";
export const json = (data: unknown, status = 200) => NextResponse.json(data, { status });
export const unauthorized = () => json({ error: "Faça login para continuar." }, 401);
export const notFound = (what = "Registro") => json({ error: `${what} não encontrado.` }, 404);
export const bad = (msg: string) => json({ error: msg }, 400);
