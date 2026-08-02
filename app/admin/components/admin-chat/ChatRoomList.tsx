"use client";

interface Room {
  ROOM_ID: string;
  LAST_TIME?: string;
  TOTAL_MESSAGES?: number;
}

interface Props {
  rooms: Room[];
  selectedRoom: string;
  onSelect: (room: string) => void;
}

export default function ChatRoomList({
  rooms,
  selectedRoom,
  onSelect,
}: Props) {
  return (
    <div className="w-80 bg-white border-r flex flex-col">

      <div className="px-6 py-5 border-b">
        <h2 className="text-xl font-bold">
          Khách hàng
        </h2>

        <p className="text-sm text-gray-500 mt-1">
          {rooms.length} cuộc trò chuyện
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">

        {rooms.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            Chưa có cuộc trò chuyện
          </div>
        )}

        {rooms.map((room) => {

          const active = room.ROOM_ID === selectedRoom;

          return (
            <button
              key={room.ROOM_ID}
              onClick={() => onSelect(room.ROOM_ID)}
              className={`w-full px-5 py-4 border-b transition flex items-center gap-4
              ${
                active
                  ? "bg-blue-50"
                  : "hover:bg-gray-50"
              }`}
            >

              {/* Avatar */}

              <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">

                {room.ROOM_ID.replace("USER_", "")}

              </div>

              {/* Info */}

              <div className="flex-1 text-left">

                <div className="font-semibold">

                  {room.ROOM_ID}

                </div>

                <div className="text-xs text-gray-500 mt-1">

                  {room.TOTAL_MESSAGES ?? 0} tin nhắn

                </div>

              </div>

              {/* Time */}

              <div className="text-[11px] text-gray-400">

                {room.LAST_TIME
                  ? new Date(room.LAST_TIME).toLocaleDateString()
                  : ""}

              </div>

            </button>
          );

        })}

      </div>

    </div>
  );
}