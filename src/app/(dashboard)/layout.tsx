import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* 1. Sidebar posisinya fixed, width-nya w-64 */}
      <Sidebar />

      {/* 2. KONTEN UTAMA: Tambahkan 'ml-64' (margin-left-64) 
           agar konten bergeser ke kanan sejauh lebar sidebar */}
      <div className="ml-64 flex flex-col min-h-screen">
        
        <Header />
        
        {/* 3. Beri padding agar konten tidak mepet ke pinggir */}
        <main className="flex-1 p-6">
          {children}
        </main>
        
      </div>
    </div>
  );
}