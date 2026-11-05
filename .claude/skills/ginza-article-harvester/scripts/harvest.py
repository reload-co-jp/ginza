#!/usr/bin/env python3
"""
Ginza Now article harvester helper (ported from the Akiba Live harvester).

Why this exists: WebFetch in this environment gets redirected/throttled by the
context-mode MCP plugin, and naive regex against listing pages breaks silently
(wrong href shape, title hidden in nested tags, stale dates). This script bakes
in the fixes found the hard way so each harvest run doesn't re-derive them.

Usage:
  python3 harvest.py list <source|all>      # candidate (title, url) pairs
                                             # auto-skips rows whose URL already
                                             # matches an existing article's
                                             # sources[]/image.sourceUrl, or a
                                             # previously-logged excluded URL —
                                             # counts show up in the header, e.g.
                                             # "(12 shown / 40 total, 20
                                             # already-in-articles.json skipped,
                                             # 8 previously-excluded skipped)".
                                             # Pass --all to disable this and see
                                             # every raw row (gnews/ceek URLs wrap
                                             # a fresh Google News redirect token
                                             # per crawl, so this filter rarely
                                             # catches anything there — see
                                             # SKILL.md's gnews redirect note).
  python3 harvest.py scan [out.json]         # list all -> dedup -> detail for NEW,
                                             # writes tmp/harvest-queue.json
  python3 harvest.py image "<img-url>" "<slug>"
                                             # save to public/images/articles/<slug>.<ext>;
                                             # refuses if slug/image already exists
  python3 harvest.py detail <url>           # TITLE/OGIMG/OGDESC/FACTS for one page
  python3 harvest.py dedup "<kw1>" "<kw2>"   # check candidates against existing data + excluded log
  python3 harvest.py exclude "<url>" "<reason>" "<note>"
                                             # log a held/rejected candidate so future
                                             # dedup runs skip re-researching it. reason is a
                                             # short tag: out_of_scope_area, event_ended,
                                             # not_ginza_specific, insufficient_facts, low_value

Run with output redirected to a file and read the file back, e.g.:
  python3 harvest.py list all > /tmp/harvest_out.txt 2>&1
Then use the Read tool on /tmp/harvest_out.txt. A PreToolUse hook in this
environment prepends a directory listing to raw Bash stdout; redirecting to a
file and reading it back is the only reliable way to avoid that noise.
"""
import html
import json
import re
import socket
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from html.parser import HTMLParser
from pathlib import Path

UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
REPO_ROOT = Path(__file__).resolve().parents[4]
ARTICLES_JSON = REPO_ROOT / "data" / "articles.json"
IMAGES_DIR = REPO_ROOT / "public" / "images" / "articles"
EXCLUDED_JSONL = Path(__file__).resolve().parent.parent / "references" / "excluded-candidates.jsonl"


def load_excluded():
    """Load previously-held/rejected candidate URLs so dedup runs don't
    re-research the same non-article every harvest pass. Keyed by normalized
    URL; last entry for a given URL wins if it was logged more than once."""
    if not EXCLUDED_JSONL.exists():
        return {}
    out = {}
    for line in EXCLUDED_JSONL.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            rec = json.loads(line)
        except json.JSONDecodeError:
            continue
        norm = normalize_source_url(rec.get("url", ""))
        if norm:
            out[norm] = rec
    return out


def cmd_exclude(args):
    """Append one held/rejected candidate to the excluded-candidates log.
    Usage: python3 harvest.py exclude "<url>" "<reason>" "<note>"
    reason is a short machine-friendly tag, e.g. out_of_scope_area,
    event_ended, not_ginza_specific, insufficient_facts, low_value."""
    if len(args) < 2:
        print('Usage: python3 harvest.py exclude "<url>" "<reason>" ["<note>"]')
        return
    url = args[0]
    reason = args[1]
    note = args[2] if len(args) > 2 else ""
    rec = {
        "url": url,
        "reason": reason,
        "note": note,
        "checked": time.strftime("%Y-%m-%d"),
    }
    EXCLUDED_JSONL.parent.mkdir(parents=True, exist_ok=True)
    with EXCLUDED_JSONL.open("a", encoding="utf-8") as f:
        f.write(json.dumps(rec, ensure_ascii=False) + "\n")
    print(f"Logged excluded candidate: {url} ({reason})")


def is_transient_network_error(exc):
    # HTTPError subclasses URLError: retry rate-limit/server errors only. 404s
    # and Cloudflare 403s (kotobukiya, amiami) never recover on retry.
    if isinstance(exc, urllib.error.HTTPError):
        return exc.code == 429 or exc.code >= 500
    if isinstance(exc, (socket.gaierror, TimeoutError, urllib.error.URLError)):
        return True
    msg = str(exc).lower()
    return any(
        marker in msg
        for marker in [
            "temporary failure in name resolution",
            "nodename nor servname provided",
            "name or service not known",
            "timed out",
            "network is unreachable",
        ]
    )


def fetch(url, timeout=20, retries=3, retry_delay=2):
    req = urllib.request.Request(url, headers=UA)
    last_error = None
    for attempt in range(1, retries + 1):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return r.read().decode(r.headers.get_content_charset() or "utf-8", errors="ignore")
        except Exception as exc:
            last_error = exc
            if attempt >= retries or not is_transient_network_error(exc):
                break
            print(
                f"FETCH RETRY {attempt}/{retries}: {url} ({type(exc).__name__}: {exc})",
                file=sys.stderr,
            )
            time.sleep(retry_delay * attempt)
    print(
        "FETCH FAILED after retries. If this is DNS/network sandboxing, rerun the same "
        f"harvest.py command with escalated network permissions. URL: {url}",
        file=sys.stderr,
    )
    raise last_error


def dec(s):
    return html.unescape(s)


def trunc(s, n):
    s = s.strip()
    return s[:n] + "..." if len(s) > n else s


class LinkExtractor(HTMLParser):
    """Collects (href, text-or-title-attr) for <a> tags matching href_filter."""

    def __init__(self, href_filter):
        super().__init__()
        self.href_filter = href_filter
        self.items = []
        self.cur_href = None
        self.cur_text = []
        self.cur_has_title_attr = False
        self.depth = 0

    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        if tag == "a":
            href = d.get("href", "")
            if self.href_filter(href):
                self.cur_href = href
                # many sites (shosen) put the real title in title="", not inner text
                self.cur_has_title_attr = bool(d.get("title"))
                self.cur_text = [d["title"]] if self.cur_has_title_attr else []
                self.depth = 1
            elif self.cur_href is not None:
                self.depth += 1
        elif tag == "img" and self.cur_href is not None:
            alt = d.get("alt")
            if alt:
                self.cur_text.append(alt)

    def handle_endtag(self, tag):
        if tag == "a" and self.cur_href is not None:
            self.depth -= 1
            if self.depth <= 0:
                text = " ".join(t.strip() for t in self.cur_text if t.strip())
                self.items.append((self.cur_href, text))
                self.cur_href = None
                self.cur_has_title_attr = False

    def handle_data(self, data):
        if self.cur_href is not None and not self.cur_has_title_attr:
            t = data.strip()
            if t:
                self.cur_text.append(t)


def extract(url, href_filter, base=""):
    text = fetch(url)
    p = LinkExtractor(href_filter)
    p.feed(text)
    out_by_url = {}
    for href, t in p.items:
        full = href if href.startswith("http") else base + href
        title = dec(t)
        # Cards often have several anchors to the same URL (image with a
        # category label, then the real title). Keep the longest text.
        if full not in out_by_url or len(title) > len(out_by_url[full]):
            out_by_url[full] = title
    return [(t, href) for href, t in out_by_url.items()]


# --- per-source extraction -------------------------------------------------
# Gotchas found while building the Ginza source list (2026-11):
#   - ginza.jp (GINZA OFFICIAL) links are absolute. Event pages are
#     /event/{id}; shop news (Matsuya, galleries, ...) are /shopnews/{shop}/{id}.
#     Matsuya Ginza's own event page (matsuyaginza.com) is client-rendered, so
#     its events are picked up here via shopnews instead.
#   - GINZA SIX: the plain /news/ list mixes notices; use the events and
#     the-pop-up category lists. Detail pages are /news/detail/shopnews/{id}.
#   - enjoytokyo area1304 is "銀座" but includes 丸の内/日比谷/Tokyo-wide
#     events. Paged as /area1304/2/ ... ; verify the venue on the detail page.
#   - collabo-cafe /events/tag/ginza/ returns ~80 links, most of them sidebar
#     items for other cities. area_filter keeps only rows whose title/URL
#     mention a Ginza-area keyword.
#   - tsukiji.or.jp /event/ keeps years-old posts (/event/2020/03/...). Rows
#     from before the current year are dropped.
#   - Client-rendered (no links in plain HTML, not scriptable here):
#     matsuyaginza.com, kabuki-bito.jp play list, gallery.shiseido.com,
#     0101.co.jp (有楽町マルイ), po-holdings.co.jp m-annex. Use WebSearch
#     (site:...) for those — see references/source-list.md.
#   - Bot-blocked (403): mistore.jp (銀座三越), hermes.com, store.tsite.jp.

AREA_RE = re.compile(
    r"銀座|ギンザ|GINZA|Ginza|ginza|有楽町|YURAKUCHO|Yurakucho|yurakucho|日比谷|HIBIYA|Hibiya|hibiya"
    r"|築地|tsukiji|京橋|kyobashi|東銀座|歌舞伎座|kabukiza|数寄屋橋|新橋演舞場|東京国際フォーラム"
)

SOURCES = {
    "ginza_official": dict(
        url="https://www.ginza.jp/event",
        href_filter=lambda h: bool(re.search(r"ginza\.jp/(event/\d+|shopnews/[^/]+/\d+)/?$", h or "")),
        base="",
    ),
    # 中央区観光協会: whole ward (日本橋/月島 too). Card text carries area tags
    # (銀座エリア/築地エリア), so area_filter keeps only Ginza-side events.
    "chuo_kanko": dict(
        url="https://www.chuo-kanko.or.jp/blogs/event",
        href_filter=lambda h: bool(re.search(r"^/blogs/event/\d+$", h or "")),
        base="https://www.chuo-kanko.or.jp",
        area_filter=True,
    ),
    "ginza6_events": dict(
        url="https://ginza6.tokyo/news/news_category/events",
        href_filter=lambda h: bool(re.search(r"^/news/detail/shopnews/\d+$", h or "")),
        base="https://ginza6.tokyo",
    ),
    "ginza6_popup": dict(
        url="https://ginza6.tokyo/news/news_category/the-pop-up",
        href_filter=lambda h: bool(re.search(r"^/news/detail/shopnews/\d+$", h or "")),
        base="https://ginza6.tokyo",
    ),
    "hibiya_midtown": dict(
        url="https://www.hibiya.tokyo-midtown.com/jp/event/",
        href_filter=lambda h: bool(re.search(r"^/jp/event/\d+/$", h or "")),
        base="https://www.hibiya.tokyo-midtown.com",
    ),
    "lumine_yurakucho": dict(
        url="https://www.lumine.ne.jp/yurakucho/",
        href_filter=lambda h: bool(re.search(r"^/yurakucho/(news|topics)/detail/\?cd=", h or "")),
        base="https://www.lumine.ne.jp",
    ),
    "tif": dict(
        url="https://www.t-i-forum.co.jp/visitors/event/",
        href_filter=lambda h: bool(re.search(r"^detail\.html\?id=", h or "")),
        base="https://www.t-i-forum.co.jp/visitors/event/",
    ),
    "ggg": dict(
        url="https://www.dnpfcp.jp/CGI/gallery/schedule/list.cgi?l=1&t=1",
        href_filter=lambda h: "schedule/detail.cgi" in (h or ""),
        base="https://www.dnpfcp.jp",
    ),
    "tsukiji": dict(
        url="https://www.tsukiji.or.jp/event/",
        href_filter=lambda h: bool(re.search(r"tsukiji\.or\.jp/event/(\d{4})/\d{2}/p\d+/?$", h or ""))
        and int(re.search(r"/event/(\d{4})/", h).group(1)) >= int(time.strftime("%Y")),
        base="",
    ),
    "prtimes": dict(
        url="https://prtimes.jp/topics/keywords/%E9%8A%80%E5%BA%A7",
        href_filter=lambda h: bool(re.match(r"^/main/html/rd/p/", h or "")),
        base="https://prtimes.jp",
    ),
    "collabocafe": dict(
        url="https://collabo-cafe.com/events/tag/ginza/",
        href_filter=lambda h: "/events/collabo/" in (h or ""),
        base="",
        area_filter=True,
    ),
}

# enjoytokyo is paged; each page has ~15 events.
ENJOYTOKYO_PAGES = 5


def list_enjoytokyo():
    rows, seen = [], set()
    for page in range(1, ENJOYTOKYO_PAGES + 1):
        url = "https://www.enjoytokyo.jp/event/list/area1304/" + ("" if page == 1 else f"{page}/")
        try:
            items = extract(url, lambda h: bool(re.search(r"enjoytokyo\.jp/event/\d{6,7}/$", h or "")))
        except Exception:
            if page == 1:
                raise
            break
        for t, href in items:
            if href not in seen:
                seen.add(href)
                rows.append((None, t, href))
    return rows


CRIME_NOISE_RE = re.compile(r"逮捕|容疑|殺人予備|通り魔|無差別殺傷|殺傷事件|強盗|窃盗")
# Shopping streets elsewhere named "◯◯銀座" match a 銀座 search but are out of
# scope. Only drop rows that never mention the real Ginza otherwise.
OTHER_GINZA_RE = re.compile(
    r"(戸越|十条|砂町|谷中|武蔵小山|高円寺|中延|三ノ輪|ジョイフル三ノ輪|吉祥寺|蒲田|大山|北千住|鳩ヶ谷|熱海|大須)銀座"
)


def noise_reason(title):
    """Collapse obviously-out-of-scope rows to a count instead of printing them.
    gnews/ceek for 銀座 pull in crime reports (銀座の宝飾店強盗 etc.) that have no
    visitor-facing angle. Keep this conservative."""
    if CRIME_NOISE_RE.search(title):
        return "crime"
    if OTHER_GINZA_RE.search(title) and "銀座" not in OTHER_GINZA_RE.sub("", title):
        return "other-ginza"
    return None


def normalize_news_title(title):
    """Collapse '<same story> - Outlet A' / '<same story> - Outlet B' into one
    grouping key so syndicated reposts (common on gnews/ceek) count once."""
    t = re.sub(r"\s*[\|\-–—]\s*[^\|\-–—]{1,30}$", "", title).strip()
    t = re.sub(r"\s+", "", t)
    t = re.sub(r"[「」『』（）()]", "", t)
    return t


def strip_fragment(url):
    return url.split("#")[0]


def print_items(name, rows, limit, skip_known=True):
    """rows: iterable of (extra_or_None, title, url). Applies noise filtering
    (see noise_reason) and duplicate-title grouping (see normalize_news_title)
    before printing, so callers reading the redirected output file don't pay
    for reading past dozens of reposts of the same story or routine PC-parts
    sale posts that SKILL.md excludes anyway.

    When skip_known is True (the default), also drops any row whose URL
    (normalized) exactly matches an existing article's sources[].url/
    image.sourceUrl, or a previously-logged excluded-candidates.jsonl entry.
    This is a repeat-pass optimization: primary/aggregator sources
    (collabocafe, kotobukiya, gamers, atre, shosen, animate, ...) reuse the
    same stable URL for an event page across harvest runs, so once an item
    has been written or explicitly held/rejected, re-listing it every pass
    was pure waste. gnews/ceek URLs wrap a fresh Google News redirect token
    per crawl and so rarely match here — pass --all to see everything
    unfiltered (e.g. when checking whether this filter itself is hiding
    something it shouldn't)."""
    kept, total, suffix = filter_rows(rows, skip_known)
    print(f"\n=== {name} ({len(kept)} shown / {total} total{suffix}) ===")
    for count, extra, title, url in kept[:limit]:
        dup = f" (x{count})" if count > 1 else ""
        prefix = f"{extra} | " if extra else ""
        print(f"{prefix}{trunc(title, 70)}{dup} | {url}")


def filter_rows(rows, skip_known=True):
    """Shared by print_items and scan: returns (kept [count, extra, title, url]
    entries, total row count, header suffix describing what was dropped)."""
    noise_counts = {}
    seen_keys = {}
    kept = []
    known_skipped = 0
    excluded_skipped = 0
    existing_urls = load_existing_source_urls() if skip_known else set()
    excluded = load_excluded() if skip_known else {}
    for extra, title, url in rows:
        reason = noise_reason(title)
        if reason:
            noise_counts[reason] = noise_counts.get(reason, 0) + 1
            continue
        clean_url = strip_fragment(url)
        if skip_known:
            norm = normalize_source_url(clean_url)
            if norm in existing_urls:
                known_skipped += 1
                continue
            if norm in excluded:
                excluded_skipped += 1
                continue
        key = normalize_news_title(title)
        if key in seen_keys:
            seen_keys[key][0] += 1
            continue
        entry = [1, extra, title, clean_url]
        seen_keys[key] = entry
        kept.append(entry)

    suffix = ""
    if noise_counts.get("crime"):
        suffix += f", {noise_counts['crime']} crime-noise filtered"
    if noise_counts.get("other-ginza"):
        suffix += f", {noise_counts['other-ginza']} other-銀座 (戸越銀座 etc.) filtered"
    if known_skipped:
        suffix += f", {known_skipped} already-in-articles.json skipped"
    if excluded_skipped:
        suffix += f", {excluded_skipped} previously-excluded skipped"
    return kept, len(rows), suffix


WALKER_LISTS = [
    "https://www.walkerplus.com/event_list/ar0313102/chuo/",  # 中央区（銀座・築地・京橋）
    "https://www.walkerplus.com/event_list/ar0313101/chiyoda/",  # 千代田区（有楽町・日比谷）
]


def list_walkerplus(max_pages=8):
    """WalkerPlus 中央区 + 千代田区 lists, filtered to Ginza-area cards.

    Each card spans several <a href="/event/ar0313eNNN/"> anchors (image, title,
    ...), so text is merged per URL before matching. Card text is
    title | status | dates | catch | 東京都 | 区 | venue | genre."""
    cards = {}
    for base in WALKER_LISTS:
        for page in range(1, max_pages + 1):
            url = base + ("" if page == 1 else f"{page}.html")
            try:
                text = fetch(url)
            except Exception:
                if page == 1:
                    raise
                break
            segs = re.split(r'(?=<a[^>]+href="/event/ar0313e\d+/")', text)[1:]
            if not segs:
                break
            for seg in segs:
                href = re.match(r'<a[^>]+href="(/event/ar0313e\d+/)"', seg).group(1)
                parts = [dec(t.strip()) for t in re.sub(r"<[^>]+>", "\n", seg).split("\n") if t.strip()]
                cards.setdefault(href, []).extend(p for p in parts[:15] if "googletag" not in p)
    rows = []
    for href, parts in cards.items():
        if not parts or not AREA_RE.search(" ".join(parts)):
            continue
        date = next((p for p in parts if re.search(r"\d{4}年\d{1,2}月", p)), "")
        ward = next((i for i, p in enumerate(parts) if p.endswith("区")), None)
        venue = parts[ward + 1] if ward is not None and ward + 1 < len(parts) else ""
        rows.append((date, f"{parts[0]} @ {venue}" if venue else parts[0], "https://www.walkerplus.com" + href))
    return rows


def list_source(name, limit=80, skip_known=True):
    print_items(name, source_rows(name), limit, skip_known=skip_known)


def source_rows(name):
    """Raw (extra_or_None, title, url) rows for one source, unfiltered."""
    if name == "gnews":
        text = fetch(
            "https://news.google.com/rss/search?q=%E9%8A%80%E5%BA%A7&hl=ja&gl=JP&ceid=JP:ja"
        )
        items = re.findall(r"<item>(.*?)</item>", text, re.S)
        rows = []
        for it in items:
            title = dec(re.search(r"<title>(.*?)</title>", it, re.S).group(1))
            link = re.search(r"<link>(.*?)</link>", it, re.S).group(1)
            pub = re.search(r"<pubDate>(.*?)</pubDate>", it, re.S)
            pub = pub.group(1)[:16] if pub else ""
            rows.append((pub, title, link))
        return rows
    if name == "ceek":
        items = extract(
            "https://news.ceek.jp/search.cgi?q=%E9%8A%80%E5%BA%A7",
            lambda h: h and h.startswith("http") and "ceek.jp" not in h,
        )
        # ceek's 銀座 search matches body text too; most rows are unrelated.
        rows = [(None, t, href) for t, href in items if AREA_RE.search(t)]
        return rows
    if name == "walkerplus":
        return list_walkerplus()
    if name == "enjoytokyo":
        return list_enjoytokyo()
    cfg = SOURCES[name]
    items = extract(cfg["url"], cfg["href_filter"], cfg["base"])
    if cfg.get("area_filter"):
        items = [(t, href) for t, href in items if AREA_RE.search(f"{t} {href}")]
    return [(None, t, href) for t, href in items]


ALL_SOURCES = list(SOURCES) + ["enjoytokyo", "walkerplus", "gnews", "ceek"]


def cmd_list(args):
    skip_known = "--all" not in args
    args = [a for a in args if a != "--all"]
    target = args[0] if args else "all"
    if target == "all":
        for name in ALL_SOURCES:
            try:
                list_source(name, skip_known=skip_known)
            except Exception as e:
                print(f"\n=== {name} ERROR: {e}")
    else:
        list_source(target, limit=200, skip_known=skip_known)


def cmd_detail(args):
    """Fetch one detail page and print TITLE/OGIMG/OGDESC/FACTS — use before
    writing any article to confirm venue, dates, price, reservation rules."""
    for url in args:
        try:
            d = detail_facts(url)
            print(f"\n=== {url} ===")
            print("TITLE:", d["title"])
            print("OGIMG:", d["ogimg"])
            print("OGDESC:", d["ogdesc"])
            print("FACTS:", " | ".join(d["facts"]))
            if d["warning"]:
                print("WARNING:", d["warning"])
        except Exception as e:
            print(f"\n=== {url} ERROR: {e}")


def detail_facts(url):
    text = fetch(url)
    title = re.search(r"<title>(.*?)</title>", text, re.S)
    ogimg = re.search(r'<meta property="og:image" content="([^"]+)"', text)
    ogdesc = re.search(r'<meta property="og:description" content="([^"]+)"', text)
    body = re.sub(r"<script[\s\S]*?</script>", " ", text)
    body = re.sub(r"<style[\s\S]*?</style>", " ", body)
    plain = dec(re.sub(r"<[^>]+>", "\n", body))
    lines = [l.strip() for l in plain.split("\n") if l.strip()]
    keep = [
        l
        for l in lines
        if re.search(r"\d{1,2}月\d{1,2}日|\d{4}年|期間|会期|会場|住所|店舗|価格|料金|円|予約|無料|有料|時間|開催", l)
    ]
    warning = ""
    if not AREA_RE.search(plain):
        warning = "page never mentions 銀座/有楽町/日比谷/築地/京橋 — confirm the venue is in the Ginza area before writing."
    return {
        "title": dec(title.group(1)).strip() if title else "",
        "ogimg": ogimg.group(1) if ogimg else "",
        "ogdesc": dec(ogdesc.group(1))[:300] if ogdesc else "",
        "facts": keep[:30],
        "warning": warning,
    }


GENERIC_SLUG_TOKENS = {
    "popup", "pop", "store", "shop", "shops", "ginza", "yurakucho", "hibiya", "tokyo", "japan",
    "event", "events", "collabo", "collaboration", "fair", "cafe", "campaign",
    "exhibition", "exhibit", "anime", "anniversary", "tour", "festival", "the",
}


def slug_tokens(url_or_slug):
    """Pull distinctive lowercase tokens out of a URL path or slug. Aggregator
    URLs (collabocafe, gamers, ...) already carry a romanized hint of the title
    — e.g. .../otagal-animal-butler-and-maid-popup-store-akihabara2026/ — which
    is the only practical way to cross-check a Japanese aggregator title against
    this repo's English article slugs without doing real translation."""
    s = re.sub(r"^https?://[^/]+", "", url_or_slug)
    s = re.sub(r"\.(html?|jpe?g|png|php.*)$", "", s)
    s = re.sub(r"\d+$", "", s)  # trailing year, e.g. ...2026
    parts = re.split(r"[/_\-?=&]+", s)
    out = []
    for p in parts:
        p = p.lower()
        if len(p) >= 4 and p.isalpha() and p not in GENERIC_SLUG_TOKENS:
            out.append(p)
    return out


TRACKING_QUERY_PREFIXES = ("utm_",)
TRACKING_QUERY_KEYS = {
    "fbclid", "gclid", "yclid", "mc_cid", "mc_eid", "igshid", "ref", "ref_src",
    "spm", "feature", "si",
}


def normalize_source_url(url):
    """Normalize source/reference URLs for duplicate detection. This keeps
    source identity stable while ignoring tracking noise."""
    if not url:
        return ""
    parsed = urllib.parse.urlsplit(url.strip())
    scheme = parsed.scheme.lower() or "https"
    netloc = parsed.netloc.lower()
    if netloc.startswith("www."):
        netloc = netloc[4:]
    path = re.sub(r"/+$", "", parsed.path) or "/"
    query_items = []
    for key, value in urllib.parse.parse_qsl(parsed.query, keep_blank_values=True):
        key_l = key.lower()
        if key_l in TRACKING_QUERY_KEYS or any(key_l.startswith(p) for p in TRACKING_QUERY_PREFIXES):
            continue
        query_items.append((key_l, value))
    query = urllib.parse.urlencode(sorted(query_items))
    return urllib.parse.urlunsplit((scheme, netloc, path, query, ""))


def load_existing_source_urls():
    """Normalized set of every sources[].url and image.sourceUrl already in
    articles.json. Used by list_source to auto-skip candidates that were
    already harvested under this exact URL, so a repeat pass over the same
    primary/aggregator sources doesn't re-surface hundreds of already-written
    items (collabocafe/kotobukiya/gamers/atre/etc. reuse stable URLs across
    passes; gnews/ceek do NOT because they wrap a fresh Google News redirect
    token each crawl, so this optimization mainly helps the non-news sources)."""
    if not ARTICLES_JSON.exists():
        return set()
    articles = json.loads(ARTICLES_JSON.read_text(encoding="utf-8"))
    urls = set()
    for a in articles:
        for src in a.get("sources", []) or []:
            norm = normalize_source_url(src.get("url", ""))
            if norm:
                urls.add(norm)
        img = a.get("image") or {}
        norm = normalize_source_url(img.get("sourceUrl", ""))
        if norm:
            urls.add(norm)
    return urls


def dedup_index():
    """Lookup tables for dedup_check. Candidates are checked against existing articles. Each candidate is either:
      - a Japanese keyword/title fragment -> substring-matched against
        title/summary/content (works when the aggregator's wording matches
        this repo's wording — often does NOT, since this repo tends to use
        formal/official titles while aggregators use colloquial ones), or
      - a source URL (collabocafe/gamers/atre/...) -> first checked exactly
        against existing sources[].url and image.sourceUrl after URL
        normalization, then its path tokens are cross-checked against existing
        slugs AND image filenames under public/images/articles/. This catches
        both direct source reuse and the common case where a candidate looks
        "new" by title-keyword search alone but was already harvested under
        different Japanese wording in a prior pass.
      - "keyword|url" to run both checks for one candidate at once.
    Token matches are a heuristic, not proof — always open the existing
    article and compare dates/venue before concluding it's a true duplicate.
    """
    articles = json.loads(ARTICLES_JSON.read_text(encoding="utf-8"))
    existing_slugs = [a["slug"] for a in articles]
    image_stems = [p.stem for p in IMAGES_DIR.glob("*")] if IMAGES_DIR.exists() else []
    slug_to_article = {a["slug"]: a for a in articles}
    source_url_index = {}
    for a in articles:
        for src in a.get("sources", []) or []:
            norm = normalize_source_url(src.get("url", ""))
            if norm:
                source_url_index.setdefault(norm, {})[a["slug"]] = a
        img = a.get("image") or {}
        norm = normalize_source_url(img.get("sourceUrl", ""))
        if norm:
            source_url_index.setdefault(norm, {})[a["slug"]] = a

    excluded = load_excluded()
    return articles, existing_slugs, image_stems, slug_to_article, source_url_index, excluded


KEYWORD_RE = re.compile(r"[「『【](.{2,30}?)[」』】]|([A-Za-z][A-Za-z0-9'&.\- ]{3,}[A-Za-z0-9])|([ァ-ヴー・]{4,})")


def title_keywords(title):
    """Short proper-noun-ish fragments of a long title: bracketed names,
    latin words, katakana runs. Full aggregator titles almost never substring-
    match this repo's reworded titles (the gnews blindspot), but their
    store/IP names do."""
    kws = []
    for m in KEYWORD_RE.finditer(title):
        k = next(g for g in m.groups() if g).strip()
        if k not in kws:
            kws.append(k)
    return kws


# Generic words that title_keywords() picks up but that say nothing about
# identity. With a small article set the max_body_hits guard below cannot
# learn these from frequency, so list them explicitly.
GENERIC_KEYWORDS = {
    "オープン", "イベント", "ポップアップ", "ポップアップストア", "カフェ", "コラボ", "コラボカフェ",
    "クリスマス", "イルミネーション", "キャンペーン", "フェア", "フェスティバル", "スタート",
    "ショップ", "ストア", "ギャラリー", "ミュージアム", "コレクション", "リニューアル",
    "tokyo", "ginza", "ginza six", "pop up", "pop up store", "popup", "event", "cafe",
    "collection", "christmas", "xmas", "new", "open", "store", "shop", "gallery",
}


def keyword_hits(title, articles, max_hits=5, max_body_hits=15):
    """Keywords that hit 1..max_hits article titles/slugs. A word that also
    shows up in many article bodies is generic (スタート, システム, ...) and
    is dropped as noise."""
    if len(title) < 15:
        return []
    out = []
    for k in title_keywords(title):
        kl = k.lower()
        if kl in GENERIC_KEYWORDS or re.fullmatch(r"[a-z ]*\d{4}", kl) or re.fullmatch(r"tokyo \d{4}", kl):
            continue
        if sum(kl in a.get("content", "").lower() for a in articles) > max_body_hits:
            continue
        hits = [a for a in articles if kl in a.get("title", "").lower() or kl in a.get("slug", "")]
        if 0 < len(hits) <= max_hits:
            out.append(f"  KEYWORD MATCH ({k}):")
            out += [f"    {a['slug']} | {a['title']} | {a['publishedAt']}" for a in hits]
    return out


def dedup_check(cand, idx):
    """Return match lines for one candidate; empty list = NEW."""
    articles, existing_slugs, image_stems, slug_to_article, source_url_index, excluded = idx
    out = []
    kw, _, url = cand.partition("|")

    excluded_target = url or (kw if kw.startswith("http") else "")
    if excluded_target:
        rec = excluded.get(normalize_source_url(excluded_target))
        if rec:
            out.append(f"  PREVIOUSLY EXCLUDED ({rec.get('reason', '?')}, checked {rec.get('checked', '?')}):")
            if rec.get("note"):
                out.append(f"    {rec['note']}")

    if kw and not kw.startswith("http"):
        text_hits = [
            (a["slug"], a["title"], a["publishedAt"])
            for a in articles
            if kw in a.get("title", "") or kw in a.get("summary", "") or kw in a.get("content", "")
        ]
        if text_hits:
            out.append(f"  TEXT MATCH ({len(text_hits)}):")
            for slug, title, pub in text_hits[:5]:
                out.append(f"    {slug} | {title} | {pub}")
        out += keyword_hits(kw, articles)
    elif kw.startswith("http"):
        url = kw  # only one arg given and it's a URL

    target_url = url or (kw if kw.startswith("http") else "")
    if target_url:
        norm_target = normalize_source_url(target_url)
        source_hits = list(source_url_index.get(norm_target, {}).values())
        if source_hits:
            out.append(f"  SOURCE URL MATCH ({norm_target}):")
            for a in source_hits[:5]:
                out.append(f"    {a['slug']} | {a['title']} | {a['publishedAt']}")

        toks = slug_tokens(target_url)
        hits = set()
        for slug in existing_slugs + image_stems:
            slug_l = slug.lower()
            matched = [t for t in toks if t in slug_l]
            if matched:
                hits.add(slug)
        if hits:
            out.append(f"  SLUG/IMAGE TOKEN MATCH (tokens={toks}):")
            for slug in sorted(hits)[:5]:
                a = slug_to_article.get(slug)
                if a:
                    out.append(f"    {slug} | {a['title']} | {a['publishedAt']}")
                else:
                    out.append(f"    {slug} (image file only, no matching article slug — check manually)")

    return out


def cmd_dedup(candidates):
    idx = dedup_index()
    for cand in candidates:
        print(f"\n=== {cand} ===")
        print("\n".join(dedup_check(cand, idx)) or "  NEW (no match found — still confirm facts before writing)")


def safe_detail(url):
    try:
        return detail_facts(url)
    except Exception as e:
        return {"error": str(e)}


def cmd_scan(args):
    """Mechanical part of a harvest pass in one go: list every source, dedup
    every kept row, fetch detail for NEW ones, write a JSON queue. Editorial
    calls (scope, merge, writing) stay with the human/agent reading the queue.
    gnews rows are left as needs_resolve: their redirect URLs can't be fetched
    and their dedup is unreliable (see SKILL.md gnews note)."""
    out_path = Path(args[0]) if args else REPO_ROOT / "tmp" / "harvest-queue.json"
    idx = dedup_index()
    names = ALL_SOURCES
    queue, errors = [], {}
    with ThreadPoolExecutor(8) as ex:
        futs = {name: ex.submit(source_rows, name) for name in names}
    for name, fut in futs.items():
        try:
            rows = fut.result()
        except Exception as e:
            errors[name] = str(e)
            continue
        for count, extra, title, url in filter_rows(rows)[0]:
            hits = [h.strip() for h in dedup_check(f"{title}|{url}", idx)]
            status = "maybe_dup" if hits else ("needs_resolve" if name == "gnews" else "new")
            queue.append({
                "source": name, "status": status, "title": title, "url": url,
                "date": extra or "", "syndicated": count, "matches": hits,
            })
    new = [c for c in queue if c["status"] == "new"]
    with ThreadPoolExecutor(8) as ex:
        for c, d in zip(new, ex.map(safe_detail, [c["url"] for c in new])):
            c["detail"] = d
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(
        json.dumps({"errors": errors, "candidates": queue}, ensure_ascii=False, indent=1),
        encoding="utf-8",
    )
    counts = {}
    for c in queue:
        counts[c["status"]] = counts.get(c["status"], 0) + 1
    print(f"wrote {out_path}: {counts}, source errors: {list(errors) or 'none'}")


IMAGE_EXTS = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif"}


def cmd_image(args):
    """Download an article image to public/images/articles/<slug>.<ext>,
    refusing if the slug already exists as an article or image file — the
    overwrite accident that recurred across gnews passes."""
    if len(args) < 2:
        print('Usage: python3 harvest.py image "<image-url>" "<slug>"')
        sys.exit(1)
    url, slug = args[:2]
    clash = [p.name for p in IMAGES_DIR.glob(f"{slug}.*")]
    if slug in dedup_index()[3]:
        clash.append(f"articles.json slug {slug}")
    if clash:
        sys.exit(f"REFUSED: {clash} already exist — likely a duplicate article; re-check dedup or pick another slug")
    # og:image filenames are sometimes raw Japanese; urllib can't send non-ASCII.
    url = urllib.parse.quote(url, safe=":/?&=%#~+@,;")
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
        data, ctype = r.read(), r.headers.get_content_type()
    ext = IMAGE_EXTS.get(ctype)
    if not ext:
        sys.exit(f"REFUSED: {url} is {ctype}, not an image")
    dest = IMAGES_DIR / f"{slug}.{ext}"
    with dest.open("xb") as f:  # "x" = never overwrite
        f.write(data)
    print(f"saved {dest.relative_to(REPO_ROOT)} ({len(data)} bytes)")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return
    cmd, *args = sys.argv[1:]
    if cmd == "list":
        cmd_list(args)
    elif cmd == "detail":
        cmd_detail(args)
    elif cmd == "dedup":
        cmd_dedup(args)
    elif cmd == "exclude":
        cmd_exclude(args)
    elif cmd == "scan":
        cmd_scan(args)
    elif cmd == "image":
        cmd_image(args)
    else:
        print(__doc__)


if __name__ == "__main__":
    main()
