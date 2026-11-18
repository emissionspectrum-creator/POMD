# POMD — 專案說明（給 Claude Code）

門診用「主訴追問與鑑別診斷輔助工具」，個人使用版。設計規格見 `DESIGN.md`（已定案，修改前先問使用者）；修改紀錄見 `CHANGELOG.md`。

## 關鍵規則

- **產出單一檔案 `dist/POMD.html`**（完整版）與 **`dist/POMD-history.html`**（只有 History 的精簡版，使用者 2026-11-18 要求），各自都要能在 Windows 11 Edge／Chrome／Firefox 以 `file://` 直接開啟、**完全離線**：不得引用任何外部 URL、CDN、字型、圖片。
- 介面與輸出文字**全英文**；文件（本檔、CHANGELOG）用繁體中文。
- **不做機率、權重或「最可能診斷」**。標亮只表示「有至少一項典型特徵被點選」，數字只是符合數量。
- 例外（使用者 2026-10-31 要求）：右欄可切換「By matches」，依符合數量高低排序（單純計數，不加權；同分維持位置順序）。
- 右欄**不**標示 must-not-miss（不用紅色、不加 ★、不加粗；使用者要求）。`must_not_miss` 資料保留，只在說明卡以中性的 "Must-not-miss" 徽章顯示。
- **內容與程式分開**：臨床內容只放 `data/`；`src/` 不得寫死任何疾病、症狀或選項。
- **疾病是獨立單位**：右欄標亮與說明卡比對都由疾病資料的 `symptoms`／`pe` 推導，**不要另外維護「選項 → 疾病」對照表**。
- 內容自行撰寫，不抄教科書；英文問法要自然道地。新增或修改的疾病 `status` 一律 `draft`，只有使用者（佑達）審核後才改 `reviewed`。
- 純 HTML + CSS + 原生 JavaScript（ES5 風格、IIFE），不引入框架或 npm 依賴。
- 每次修改都要在 `CHANGELOG.md` 記錄日期、改了什麼、為什麼。

## 目錄結構

```
DESIGN.md                 設計文件（定案）
CLAUDE.md / CHANGELOG.md
build.py                  驗證 data/ 並組出 dist/ 兩個 html（需 PyYAML）
src/
  index.html              外殼，含 /*__CSS__*/ /*__DATA__*/ /*__CORE__*/ /*__APP__*/ __VERSION__ 佔位
  style.css
  core.js                 純邏輯（無 DOM）：選取、比對、標亮、時程、文字組裝；瀏覽器與 Node 共用
  app.js                  DOM／事件／畫面
  history.html            精簡版外殼（同樣的佔位）
  history.js              精簡版 DOM／事件：問題可拖曳／↑↓ 移動、隱藏、+ Add question；Submit 切到完整版
data/
  vocab/history.yaml      共用病史項目（items + options）
  vocab/pe.yaml           共用 PE 項目
  complaints/<id>.yaml    主訴範本：版面、建議檢查、鑑別診斷分組、HPI／PE 句型
  diseases/<id>.yaml      每個疾病一檔，檔名 = id
tests/core.test.js        Node 內建 test runner
dist/POMD.html            建置產物（有 commit，方便直接複製到醫院電腦）
dist/POMD-history.html    精簡版建置產物（不含疾病資料）
```

## 建置與驗證

```bash
python3 build.py --check        # 只驗證資料
python3 build.py                # 驗證 + 產生 dist/POMD.html 與 dist/POMD-history.html
node --test tests/*.test.js     # 單元測試 + 對 dist 資料的端對端測試（需先 build）
```

- 改完 `data/` 或 `src/` 一定要重新 build，並把 `dist/` 兩個 html 一起 commit。
- `build.py` 有 error 會中止；warning（例如疾病特徵用到主訴沒顯示的項目、疾病沒被任何主訴引用）要看過並處理或說明。
- 版本號在 `build.py` 的 `APP_VERSION`，會顯示在畫面右上角。
- 注意 `node --test tests/`（目錄）在 Node 22 會失敗，要用 `tests/*.test.js`。
- 瀏覽器實測：可在 session scratchpad 安裝 `playwright-core`，搭配 `~/.cache/ms-playwright/chromium-*/chrome-linux64/chrome` 以 `file://` 開啟 dist 測試；不要把 playwright 裝進專案。

## 同步（本機 ↔ 雲端 session）

使用者有時在本機改、有時在另一台電腦用雲端 session（claude.ai/code）改。GitHub private repo `emissionspectrum-creator/POMD` 的 `main` 是唯一的共同版本。

- **開始**：`.claude/hooks/session-start.sh` 會在每個 session 開始時 `git fetch` 並把目前分支 rebase 到 `origin/main`；雲端另外會安裝 PyYAML。hook 的 `[sync]` 訊息若是 WARNING（有未 commit 的變更或 rebase 衝突），先告訴使用者，處理好再動手改。
- **結束**：每完成一項修改、build 與測試都通過後，**直接 commit 並 push 到 `origin main`，不用再問**（使用者 2026-11-04 明確要求，覆寫全域「commit／push 前先問」）。步驟：
  1. 先 commit，再 `git fetch origin main && git rebase origin/main`（有未 commit 變更時無法 rebase）
  2. 若衝突只在 `dist/` 的 html（內含 build 日期，兩邊各自 build 就會衝突）：`python3 build.py && git add dist/ && git rebase --continue`；其他檔案衝突 → 停下來問使用者。
  3. rebase 後若有拉到新的 `data/`／`src/` 變更，重新 build、跑測試，有變動就再 commit。
  4. `git push origin HEAD:main`（雲端 session 在 `claude/...` 分支上也一樣推到 `main`）。
- 不要 force push。push 被拒（遠端又有新 commit）就回到步驟 1。
- 雲端沒有本機的 playwright chromium，瀏覽器實測回本機做。

## 資料格式

### 項目（`data/vocab/*.yaml`）

```yaml
- id: pain_location          # 全域唯一，小寫底線
  label: Location            # 畫面顯示
  type: multi                # single | multi | presence
  template: "{} pain"        # 選填，single/multi 才可用；選項片段串起來後套入 {}
  join: and                  # 選填：and（預設）| or | ","（只用逗號）
  ask:                       # 給病人的英文問法 2–3 種（Show English phrasing 開啟時顯示）
    - "Where is the pain?"
  options:
    - id: ruq                # 項目內唯一
      label: RUQ             # 按鈕文字
      frag: RUQ              # 輸出用片段（省略時 = label）
      frag_neg: ...          # 只用於 presence：「沒有」時的 PE 片段（預設 "no " + frag）
      exclusive: true        # 只用於 multi：如「None／Non-tender」，選它會清掉其他，選其他會清掉它；輸出時不套 template
      red_flag: true         # 按鈕旁顯示紅色 !
      tc: [acute]            # 只用於時程項目（duration）：acute | subacute | chronic
```

- `single`：單選，再點一次取消。
- `multi`：複選。
- `presence`：每個選項三態循環：點一下 **present**（綠 +）→ 再點 **absent**（紅 −）→ 再點清除。用於伴隨症狀、危險因子、特殊徵象、生命徵象等需要「有／沒有」的地方。
- YAML 陷阱：flow mapping `{...}` 裡的值若含逗號或 `: `，必須加引號；`build.py` 會以「unknown keys」報錯提醒。

### 主訴（`data/complaints/<id>.yaml`）

- `location_item`：哪個項目代表疼痛位置；點選後，`ddx` 中 `locations` 有交集的群組排到最前面。
- `timecourse_item`：哪個項目代表時程；其選項的 `tc` 決定右欄 A／S／C 徽章的標亮。
- `history`／`pe`：`[{section, items: [item id...]}]`，決定左欄、中欄的分段與順序。
- `labs`／`imaging`：`[{name, note}]`，純建議清單，不可點、不參與比對。
- `ddx`：`[{group, locations: [location option id...], diseases: [disease id...]}]`；同一疾病可出現在多個群組。
- `hpi`／`pe_text`：文字組裝規格（見下）。
- `quick: {show: [item id...]}`：精簡版預設顯示的問題與順序；必須是 `history` 裡的項目、不可重複。沒列的預設隱藏，可用「+ Add question」加回。省略 `quick` 時顯示全部 history 項目。使用者在瀏覽器調整過的版面會存在 localStorage 並優先使用（「Reset layout」回到這個預設）。HPI 句子順序仍由 `hpi` 模板決定，不受畫面順序影響。

### 疾病（`data/diseases/<id>.yaml`）

```yaml
id: acute_cholecystitis       # 必須等於檔名
name: Acute cholecystitis
must_not_miss: true
timecourse: [acute]           # acute | subacute | chronic，可多個
status: draft                 # draft | reviewed
one_liner: >
  ...
symptoms:                     # 典型症狀（參與比對）
  - when: pain_location = ruq | epigastric     # 項目 = 選項（| 表示任一即符合）
    text: RUQ (sometimes epigastric) pain       # 說明卡上顯示的文字
  - when: assoc_sys = fever                    # presence 項目：= 表示 present
  - when: assoc_sys = no jaundice              # presence 項目：= no 表示 absent（典型為「沒有」）
pe:                           # 典型 PE（同上格式）
  - when: abd_signs = murphy
    text: Positive Murphy's sign
labs: [純文字...]
imaging: [純文字...]
pitfalls: [純文字...]
```

比對規則（`core.featureStatus`）：
- single／multi：該項目有點選且包含任一列出的選項 → **Match**；有點選但都不是 → **Different**；沒點 → **Not asked**。
- presence：只看列出的那些選項。
  - `item = a | b`（典型為「有」）：任一為 present → Match；沒有 present 但有 absent → Different；都沒點 → Not asked。
  - `item = no a | b`（典型為「都沒有」）：任一為 present → Different；沒有 present 且至少一個 absent → Match；都沒點 → Not asked。
- 右欄標亮 = 任一特徵為 Match；數字 = Match 數。時程徽章另外計算，不算進數字。

### 文字組裝（`hpi`／`pe_text`）

```yaml
hpi:
  joiner: " "                 # 句子之間的連接（PE 用 "\n"）
  sentences:
    - always: true            # 就算沒有任何內容也輸出（用於開頭句）
      lead: ""                # 句首固定文字（例 "Abdomen: "），只在有內容時出現
      sep: ", "               # parts 之間的分隔（預設 ", "）
      end: "."                # 句尾（預設 "."）
      parts:
        - "{sex|the patient}[, aged {age_group},] presented with {pain_location|abdominal pain}[ {duration}]"
        - "{pain_quality}"
```

- `{item}`：該項目選到的片段（套 item template、依 join 串接）。
- `{item|預設}`：沒選時用預設文字。
- `[...]`：選擇性片段，裡面的 placeholder 有任何一個是空的就整段省略（不可巢狀）。
- part 裡有「必填」placeholder（不在 `[...]` 內、無預設）是空的 → 整個 part 省略。
- 句子只有在至少一個 placeholder 有實際內容時才輸出（或 `always: true`）。
- presence 項目的後綴：`{x+}` 只列 present（以 and 連接），`{x-}` 只列 absent（以 or 連接，用於 "Denied ..."），`{x*}` 先列 present、再列 absent（各依選項順序），absent 用 `frag_neg`（避免 "no A, B" 的歧義）。
- 多個項目合併成一個清單：`{assoc_gi+,assoc_sys+}`。
- `{@date_roc}`：頁面提供的變數（今天的民國日期，例 `115/01/05`，月日補 0），當作固定文字，不算「有內容」。可用變數定義在 `core.textVars`，`build.py` 的 `TEXT_VARS` 要同步。
- `[ ] { } |` 是保留字元，模板文字中不要另作他用。
- 每句首字自動大寫。

## 設計決定（DESIGN.md 未明定之處）

- 項目定義放在共用 `data/vocab/`，主訴只引用 id → 未來多主訴可共用同一詞彙，疾病特徵跨主訴一致。
- 資料格式用 YAML（易讀、可寫多行文字與註解）；建置需 PyYAML。
- 時程分 acute／subacute／chronic 三級（DESIGN 寫 acute／chronic／both；疾病以清單表示「both」）。1–4 週算 subacute。
- 疾病說明卡為右側滑出面板，蓋住鑑別診斷欄，可按 × 或 Esc 關閉；內容隨點選即時更新。說明卡額外顯示「典型時程」與目前 duration 的比對。
- Different 狀態下，說明卡會顯示目前實際點了什麼（selected: ...）。
- Early appendicitis 與 acute appendicitis 合併為同一疾病 `acute_appendicitis`，同時列在 Periumbilical／Diffuse 與 RLQ 群組。
- 除 DESIGN 第 6 節表格外，另把部分疾病放進第二個位置群組：acute pancreatitis → LUQ、diverticulitis → RLQ、ectopic pregnancy／ovarian torsion → LLQ、ruptured AAA → Flank。
- 疾病內容加入台灣臨床脈絡（Klebsiella 肝膿瘍、B 肝 flare、腸結核、草藥 DILI、胃癌盛行率與 EGD 年齡門檻）。
- 「New patient」按鈕：有點選時需在 3 秒內點兩次才清空（避免誤觸，又不跳對話框）。
- 兩頁共用目前病人（使用者 2026-11-18 決定）：點選存在 localStorage `pomd.patient.v1`（`{complaint, state}`），兩頁用 `storage` 事件雙向即時同步；不自動過期，只有 New patient（任一頁）會清空。精簡版版面存在 `pomd.quickLayout.v1`（每個主訴一個順序陣列）。讀取時以 `Core.sanitizeState`／`sanitizeOrder` 過濾無效資料。
- 精簡版 Submit：`window.open('', 'pomd-main')` 找到完整版分頁就切過去，否則開啟同資料夾的 `POMD.html`；完整版載入時把 `window.name` 設為 `pomd-main`。反方向同理：完整版的「Quick history」按鈕用 `pomd-quick`（精簡版載入時設定）。
- 這些跨頁功能只在 Edge／Chrome 有效（`file://` 視為同一 origin）；Firefox 的 `file://` 各檔案隔離，兩頁仍可各自使用但不會同步。
- 精簡版的 Hide 只是版面設定，不清除該題答案（完整版仍看得到）。
- 除了 DESIGN 要求的「Copy HPI + PE」，另外提供 Copy HPI、Copy PE（病歷常分 S／O 兩欄）。
- Copy 先用 Clipboard API，失敗時改用隱藏 textarea + `execCommand('copy')`。
- 選項可標 `red_flag`，按鈕旁顯示紅色「!」。
- 每個項目有「clear」小按鈕，可單獨清除該項。
