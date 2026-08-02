export interface Order {
  ORDER_ID: number;

  USER_ID: number;

  USERNAME?: string;

  FULLNAME?: string;

  EMAIL?: string;

  PHONE?: string;

  ADDRESS?: string;


  STATUS: 
    | "PENDING"
    | "PROCESSING"
    | "COMPLETED"
    | "CANCELLED"
    | "PAID"
    | string;


  TOTAL_AMOUNT: number;


  PAYMENT_METHOD?: 
    | "CASH"
    | "ONLINE"
    | "COD"
    | string;


  ORDER_DATE?: string;


  ITEMS?: OrderItem[];


  // dùng cho modal tổng tiền
  SUBTOTAL?: number;

  SHIPPING_FEE?: number;

  DISCOUNT?: number;
}



export interface OrderItem {

  ITEM_ID:number;


  MASP:string;


  TENSP?:string;


  PRODUCT_NAME?:string;


  SOLUONG:number;


  QUANTITY?:number;


  PRICE:number;


  TOTAL?:number;


  SUBTOTAL?:number;


  IMAGE_URL?:string;

}