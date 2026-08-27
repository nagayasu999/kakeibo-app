/**
 * 画像ファイルを縮小して base64 に変換する。
 * レシート写真はそのままだと数MBになりAPIの上限に触れるため、
 * 長辺 1600px・JPEG品質0.85 まで落としてから送信する。
 *
 * @param {File} file 入力画像ファイル
 * @param {number} maxSize 長辺の最大ピクセル数
 * @returns {Promise<{base64: string, mediaType: string, dataUrl: string}>}
 */
export async function fileToResizedBase64(file, maxSize = 1600) {
  const dataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(dataUrl);

  // 縮小が不要なほど小さい場合はそのまま使う
  const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
  const width = Math.round(image.width * scale);
  const height = Math.round(image.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0, width, height);

  const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
  return {
    base64: resizedDataUrl.split(',')[1],
    mediaType: 'image/jpeg',
    dataUrl: resizedDataUrl,
  };
}

/** File を data URL として読み込む */
function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('画像の読み込みに失敗しました。'));
    reader.readAsDataURL(file);
  });
}

/** data URL から Image オブジェクトを生成する */
function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('画像を解析できませんでした。'));
    image.src = dataUrl;
  });
}
