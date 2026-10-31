# CHANGELOG

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
