export type OrderStatus = 'OPEN' | 'CLOSED';

export type CafeFloor = '7층 카페' | '45층 카페';

export interface OrderSheet {
  id: string;
  title: string;
  status: OrderStatus;
  createdAt: string;
  closedAt: string | null;
  cafeId: string;
  cafeName: string;
  cafeFloor: string;
  naverOrderUrl: string;
}

export interface OrderItem {
  id: string;
  orderSheetId: string;
  userName: string;
  cafeId: string;
  cafeName: string;
  cafeFloor: string;
  menuName: string;
  menuId?: string | null;
  price: number;
  quantity: number;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface StoredAppData {
  orderSheets: OrderSheet[];
  items: OrderItem[];
  menus: Menu[];
  activeOrderSheetId: string | null;
}

export interface Menu {
  id: string;
  cafeId: string;
  cafeName: string;
  menuName: string;
  price: number;
  soldOutYn: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}
