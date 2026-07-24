const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs: number = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }
    throw error;
  }
}


export interface Product {
  MASP: string;
  TENSP: string;
  GIABAN: number;
  IMAGE_URL: string;
  DESCRIPTION: string;
  SOLUONGTON: number;
  MANCC?: string;  // ✅ Optional
  CAT_ID?: never;  // ✅ Không dùng nữa
}

export interface CartItem extends Product {
  SOLUONG: number;
  TOTAL_PRICE?: number;
}

export interface Order {
  ORDER_ID: number;
  USER_ID: number;
  STATUS: string;
  TOTAL_AMOUNT: number;
  ORDER_DATE?: string;
  items?: OrderItem[];
}

export interface OrderItem {
  ITEM_ID: number;
  MASP: string;
  SOLUONG: number;
  PRICE: number;
  TENSP?: string;
  IMAGE_URL?: string;
  TOTAL?: number;
}

export interface User {
  userId: number;
  username: string;
  role: string;
  email?: string;
  fullname?: string;
}

export const productAPI = {
  async getAll(page: number = 1, limit: number = 20) {
    try {
      console.log(`[API] Fetching products page ${page}, limit ${limit}`);
      const response = await fetchWithTimeout(
        `${API_BASE_URL}/product?page=${page}&limit=${limit}`,
        { method: 'GET', headers: { 'Content-Type': 'application/json' } }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[API] Response error:', errorText);
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log(`[API] Got ${data.data?.length || 0} products`);
      return data;
    } catch (error) {
      console.error('[PRODUCT API ERROR]', error);
      throw error;
    }
  },

  async getById(id: string) {
    try {
      console.log(`[API] Fetching product ${id}`);
      const response = await fetchWithTimeout(`${API_BASE_URL}/product/${id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error(`Product not found: ${id}`);

      const data = await response.json();
      console.log(`[API] Got product: ${data.data?.TENSP}`);
      return data;
    } catch (error) {
      console.error('[PRODUCT DETAIL ERROR]', error);
      throw error;
    }
  },

  async search(query: string) {
    try {
      console.log(`[API] Searching: ${query}`);
      const response = await fetchWithTimeout(
        `${API_BASE_URL}/product/search/query?q=${encodeURIComponent(query)}`,
        { method: 'GET', headers: { 'Content-Type': 'application/json' } }
      );

      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();
      console.log(`[API] Found ${data.count || 0} results`);
      return data;
    } catch (error) {
      console.error('[SEARCH ERROR]', error);
      throw error;
    }
  },

  // Admin functions
  async create(productData: Omit<Product, 'MASP'>) {
    try {
      console.log('[API] Creating product:', productData.TENSP);
      const response = await fetchWithTimeout(`${API_BASE_URL}/product`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create product');
      }

      const data = await response.json();
      console.log('[API] Product created:', data.data?.MASP);
      return data;
    } catch (error) {
      console.error('[CREATE PRODUCT ERROR]', error);
      throw error;
    }
  },

  async update(id: string, productData: Partial<Omit<Product, 'MASP'>>) {
    try {
      console.log('[API] Updating product:', id);
      const response = await fetchWithTimeout(`${API_BASE_URL}/product/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update product');
      }

      const data = await response.json();
      console.log('[API] Product updated:', id);
      return data;
    } catch (error) {
      console.error('[UPDATE PRODUCT ERROR]', error);
      throw error;
    }
  },

  async delete(id: string) {
    try {
      console.log('[API] Deleting product:', id);
      const response = await fetchWithTimeout(`${API_BASE_URL}/product/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete product');
      }

      const data = await response.json();
      console.log('[API] Product deleted:', id);
      return data;
    } catch (error) {
      console.error('[DELETE PRODUCT ERROR]', error);
      throw error;
    }
  },
};

export const cartAPI = {
  async getCart(userId: number) {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/cart/${userId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('[CART API ERROR]', response.status, errorData);
        throw new Error(errorData.message || `Failed to fetch cart (HTTP ${response.status})`);
      }

      const data = await response.json();
      console.log(`[CART API] Cart fetched successfully:`, data);
      return data;
    } catch (error) {
      console.error('[CART FETCH ERROR]', error);
      throw error;
    }
  },

  async addToCart(userId: number, masp: string, soluong: number) {
    const response = await fetchWithTimeout(`${API_BASE_URL}/cart/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, masp, soluong }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add to cart');
    }
    return await response.json();
  },

  async removeFromCart(userId: number, masp: string) {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/cart/item/${userId}/${masp}`,
      { method: 'DELETE', headers: { 'Content-Type': 'application/json' } }
    );

    if (!response.ok) throw new Error('Failed to remove from cart');
    return await response.json();
  },
  async clearCart(userId:number){

  const response = await fetchWithTimeout(
    `${API_BASE_URL}/cart/clear/${userId}`,
    {
      method:"DELETE",
      headers:{
        "Content-Type":"application/json"
      }
    }
  );


  if(!response.ok){

    const error =
      await response.json()
      .catch(()=>({
        message:"Không thể xóa giỏ hàng"
      }));

    throw new Error(
      error.message
    );
  }


  return await response.json();

},
};
export const voucherAPI = {

   async apply(code:string,subtotal:number){

      const response=await fetchWithTimeout(
         `${API_BASE_URL}/voucher/apply`,
         {
            method:"POST",
            headers:{
               "Content-Type":"application/json"
            },
            body:JSON.stringify({
                code,
                subtotal
            })
         }
      );

      if(!response.ok){
          const error=await response.json();
          throw new Error(error.message);
      }

      return await response.json();

   }

}
export const orderAPI = {
  async createOrder(orderData: any) {
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/order/create`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create order");
  }

  return await response.json();
},

 async getOrderDetail(orderId: number) {
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/order/${orderId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Không lấy được chi tiết đơn hàng" }));
    throw new Error(error.message);
  }

  return await response.json();
},

  async getUserOrders(userId: number, page: number = 1, limit: number = 10) {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/order/user/${userId}?page=${page}&limit=${limit}`,
      { method: 'GET', headers: { 'Content-Type': 'application/json' } }
    );

    if (!response.ok) throw new Error('Failed to fetch orders');
    return await response.json();
  },

  async cancelOrder(orderId: number, reason = "") {
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/order/${orderId}/cancel`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reason }),
    }
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Không thể hủy đơn" }));

    throw new Error(error.message);
  }

  return await response.json();
},
async reorder(orderId: number) {
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/order/${orderId}/reorder`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Không thể mua lại");
  }

  return await response.json();
},

async reviewProduct(data:{
    userId:number;
    masp:string;
    rating:number;
    comment:string;
}){

const response = await fetchWithTimeout(
`${API_BASE_URL}/review`,
{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify(data)
}
);


if(!response.ok){

const error =
await response.json()
.catch(()=>({
message:"Đánh giá thất bại"
}));

throw new Error(error.message);

}


return await response.json();

},
async trackOrder(orderId:number){

const response=await fetchWithTimeout(
`${API_BASE_URL}/order/${orderId}/tracking`
);

if(!response.ok){
throw new Error("Không lấy được trạng thái");
}

return await response.json();

},
async downloadInvoice(orderId:number){

const response = await fetchWithTimeout(
  `${API_BASE_URL}/order/${orderId}/invoice`,
  {
    method: "GET",
  }
);

if(!response.ok){
throw new Error("Invoice not found");
}

return response.blob();

},async repay(orderId:number){

const response=await fetchWithTimeout(
`${API_BASE_URL}/order/${orderId}/pay`,
{
method:"POST"
}
);

if(!response.ok){
throw new Error("Thanh toán thất bại");
}

return await response.json();

}
};

export const authAPI = {
  async login(username: string, password: string) {
    const response = await fetchWithTimeout(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },

  async register(username: string, password: string, email?: string, role: string = 'USER') {
    const response = await fetchWithTimeout(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, email, role }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    const data = await response.json();
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },

  getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
    }
  },

  async getUser(userId: number) {
    const response = await fetchWithTimeout(`${API_BASE_URL}/auth/user/${userId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) throw new Error('Failed to fetch user profile');
    return await response.json();
  },

  async updateProfile(userId: number, data: { email?: string; fullname?: string }) {
    const response = await fetchWithTimeout(`${API_BASE_URL}/auth/user/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to update profile' }));
      throw new Error(error.message || 'Failed to update profile');
    }

    const result = await response.json();
    
    // Update localStorage with new user data
    if (typeof window !== 'undefined' && result.data) {
      const currentUser = this.getCurrentUser();
      if (currentUser) {
        const updatedUser = {
          ...currentUser,
          email: result.data.EMAIL || currentUser.email,
          fullname: result.data.FULLNAME || currentUser.fullname,
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    }

    return result;
  },
};

export const adminAPI = {
  async getAllUsers() {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/users`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to fetch users' }));
      throw new Error(error.message || 'Failed to fetch users');
    }

    return await response.json();
  },

  async getUserDetail(userId: number) {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/users/${userId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) throw new Error('Failed to fetch user detail');
    return await response.json();
  },

  async updateUser(userId: number, data: { email?: string; fullname?: string; role?: string }) {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to update user' }));
      throw new Error(error.message || 'Failed to update user');
    }

    return await response.json();
  },

  async deleteUser(userId: number) {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to delete user' }));
      throw new Error(error.message || 'Failed to delete user');
    }

    return await response.json();
  },

  async getAllOrders() {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/orders`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to fetch orders' }));
      throw new Error(error.message || 'Failed to fetch orders');
    }

    return await response.json();
  },

  async getOrderDetail(orderId: number) {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/orders/${orderId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to fetch order' }));
      throw new Error(error.message || 'Failed to fetch order details');
    }

    return await response.json();
  },

  async updateOrderStatus(orderId: number, status: string) {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to update order' }));
      throw new Error(error.message || 'Failed to update order');
    }

    return await response.json();
  },
  // ================= Voucher =================

async getAllVouchers() {
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/admin/vouchers`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to fetch vouchers" }));

    throw new Error(error.message || "Failed to fetch vouchers");
  }

  return await response.json();
},
async hideReview(reviewId:number){

const response = await fetchWithTimeout(
`${API_BASE_URL}/review/admin/${reviewId}`,
{
method:"PUT",
headers:{
"Content-Type":"application/json"
}
}
);


if(!response.ok){

const error =
await response.json()
.catch(()=>({
message:"Ẩn đánh giá thất bại"
}));

throw new Error(error.message);

}


return await response.json();

},
async getVoucher(id: number) {
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/admin/vouchers/${id}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Không lấy được voucher");
  }

  return await response.json();
},

async createVoucher(data: any) {
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/admin/vouchers`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Create failed" }));

    throw new Error(error.message);
  }

  return await response.json();
},

async updateVoucher(id: number, data: any) {
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/admin/vouchers/${id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Update failed" }));

    throw new Error(error.message);
  }

  return await response.json();
},

async deleteVoucher(id: number) {
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/admin/vouchers/${id}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Delete failed" }));

    throw new Error(error.message);
  }

  return await response.json();
},
async getAllReviews(){

const response = await fetchWithTimeout(
`${API_BASE_URL}/review/admin/all`,
{
method:"GET",
headers:{
"Content-Type":"application/json"
}
}
);


if(!response.ok){

const error =
await response.json()
.catch(()=>({
message:"Failed to fetch reviews"
}));

throw new Error(error.message);

}


return await response.json();

},


async getAllQuestions(){

const response = await fetchWithTimeout(
`${API_BASE_URL}/admin/questions`,
{
method:"GET",
headers:{
"Content-Type":"application/json"
}
}
);


if(!response.ok){

const error =
await response.json()
.catch(()=>({
message:"Failed to fetch questions"
}));

throw new Error(error.message);

}


return await response.json();

},
async answerQuestion(
  questionId: number,
  answer: string
) {

  const response = await fetchWithTimeout(
    `${API_BASE_URL}/admin/questions/${questionId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        answer
      }),
    }
  );


  if (!response.ok) {

    const error =
      await response.json()
      .catch(() => ({
        message: "Failed to answer question"
      }));

    throw new Error(error.message);

  }


  return await response.json();

},
};
export const reviewAPI = {

  // User gửi đánh giá
  async createReview(data:{
    userId:number;
    masp:string;
    rating:number;
    comment:string;
  }){

    const response = await fetchWithTimeout(
      `${API_BASE_URL}/review`,
      {
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify(data)
      }
    );


    if(!response.ok){

      const error = await response
        .json()
        .catch(()=>({
          message:"Đánh giá thất bại"
        }));

      throw new Error(error.message);

    }


    return await response.json();

  },

async getUserReview(
    userId:number,
    masp:string
){

const response = await fetchWithTimeout(
`${API_BASE_URL}/review/user/${userId}/${masp}`
);

if(!response.ok){
throw new Error("Không lấy được đánh giá");
}

return await response.json();

},

  // Lấy đánh giá của sản phẩm
  async getProductReviews(masp:string){

    const response = await fetchWithTimeout(
      `${API_BASE_URL}/review/product/${masp}`,
      {
        method:"GET",
        headers:{
          "Content-Type":"application/json"
        }
      }
    );


    if(!response.ok){

      throw new Error(
        "Không lấy được đánh giá"
      );

    }


    return await response.json();

  }

};


export const categoryAPI = {
  async getAll() {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/category`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }

      const data = await response.json();
      console.log(`[API] Fetched ${data.data?.length || 0} categories`);
      return data;
    } catch (error) {
      console.error('[CATEGORY ERROR]', error);
      throw error;
    }
  },
};

export default {
    productAPI,
    cartAPI,
    orderAPI,
    authAPI,
    adminAPI,
    categoryAPI,
    voucherAPI,
    reviewAPI
}