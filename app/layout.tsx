import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:5173";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const metadataBase = new URL(`${protocol}://${host}`);
  const title = "ヒマノワ｜暇を、遊びに変える。";
  const description = "クリックでも、キーでも。タイピングや方向キーゲームを含む14種類の小さな遊びが1分から楽しめる暇つぶしポータル。";
  const socialImage = new URL("/og.png", metadataBase).toString();

  return {
    metadataBase,
    title: { default: title, template: "%s｜ヒマノワ" },
    description,
    openGraph: {
      type: "website",
      locale: "ja_JP",
      title,
      description,
      siteName: "ヒマノワ",
      images: [{ url: socialImage, width: 1731, height: 909, alt: "ヒマノワ — 暇を、遊びに変える。KEYBOARD LAB" }],
    },
    twitter: { card: "summary_large_image", title, description, images: [socialImage] },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
