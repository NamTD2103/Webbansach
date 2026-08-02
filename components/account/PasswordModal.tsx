"use client";

interface Props {
  open: boolean;
  data: {
    oldPassword:string;
    newPassword:string;
    confirmPassword:string;
  };

  loading:boolean;

  onClose:()=>void;

  onChange:(field:string,value:string)=>void;

  onSave:()=>void;
}


export default function PasswordModal({
  open,
  data,
  loading,
  onClose,
  onChange,
  onSave
}:Props){

  if(!open) return null;


  return (
    <div className="
      fixed inset-0
      bg-black/50
      flex items-center justify-center
      z-50
    ">

      <div className="
        bg-white
        w-full
        max-w-md
        rounded-3xl
        p-8
        shadow-2xl
      ">

        <h2 className="
          text-2xl
          font-bold
          mb-6
          text-gray-800
        ">
          🔐 Đổi mật khẩu
        </h2>


        <input
          type="password"
          placeholder="Mật khẩu hiện tại"
          value={data.oldPassword}
          onChange={(e)=>
            onChange(
              "oldPassword",
              e.target.value
            )
          }
          className="
            w-full
            border
            rounded-xl
            p-3
            mb-4
          "
        />


        <input
          type="password"
          placeholder="Mật khẩu mới"
          value={data.newPassword}
          onChange={(e)=>
            onChange(
              "newPassword",
              e.target.value
            )
          }
          className="
            w-full
            border
            rounded-xl
            p-3
            mb-4
          "
        />


        <input
          type="password"
          placeholder="Xác nhận mật khẩu"
          value={data.confirmPassword}
          onChange={(e)=>
            onChange(
              "confirmPassword",
              e.target.value
            )
          }
          className="
            w-full
            border
            rounded-xl
            p-3
            mb-6
          "
        />


        <div className="flex gap-3">

          <button
            onClick={onClose}
            className="
              flex-1
              py-3
              rounded-xl
              bg-gray-200
            "
          >
            Hủy
          </button>


          <button
            disabled={loading}
            onClick={onSave}
            className="
              flex-1
              py-3
              rounded-xl
              bg-red-500
              text-white
              hover:bg-red-600
            "
          >
            {loading 
              ? "Đang đổi..."
              : "Đổi mật khẩu"
            }
          </button>

        </div>

      </div>

    </div>
  );
}