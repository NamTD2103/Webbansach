"use client";

export default function ChatHeader() {
  return (
    <div className="bg-blue-600 text-white px-5 py-4 flex items-center gap-4">

      <div className="w-12 h-12 rounded-full bg-white text-blue-600 flex items-center justify-center font-bold text-xl">
        A
      </div>

      <div>

        <h2 className="font-bold text-lg">
          Hỗ trợ khách hàng
        </h2>

        <p className="text-sm text-blue-100">
          Online
        </p>

      </div>

    </div>
  );
}