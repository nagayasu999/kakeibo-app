import { useRef, useState } from 'react';
import { fileToResizedBase64 } from '../utils/image.js';
import { CATEGORIES } from '../utils/categories.js';
import { formatYen } from '../utils/format.js';

/** 受け付ける画像形式 */
const ACCEPTED = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

/**
 * レシート画像のアップロードと解析結果の確認・修正を行うカード。
 * @param {{ onRegister: (receipt: object) => void }} props
 */
export default function ReceiptUploader({ onRegister }) {
  const fileInputRef = useRef(null);
  const [imageDataUrl, setImageDataUrl] = useState('');   // プレビュー用
  const [payload, setPayload] = useState(null);           // 送信用のbase64データ
  const [draft, setDraft] = useState(null);               // 解析結果（登録前に編集可能）
  const [status, setStatus] = useState('idle');           // idle | analyzing | done
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  /** ファイル選択・ドロップ共通の処理 */
  async function handleFile(file) {
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      setError('JPEG / PNG / GIF / WebP の画像を選択してください。');
      return;
    }

    setError('');
    setMessage('');
    setDraft(null);
    try {
      // 送信前に縮小してAPIの上限とアップロード時間を抑える
      const resized = await fileToResizedBase64(file);
      setImageDataUrl(resized.dataUrl);
      setPayload({ imageBase64: resized.base64, mediaType: resized.mediaType });
      setStatus('idle');
    } catch (err) {
      setError(err.message);
    }
  }

  /** バックエンドにレシート解析をリクエストする */
  async function analyze() {
    if (!payload) return;
    setStatus('analyzing');
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/analyze-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '解析に失敗しました。');
      }

      setDraft(result);
      setStatus('done');
    } catch (err) {
      setError(err.message);
      setStatus('idle');
    }
  }

  /** 明細1行を書き換える */
  function updateItem(index, key, value) {
    setDraft((current) => {
      const items = current.items.map((item, i) =>
        i === index ? { ...item, [key]: key === 'price' ? Number(value) || 0 : value } : item,
      );
      return { ...current, items };
    });
  }

  /** 明細1行を削除する */
  function removeItem(index) {
    setDraft((current) => ({
      ...current,
      items: current.items.filter((_, i) => i !== index),
    }));
  }

  /** 家計簿に登録して入力状態をリセットする */
  function register() {
    const items = draft.items.filter((item) => item.price > 0);
    if (items.length === 0) {
      setError('登録できる明細がありません。');
      return;
    }

    onRegister({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date: draft.date,
      store: draft.store,
      items,
      total: items.reduce((sum, item) => sum + item.price, 0),
      createdAt: new Date().toISOString(),
    });

    reset();
    setMessage('家計簿に登録しました。');
  }

  /** 入力内容をすべてクリアする */
  function reset() {
    setImageDataUrl('');
    setPayload(null);
    setDraft(null);
    setStatus('idle');
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const draftTotal = draft ? draft.items.reduce((sum, item) => sum + item.price, 0) : 0;

  return (
    <section className="card">
      <h2>レシートを読み取る</h2>
      <p className="card-subtitle">
        画像を選ぶと Claude が商品名・金額・日付を抽出し、カテゴリを自動で分類します。
      </p>

      {!imageDataUrl ? (
        <div
          className={`dropzone${isDragging ? ' is-dragging' : ''}`}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            handleFile(event.dataTransfer.files?.[0]);
          }}
        >
          <p>ここに画像をドラッグ＆ドロップ、または</p>
          <button type="button" className="button" onClick={() => fileInputRef.current?.click()}>
            レシート画像を選択
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) => handleFile(event.target.files?.[0])}
          />
        </div>
      ) : (
        <div className="preview">
          <img src={imageDataUrl} alt="選択したレシート" />

          <div className="preview-body">
            {!draft ? (
              <>
                <p className="hint">画像を確認して「読み取る」を押してください。</p>
                <div className="button-row">
                  <button
                    type="button"
                    className="button"
                    onClick={analyze}
                    disabled={status === 'analyzing'}
                  >
                    読み取る
                  </button>
                  <button type="button" className="button secondary" onClick={reset}>
                    選び直す
                  </button>
                  {status === 'analyzing' && (
                    <span className="loading">
                      <span className="spinner" aria-hidden="true" />
                      解析中…
                    </span>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="field-row">
                  <label className="field">
                    購入日
                    <input
                      type="date"
                      value={draft.date}
                      onChange={(event) =>
                        setDraft({ ...draft, date: event.target.value })
                      }
                    />
                  </label>
                  <label className="field">
                    店舗名
                    <input
                      type="text"
                      value={draft.store}
                      placeholder="店舗名"
                      onChange={(event) =>
                        setDraft({ ...draft, store: event.target.value })
                      }
                    />
                  </label>
                </div>

                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>商品名</th>
                        <th>カテゴリ</th>
                        <th className="num">金額</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {draft.items.map((item, index) => (
                        <tr key={index}>
                          <td>
                            <input
                              type="text"
                              value={item.name}
                              onChange={(event) => updateItem(index, 'name', event.target.value)}
                            />
                          </td>
                          <td>
                            <select
                              value={item.category}
                              onChange={(event) =>
                                updateItem(index, 'category', event.target.value)
                              }
                            >
                              {CATEGORIES.map((category) => (
                                <option key={category} value={category}>
                                  {category}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="num">
                            <input
                              type="number"
                              value={item.price}
                              min="0"
                              onChange={(event) => updateItem(index, 'price', event.target.value)}
                            />
                          </td>
                          <td>
                            <button
                              type="button"
                              className="icon-button"
                              title="この行を削除"
                              onClick={() => removeItem(index)}
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={2}>合計</td>
                        <td className="num">{formatYen(draftTotal)}</td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="button-row">
                  <button type="button" className="button" onClick={register}>
                    家計簿に登録
                  </button>
                  <button type="button" className="button secondary" onClick={reset}>
                    破棄する
                  </button>
                  <span className="hint">読み取り結果はその場で修正できます。</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {error && <div className="alert error">{error}</div>}
      {message && <div className="alert success">{message}</div>}
    </section>
  );
}
