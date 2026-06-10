'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CafeFloor,
  OrderItem,
  OrderSheet,
  OrderStatus,
  StoredAppData,
  Menu,
} from '../lib/types';
import { loadAppData, saveAppData, resetAppData } from '../lib/localStorage';

const defaultTitle = '카페 주문 취합';

const CAFES: Record<string, { cafeId: string; cafeName: string; cafeFloor: string; naverOrderUrl: string }> = {
  'cafe-7f': {
    cafeId: 'cafe-7f',
    cafeName: '7층 카페',
    cafeFloor: '7층 카페',
    naverOrderUrl: 'https://booking.naver.com/order/bizes/1655213/items/7684094',
  },
  'cafe-45f': {
    cafeId: 'cafe-45f',
    cafeName: '45층 카페',
    cafeFloor: '45층 카페',
    naverOrderUrl: 'https://booking.naver.com/order/bizes/1655266/items/7683611',
  },
};

function makeId() {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

function formatCurrency(value: number) {
  return `${value.toLocaleString()}원`;
}

function buildFinalOrderText(sheet: OrderSheet, items: OrderItem[]) {
  const lines = [
    `주문서명: ${sheet.title}`,
    `상태: ${sheet.status === 'OPEN' ? '취합중' : '취합완료'}`,
    `생성일: ${new Date(sheet.createdAt).toLocaleString()}`,
    '',
    '--- 주문 내역 ---',
  ];

  if (items.length === 0) {
    lines.push('주문 항목이 없습니다.');
  } else {
    items.forEach((item, index) => {
      lines.push(
        `${index + 1}. ${item.userName} | ${item.cafeFloor} | ${item.menuName} | ${item.quantity}개 | ${formatCurrency(
          item.totalPrice,
        )}`,
      );
    });
    lines.push('');
    const total = items.reduce((sum, item) => sum + item.totalPrice, 0);
    lines.push(`총 합계: ${formatCurrency(total)}`);
  }

  return lines.join('\n');
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'USER' | 'ADMIN'>('USER');
  const [data, setData] = useState<StoredAppData>({ orderSheets: [], items: [], menus: [], activeOrderSheetId: null });
  const [userName, setUserName] = useState('');
  const [menuName, setMenuName] = useState('');
  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null);
  const [price, setPrice] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [copyMessage, setCopyMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [newSheetCafeId, setNewSheetCafeId] = useState<string>('cafe-7f');
  const [menuManagementCafeId, setMenuManagementCafeId] = useState<string>('cafe-7f');
  const [menuForm, setMenuForm] = useState<{ menuName: string; price: number; order: number; soldOutYn?: boolean }>({ menuName: '', price: 0, order: 1, soldOutYn: false });
  const [editingMenuId, setEditingMenuId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const hasClipboard = typeof navigator !== 'undefined' && !!navigator.clipboard;

  useEffect(() => {
    setIsMounted(true);

    const stored = loadAppData();
    if (!stored.activeOrderSheetId && stored.orderSheets.length > 0) {
      stored.activeOrderSheetId = stored.orderSheets[0].id;
    }
    setData(stored);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    saveAppData(data);
  }, [data, isMounted]);

  const activeSheet = useMemo(
    () => data.orderSheets.find((sheet) => sheet.id === data.activeOrderSheetId) ?? null,
    [data.orderSheets, data.activeOrderSheetId],
  );

  const activeItems = useMemo(
    () => data.items.filter((item) => item.orderSheetId === data.activeOrderSheetId),
    [data.items, data.activeOrderSheetId],
  );

  const existingItem = useMemo(
    () =>
      activeSheet
        ? activeItems.find((item) => item.userName.trim().toLowerCase() === userName.trim().toLowerCase()) ?? null
        : null,
    [activeItems, activeSheet, userName],
  );

  const userFormDisabled = activeSheet?.status === 'CLOSED' || !activeSheet;

  const availableMenus = useMemo(() => {
    if (!data.menus || !activeSheet) return [] as Menu[];
    return (data.menus || [])
      .filter((m) => m.cafeId === activeSheet.cafeId && !m.soldOutYn)
      .sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt));
  }, [data.menus, activeSheet]);

  useEffect(() => {
    if (selectedMenuId && data.menus) {
      const m = data.menus.find((x) => x.id === selectedMenuId);
      if (m) {
        setMenuName(m.menuName);
        setPrice(m.price);
      }
    }
  }, [selectedMenuId, data.menus]);

  useEffect(() => {
    if (selectedMenuId && !availableMenus.some((m) => m.id === selectedMenuId)) {
      setSelectedMenuId(null);
      setMenuName('');
      setPrice(0);
    }
  }, [availableMenus, selectedMenuId]);

  const managementMenus = useMemo(() => {
    if (!data.menus) return [] as Menu[];
    return data.menus
      .filter((m) => m.cafeId === menuManagementCafeId)
      .sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt));
  }, [data.menus, menuManagementCafeId]);

  const menuTotals = useMemo(() => {
    return activeItems.reduce<Record<string, number>>((acc, item) => {
      acc[item.menuName] = (acc[item.menuName] ?? 0) + item.quantity;
      return acc;
    }, {});
  }, [activeItems]);

  const cafeTotals = useMemo(() => {
    return activeItems.reduce<Record<CafeFloor, number>>((acc, item) => {
      const floor = item.cafeFloor as CafeFloor;
      if (floor in acc) {
        acc[floor] = (acc[floor] ?? 0) + item.quantity;
      }
      return acc;
    }, { '7층 카페': 0, '45층 카페': 0 });
  }, [activeItems]);

  const totalAmount = useMemo(
    () => activeItems.reduce((sum, item) => sum + item.totalPrice, 0),
    [activeItems],
  );

  const handleSubmit = () => {
    if (!activeSheet) {
      alert('관리자에게 주문서를 생성하도록 요청하세요.');
      return;
    }
    if (activeSheet.status === 'CLOSED') {
      alert('취합 완료된 주문서입니다. 새로운 주문이 불가능합니다.');
      return;
    }
    if (!userName.trim() || !selectedMenuId || price <= 0 || quantity <= 0) {
      alert('이름, 등록된 메뉴, 가격, 수량을 모두 정확히 입력해주세요.');
      return;
    }
    const menu = data.menus?.find((m) => m.id === selectedMenuId) ?? null;
    if (!menu) {
      alert('등록된 메뉴를 선택해주세요.');
      return;
    }
    const item: OrderItem = {
      id: existingItem ? existingItem.id : makeId(),
      orderSheetId: activeSheet.id,
      userName: userName.trim(),
      cafeId: activeSheet.cafeId,
      cafeName: activeSheet.cafeName,
      cafeFloor: activeSheet.cafeFloor + ' 카페',
      menuId: menu ? menu.id : null,
      menuName: (menu ? menu.menuName : menuName).trim(),
      price,
      quantity,
      totalPrice: price * quantity,
      createdAt: existingItem ? existingItem.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setData((prev) => {
      const nextItems = existingItem
        ? prev.items.map((x) => (x.id === existingItem.id ? item : x))
        : [...prev.items, item];
      return { ...prev, items: nextItems };
    });
    if (!existingItem) {
      setUserName('');
      setMenuName('');
      setPrice(0);
      setQuantity(1);
    }
  };

  const handleNewSheet = () => {
    const cafe = CAFES[newSheetCafeId];
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const title = `${dateStr} ${cafe.cafeName} 메뉴취합`;
    const newSheet: OrderSheet = {
      id: makeId(),
      title,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      closedAt: null,
      cafeId: cafe.cafeId,
      cafeName: cafe.cafeName,
      cafeFloor: cafe.cafeFloor,
      naverOrderUrl: cafe.naverOrderUrl,
    };
    setData((prev) => ({
      orderSheets: [newSheet, ...prev.orderSheets],
      items: prev.items,
      menus: prev.menus ?? [],
      activeOrderSheetId: newSheet.id,
    }));
  };

  const handleToggleStatus = () => {
    if (!activeSheet) return;
    const nextStatus: OrderStatus = activeSheet.status === 'OPEN' ? 'CLOSED' : 'OPEN';
    setData((prev) => ({
      ...prev,
      orderSheets: prev.orderSheets.map((sheet) =>
        sheet.id === activeSheet.id
          ? { ...sheet, status: nextStatus, closedAt: nextStatus === 'CLOSED' ? new Date().toISOString() : null }
          : sheet,
      ),
    }));
  };

  const handleReset = () => {
    if (!confirm('전체 데이터를 초기화하시겠습니까?')) return;
    resetAppData();
    setData({ orderSheets: [], items: [], menus: [], activeOrderSheetId: null });
  };

  const handleAddMenu = () => {
    if (!menuForm.menuName.trim() || menuForm.price <= 0) {
      alert('메뉴명과 가격을 입력해주세요.');
      return;
    }
    const cafe = CAFES[menuManagementCafeId];
    const currentCafeMenus = data.menus?.filter((m) => m.cafeId === menuManagementCafeId) ?? [];
    const nextOrder = Math.max(0, ...currentCafeMenus.map((m) => m.order)) + 1;
    const newMenu: Menu = {
      id: makeId(),
      cafeId: cafe.cafeId,
      cafeName: cafe.cafeName,
      menuName: menuForm.menuName.trim(),
      price: menuForm.price,
      soldOutYn: !!menuForm.soldOutYn,
      order: menuForm.order > 0 ? menuForm.order : nextOrder,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setData((prev) => ({ ...prev, menus: [...(prev.menus || []), newMenu] }));
    setMenuForm({ menuName: '', price: 0, order: nextOrder + 1, soldOutYn: false });
    setStatusMessage('메뉴가 추가되었습니다.');
    setTimeout(() => setStatusMessage(''), 2000);
  };

  const handleEditMenu = (menuId: string) => {
    const m = data.menus?.find((x) => x.id === menuId);
    if (!m) return;
    setMenuManagementCafeId(m.cafeId);
    setMenuForm({ menuName: m.menuName, price: m.price, order: m.order, soldOutYn: !!m.soldOutYn });
    setEditingMenuId(menuId);
  };

  const handleSaveMenu = () => {
    if (!editingMenuId) return;
    setData((prev) => ({
      ...prev,
      menus: (prev.menus || []).map((m) =>
        m.id === editingMenuId
          ? {
              ...m,
              menuName: menuForm.menuName.trim(),
              price: menuForm.price,
              order: menuForm.order > 0 ? menuForm.order : m.order,
              soldOutYn: !!menuForm.soldOutYn,
              updatedAt: new Date().toISOString(),
            }
          : m,
      ),
    }));
    setEditingMenuId(null);
    setMenuForm({ menuName: '', price: 0, order: managementMenus.length + 1, soldOutYn: false });
    setStatusMessage('메뉴가 저장되었습니다.');
    setTimeout(() => setStatusMessage(''), 2000);
  };

  const handleDeleteMenu = (menuId: string) => {
    if (!confirm('해당 메뉴를 삭제하시겠습니까?')) return;
    setData((prev) => ({ ...prev, menus: (prev.menus || []).filter((m) => m.id !== menuId) }));
  };

  const moveMenu = (menuId: string, direction: 'UP' | 'DOWN') => {
    setData((prev) => {
      const menus = prev.menus || [];
      const cafeMenus = menus
        .filter((menu) => menu.cafeId === menuManagementCafeId)
        .sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt));
      const currentIndex = cafeMenus.findIndex((menu) => menu.id === menuId);
      if (currentIndex === -1) return prev;
      const targetIndex = direction === 'UP' ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= cafeMenus.length) return prev;
      const sourceOrder = cafeMenus[currentIndex].order;
      const targetOrder = cafeMenus[targetIndex].order;
      const nextMenus = menus.map((menu) => {
        if (menu.id === menuId) {
          return { ...menu, order: targetOrder, updatedAt: new Date().toISOString() };
        }
        if (menu.id === cafeMenus[targetIndex].id) {
          return { ...menu, order: sourceOrder, updatedAt: new Date().toISOString() };
        }
        return menu;
      });
      return { ...prev, menus: nextMenus };
    });
  };

  const toggleSoldOut = (menuId: string) => {
    setData((prev) => ({ ...prev, menus: (prev.menus || []).map((m) => (m.id === menuId ? { ...m, soldOutYn: !m.soldOutYn, updatedAt: new Date().toISOString() } : m)) }));
  };

  const handleCopyResult = async () => {
    if (!activeSheet) {
      return;
    }

    if (!hasClipboard) {
      setCopyMessage('이 브라우저에서는 클립보드 복사가 지원되지 않습니다.');
      setTimeout(() => setCopyMessage(''), 2500);
      return;
    }

    const text = buildFinalOrderText(activeSheet, activeItems);
    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage('최종 주문 결과가 클립보드에 복사되었습니다.');
      setTimeout(() => setCopyMessage(''), 2500);
    } catch {
      setCopyMessage('클립보드 복사에 실패했습니다.');
      setTimeout(() => setCopyMessage(''), 2500);
    }
  };

  const sheetStatusLabel = activeSheet ? (activeSheet.status === 'OPEN' ? '취합중' : '취합완료') : '없음';

  if (!isMounted) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-10 text-center text-slate-300">
          로딩 중...
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-black/20 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-violet-300/80">사내 카페 주문 취합 MVP</p>
          <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">카카오톡 공유용 주문서</h1>
          <p className="mt-2 max-w-2xl text-slate-300">사용자는 URL로 접속해서 이름과 메뉴를 입력하고, 관리자는 주문서를 생성·취합·결과를 확인할 수 있습니다.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('USER')}
            className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${activeTab === 'USER' ? 'bg-violet-500 text-white' : 'border border-white/10 bg-slate-800 text-slate-200 hover:bg-slate-700'}`}
          >
            사용자 화면
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ADMIN')}
            className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${activeTab === 'ADMIN' ? 'bg-violet-500 text-white' : 'border border-white/10 bg-slate-800 text-slate-200 hover:bg-slate-700'}`}
          >
            관리자 화면
          </button>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <article className="space-y-5 rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-black/10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-400">현재 주문서명</p>
              <p className="mt-2 text-xl font-semibold text-white">{activeSheet?.title ?? '주문서 없음'}</p>
            </div>
            <div className="rounded-3xl bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-100">
              상태: <span className={activeSheet?.status === 'OPEN' ? 'text-emerald-300' : 'text-rose-300'}>{sheetStatusLabel}</span>
            </div>
          </div>

          {activeTab === 'USER' ? (
            <div className="space-y-5">
              <div className="rounded-3xl bg-slate-950/70 p-4">
                <p className="text-sm text-slate-400">사용자 주문 입력</p>
                {!activeSheet ? (
                  <p className="mt-3 text-slate-300">관리자가 주문서를 생성하면 바로 주문할 수 있습니다.</p>
                ) : (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-sm text-slate-300">이름</span>
                      <input
                        value={userName}
                        onChange={(event) => setUserName(event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-violet-500"
                        placeholder="홍길동"
                        disabled={userFormDisabled}
                      />
                    </label>
                    {availableMenus.length > 0 ? (
                      <>
                        <label className="block">
                          <span className="text-sm text-slate-300">메뉴 선택</span>
                          <select
                            value={selectedMenuId ?? ''}
                            onChange={(e) => setSelectedMenuId(e.target.value || null)}
                            className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-violet-500"
                            disabled={userFormDisabled}
                          >
                            <option value="">선택하세요</option>
                            {availableMenus.map((m) => (
                              <option key={m.id} value={m.id}>{`${m.menuName} · ${m.price.toLocaleString()}원${m.soldOutYn ? ' · 품절' : ''}`}</option>
                            ))}
                          </select>
                        </label>
                        <label className="block">
                          <span className="text-sm text-slate-300">가격</span>
                          <input
                            type="number"
                            min={0}
                            value={price || ''}
                            className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-violet-500"
                            placeholder="메뉴 선택 시 자동 채움"
                            readOnly
                          />
                        </label>
                      </>
                    ) : (
                      <div className="col-span-full rounded-3xl border border-dashed border-slate-700 bg-slate-950/80 p-4 text-slate-300">
                        <p>등록된 메뉴가 없습니다. 관리자에게 메뉴 등록을 요청하세요.</p>
                      </div>
                    )}
                    <label className="block">
                      <span className="text-sm text-slate-300">수량</span>
                      <input
                        type="number"
                        min={1}
                        value={quantity}
                        onChange={(event) => setQuantity(Number(event.target.value))}
                        className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-violet-500"
                        disabled={userFormDisabled}
                      />
                    </label>
                  </div>
                )}
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={userFormDisabled || !activeSheet || availableMenus.length === 0}
                    className="inline-flex items-center justify-center rounded-2xl bg-violet-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:bg-slate-700"
                  >
                    {existingItem ? '기존 주문 수정' : '주문 완료'}
                  </button>
                  <p className="text-sm text-slate-400">
                    {existingItem
                      ? '같은 이름 주문이 이미 있습니다. 버튼 클릭 시 수정됩니다.'
                      : '주문한 이름이 같으면 기존 주문을 덮어씁니다.'}
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">현재 주문 목록</p>
                  <p className="text-sm text-slate-400">총 {activeItems.length}건</p>
                </div>
                {activeItems.length === 0 ? (
                  <p className="text-slate-400">아직 등록된 주문이 없습니다.</p>
                ) : (
                  <div className="space-y-3">
                    {activeItems.map((item) => (
                      <div key={item.id} className="rounded-3xl border border-white/5 bg-slate-900/90 p-4">
                        <p className="font-semibold text-white">{item.userName}</p>
                        <p className="mt-1 text-sm text-slate-400">{item.cafeFloor} · {item.menuName} · {item.quantity}개 · {formatCurrency(item.totalPrice)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block rounded-3xl border border-white/10 bg-slate-950/80 p-4">
                  <span className="text-sm text-slate-300">주문서 생성 카페</span>
                  <select
                    value={newSheetCafeId}
                    onChange={(event) => setNewSheetCafeId(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-violet-500"
                  >
                    <option value="cafe-7f">7층 카페</option>
                    <option value="cafe-45f">45층 카페</option>
                  </select>
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={handleNewSheet}
                    className="rounded-3xl bg-emerald-500 px-5 py-4 text-left font-semibold text-slate-950 transition hover:bg-emerald-400"
                  >
                    신규 주문서 생성
                  </button>
                  <button
                    type="button"
                    onClick={handleToggleStatus}
                    disabled={!activeSheet}
                    className="rounded-3xl bg-indigo-500 px-5 py-4 text-left font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-700"
                  >
                    {activeSheet?.status === 'OPEN' ? '취합완료' : '취합완료 취소'}
                  </button>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-5">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-3xl bg-slate-900 p-4">
                    <p className="text-sm text-slate-400">상태</p>
                    <p className="mt-2 text-lg font-semibold text-white">{sheetStatusLabel}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-900 p-4">
                    <p className="text-sm text-slate-400">주문 건수</p>
                    <p className="mt-2 text-lg font-semibold text-white">{activeItems.length}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-900 p-4">
                    <p className="text-sm text-slate-400">전체 금액</p>
                    <p className="mt-2 text-lg font-semibold text-white">{formatCurrency(totalAmount)}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">메뉴별 합산</p>
                </div>
                {Object.keys(menuTotals).length === 0 ? (
                  <p className="text-slate-400">주문이 없으면 합산 값이 표시되지 않습니다.</p>
                ) : (
                  <div className="grid gap-3">
                    {Object.entries(menuTotals).map(([menu, count]) => (
                      <div key={menu} className="rounded-3xl bg-slate-900 p-4">
                        <p className="font-semibold text-white">{menu}</p>
                        <p className="mt-1 text-sm text-slate-400">수량 {count}개</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">카페별 합산</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(Object.keys(cafeTotals) as CafeFloor[]).map((floor) => (
                    <div key={floor} className="rounded-3xl bg-slate-900 p-4">
                      <p className="font-semibold text-white">{floor}</p>
                      <p className="mt-1 text-sm text-slate-400">수량 {cafeTotals[floor] ?? 0}개</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <a
                  href={CAFES['cafe-7f'].naverOrderUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-3xl bg-orange-500 px-5 py-4 text-center font-semibold text-slate-950 transition hover:bg-orange-400"
                >
                  7층 네이버 주문하기 열기
                </a>
                <a
                  href={CAFES['cafe-45f'].naverOrderUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-3xl bg-orange-500 px-5 py-4 text-center font-semibold text-slate-950 transition hover:bg-orange-400"
                >
                  45층 네이버 주문하기 열기
                </a>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleCopyResult}
                  disabled={!activeSheet}
                  className="rounded-3xl bg-sky-500 px-5 py-4 font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700"
                >
                  최종 주문 결과 복사
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-3xl bg-rose-500 px-5 py-4 font-semibold text-white transition hover:bg-rose-400"
                >
                  전체 초기화
                </button>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-black/10 mt-6">
                <h2 className="text-xl font-semibold text-white">메뉴 관리</h2>
                <p className="mt-2 text-sm text-slate-400">현재 저장된 메뉴를 확인하고 수동으로 관리하세요.</p>
                {managementMenus.length === 0 ? (
                  <p className="mt-4 text-slate-400">선택한 카페에 등록된 메뉴가 없습니다. 메뉴를 추가해주세요.</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {managementMenus.map((m, index) => (
                      <div key={m.id} className="rounded-3xl border border-white/5 bg-slate-950 p-4 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-white">{m.order}. {m.menuName} {m.soldOutYn ? '(품절)' : ''}</p>
                          <p className="mt-1 text-sm text-slate-400">
                            {m.cafeName} · {m.price.toLocaleString()}원
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => toggleSoldOut(m.id)} className="rounded px-3 py-1 bg-slate-700 text-sm">{m.soldOutYn ? '품절해제' : '품절'}</button>
                          <button onClick={() => moveMenu(m.id, 'UP')} disabled={index === 0} className="rounded px-3 py-1 bg-slate-700 text-sm disabled:opacity-50">위로</button>
                          <button onClick={() => moveMenu(m.id, 'DOWN')} disabled={index === managementMenus.length - 1} className="rounded px-3 py-1 bg-slate-700 text-sm disabled:opacity-50">아래로</button>
                          <button onClick={() => handleEditMenu(m.id)} className="rounded px-3 py-1 bg-amber-500 text-sm">수정</button>
                          <button onClick={() => handleDeleteMenu(m.id)} className="rounded px-3 py-1 bg-rose-500 text-sm text-white">삭제</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-4 rounded-2xl bg-slate-950/70 p-4">
                  <p className="text-sm text-slate-300">메뉴 관리 (카페별)</p>
                  <div className="mt-3 grid gap-3">
                    <label className="block">
                      <span className="text-sm text-slate-300">관리할 카페</span>
                      <select
                        value={menuManagementCafeId}
                        onChange={(e) => setMenuManagementCafeId(e.target.value)}
                        className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-violet-500"
                      >
                        <option value="cafe-7f">7층 카페</option>
                        <option value="cafe-45f">45층 카페</option>
                      </select>
                    </label>
                    <input value={menuForm.order} onChange={(e) => setMenuForm({ ...menuForm, order: Number(e.target.value) })} placeholder="순번" type="number" min={1} className="rounded-2xl p-2 bg-slate-900 text-white" />
                    <input value={menuForm.menuName} onChange={(e) => setMenuForm({ ...menuForm, menuName: e.target.value })} placeholder="메뉴명" className="rounded-2xl p-2 bg-slate-900 text-white" />
                    <input value={menuForm.price} onChange={(e) => setMenuForm({ ...menuForm, price: Number(e.target.value) })} placeholder="가격" type="number" className="rounded-2xl p-2 bg-slate-900 text-white" />
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!menuForm.soldOutYn} onChange={(e) => setMenuForm({ ...menuForm, soldOutYn: e.target.checked })} /> 품절 여부</label>
                    <div className="flex gap-2">
                      {editingMenuId ? (
                        <button onClick={handleSaveMenu} className="rounded-2xl bg-emerald-500 px-4 py-2">저장</button>
                      ) : (
                        <button onClick={handleAddMenu} className="rounded-2xl bg-emerald-500 px-4 py-2">추가</button>
                      )}
                      <button onClick={() => { setMenuForm({ menuName: '', price: 0, order: managementMenus.length + 1, soldOutYn: false }); setEditingMenuId(null); }} className="rounded-2xl bg-slate-700 px-4 py-2">취소</button>
                    </div>
                  </div>
                </div>
              </div>
              {copyMessage ? <p className="text-sm text-emerald-300">{copyMessage}</p> : null}
              {statusMessage ? <p className="text-sm text-emerald-300">{statusMessage}</p> : null}
            </div>
          )}
        </article>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-black/10">
            <h2 className="text-xl font-semibold text-white">관리자 주문 목록</h2>
            <p className="mt-2 text-sm text-slate-400">현재 주문서에 등록된 주문을 확인하세요.</p>
            {activeItems.length === 0 ? (
              <p className="mt-4 text-slate-400">주문 항목이 아직 없습니다.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {activeItems.map((item) => (
                  <div key={item.id} className="rounded-3xl border border-white/5 bg-slate-950 p-4">
                    <p className="font-semibold text-white">{item.userName}</p>
                    <p className="mt-1 text-sm text-slate-400">{item.cafeFloor} · {item.menuName} · {item.quantity}개 · {formatCurrency(item.totalPrice)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-black/10">
            <h2 className="text-xl font-semibold text-white">주문서 히스토리</h2>
            {data.orderSheets.length === 0 ? (
              <p className="mt-4 text-slate-400">생성된 주문서가 없습니다.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {data.orderSheets.map((sheet) => (
                  <button
                    key={sheet.id}
                    type="button"
                    onClick={() => setData((prev) => ({ ...prev, activeOrderSheetId: sheet.id }))}
                    className={`w-full rounded-3xl border px-4 py-4 text-left transition ${sheet.id === activeSheet?.id ? 'border-violet-400 bg-slate-800' : 'border-white/10 bg-slate-950/70 hover:bg-slate-900'}`}
                  >
                    <p className="font-semibold text-white">{sheet.title}</p>
                    <p className="mt-1 text-sm text-slate-400">{sheet.status === 'OPEN' ? '취합중' : '취합완료'} · {new Date(sheet.createdAt).toLocaleDateString()}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}
