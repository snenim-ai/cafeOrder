import { Menu, StoredAppData } from './types';

const STORAGE_KEY = 'cafe-order-app-v1';

const baseSampleMenus = [
  { menuName: 'HOT아메리카노', price: 1500 },
  { menuName: 'ICE아메리카노', price: 1500 },
  { menuName: 'HOT카페라떼', price: 2000 },
  { menuName: 'ICE카페라떼', price: 2000 },
  { menuName: 'ICE오트라떼', price: 2000 },
  { menuName: 'ICE디카페인 콜드브루라떼', price: 2800 },
  { menuName: 'HOT바닐라라떼(제로)', price: 2500 },
  { menuName: 'ICE바닐라라떼(제로)', price: 2500 },
  { menuName: 'ICE디카페인콜드브루', price: 2000 },
  { menuName: 'ICE콜드브루', price: 2000 },
  { menuName: 'HOT페퍼민트', price: 2000 },
  { menuName: 'ICE페퍼민트', price: 2000 },
  { menuName: 'HOT캐모마일', price: 2000 },
  { menuName: 'ICE캐모마일', price: 2000 },
  { menuName: 'HOT루이보스', price: 2000 },
  { menuName: 'ICE루이보스', price: 2000 },
  { menuName: '아이스티복숭아(제로)', price: 1500 },
  { menuName: 'HOT자몽허니블랙티', price: 2000 },
  { menuName: 'ICE자몽허니블랙티', price: 2000 },
  { menuName: '딸기요거트스무디(제로)', price: 2500 },
  { menuName: '플레인요거트스무디(제로)', price: 2500 },
  { menuName: 'ICE초코라떼', price: 2000 },
  { menuName: 'ICE리얼딸기라떼', price: 2000 },
  { menuName: 'ICE얼그레이밀크티', price: 2800 },
  { menuName: '산펠레그리노', price: 2000 },
  { menuName: '분다버그 핑크자몽', price: 2500 },
  { menuName: '분다버그 레몬라임비터', price: 2500 },
  { menuName: '에비앙', price: 1000 },
  { menuName: '셀렉스 프로핏(딸기초코)', price: 1900 },
  { menuName: '셀렉스 프로핏(모카초콜렛)', price: 1900 },
  { menuName: '셀렉스 프로핏(밀크바닐라)', price: 1900 },
  { menuName: '셀렉스 프로핏(바나나)', price: 1900 },
];

function createSampleMenus(): Menu[] {
  const now = new Date().toISOString();
  const cafes = [
    { cafeId: 'cafe-7f', cafeName: '7층 카페' },
    { cafeId: 'cafe-45f', cafeName: '45층 카페' },
  ];

  return cafes.flatMap((cafe) =>
    baseSampleMenus.map((menu, index) => ({
      id: `menu-${cafe.cafeId}-${index + 1}`,
      cafeId: cafe.cafeId,
      cafeName: cafe.cafeName,
      menuName: menu.menuName,
      price: menu.price,
      soldOutYn: false,
      order: index + 1,
      createdAt: now,
      updatedAt: now,
    })),
  );
}

export function loadAppData(): StoredAppData {
  if (typeof window === 'undefined') {
    return { orderSheets: [], items: [], menus: createSampleMenus(), activeOrderSheetId: null };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { orderSheets: [], items: [], menus: createSampleMenus(), activeOrderSheetId: null };
    }
    const parsed = JSON.parse(raw) as Partial<StoredAppData> | null;
    const parsedMenus = Array.isArray(parsed?.menus) ? parsed.menus : [];
    const menus = parsedMenus.map((menu, index) => ({
      ...menu,
      order: typeof menu.order === 'number' && menu.order > 0 ? menu.order : index + 1,
    })) as Menu[];
    return {
      orderSheets: Array.isArray(parsed?.orderSheets) ? parsed.orderSheets : [],
      items: Array.isArray(parsed?.items) ? parsed.items : [],
      menus,
      activeOrderSheetId: typeof parsed?.activeOrderSheetId === 'string' ? parsed.activeOrderSheetId : null,
    };
  } catch {
    return { orderSheets: [], items: [], menus: createSampleMenus(), activeOrderSheetId: null };
  }
}

export function saveAppData(data: StoredAppData) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function resetAppData() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function getMenus(data: StoredAppData): Menu[] {
  return data.menus ?? [];
}

export function saveMenus(data: StoredAppData, menus: Menu[]): StoredAppData {
  const nextData = { ...data, menus };
  saveAppData(nextData);
  return nextData;
}

export function addMenu(data: StoredAppData, menu: Menu): StoredAppData {
  return saveMenus(data, [...getMenus(data), menu]);
}

export function updateMenu(data: StoredAppData, menu: Menu): StoredAppData {
  return saveMenus(
    data,
    getMenus(data).map((m) => (m.id === menu.id ? { ...m, ...menu, updatedAt: new Date().toISOString() } : m)),
  );
}

export function deleteMenu(data: StoredAppData, menuId: string): StoredAppData {
  return saveMenus(data, getMenus(data).filter((m) => m.id !== menuId));
}

export function getMenusByCafeId(data: StoredAppData, cafeId: string): Menu[] {
  return getMenus(data).filter((m) => m.cafeId === cafeId);
}
