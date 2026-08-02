"use client";

import { useEffect, useState } from "react";

import { chatAPI } from "@/lib/api";

import ChatRoomList from "./ChatRoomList";
import AdminMessages from "./AdminMessages";
import AdminInput from "./AdminInput";

interface Room {
  ROOM_ID: string;
  LAST_TIME?: string;
  TOTAL_MESSAGES?: number;
}

export default function AdminChatWindow() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>("");

  useEffect(() => {
    loadRooms();
  }, []);

  async function loadRooms() {
    try {
      const data = await chatAPI.getRooms();

      setRooms(data);

      if (data.length > 0) {
        setSelectedRoom(data[0].ROOM_ID);
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="h-[85vh] rounded-2xl bg-white shadow-xl overflow-hidden flex">

      <ChatRoomList
        rooms={rooms}
        selectedRoom={selectedRoom}
        onSelect={setSelectedRoom}
      />

      <div className="flex-1 flex flex-col">

        <AdminMessages room={selectedRoom} />

        <AdminInput
  room={selectedRoom}
  adminId={1}
/>

      </div>

    </div>
  );
}