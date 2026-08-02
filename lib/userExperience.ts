import type { Product } from '@/lib/api';


export interface CartStorageItem {

  MASP: string;

  TENSP: string;

  GIABAN: number;

  IMAGE_URL?: string;

  DESCRIPTION?: string;

  SOLUONGTON?: number;

  SOLUONG: number;

  TOTAL_PRICE: number;

}



export interface WishlistItem {

  MASP: string;

  TENSP: string;

  GIABAN: number;

  IMAGE_URL?: string;

  DESCRIPTION?: string;

}



const GUEST_CART_KEY = 'guest_cart_v1';

const WISHLIST_KEY = 'guest_wishlist_v1';

const SEARCH_HISTORY_KEY = 'book_search_history_v1';




// ===============================
// LOCAL STORAGE HELPER
// ===============================


function readStorage<T>(
  key:string,
  fallback:T
):T {


  if(typeof window === 'undefined')
    return fallback;


  try{

    const stored =
      localStorage.getItem(key);


    return stored
      ? JSON.parse(stored)
      : fallback;


  }
  catch{

    return fallback;

  }

}



function writeStorage<T>(
  key:string,
  value:T
){

  if(typeof window === 'undefined')
    return;


  localStorage.setItem(
    key,
    JSON.stringify(value)
  );

}





// ===============================
// GUEST CART
// ===============================



export function getGuestCart()
:CartStorageItem[] {


return readStorage<CartStorageItem[]>(
  GUEST_CART_KEY,
  []
);


}





export function saveGuestCart(
cart:CartStorageItem[]
){

writeStorage(
  GUEST_CART_KEY,
  cart
);


}





// THÊM SẢN PHẨM VÀO GIỎ KHÁCH


export function addGuestCartItem(
product:Product,
quantity=1
):CartStorageItem[] {


const cart =
getGuestCart();



const existing =
cart.find(
(item)=>item.MASP===product.MASP
);



if(existing){



const newQuantity =
Math.min(

existing.SOLUONG + quantity,

product.SOLUONGTON

);



existing.SOLUONG =
newQuantity;



existing.TOTAL_PRICE =
existing.GIABAN *
newQuantity;



}
else{


cart.push({

MASP:product.MASP,

TENSP:product.TENSP,

GIABAN:product.GIABAN,

IMAGE_URL:product.IMAGE_URL,

DESCRIPTION:product.DESCRIPTION,

SOLUONGTON:product.SOLUONGTON,

SOLUONG:
Math.min(
quantity,
product.SOLUONGTON
),

TOTAL_PRICE:
product.GIABAN * quantity,


});


}



saveGuestCart(cart);


return cart;


}





// CẬP NHẬT SỐ LƯỢNG
// CÓ KIỂM TRA TỒN KHO


export function updateGuestCartItem(
masp:string,
quantity:number
){


const cart =
getGuestCart();



const updated =
cart.map(item=>{


if(item.MASP !== masp)

return item;




const maxStock =
item.SOLUONGTON ?? 0;




const safeQuantity =

Math.min(

Math.max(
quantity,
1
),

maxStock

);




return {


...item,


SOLUONG:
safeQuantity,


TOTAL_PRICE:

item.GIABAN *
safeQuantity


};


});




saveGuestCart(updated);



return updated;


}






// XÓA SẢN PHẨM


export function removeGuestCartItem(
masp:string
){


const cart =

getGuestCart()
.filter(
(item)=>item.MASP!==masp
);



saveGuestCart(cart);


return cart;


}





// XÓA TOÀN BỘ GIỎ


export function clearGuestCart(){

saveGuestCart([]);

}





// ===============================
// WISHLIST
// ===============================



export function getWishlistItems()
:WishlistItem[] {


return readStorage<WishlistItem[]>(
WISHLIST_KEY,
[]
);


}





export function toggleWishlistItem(
product:Product
){


const items =
getWishlistItems();



const index =
items.findIndex(
(item)=>item.MASP===product.MASP
);



if(index>=0){


items.splice(index,1);


writeStorage(
WISHLIST_KEY,
items
);



return {

items,

isFavorite:false

};


}




items.push({

MASP:product.MASP,

TENSP:product.TENSP,

GIABAN:product.GIABAN,

IMAGE_URL:product.IMAGE_URL,

DESCRIPTION:product.DESCRIPTION

});



writeStorage(
WISHLIST_KEY,
items
);



return {


items,

isFavorite:true


};



}





export function isWishlisted(
masp:string
){


return getWishlistItems()
.some(
(item)=>item.MASP===masp
);


}





// ===============================
// SEARCH HISTORY
// ===============================



export function getSearchHistory()
:string[] {


return readStorage<string[]>(
SEARCH_HISTORY_KEY,
[]
);


}




export function saveSearchHistory(
query:string
){


const trimmed =
query.trim();



if(!trimmed)

return getSearchHistory();




const history =

getSearchHistory()
.filter(

(item)=>

item.toLowerCase()
!==trimmed.toLowerCase()

);



history.unshift(trimmed);



const next =
history.slice(0,8);



writeStorage(
SEARCH_HISTORY_KEY,
next
);



return next;


}