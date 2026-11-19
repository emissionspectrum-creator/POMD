# CHANGELOG

## 2026-11-19 — Abdominal pain：新增每次發作的持續時間（v0.6.2，使用者要求）

- 新詞彙 `episode_duration`（Each episode lasts）：<5 min／5–30 min／30–60 min／1–6 h／>6 h，放在 Quality 段的 Pattern 之後；與 `duration`（從發病至今）分開。
- HPI 輸出 "each episode lasting …"，接在 pattern 之後；精簡版預設顯示。
- biliary colic 加上特徵 `episode_duration = m30_60 | h1_6`（draft）。

## 2026-11-18 — Abnormal liver tests：題目收合整理、補病毒性疾病（v0.6.1，使用者要求）

- 比照 Alcohol，把三段改成「主項目＋收合細項」：
  - Abdominal pain（原 Biliary）：主項目 pain_location；細項 pain pattern、與進食關係、radiation（新增右肩、背部）。
  - Drugs & herbs：主項目 drug_timing 改名「Medications / herbs」並加上 None；細項為藥物清單、草藥／保健食品。
  - Viral hepatitis（原 Viral）：主項目 viral_history；細項 exposure 與新增的 viral_sx（喉嚨痛、淋巴腫、皮疹、肌肉痛、咳嗽／流鼻水）。
- PE 新增 infection_pe（頸部淋巴結腫大、扁桃腺滲出物、皮疹）。
- 新疾病（draft）：EBV infection、CMV hepatitis、acute HIV infection★、systemic viral infection（influenza、COVID-19、一般感冒等）。dengue 依使用者決定不加。
- choledocholithiasis、malignant biliary obstruction 加上 radiation 特徵。
- HANDOFF 補充主項目＋細項的選題原則。

## 2026-11-18 — 新增 HANDOFF.md（使用者要求）

- 新增根目錄 `HANDOFF.md`：新增主訴的操作手冊，內容包括開工前要讀的與範本對照、十步流程、`<id>.md` 範本、設計判斷準則、踩過的坑、驗證工具（node 產生 HPI、playwright 實測）、使用者的工作偏好。只寫流程，不記錄現況（現況看本檔）。
- `CLAUDE.md` 加上「新增主訴前先讀 `HANDOFF.md`」，目錄結構加一行。
- 之後每完成一個主訴，就把新的坑與判斷準則補進 HANDOFF。

## 2026-11-18 — 新增第三個主訴 Abnormal liver tests（v0.6.0，使用者要求）

依 `data/complaints/abnormal_lft.md`（已與使用者對齊）實作。

**程式**
- 可收合細項：主訴的項目可以寫 `{item, details: {label, note, items}}`，細項預設收合、有點選時自動展開，收合時標題列顯示摘要；可附說明文字（用於酒精克數換算表）。完整版與精簡版都支援，精簡版中細項跟著主項目移動、沒有自己的排序按鈕。`core.js` 新增 `itemDetails`、`detailsSummary`。
- `group_item` 改為選填：依病因分組、與左欄分段對應的主訴不需要排序項目。
- 修正 CSS：已作答的主項目不再讓細項的標籤變色、clear 一直顯示。
- 新增測試：細項、無 group_item 的分組順序、肝功能異常端對端（27 個測試）。

**內容（全部 `draft`）**
- 病史依病因分段：Course & symptoms → Alcohol → Drugs & herbs → Viral → Metabolic → Biliary → Congestive / ischemic → Autoimmune & others；抽血型態不做成選項（使用者自行判讀）。
- 酒精：alcohol_use（保留主項目）＋收合細項（種類、每日克數 < 20／20–40／40–60／60–100／> 100 g、年數、最後一次喝、型態），說明文字附台灣常見酒類換算。
- 新詞彙：lft_duration（< 1 mo acute、1–6 mo subacute、> 6 mo chronic）、liver_warning、alcohol_*、liver_drugs、herbs、drug_timing、viral_history、viral_exposure、metabolic、congestion_sx、other_liver；PE 新增 liver_pe、congestion_pe。
- 新疾病 16 個（★：alcoholic hepatitis、acetaminophen toxicity、HBV flare、ischemic hepatitis）；choledocholithiasis、acute cholangitis、liver abscess、hyperthyroidism 共用。腹痛的 RUQ 群組照舊使用 `acute_hepatitis`。

## 2026-11-18 — 不再提醒審核疾病（使用者要求）

- 使用者已初步看過疾病內容，但不打算逐一細審；`CLAUDE.md` 註明之後不要再提醒或要求審核。`status` 維持 `draft`，只有使用者主動表示審核過才改 `reviewed`。

## 2026-11-18 — 新增第二個主訴 Diarrhea（v0.5.0，使用者要求）

依 `data/complaints/diarrhea.md`（已與使用者對齊）實作。

**程式（通用功能，DESIGN 4.6）**
- 主訴引用共用項目時可寫 `{item, options, ask, label}`：只顯示部分選項、覆寫英文問法與標籤（使用者選 Q1 方案 (a)，讓 travel、fever 這類概念維持只有一種寫法）。`core.js` 新增 `shownItems`、`itemOptions`、`itemAsk`、`itemLabel`、`featureShown`；兩頁的畫面改用這些函式。
- 疾病特徵只在有顯示該項目（及選項）的主訴參與比對、計數與說明卡；`diseaseFeatures`／`matchCount` 多一個選填的 complaint 參數。
- 排序項目通用化：`location_item`／`locations` 改名為 `group_item`／`options`（腹痛 yaml 同步修改），presence 項目只看 present；右欄按鈕「By location」改為「By group」。
- `build.py`：驗證上述覆寫；原本「疾病特徵用到主訴沒顯示的項目」的 warning，改為「在引用它的所有主訴中都沒有顯示」才警告；精簡版資料加入覆寫欄位。
- 新增測試：選項子集／問法／標籤覆寫、特徵可見性、presence 排序項目、腹瀉端對端（24 個測試）。

**內容（全部 `draft`）**
- 詞彙：新增 diarrhea_duration（< 2 週 acute、2–4 週 subacute、> 4 週 chronic）、diarrhea_pattern、stool_character、stool_frequency、stool_volume、nocturnal_stool、fasting_effect、continence、dehydration_sx、extraintestinal、exposure、food_trigger、diarrhea_drugs、diarrhea_history；PE 新增 hydration、systemic_pe。
- 新疾病 13 個：C. difficile infection★、STEC★、invasive bacterial enterocolitis、bacterial food poisoning、amoebic colitis、intestinal tuberculosis、microscopic colitis、bile acid diarrhea、lactose intolerance、SIBO、drug-induced diarrhea、hyperthyroidism、overflow diarrhea。
- 與腹痛共用的 8 個疾病加上腹瀉特徵：acute gastroenteritis、infectious ileocecitis、UC、Crohn's、CRC、ischemic colitis、IBS、chronic pancreatitis。
- 鑑別診斷依機轉分 7 群，排序項目為 stool_character。

## 2026-11-18 — DESIGN 4.1 不再規定非疼痛類主訴的追問順序（使用者要求）

- 刪除「非疼痛類主訴：大致依 起始與病程 → 性狀 → … → 危險因子與用藥」。每個主訴的追問邏輯不同（例如 leg edema 依心、腎、肝逐一追問，伴隨症狀反而是主體），寫死一種順序會讓之後的主訴被硬套。
- 改為原則：追問框架由各主訴依其臨床推理方式決定，寫在該主訴的設計說明並交代理由；LQQOPERA（疼痛）、依器官系統（leg edema）、依時程／機轉分流（diarrhea）只列為例子。
- 「各主訴通常都有的段落」放寬為 Patient、時程、相關病史，其餘依框架決定（不再暗示「伴隨症狀」是必備段落）。
- 第 6 節新增主訴流程的第一步，要求寫明追問框架的理由。

## 2026-11-18 — DESIGN.md 通用化，腹痛設計獨立（使用者要求）

為了加入第二個主訴（diarrhea）：原 DESIGN 第 3、4、6 節是照腹痛寫的（LQQOPERA、依位置分組、腹痛疾病表），不適用其他主訴。

- `DESIGN.md` 升為 v0.2，只寫通用原則：追問框架由主訴決定（疼痛類 LQQOPERA、非疼痛類另一套順序）、分組方式與排序項目由主訴決定、時程界線由各主訴 duration 的 `tc` 定義；新增 4.6「跨主訴共用疾病」原則（待做第二個主訴時實作）；第 6 節改為「新增主訴的流程」。
- 新增 `data/complaints/abdominal_pain.md`：從 DESIGN 移出的腹痛內容（LQQOPERA 段落、位置分組與疾病表、時程界線、預設 PE、HPI／PE 範例），以及原本記在 CLAUDE.md 的腹痛決定（appendicitis 合併、第二位置群組、台灣臨床脈絡）。
- 同步現況：右欄不標示 must-not-miss、By matches 排序例外、acute／subacute／chronic 三級、三個 Copy 按鈕、精簡版 History 頁與兩頁同步、GitHub Pages 備案。
- `CLAUDE.md`：指向新的文件位置，刪除已經寫進 DESIGN 或腹痛文件的重複條目。
- 只改文件，程式與資料不變。

## 2026-11-18 — CLAUDE.md 補充建置流程說明（/init）

- 加上 Claude Code 標準開頭；新增「只跑單一測試」指令。
- 新增「建置流程」小節：`build.py` 如何組出兩個 html、精簡版只帶哪些主訴欄位、`core.js` 在 Node／瀏覽器的匯出方式、端對端測試讀的是 `dist/` 裡的資料（改 `data/` 後須先 build）。

## 2026-11-18 — PE 預設點選 soft、non-tender（使用者要求）

**新增**
- 主訴資料新增 `defaults`：新病人自動點選的項目。腹痛預設 Wall / guarding: Soft、Tenderness: Non-tender，PE 段落一開始就是 "Abdomen: soft, non-tender."。
- 開啟頁面、New patient（任一頁）、切換主訴時都會回到預設；點其他壓痛位置會自動取消 Non-tender（原本的 exclusive 規則）。
- 只有預設值時視為「尚未點選」：HPI 維持空白、New patient 不需點兩次、不寫入 localStorage。
- `core.js` 新增 `defaultState`、`sameState`、`isPristine`；`build.py` 驗證 `defaults`；新增測試。
- 注意：Non-tender 會參與鑑別診斷比對（典型有壓痛的疾病顯示 Different）。

## 2026-11-18 — 公開 repo 並開啟 GitHub Pages（使用者要求）

- repo 改為 public（使用者確認文件中的姓名一併公開），以免費開啟 GitHub Pages。
- 網路版：`https://emissionspectrum-creator.github.io/POMD/dist/POMD-history.html`（精簡版）、`.../dist/POMD.html`（完整版）。
- 網路版在同一網域下，版面偏好、兩頁同步、Submit 都可用（含 Firefox）；偏好存在各瀏覽器，不跨電腦同步。

## 2026-11-18 — HPI 開頭改為民國日期（使用者要求）

**修改**
- HPI 開頭由 "The patient presented with epigastric pain …" 改為 "(115/11/18) epigastric pain …"：日期為當天民國年（西元 − 1911），月日補 0。
- Sex／Age 不再寫進 HPI（使用者選擇），只用於鑑別診斷比對。

**新增**
- 句型支援 `{@name}` 頁面變數，目前只有 `{@date_roc}`；當作固定文字，不會讓原本不輸出的句子出現。`core.js` 新增 `rocDate`、`textVars`；`build.py` 檢查未知變數。

## 2026-11-18 — 完整版新增「Quick history」按鈕（使用者要求）

**新增**
- 完整版頂端列（New patient 旁）新增 **Quick history** 按鈕：開啟同資料夾的 `POMD-history.html`，若已開著（同一組分頁）就切過去。兩頁共用病人，不需另外傳資料。
- 精簡版載入時把 `window.name` 設為 `pomd-quick`，讓完整版能找到它。

## 2026-11-18 — 精簡版 Submit 按鈕置中（使用者要求）

**修改**
- 精簡版底部的「Submit → full page」按鈕改為水平置中（說明文字留在左側）。

## 2026-11-18 — v0.4.0 精簡版 Submit、拖曳排序、兩頁共用病人（使用者要求）

**新增**
- 精簡版底部改成 **Submit → full page**（拿掉 HPI 預覽與 Copy HPI）：開啟同資料夾的 `POMD.html`，若之前由精簡版開過就切到那個分頁。
- 兩頁共用目前病人：點選存在 localStorage，雙向即時同步（任一頁點選，另一頁立刻更新）；任一頁按 New patient 兩頁一起清空；不自動過期（使用者選擇）。重新整理也不會遺失。
- Edit layout 時可用滑鼠拖曳 ⠿ 排序（↑↓ 保留，手機用）；版面（順序、隱藏）存在 localStorage，下次開啟還在；Reset layout 回到 `quick.show` 預設。
- `core.js` 新增 `sanitizeState`、`parseStoredState`、`serializeState`、`sanitizeOrder` 與測試。

**修改**
- `quick.show` 改為全部 22 題（原 LQQOPERA 順序，duration 移到 location 後面），由使用者自行隱藏。
- 精簡版的 Hide 不再清除答案：精簡版已無 HPI，完整版看得到所有答案，隱藏只是版面設定。

**限制**
- 跨頁同步與 Submit 切換分頁依賴 Edge／Chrome 把 `file://` 視為同一 origin（已在 Chromium 實測）；Firefox 不會同步。
- 換病人忘了按 New patient 時，上一位的點選會留在瀏覽器儲存中。

## 2026-11-18 — 取消「不儲存任何病人資料」規則（使用者要求）

**修改**
- `DESIGN.md` 第 2 節刪除「不儲存任何病人資料：不寫入 localStorage／檔案」，保留「New patient 一鍵清空」；`CLAUDE.md` 同步刪除對應的關鍵規則。
- 原因：精簡頁想記住版面偏好，並把點選內容 Submit 到完整版，需要能使用瀏覽器儲存。目前程式行為不變（仍未使用任何儲存），實際做法另行決定。

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
