# CHANGELOG

## 2026-11-18 — v0.3.0 精簡版病史頁 `dist/POMD-history.html`（使用者要求）

**新增**
- 另外產生只有 History + HPI 的精簡頁 `dist/POMD-history.html`。原因：完整版很好用，但門診問病史時畫面太龐大。完整版 `dist/POMD.html` 不變。
  - 單欄問題清單，不分 LQQOPERA 段落；保留 Show English phrasing、New patient（點兩次清空）、Copy HPI。
  - 「Edit layout」開關：每題出現 ↑ ↓ 和 Hide；Hide 會一併清掉該題的選取，避免看不見的內容跑進 HPI。「Reset layout」回到預設。
  - 清單底部的「+ Add question」下拉選單可隨時把隱藏的問題加回（依原 LQQOPERA 分段列出）。
  - 版面調整只存在記憶體，重新整理就回到預設；不用 localStorage，維持「不儲存任何資料」的規則。
  - HPI 句子順序仍由 `hpi` 模板決定，不受畫面順序影響。
- 主訴資料新增 `quick.show`：精簡頁預設顯示的問題與順序。腹痛初稿把 duration 放在 location 後面，預設隱藏 sex、age_group、repro_status、pain_migration、nocturnal、episodes、precipitant、assoc_gu、assoc_other、risk。
- `build.py` 驗證 `quick.show`（必須是該主訴 history 項目、不可重複），並另外輸出精簡頁（payload 不含疾病資料）。新增 `src/history.html`、`src/history.js` 與精簡頁樣式；測試新增精簡頁資料檢查。

## 2026-11-04 — 本機與雲端 session 同步

**新增**
- `session-start.sh` 擴充：本機與雲端都會在 session 開始時 fetch 並 rebase 到 `origin/main`；有未 commit 變更或衝突時不動作，只提出警告。
- SessionStart hook 加上 `matcher: "startup|resume"`，只在新開或 resume session 時同步；對話壓縮（compact）、`/clear` 時不再執行，避免改到一半時誤報「有未 commit 變更」。
- `CLAUDE.md` 新增「同步」一節：完成修改且 build／測試通過後直接 commit 並 push 到 `main`（使用者要求）；`dist/POMD.html` 因含 build 日期，衝突時以重新 build 解決。

## 2026-11-04 — 支援雲端 session

**新增**
- 建立 private GitHub repo `POMD` 並 push，讓 Claude Code 雲端 session（claude.ai/code）可以 clone 使用。
- `.claude/settings.json` + `.claude/hooks/session-start.sh`：SessionStart hook，只在雲端環境（`CLAUDE_CODE_REMOTE=true`）安裝 PyYAML，讓 `build.py` 與測試能直接執行；本機不受影響。
- `CLAUDE.md` 補充雲端 session 的注意事項。

## 2026-10-31 — v0.2.0 後續修改（使用者要求）

**修改**
- Differential 取消 must-not-miss 標示：不再用紅字、★、加粗，圖例也移除。說明卡標題同步移除 ★ 與紅字，只保留中性灰色的 "Must-not-miss" 徽章。
- Differential 新增排序切換：**By location**（原本的位置分組）／**By matches**（不分組、去重複，依 typical feature 符合數量由高到低排序；同分時維持位置順序，已點選位置的群組在前；每個疾病下方以小字標出所屬位置群組）。排序模式在 New patient 後保留。
  - 這是 DESIGN.md「不做排序」的例外，由使用者明確要求；只依符合數量排序，不做加權。
- `core.js` 新增 `rankByMatches()` 與對應測試。

## 2026-10-31 — v0.2.0（M2 腹痛完整內容）

**新增**
- 依 DESIGN.md 第 6 節補齊腹痛鑑別診斷，共 41 個疾病（新增 35 個，皆為 `draft`，待佑達審核）：
  - RUQ：choledocholithiasis、acute cholangitis★、acute hepatitis、liver abscess★、RLL pneumonia
  - Epigastric：perforated peptic ulcer★、functional dyspepsia、GERD、gastritis、chronic pancreatitis、gastric cancer、ACS★
  - LUQ：splenic infarction、splenic rupture★
  - Periumbilical／Diffuse：SBO★、acute gastroenteritis、IBS、constipation、hollow viscus perforation／peritonitis★、ruptured AAA★、DKA★
  - RLQ：Crohn's disease、infectious ileocecitis、ectopic pregnancy★、ovarian torsion★
  - LLQ：diverticulitis、ischemic colitis、ulcerative colitis、colorectal cancer、sigmoid volvulus★
  - Suprapubic：cystitis、acute urinary retention、PID
  - Flank：renal colic、acute pyelonephritis
- 鑑別診斷分組補齊；除 DESIGN 表格外另做的跨組安排：acute pancreatitis 也列在 LUQ；diverticulitis 也列在 RLQ（亞洲右側憩室炎常見）；ectopic pregnancy、ovarian torsion 也列在 LLQ（左右側皆可能）；ruptured AAA 也列在 Flank（常被誤認為腎絞痛）。
- 危險因子新增：known AAA、biliary stent／prior biliary intervention、new drug／herbal supplement（DILI）、anticholinergic／opioid drugs（尿滯留、便秘）。
- 內容加入台灣臨床脈絡：Klebsiella 肝膿瘍與糖尿病、眼內炎；B 肝帶原者 flare；腸結核與 Crohn's 鑑別；生物製劑前篩檢 HBV／TB。

**修改**
- presence 比對語意：`item = no a | b` 改為「全部都沒有」才算 Match（任一為 present 即 Different），符合「No GI bleeding」這類多選項陰性特徵的臨床意義；`item = a | b` 仍為「任一有」。新增對應測試。
- PE 的 `{x*}` 輸出改為先列陽性、再列陰性，避免 "no cervical motion tenderness, adnexal tenderness" 這種歧義句。
- 輸出區高度 190px → 160px，讓 1366×768 螢幕的三欄有更多空間。
- `build.py` 遇到 YAML 語法錯誤時，改為顯示檔名與提示，不再丟出 traceback。

## 2026-10-31 — v0.1.0（M1 骨架）

**新增**
- 專案骨架：`build.py`（YAML 驗證 + 組成單一檔案 `dist/POMD.html`）、`src/`（index.html、style.css、core.js、app.js）、`data/`、`tests/`。
- 三欄介面：左 History、中 Physical exam + Labs／Imaging 建議清單、右 Differential；下方即時產生英文 HPI 與 PE。
- 點選邏輯：single（單選）、multi（複選，可設 exclusive 選項）、presence（present → absent → 清除 三態）。
- 鑑別診斷：依位置分組、點選 Location 後相關群組排到最前；must-not-miss 紅字 ★；有典型特徵被點選就標亮並顯示數量；依 Duration 標亮 A／S／C 時程徽章。
- 疾病說明卡：One-liner、典型症狀／PE 三色比對（Match／Not asked／Different，Different 會顯示目前點了什麼）、典型時程比對、Labs、Imaging／endoscopy、Pitfalls、審核狀態。
- HPI／PE 文字組裝：資料驅動的句型模板（預設值、選擇性片段、present／absent 清單）。
- Copy HPI + PE（另有 Copy HPI、Copy PE），Clipboard API 失敗時改用 execCommand 備援，`file://` 可用。
- New patient：點兩次清空（3 秒內）。Show English phrasing 開關：每個病史項目 2–3 種英文問法。
- 窄螢幕（≤900px）三欄改上下堆疊，輸出區固定在底部。
- 共用詞彙：病史 22 項、PE 15 項（`data/vocab/`）。
- 6 個驗證用疾病：biliary colic、acute cholecystitis、acute pancreatitis、peptic ulcer disease、acute appendicitis、acute mesenteric ischemia（皆為 draft）。
- 建置時一致性檢查：項目／選項 id、疾病引用、主訴引用、模板 placeholder、YAML 常見錯誤（flow mapping 內未加引號的逗號）。
- `tests/core.test.js`：核心邏輯單元測試 + 對建置產物的端對端測試。

**設計決定**（詳見 CLAUDE.md「設計決定」）
- 項目定義集中在 `data/vocab/`，主訴只引用 id，以符合「共用詞彙」並為多主訴預留。
- 時程分 acute／subacute／chronic；疾病以清單標記（取代 DESIGN 的 both）。
- Early appendicitis 併入 acute appendicitis，同時列在 periumbilical 與 RLQ 群組。
- 說明卡採右側滑出面板，Esc 可關閉。
