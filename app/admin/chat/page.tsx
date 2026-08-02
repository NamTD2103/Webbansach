"use client";

import AdminChatWindow from "@/app/admin/components/admin-chat/AdminChatWindow";


export default function AdminChatPage() {

  return (

    <div className="p-6 min-h-screen bg-gray-100">

      <div className="mb-6">

        <h1 className="
          text-3xl
          font-bold
          text-gray-800
        ">
          💬 Chat khách hàng
        </h1>


        <p className="
          text-gray-500
          mt-2
        ">
          Quản lý và hỗ trợ khách hàng trực tuyến
        </p>

      </div>


      <AdminChatWindow />


    </div>

  );

}