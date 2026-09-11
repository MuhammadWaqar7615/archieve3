import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_NAME = "wowcar_admin_session";
const SESSION_SECRET = process.env.SESSION_SECRET || "wowcar_super_secret_admin_session_key_32chars_min!";

export interface SessionData {
  portal?: "admin" | "dealer";
  portalToken?: string;
  user?: {
    username: string;
    displayName: string;
  };
  dealerAccessToken?: string;
  dealerRefreshToken?: string;
  dealerContext?: {
    dealerId: number;
    dealerName: string;
    appId: number;
    role: string;
  };
}

// Derive a 32-byte key from secret using SHA-256
function getKey(): Buffer {
  return crypto.createHash("sha256").update(SESSION_SECRET).digest();
}

// Encrypt payload object into encrypted token string (AES-256-GCM)
function encrypt(data: SessionData): string {
  const iv = crypto.randomBytes(12);
  const key = getKey();
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  
  const text = JSON.stringify(data);
  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");
  
  const tag = cipher.getAuthTag();
  
  // Combine IV + Tag + Ciphertext into single string
  return `${iv.toString("base64")}.${tag.toString("base64")}.${encrypted}`;
}

// Decrypt encrypted token string back to SessionData
export function decrypt(token: string): SessionData | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    
    const [ivB64, tagB64, encryptedText] = parts;
    const iv = Buffer.from(ivB64, "base64");
    const tag = Buffer.from(tagB64, "base64");
    const key = getKey();
    
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encryptedText, "base64", "utf8");
    decrypted += decipher.final("utf8");
    
    return JSON.parse(decrypted) as SessionData;
  } catch (error) {
    return null;
  }
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME);
  if (!sessionCookie?.value) return null;
  return decrypt(sessionCookie.value);
}

export async function setSession(data: SessionData): Promise<void> {
  const cookieStore = await cookies();
  const encrypted = encrypt(data);
  
  cookieStore.set(COOKIE_NAME, encrypted, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 8 * 3600, // 8 hours to match portal token expiry
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
