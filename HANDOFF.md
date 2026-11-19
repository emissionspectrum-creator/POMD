# HANDOFF — 新增主訴操作手冊

給要新增 chief complaint 的新 session。只寫流程、判斷準則與踩過的坑；資料格式與指令見 `CLAUDE.md`，設計原則見 `DESIGN.md`，專案現況見 `CHANGELOG.md`。
修改既有主訴或補疾病這類小工作，看 `CLAUDE.md` 就夠了，不必走這份流程。

## 1. 開工前要讀的

1. `CLAUDE.md`：關鍵規則、資料格式（尤其「主訴」一節的 `{item, options, ask, label, details}`）、同步規則。
2. `DESIGN.md`：第 4 節（通用功能，特別是 4.1 追問框架、4.6 跨主訴共用）與第 6 節（新增主訴的流程）。
3. 挑一份最接近的既有主訴當範本，`.md` 和 `.yaml` 都讀：

| 類型 | 範本 | 特點 |
|---|---|---|
| 描述症狀（疼痛類） | `data/complaints/abdominal_pain.*` | LQQOPERA；依位置分組，`group_item: pain_location` |
| 先分流再追問 | `data/complaints/diarrhea.*` | 先依時程、再依糞便型態分流；依機轉分組，`group_item: stool_character`；大量使用共用項目子集 |
| 依病因逐一排除 | `data/complaints/abnormal_lft.*` | 每個病因一段，右欄群組與左欄分段對應，不設 `group_item`；酒精用可收合細項 |

4. 瀏覽一下 `data/vocab/history.yaml`、`pe.yaml` 的項目 id 和選項，新主訴盡量沿用。

## 2. 流程

1. **同步**：session-start hook 會自動 fetch 並 rebase；有 WARNING 先告訴使用者。
2. **先討論追問框架**：使用者通常會先說這個主訴的問診重點（例如「依疾病為大方向」「要細問酒量」）。先給意見並提出 Q1、Q2……（每題附選項與建議），**不要直接動手寫**。
3. **寫 `data/complaints/<id>.md` 草稿**：用第 3 節的範本，標明「草稿，待對齊」。這時不 commit，也不寫 yaml。
4. **對齊**：把待決定的事列在草稿最後一節，每題附建議；使用者常回覆「照你的建議」。
5. **實作**，依這個順序（每一步都可以先跑 `python3 build.py --check`）：
   1. 詞彙：在 `data/vocab/history.yaml`、`pe.yaml` 檔尾新增一段 `# ---------- <Complaint> ----------`。
   2. 主訴 yaml：`data/complaints/<id>.yaml`。
   3. 新疾病：`data/diseases/<id>.yaml`，一律 `status: draft`。
   4. 共用疾病補特徵：既有疾病在 `pe:`／`labs:` 前插入 `# <complaint> complaint` 註解與新特徵。
   5. 若需要新的通用功能（例如子集、細項），程式改在 `src/core.js`（純邏輯）＋ `src/app.js`／`src/history.js`（兩頁都要）＋ `build.py`（驗證與輸出，精簡版的 `quick_data` 也要帶上新欄位）。
6. **驗證**（第 6 節）：build 不能有 error，warning 要處理或說明；跑測試；用 node 產生 HPI／PE 讀讀看；用 playwright 實測兩頁。
7. **補測試**：在 `tests/core.test.js` 加一個 `built data: <complaint> — ...` 的端對端測試；新的 core 函式要有單元測試。
8. **文件**：
   - 把 `<id>.md` 改成定案版：刪掉「待對齊」，記下每題的決定，以及實作時跟草稿不同的地方和原因；HPI 範例換成實際輸出。
   - `DESIGN.md` 第 6 節的主訴表加一列；第 9 節加一個 milestone。若新增通用功能，也寫進第 4 節。
   - `CLAUDE.md`：資料格式有變時才更新。
   - `CHANGELOG.md`：寫一筆，分「程式」「內容」兩段。
   - `build.py` 的 `APP_VERSION` 升一個 minor。
9. **commit 並 push**（`CLAUDE.md` 的同步步驟，不用再問）。
10. **更新這份文件**：這次若踩到新的坑、加了新功能或新的判斷準則，補進第 4、5 節。

## 3. `<id>.md` 範本

```markdown
# 主訴設計說明：<Name>（<中文>）

> 狀態：**草稿，待佑達對齊**（尚未建立 `<id>.yaml`）。通用原則見 `DESIGN.md`。
> 標記：〔共用〕＝沿用既有項目（只顯示相關選項）；〔新〕＝新增項目；〔共〕＝與其他主訴共用的疾病。

## 1. 追問框架與理由
（依哪種臨床推理方式排列、為什麼；段落順序）

## 2. 病史項目
| 段落 | 項目 | 選項（草案） |

## 3. 理學檢查

## 4. 時程界線
（duration 選項與 acute／subacute／chronic 的對應）

## 5. 鑑別診斷分組
（分組軸、排序項目或不設；群組 × 疾病表，標 ★ must-not-miss 與〔共〕；台灣臨床脈絡；考慮過但不放的疾病）

## 6. 建議檢查

## 7. HPI／PE 範例（示意）

## 8. 待對齊的問題
1. …（附建議）
```

## 4. 設計判斷準則

**共用或新增項目**
- 概念已經存在（fever、travel、diabetes、tenesmus……），就用 `{item, options: [...]}` 只顯示需要的選項，不要另立重複的選項。DESIGN 5.1 要求同一個特徵只有一種寫法。
- 描述主訴本身的項目屬於該主訴，另立新項目（腹痛的 pain_quality、腹瀉的 stool_character、肝的 lft_duration）。
- 共用項目的英文問法或標籤寫的是別的主訴（例如 episodes 問 "pain like this before?"、assoc_sys 叫 "Systemic / hepatobiliary"），用 `ask`／`label` 覆寫。精簡版沒有段落標題，像「Location」這種標籤要改成「Pain location」。
- 沿用前檢查既有選項的 `red_flag` 和 `frag` 是否適合新主訴。例如 onset 的「Sudden」標了 red flag，所以腹瀉不放 onset；腹痛的 nocturnal 片段寫的是被「痛」醒，所以另立 nocturnal_stool。
- **一個項目在一個主訴只能出現一次**（包含細項）。`risk`、`assoc_other` 這類大雜燴項目只能整個放在某一段，必要時用 `label` 改名（例如「Other risk factors」）。
- 需要細問、但會佔版面的內容，用 `details` 掛在主項目下（預設收合）。主項目選「有沒有、什麼時候、哪裡」這種一眼能答的問題（alcohol_use、drug_timing 加上 None、pain_location、viral_history），清單類放細項。使用者偏好把同一主題的題目這樣「集中」起來。

**時程**
- 每個主訴依自己的臨床定義另立 duration 項目，選項標 `tc`。腹瀉：< 2 週、2–4 週、> 4 週；肝：< 1 月、1–6 月、> 6 月。不要改共用的 `duration`，那會動到腹痛的疾病特徵。

**鑑別分組**
- 分組軸依主訴決定：位置、機轉、病因。若群組與左欄分段一一對應（病因型），就不設 `group_item`。
- 同一疾病可以放在多個群組（例如 C. diff 放在三個群組）。
- must-not-miss 只標「漏掉會出大事、而且有可做的處置」的疾病。右欄不顯示，只在說明卡顯示。
- 既有疾病要在新主訴重用時，先看它的範圍：太籠統就細分成新疾病。使用者可能要求舊主訴繼續用原本的疾病（例如腹痛的 RUQ 群組仍用 `acute_hepatitis`）。

**疾病內容**
- 自行撰寫，英文自然；加入台灣臨床脈絡（流行病學、常見酒類與草藥、健保等）。
- `symptoms`／`pe` 的 `when` 只能引用存在的項目與選項；新主訴的特徵要用該主訴有顯示的項目，否則不參與比對。
- `status` 一律 `draft`；**不要提醒使用者審核**。

## 5. 踩過的坑

- YAML flow mapping `{...}` 中，值含逗號或 `: ` 要加引號（`label: "Long-term, unchanged"`）。build 會以「unknown keys」報錯。
- `item = no a` 只能用在 presence 項目；single／multi 想表達「沒有 X」，就改寫成符合的選項，或乾脆不寫。
- frag 要放進 HPI 句子裡讀讀看：
  - multi 的 `template`（例如 "{} diarrhea"）會把所有片段串起來。
  - presence 的 `-` 清單前面接 "Denied "／"No "，所以 frag 不要帶冠詞（"proton pump inhibitors"，不寫 "a PPI"）。
- 精簡版的 `itemBlockHtml` 有排版控制項，細項（`idx < 0`）不顯示它們；改 HTML 結構時，注意 `item-head` 的結尾標籤。
- CSS 中 `.item.answered` 要用 `> .item-head` 限定，否則巢狀的細項也會被套用。
- 新增主訴層級的欄位時，記得加進 `build.py` 的 `quick_data`，否則精簡版拿不到。
- `node --test tests/`（目錄）在 Node 22 會失敗，要用 `tests/*.test.js`。
- 「無痛」這類特徵寫不出來：`pain_location` 是 multi，不能寫 `= no ...`（黑便踩過）；寫進 one_liner 就好。
- 共用項目新增選項（例如 assoc_gi 的 retching）會出現在**所有顯示整個項目**的主訴；不想讓舊主訴看到，就在舊主訴改用 `{item, options}` 列出子集。
- 共用疾病補特徵前，先看它原本有沒有同一個 `when`（例如 IBS 早就有 `relieving = defecation`）；項目已在新主訴顯示，舊特徵就會自動參與比對，重複寫會讓同一點選算兩次。
- 共用選項的 frag 若把兩種發現綁在一起（例如原本的「markedly distended and tympanic」），在新主訴可能與其他發現矛盾；拆開，並在 CHANGELOG 註明舊主訴輸出的改變。
- multi 項目的片段以 and 串接，選項要都是可並列的名詞片語；修飾語（如「惡臭」）併入某個選項，不要單獨成選項。

## 6. 驗證工具

**產生 HPI／PE、檢查排序與計數**（在專案根目錄執行；先 build）：

```bash
node -e "
const fs=require('fs'),Core=require('./src/core.js');
const h=fs.readFileSync('dist/POMD.html','utf8');
const d=Core.prepare(JSON.parse(h.match(/window\.POMD_DATA = (\{.*\});\n/)[1]));
const c=d.complaints.find(x=>x.id==='<id>'),I=d.items,s=Core.defaultState(c,I);
const t=(i,o,n=1)=>{for(let k=0;k<n;k++)Core.toggle(s,I[i],o)};   // presence: n=2 → absent
t('<item>','<option>');
const v={date_roc:'115/11/18'};
console.log(Core.composeText(c.hpi,s,I,v));console.log(Core.composeText(c.pe_text,s,I,v));
console.log(Core.orderGroups(c,s).map(e=>(e.promoted?'*':'')+e.group.group).join(' | '));
console.log(Core.rankByMatches(c,d.diseases,s,I).slice(0,6).map(x=>x.id+':'+x.n).join(', '));
"
```

**瀏覽器實測**（本機；雲端 session 現在也有預裝 Chromium，`require('playwright')` 直接可用）：
- 在 session scratchpad 執行 `npm i playwright-core`，不要裝進專案。
- `chromium.launch({ executablePath: ~/.cache/ms-playwright/chromium-<最新>/chrome-linux64/chrome })`，以 `file:///.../dist/POMD.html` 開啟。
- 檢查項目：
  - `selectOption('#complaint-select', '<id>')` 可以切換到新主訴。
  - 點 `[data-item="x"][data-opt="y"]` 後，右欄第一個群組、說明卡（`[data-disease=...]`）、`#output` 的 HPI 都正確。
- 同一個 context 再開 `POMD-history.html`，確認兩頁共用狀態，並勾選 `#toggle-edit` 看「Edit layout」模式。
- 收集 `pageerror` 和 console error，並截圖看版面。

## 7. 使用者的工作偏好

- 用繁體中文回覆；回報簡短，重點放在結果與「實作時自己做的決定」，讓使用者確認。
- 要使用者判斷的事，列成 Q1、Q2……，每題附選項與建議；能從程式或慣例決定的就直接做。
- 疾病內容不用使用者審核，也不要提醒；`status` 維持 `draft`。
- build 與測試通過後，直接 commit 並 push 到 `main`，不用再問。
- 改 `DESIGN.md` 的原則前要先問；流程第 8 步的例行更新（主訴表、milestone、已對齊的新功能）不用問。
