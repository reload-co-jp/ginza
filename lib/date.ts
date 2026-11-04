const JST_OFFSET_MS = 9 * 60 * 60 * 1000

/**
 * ビルド時点の日本時間の日付（YYYY-MM-DD）。
 * 静的サイトなので「今日」はビルド日になる。デプロイは毎日再ビルドする。
 * `GINZA_TODAY` で日付を固定できる（テスト・検証用）。
 */
export const getToday = (now = new Date()): string => {
  const override = process.env.GINZA_TODAY
  if (override && /^\d{4}-\d{2}-\d{2}$/.test(override)) return override
  return new Date(now.getTime() + JST_OFFSET_MS).toISOString().slice(0, 10)
}

export const addDays = (date: string, days: number): string => {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"]

export const getWeekday = (date: string): string =>
  WEEKDAYS[new Date(`${date}T00:00:00Z`).getUTCDay()]

/** 2026-11-04 → 11月4日（水） */
export const formatJaDate = (date: string, withYear = false): string => {
  const [y, m, d] = date.split("-").map(Number)
  const head = withYear ? `${y}年${m}月${d}日` : `${m}月${d}日`
  return `${head}（${getWeekday(date)}）`
}

/** 2026-11-04 → 2026.11.04 */
export const formatDotDate = (date: string): string => date.replace(/-/g, ".")

/** イベント期間の表示。年をまたぐときだけ終了日に年を付ける。 */
export const formatDateRange = (start: string, end: string): string => {
  if (start === end) return formatJaDate(start, true)
  const sameYear = start.slice(0, 4) === end.slice(0, 4)
  return `${formatJaDate(start, true)} 〜 ${formatJaDate(end, !sameYear)}`
}

/**
 * 「今週末」= 次の土日。今日が土曜ならその土日、日曜なら当日のみを含む前日の土曜から。
 */
export const getWeekendRange = (
  today: string
): { start: string; end: string } => {
  const day = new Date(`${today}T00:00:00Z`).getUTCDay()
  const satOffset = day === 0 ? -1 : 6 - day
  const start = addDays(today, satOffset)
  return { start, end: addDays(start, 1) }
}

export const daysBetween = (from: string, to: string): number =>
  Math.round(
    (new Date(`${to}T00:00:00Z`).getTime() -
      new Date(`${from}T00:00:00Z`).getTime()) /
      (24 * 60 * 60 * 1000)
  )
