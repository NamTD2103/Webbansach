const express = require("express");
const router = express.Router();

const {
    executeQuery,
    executeUpdate
} = require("../config/db");
router.post("/send", async (req, res) => {

    try {

        const {
            room,
            sender,
            receiver,
            message
        } = req.body;

        await executeUpdate(
            `
            INSERT INTO CHAT_MESSAGES
            (
                ROOM_ID,
                SENDER_ID,
                RECEIVER_ID,
                MESSAGE
            )
            VALUES
            (
                :room,
                :sender,
                :receiver,
                :message
            )
        `,
            {
                room,
                sender,
                receiver,
                message
            }
        );

        req.app.get("io")
            .to(room)
            .emit("newMessage", {
                room,
                sender,
                receiver,
                message
            });

        res.json({
            success: true
        });

    } catch (err) {

        console.log(err);

        res.status(500).json(err);

    }

});
// =============================
// Danh sách phòng chat
// =============================
router.get("/rooms/list", async (req, res) => {
  try {
    const rows = await executeQuery(`
      SELECT
        ROOM_ID,
        MAX(CREATED_AT) LAST_TIME,
        COUNT(*) TOTAL_MESSAGES
      FROM CHAT_MESSAGES
      GROUP BY ROOM_ID
      ORDER BY MAX(CREATED_AT) DESC
    `);

    res.json(rows.rows || rows);

  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
});

// =============================
// Lấy tin nhắn theo phòng
// =============================
router.get("/:room", async (req, res) => {
  try {

    const rows = await executeQuery(
      `
      SELECT *
      FROM CHAT_MESSAGES
      WHERE ROOM_ID = :room
      ORDER BY CREATED_AT
      `,
      {
        room: req.params.room,
      }
    );

    res.json(rows.rows || rows);

  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
});
module.exports = router;