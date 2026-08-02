const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendOrderEmail({
  to,
  customerName,
  orderId,
  total,
  paymentMethod,
  items,
}) {
  const productHtml = items
    .map(
      (item) => `
      <tr>
        <td>${item.name}</td>
        <td>${item.quantity}</td>
        <td>${Number(item.price).toLocaleString("vi-VN")}đ</td>
      </tr>
    `
    )
    .join("");

  const html = `
  <div style="font-family:Arial;padding:20px">

      <h2 style="color:#e53935">
        CloudyInSouth
      </h2>

      <h3>Cảm ơn bạn đã đặt hàng!</h3>

      <p>Xin chào <b>${customerName}</b></p>

      <p>Đơn hàng của bạn đã được tạo thành công.</p>

      <hr>

      <p><b>Mã đơn hàng:</b> #${orderId}</p>

      <p><b>Thanh toán:</b> ${paymentMethod}</p>

      <p><b>Tổng tiền:</b>
      ${Number(total).toLocaleString("vi-VN")}đ</p>

      <table
      border="1"
      cellpadding="8"
      cellspacing="0"
      style="border-collapse:collapse;width:100%;margin-top:20px">

          <tr>
              <th>Sản phẩm</th>
              <th>SL</th>
              <th>Giá</th>
          </tr>

          ${productHtml}

      </table>

      <br>

      <h3 style="color:red">
      Tổng thanh toán:
      ${Number(total).toLocaleString("vi-VN")}đ
      </h3>

      <p>Cảm ơn bạn đã mua hàng ❤️</p>

  </div>
  `;

  await transporter.sendMail({
    from: `"CloudyInSouth" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Xác nhận đơn hàng #${orderId}`,
    html,
  });
}

module.exports = sendOrderEmail;