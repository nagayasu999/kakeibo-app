import { useCallback, useEffect, useState } from 'react';

const THEME_KEY = 'kakeibo-app:theme';

/** OS のカラースキーム設定を読む */
function systemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** 保存済みのテーマ設定（未設定なら null） */
function storedTheme() {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

/**
 * ライト／ダークテーマを管理するフック。
 * ユーザーが明示的に切り替えた場合はその設定を優先し、
 * 未設定ならOSの設定に追従する。
 */
export function useTheme() {
  const [theme, setTheme] = useState(() => storedTheme() ?? systemTheme());

  // <html data-theme="..."> を更新して CSS 側に反映する
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // 明示設定がない間はOSの切り替えに追従する
  useEffect(() => {
    if (storedTheme()) return undefined;
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (event) => setTheme(event.matches ? 'dark' : 'light');
    query.addEventListener('change', handler);
    return () => query.removeEventListener('change', handler);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch {
        // 保存できなくてもテーマ切り替え自体は動作させる
      }
      return next;
    });
  }, []);

  return { theme, toggleTheme };
}

/**
 * CSS カスタムプロパティの現在値を取得する。
 * グラフの色をCSSトークン（styles.css）と一元管理するために使う。
 * @param {string} name 例: '--text-muted'
 */
export function readToken(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
