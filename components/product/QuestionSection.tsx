"use client";

import { useEffect, useState } from "react";
import { questionAPI } from "@/lib/api";

interface Props {
  userId: number;
  masp: string;
}

export default function QuestionSection({
  userId,
  masp,
}: Props) {

  const [question, setQuestion] = useState("");
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    if (masp) {
      loadQuestions();
    }
  }, [masp]);


  const loadQuestions = async () => {
    try {
      const result = await questionAPI.getProductQuestions(masp);

      setQuestions(
        result.data || result || []
      );

    } catch (err) {
      console.error(
        "LOAD QUESTIONS ERROR:",
        err
      );
    }
  };


  const submitQuestion = async () => {

    if (!userId) {
      alert("Vui lòng đăng nhập");
      return;
    }


    if (!question.trim()) {
      alert("Vui lòng nhập câu hỏi");
      return;
    }


    try {

      setLoading(true);


      await questionAPI.createQuestion({
        userId,
        masp,
        question,
      });


      setQuestion("");


      await loadQuestions();


      alert("Đã gửi câu hỏi");


    } catch (err: any) {

      alert(
        err.message || "Lỗi gửi câu hỏi"
      );

    } finally {

      setLoading(false);

    }
  };


  return (
    <div className="mt-10 bg-white rounded-xl shadow p-6">

      <h2 className="text-2xl font-bold mb-5">
        💬 Hỏi đáp khách hàng
      </h2>


      <textarea
        className="
          border 
          rounded-lg 
          w-full 
          p-3 
          h-28
        "
        placeholder="Nhập câu hỏi..."
        value={question}
        onChange={(e) =>
          setQuestion(e.target.value)
        }
      />


      <button
        onClick={submitQuestion}
        disabled={loading}
        className="
          mt-3
          bg-blue-600
          hover:bg-blue-700
          text-white
          px-5
          py-2
          rounded-lg
          disabled:opacity-50
        "
      >
        {
          loading
          ? "Đang gửi..."
          : "Gửi câu hỏi"
        }
      </button>



      <div className="mt-8 space-y-5">


        {
          questions.length === 0 && (
            <p className="text-gray-500">
              Chưa có câu hỏi nào.
            </p>
          )
        }



        {
          questions.map((item) => (

            <div
              key={item.QUESTION_ID}
              className="
                border
                rounded-lg
                p-4
              "
            >


              <div className="font-semibold">
                {item.USERNAME || "Khách hàng"}
              </div>



              <div className="mt-2">
                ❓ {
                  item.QUESTION_TEXT ||
                  item.QUESTION
                }
              </div>




              {
                item.ANSWER_TEXT ||
                item.ANSWER
                ? (

                  <div
                    className="
                      mt-3
                      bg-green-50
                      border-l-4
                      border-green-500
                      p-3
                    "
                  >

                    <div
                      className="
                        font-semibold
                        text-green-700
                      "
                    >
                      CloudyInSouth trả lời
                    </div>


                    <div>
                      {
                        item.ANSWER_TEXT ||
                        item.ANSWER
                      }
                    </div>


                  </div>

                )
                :
                (

                  <div
                    className="
                      mt-3
                      text-orange-600
                    "
                  >
                    Đang chờ trả lời...
                  </div>

                )
              }



            </div>

          ))
        }


      </div>


    </div>
  );
}