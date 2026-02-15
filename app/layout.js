import "./globals.css";

export const metadata = {
  title: "Blog Yönetici — Uzman Klinik Psikolog",
  description: "LLM destekli blog yazısı üretici ve yönetim paneli",
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
