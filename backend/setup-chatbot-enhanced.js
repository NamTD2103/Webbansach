/**
 * Chatbot Enhanced Setup Script
 * Initializes response pool with predefined responses
 */

const { executeUpdate } = require('./config/db');

const responsePoolData = [
  // ==================== PAYMENT RESPONSES ====================
  {
    INTENT_CATEGORY: 'PAYMENT',
    RESPONSE_TYPE: 'SHORT',
    RESPONSE_TEMPLATE:
      'Chúng tôi hỗ trợ 2 phương thức:\n1️⃣ COD - Thanh toán khi nhận hàng\n2️⃣ Chuyển khoản\n\nBạn chọn cách nào?',
    RESPONSE_RANK: 1,
    CONTEXT_TAGS: 'busy,urgent,mobile',
    IS_ACTIVE: 1,
  },
  {
    INTENT_CATEGORY: 'PAYMENT',
    RESPONSE_TYPE: 'DETAILED',
    RESPONSE_TEMPLATE:
      'Phương thức thanh toán tại Web Bán Sách:\n\n1️⃣ **COD** (Thanh toán khi nhận hàng)\n- Phí: 0đ\n- Thời gian xác nhận: 5-10 phút\n\n2️⃣ **Chuyển khoản ngân hàng**\n- Phí: 0đ (khách chịu)\n- Thời gian xác nhận: Ngay lập tức\n- Hình thức: Chuyển vào tài khoản {name}\n\n📱 Bạn cần hỗ trợ thêm không?',
    RESPONSE_RANK: 2,
    CONTEXT_TAGS: 'desktop,analytical',
    IS_ACTIVE: 1,
  },
  {
    INTENT_CATEGORY: 'PAYMENT',
    RESPONSE_TYPE: 'PERSONALIZED',
    RESPONSE_TEMPLATE:
      'Hi {first_name}! Dựa trên lịch sử mua hàng của bạn, bạn thường dùng phương thức COD.\n\nNhưng lần này bạn muốn:\n✅ COD (như bình thường)\n✅ Chuyển khoản (nhanh hơn)\n\nChọn nào nhỉ?',
    RESPONSE_RANK: 1,
    CONTEXT_TAGS: 'returning_customer,first_time',
    IS_ACTIVE: 1,
  },
  {
    INTENT_CATEGORY: 'PAYMENT',
    RESPONSE_TYPE: 'UPSELL',
    RESPONSE_TEMPLATE:
      'Tuyệt vời! Mặc định bạn chọn {price_range}.\n\nMẹo: Nếu chuyển khoản ngay, chúng tôi sẽ gửi hàng trong 24h 🚀\n\nChọn phương thức thanh toán:',
    RESPONSE_RANK: 3,
    CONTEXT_TAGS: 'checkout_phase',
    IS_ACTIVE: 1,
  },

  // ==================== SHIPPING RESPONSES ====================
  {
    INTENT_CATEGORY: 'SHIPPING',
    RESPONSE_TYPE: 'SHORT',
    RESPONSE_TEMPLATE:
      'Thời gian giao:\n⏱️ HN/HCM: 2-3 ngày\n⏱️ Tỉnh khác: 3-5 ngày\n\nPhí ship: 20k (miễn phí từ 200k)',
    RESPONSE_RANK: 1,
    CONTEXT_TAGS: 'busy,mobile',
    IS_ACTIVE: 1,
  },
  {
    INTENT_CATEGORY: 'SHIPPING',
    RESPONSE_TYPE: 'DETAILED',
    RESPONSE_TEMPLATE:
      '📍 **Thông tin vận chuyển Web Bán Sách**\n\n**⏱️ Thời gian giao:**\n- Hà Nội & TP.HCM: 2-3 ngày làm việc\n- Các tỉnh thành khác: 3-5 ngày làm việc\n- (Không tính ngày đặt hàng)\n\n**💰 Phí vận chuyển:**\n- Miễn phí từ 200.000đ trở lên\n- Dưới 200.000đ: 20.000đ\n\n**📦 Quy trình:**\n1️⃣ Đơn hàng được giao cho shipper trong 24h\n2️⃣ Shipper liên hệ số điện thoại của bạn\n3️⃣ Giao hàng đúng giờ\n4️⃣ Thanh toán nếu chọn COD\n\n🔍 Bạn có mã đơn để track không?',
    RESPONSE_RANK: 2,
    CONTEXT_TAGS: 'desktop',
    IS_ACTIVE: 1,
  },

  // ==================== PRODUCT SUGGESTION RESPONSES ====================
  {
    INTENT_CATEGORY: 'PRODUCT_SUGGESTION',
    RESPONSE_TYPE: 'SHORT',
    RESPONSE_TEMPLATE:
      'Bạn quan tâm loại sách nào? 📚\n🔵 Lập trình & Công nghệ\n🟢 Tiểu thuyết\n🟡 Tâm lý & Phát triển bản thân\n🟣 Kinh doanh',
    RESPONSE_RANK: 1,
    CONTEXT_TAGS: 'busy,mobile',
    IS_ACTIVE: 1,
  },
  {
    INTENT_CATEGORY: 'PRODUCT_SUGGESTION',
    RESPONSE_TYPE: 'PERSONALIZED',
    RESPONSE_TEMPLATE:
      'Xin chào {first_name}! 👋\n\nBạn thích {category}, đúng không? 📚\n\nTop 5 sách {category} bán chạy nhất:\n1. Sách A - {price_range}\n2. Sách B - {price_range}\n3. Sách C - {price_range}\n...\n\nBạn muốn xem chi tiết sách nào?',
    RESPONSE_RANK: 1,
    CONTEXT_TAGS: 'returning_customer',
    IS_ACTIVE: 1,
  },
  {
    INTENT_CATEGORY: 'PRODUCT_SUGGESTION',
    RESPONSE_TYPE: 'UPSELL',
    RESPONSE_TEMPLATE:
      'Ngoài {category}, bạn cũng nên xem:\n🔥 HOT: Sách New Release\n💎 PREMIUM: Combo tiết kiệm 20%\n⭐ TOP: Sách bán chạy nhất tuần\n\nBạn có muốn khám phá?',
    RESPONSE_RANK: 2,
    CONTEXT_TAGS: 'checkout_phase,vip',
    IS_ACTIVE: 1,
  },

  // ==================== REFUND RESPONSES ====================
  {
    INTENT_CATEGORY: 'REFUND',
    RESPONSE_TYPE: 'SHORT',
    RESPONSE_TEMPLATE:
      '🔄 Hoàn hàng trong 7 ngày\n✅ Sách chưa dùng, nguyên seal\n✅ Còn hóa đơn\n\nLiên hệ: support@webbansach.com',
    RESPONSE_RANK: 1,
    CONTEXT_TAGS: 'busy,urgent',
    IS_ACTIVE: 1,
  },
  {
    INTENT_CATEGORY: 'REFUND',
    RESPONSE_TYPE: 'DETAILED',
    RESPONSE_TEMPLATE:
      '🔄 **Chính sách hoàn hàng Web Bán Sách**\n\n⏰ **Thời hạn:** 7 ngày kể từ khi nhận hàng\n\n✅ **Điều kiện hoàn hàng:**\n- Sách chưa sử dụng, không ghi chép\n- Nguyên vẹn, còn nguyên seal\n- Còn hóa đơn hoặc email xác nhận đơn\n- Tình trạng sách như mới\n\n❌ **Không hoàn hàng nếu:**\n- Quá 7 ngày\n- Sách đã sử dụng, ghi chép\n- Hỏng, rách, bẩn bằn\n\n📞 **Liên hệ hoàn hàng:**\nEmail: support@webbansach.com\nHotline: 0123-456-789\nZalo: 0123-456-789\n\nCó vấn đề gì không?',
    RESPONSE_RANK: 2,
    CONTEXT_TAGS: 'frustrated,desktop',
    IS_ACTIVE: 1,
  },

  // ==================== ORDER STATUS RESPONSES ====================
  {
    INTENT_CATEGORY: 'ORDER_STATUS',
    RESPONSE_TYPE: 'SHORT',
    RESPONSE_TEMPLATE:
      'Cung cấp mã đơn hàng để mình tra cứu cho bạn 📌\n\nMã đơn format: ORD-XXXXX',
    RESPONSE_RANK: 1,
    CONTEXT_TAGS: 'busy',
    IS_ACTIVE: 1,
  },
  {
    INTENT_CATEGORY: 'ORDER_STATUS',
    RESPONSE_TYPE: 'PERSONALIZED',
    RESPONSE_TEMPLATE:
      'Hi {first_name}! 👋\n\nTrạng thái đơn hàng của bạn:\n📦 ORD-12345: Đang giao (ETA 2 ngày)\n✅ ORD-12344: Đã nhận (3 ngày trước)\n\nChọn đơn nào để chi tiết?',
    RESPONSE_RANK: 1,
    CONTEXT_TAGS: 'returning_customer',
    IS_ACTIVE: 1,
  },

  // ==================== FAQ RESPONSES ====================
  {
    INTENT_CATEGORY: 'FAQ',
    RESPONSE_TYPE: 'SHORT',
    RESPONSE_TEMPLATE:
      'Mình có thể giúp gì? 🤔\n\n❓ Câu hỏi phổ biến:\n1️⃣ Thanh toán\n2️⃣ Vận chuyển\n3️⃣ Hoàn hàng\n4️⃣ Tài khoản\n\nBạn chọn số nào?',
    RESPONSE_RANK: 1,
    CONTEXT_TAGS: 'mobile',
    IS_ACTIVE: 1,
  },
];

/**
 * Initialize response pool
 */
async function initializeResponsePool() {
  console.log('Initializing chatbot response pool...');

  for (const response of responsePoolData) {
    try {
      const insertQuery = `
        INSERT INTO CHATBOT_RESPONSE_POOL
        (POOL_ID, INTENT_CATEGORY, RESPONSE_TYPE, RESPONSE_TEMPLATE, RESPONSE_RANK,
         CONTEXT_TAGS, IS_ACTIVE, CREATED_AT, UPDATED_AT, CREATED_BY)
        VALUES (chatbot_pool_seq.NEXTVAL, :category, :type, :template, :rank,
                :tags, :active, SYSDATE, SYSDATE, 'SYSTEM')
      `;

      await executeUpdate(insertQuery, {
        category: response.INTENT_CATEGORY,
        type: response.RESPONSE_TYPE,
        template: response.RESPONSE_TEMPLATE,
        rank: response.RESPONSE_RANK,
        tags: response.CONTEXT_TAGS,
        active: response.IS_ACTIVE,
      });

      console.log(`✅ Added: ${response.INTENT_CATEGORY} - ${response.RESPONSE_TYPE}`);
    } catch (err) {
      if (err.message.includes('UNIQUE constraint')) {
        console.log(`⚠️  Skipped: ${response.INTENT_CATEGORY} - ${response.RESPONSE_TYPE} (already exists)`);
      } else {
        console.error(`❌ Error adding response:`, err.message);
      }
    }
  }

  console.log('Response pool initialization complete!');
}

// Export for use in setup scripts
module.exports = {
  initializeResponsePool,
  responsePoolData,
};
