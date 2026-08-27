import { useEffect, useMemo, useState } from 'react';
import ReceiptUploader from './components/ReceiptUploader.jsx';
import SummaryCards from './components/SummaryCards.jsx';
import CategoryPieChart from './components/CategoryPieChart.jsx';
import MonthlyBarChart from './components/MonthlyBarChart.jsx';
import CategorySummaryTable from './components/CategorySummaryTable.jsx';
import ExpenseTable from './components/ExpenseTable.jsx';
import { loadReceipts, saveReceipts } from './utils/storage.js';
import { useTheme } from './utils/theme.js';
import { CATEGORIES } from './utils/categories.js';
import { toYearMonth, formatMonth } from './utils/format.js';

export default function App() {
  const { theme, toggleTheme } = useTheme();

  // 初期表示時に localStorage から復元する
  const [receipts, setReceipts] = useState(() => loadReceipts());
  // 表示対象の月（空文字なら全期間）
  const [selectedMonth, setSelectedMonth] = useState('');

  // レシートが変わるたびに localStorage へ保存する
  useEffect(() => {
    saveReceipts(receipts);
  }, [receipts]);

  /** レシートを追加する（新しい日付が上に来るよう並べ替える） */
  function addReceipt(receipt) {
    setReceipts((current) =>
      [receipt, ...current].sort((a, b) => (a.date < b.date ? 1 : -1)),
    );
  }

  /** レシートを削除する */
  function deleteReceipt(id) {
    if (!window.confirm('このレシートを削除しますか？')) return;
    setReceipts((current) => current.filter((receipt) => receipt.id !== id));
  }

  /** すべてのデータを削除する */
  function clearAll() {
    if (!window.confirm('登録済みのデータをすべて削除します。よろしいですか？')) return;
    setReceipts([]);
    setSelectedMonth('');
  }

  // 明細を1行ずつに展開したもの（一覧表示・集計の元データ）
  const allRows = useMemo(
    () =>
      receipts.flatMap((receipt) =>
        receipt.items.map((item, index) => ({
          key: `${receipt.id}-${index}`,
          receiptId: receipt.id,
          date: receipt.date,
          store: receipt.store,
          name: item.name,
          price: item.price,
          category: item.category,
        })),
      ),
    [receipts],
  );

  // データに存在する月の一覧（新しい順）
  const months = useMemo(() => {
    const set = new Set(receipts.map((receipt) => toYearMonth(receipt.date)));
    return [...set].sort().reverse();
  }, [receipts]);

  // 選択中の月で絞り込んだ明細
  const filteredRows = useMemo(
    () =>
      selectedMonth
        ? allRows.filter((row) => toYearMonth(row.date) === selectedMonth)
        : allRows,
    [allRows, selectedMonth],
  );

  // カテゴリ別集計（カテゴリの並び順は固定し、色の割り当てをぶらさない）
  const categoryTotals = useMemo(() => {
    const totals = new Map(CATEGORIES.map((category) => [category, { amount: 0, count: 0 }]));
    filteredRows.forEach((row) => {
      const entry = totals.get(row.category) ?? totals.get('その他');
      entry.amount += row.price;
      entry.count += 1;
    });
    return CATEGORIES.map((category) => ({ category, ...totals.get(category) })).filter(
      (row) => row.amount > 0,
    );
  }, [filteredRows]);

  // 月別集計（古い順に並べる）
  const monthlyTotals = useMemo(() => {
    const totals = new Map();
    allRows.forEach((row) => {
      const month = toYearMonth(row.date);
      totals.set(month, (totals.get(month) ?? 0) + row.price);
    });
    return [...totals.entries()]
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([month, amount]) => ({ month, amount }));
  }, [allRows]);

  const periodTotal = filteredRows.reduce((sum, row) => sum + row.price, 0);
  const allTimeTotal = allRows.reduce((sum, row) => sum + row.price, 0);
  const periodLabel = selectedMonth ? formatMonth(selectedMonth) : '全期間';

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>レシート家計簿</h1>
          <p>レシート画像から自動で家計簿をつける · データはこの端末に保存されます</p>
        </div>
        <button type="button" className="theme-toggle" onClick={toggleTheme}>
          {theme === 'dark' ? '☀ ライトモード' : '☾ ダークモード'}
        </button>
      </header>

      <ReceiptUploader onRegister={addReceipt} receipts={receipts} />

      <SummaryCards
        periodLabel={periodLabel}
        periodTotal={periodTotal}
        allTimeTotal={allTimeTotal}
        receiptCount={receipts.length}
        itemCount={filteredRows.length}
      />

      {/* 絞り込みはグラフ・一覧の上に1列でまとめる */}
      <div className="toolbar">
        <label htmlFor="month-filter">表示期間</label>
        <select
          id="month-filter"
          value={selectedMonth}
          onChange={(event) => setSelectedMonth(event.target.value)}
        >
          <option value="">全期間</option>
          {months.map((month) => (
            <option key={month} value={month}>
              {formatMonth(month)}
            </option>
          ))}
        </select>
        <span className="spacer" />
        {receipts.length > 0 && (
          <button type="button" className="button danger" onClick={clearAll}>
            すべて削除
          </button>
        )}
      </div>

      <div className="grid-2">
        <section className="card">
          <h2>カテゴリ別の内訳</h2>
          <p className="card-subtitle">{periodLabel}</p>
          <CategoryPieChart data={categoryTotals} theme={theme} />
        </section>

        <section className="card">
          <h2>月別の支出</h2>
          <p className="card-subtitle">棒をクリックするとその月だけを表示します</p>
          <MonthlyBarChart
            data={monthlyTotals}
            theme={theme}
            selectedMonth={selectedMonth}
            onSelectMonth={setSelectedMonth}
          />
        </section>
      </div>

      <section className="card">
        <h2>カテゴリ別集計</h2>
        <p className="card-subtitle">{periodLabel}の内訳（円グラフの数値表）</p>
        <CategorySummaryTable data={categoryTotals} theme={theme} />
      </section>

      <section className="card">
        <h2>明細一覧</h2>
        <p className="card-subtitle">{periodLabel}に登録された商品</p>
        <ExpenseTable rows={filteredRows} theme={theme} onDeleteReceipt={deleteReceipt} />
      </section>
    </div>
  );
}
