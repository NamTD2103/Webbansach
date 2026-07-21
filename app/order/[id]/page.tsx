'use client';

import React from 'react';
import { useParams } from 'next/navigation';

export default function OrderPlaceholderPage() {
  const params = useParams();
  const id = params?.id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="max-w-3xl mx-auto px-4 py-14">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-5xl mb-4">🧾</div>
          <h1 className="text-2xl font-extrabold text-slate-900">Trang hóa đơn</h1>
          <p className="text-slate-600 mt-2">Mã đơn: <span className="font-semibold">{id}</span></p>
          <p className="text-slate-500 mt-4 text-sm">
            QR trong hóa đơn sẽ mở trang này. Nếu bạn đã có trang order detail riêng, có thể thay route placeholder bằng component thực.
          </p>
          <div className="mt-6 text-sm text-emerald-700 font-semibold">
            (Placeholder)
          </div>
        </div>
      </div>
    </div>
  );
}

