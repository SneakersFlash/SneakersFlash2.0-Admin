'use client';

import { 
  DollarSign, 
  Users, 
  ShoppingCart, 
  TrendingUp, 
  Package,
  ArrowUpRight,
  MoreHorizontal
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

// Data Dummy untuk Grafik
const data = [
  { name: 'Jan', total: 1200 },
  { name: 'Feb', total: 2100 },
  { name: 'Mar', total: 1800 },
  { name: 'Apr', total: 3200 },
  { name: 'May', total: 2800 },
  { name: 'Jun', total: 4500 },
];

// Data Dummy untuk Recent Sales
const recentSales = [
  { name: 'Upiyyy', email: 'upiyyy@example.com', amount: 'Rp 2.500.000', status: 'Success' },
  { name: 'Faizal', email: 'faizal@example.com', amount: 'Rp 1.200.000', status: 'Processing' },
  { name: 'Budi Santoso', email: 'budi@example.com', amount: 'Rp 450.000', status: 'Success' },
  { name: 'Siti Aminah', email: 'siti@example.com', amount: 'Rp 8.900.000', status: 'Failed' },
  { name: 'Andi Wijaya', email: 'andi@example.com', amount: 'Rp 350.000', status: 'Success' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6 pb-10">
      {/* --- SECTION 1: STATS CARDS --- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard 
          title="Total Revenue" 
          value="Rp 45.231.000" 
          desc="+20.1% from last month"
          icon={DollarSign}
        />
        <StatsCard 
          title="Subscriptions" 
          value="+2350" 
          desc="+180.1% from last month"
          icon={Users}
        />
        <StatsCard 
          title="Sales" 
          value="+12,234" 
          desc="+19% from last month"
          icon={ShoppingCart}
        />
        <StatsCard 
          title="Active Now" 
          value="+573" 
          desc="+201 since last hour"
          icon={TrendingUp}
        />
      </div>

      {/* --- SECTION 2: CHARTS & RECENT SALES --- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        
        {/* GRAFIK (Mengambil 4 kolom) */}
        <div className="col-span-4 rounded-xl border bg-white shadow-sm">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-slate-900">Overview</h3>
            <p className="text-sm text-slate-500">Performa penjualan tahun 2026.</p>
          </div>
          <div className="pl-2 pr-6 pb-6 h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `$${value}`} 
                />
                <Tooltip 
                    cursor={{fill: '#f1f5f9'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RECENT SALES (Mengambil 3 kolom) */}
        <div className="col-span-3 rounded-xl border bg-white shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-semibold text-slate-900">Recent Sales</h3>
            <p className="text-sm text-slate-500">Kamu punya 265 penjualan bulan ini.</p>
          </div>
          <div className="p-0">
             {recentSales.map((item, i) => (
               <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-4">
                    <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                        {item.name.substring(0,2).toUpperCase()}
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium leading-none text-slate-900">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="font-bold text-sm">{item.amount}</div>
                    <div className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        item.status === 'Success' ? 'bg-green-100 text-green-700' :
                        item.status === 'Processing' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                    }`}>
                        {item.status}
                    </div>
                  </div>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Komponen Kecil untuk Kartu Statistik agar kode lebih rapi
function StatsCard({ title, value, desc, icon: Icon }: any) {
    return (
        <div className="rounded-xl border bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium text-slate-500">{title}</h3>
                <Icon className="h-4 w-4 text-slate-400" />
            </div>
            <div>
                <div className="text-2xl font-bold text-slate-900">{value}</div>
                <p className="text-xs text-slate-500 mt-1">{desc}</p>
            </div>
        </div>
    );
}