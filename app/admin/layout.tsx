import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard - Cloudy Book",
  description: "Quản lý website bán sách",
};


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <div className="min-h-screen bg-slate-100">
      {children}
    </div>
  );

}