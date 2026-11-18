# POMD — 門診主訴追問與鑑別診斷輔助工具 設計文件

> 版本：v0.1（2026-10-31）
> 作者：林佑達（肝膽腸胃科）＋ Claude
> 狀態：個人使用版，第一個主訴為「腹痛」

---

## 1. 目標與定位

一個在門診與病人對談時使用的輔助工具，靈感來自 *Problem-Oriented Medical Diagnosis*（POMD）與 *Symptom to Diagnosis*。

醫師選定主訴後，工具會：

1. 列出應追問的病史項目（可點選答案），並可顯示道地的英文問法
2. 提醒應做的理學檢查（可點選發現）
3. 列出建議的抽血與影像／內視鏡檢查
4. 在旁邊列出鑑別診斷，並依已點選的內容**標亮**相關診斷
5. 點開某個診斷時，顯示「疾病說明卡」，並把目前已點選的症狀與 PE 跟典型表現比對
6. 自動組成英文 HPI 與 PE 段落，一鍵複製貼進病歷

**不做的事**：不計算機率、不打分數、不給「最可能診斷」。權重判斷留給醫師自己。

---

## 2. 使用情境與限制

- 使用者：佑達本人，門診中一邊跟病人說話、一邊用**滑鼠點選**
- 裝置：醫院 Windows 11 電腦，瀏覽器 Edge／Chrome／Firefox；手機為備案（版面需能在窄螢幕使用）
- **完全離線**：不連網、不載入任何外部 CDN 或字型
- 提供「New patient」按鈕一鍵清空
- 介面語言：**全英文**

---

## 3. 畫面配置

```
┌──────────────────────────────────────────────────────────────────┐
│ [Chief complaint: Abdominal pain ▼]  [☐ Show English phrasing]  [New patient] │
├───────────────────────┬──────────────────────┬───────────────────┤
│ 左欄：History          │ 中欄：Physical exam   │ 右欄：Differential │
│  - 各追問項目          │  - PE 項目（可點發現） │  - 依位置分組      │
│  - 每項一排可點選項    │ ──────────────────── │  - Must-not-miss  │
│  - （開關打開時）       │ Labs（建議清單）      │    紅色標示        │
│    顯示 2–3 種英文問法  │ Imaging / Endoscopy  │  - 相關者標亮      │
│                       │ （建議清單）          │  - 點診斷 → 說明卡 │
├───────────────────────┴──────────────────────┴───────────────────┤
│ 下方：Generated HPI + PE（即時更新）              [Copy]          │
└──────────────────────────────────────────────────────────────────┘
```

- **疾病說明卡**：點右欄某診斷時開啟（側邊面板或浮動視窗，由實作決定），可隨時關閉
- 手機版：三欄改為上下堆疊或分頁切換

---

## 4. 核心功能規格

### 4.1 左欄：病史追問

- 大致依 **LQQOPERA** 順序排列：Location、Quality、Quantity（severity）、Onset／duration、Precipitating factors、Exacerbating／relieving factors、Radiation、Associated symptoms
- 不硬套框架：腹痛常用但不屬於上述任一項的內容（排便習慣改變、和進食的關係、體重減輕、發燒、黃疸、GI bleeding、red flags 等），放在 Associated symptoms 或其他最合適的位置，由內容設計者判斷
- 每個項目有一排選項按鈕；可單選或複選（依項目性質設定，例如 Location 可複選、Severity 單選）
- 再點一次可取消選取
- **英文問法**：每個項目附 2–3 種給病人聽的英文問法（開放式／封閉式，或正式／口語），由頂部總開關控制是否顯示

### 4.2 中欄：理學檢查、抽血、影像

- **PE**：每個 PE 項目可點選發現（例如 Murphy's sign: positive／negative；Tenderness 位置；Rebound；Guarding；Bowel sounds；Jaundice……），點選結果會：
  - 參與疾病說明卡的比對
  - 帶入下方的 PE 段落
- **Labs** 與 **Imaging / Endoscopy**：只是建議清單，不可點選、不參與比對

### 4.3 右欄：鑑別診斷清單

- 依位置分組（RUQ、Epigastric、LUQ、Periumbilical／Diffuse、RLQ、LLQ、Suprapubic、Flank）；點選 Location 後，該位置的群組排到最前面
- **Must-not-miss** 診斷以紅色標示，並且一直顯示
- **標亮規則**：只要某疾病的典型特徵（症狀或 PE）中，有任何一項被醫師點選，該疾病就標亮；可顯示符合的數量，例如「3」，但**不做權重計算或排序**
- **Acute／Chronic**：依 Onset／duration 的選擇，標亮相對應時程的疾病（例如選 acute 時，急腹症更突出）。疾病資料需標記其典型時程
- 不做「變淡／排除」

### 4.4 疾病說明卡

段落（v0.1）：

1. **One-liner**：一句話的典型描述
2. **Typical symptoms**：典型症狀特徵（可比對）
3. **Typical PE findings**：典型理學檢查發現（可比對）
4. **Typical labs**：典型抽血變化（純文字）
5. **Recommended imaging / endoscopy**：建議檢查（純文字）
6. **Pitfalls**：容易誤判或需要注意的地方

**三色比對**（只針對第 2、3 段）：

- 🟢 **Match**：醫師點選的正好是這個典型特徵
- ⚪ **Not asked**：這個項目還沒有點選
- 🟠 **Different**：同一項目點了其他選項（例如典型為 RUQ，但點了 LLQ）

第三種狀態不需要額外資料：因為特徵是以「項目 + 選項」表示，程式可以自行判斷同一項目是否點了別的選項。

### 4.5 輸出：HPI 與 PE

- 英文，大致依 LQQOPERA 順序組句；未點選的項目略過
- 每個選項自帶一段 HPI 片段，由程式組成自然的句子
- 範例（示意）：
  > The patient presented with epigastric and RUQ pain for 2 days, described as colicky, severity 7/10, onset after a fatty meal, radiating to the right shoulder. Associated with nausea and vomiting. Denied fever, jaundice, or melena.
- 陰性症狀（Denied ...）：Associated symptoms 項目需要能點「present／absent」，absent 的項目組成 "Denied ..." 句
- PE 段落同理，例如 "Abdomen: soft, tenderness over RUQ, Murphy's sign positive, no rebound tenderness."
- [Copy] 按鈕：一鍵複製 HPI + PE。需在 `file://` 開啟時也能運作（Clipboard API 失效時改用備援方法）

---

## 5. 資料架構（重要）

**原則：內容和程式分開；疾病是獨立單位；症狀詞彙統一。**
這三點同時也是日後轉成「多醫師協作版」的基礎。

### 5.1 三種資料

1. **Complaint（主訴範本）**，例如 `abdominal_pain`
   - History items：項目 id、名稱、單選／複選、選項清單、英文問法（2–3 種）
   - 每個選項：id、顯示文字、HPI 片段
   - PE items：結構同上，選項為發現，附 PE 段落片段
   - Labs 建議清單、Imaging／Endoscopy 建議清單
   - 鑑別診斷：依位置分組，**引用**疾病 id（不在主訴檔內重寫疾病內容）
2. **Disease（疾病）**，每個疾病一份
   - id、名稱、是否 must-not-miss、典型時程（acute／chronic／both）
   - One-liner、Typical labs、Imaging／endoscopy、Pitfalls（純文字）
   - Typical symptoms 與 Typical PE：以「項目 id + 選項 id」表示，並附一段給人看的說明文字
3. **共用詞彙**：項目與選項的 id 在所有主訴、疾病間一致，同一個特徵只有一種寫法

### 5.2 推導關係

- 右欄的標亮 = 用疾病的典型特徵反查；**不另外維護「選項 → 疾病」的對照表**
- 說明卡的三色比對 = 疾病特徵 vs 目前點選狀態

### 5.3 檔案組織（建議，由實作決定細節）

- 原始內容放在 `data/`（主訴與疾病分檔），格式需讓 Claude Code 容易閱讀修改
- 用一個簡單的建置腳本（Python 即可）把程式與內容組成 **`dist/POMD.html` 單一檔案**，可直接複製到醫院電腦、雙擊開啟
- 建置時做基本的一致性檢查：疾病引用的項目／選項 id 是否存在、主訴引用的疾病 id 是否存在
- 純 HTML + CSS + 原生 JavaScript，不依賴框架與外部資源

---

## 6. 腹痛範本內容範圍（初稿方向）

涵蓋慢性／亞急性（門診主體）與急性外科急腹症（must-not-miss）。以下為初步清單，內容設計時可增減：

| 位置 | 疾病（★ = must-not-miss） |
|---|---|
| RUQ | Biliary colic、Acute cholecystitis★、Choledocholithiasis、Acute cholangitis★、Acute hepatitis、Liver abscess★、Right lower lobe pneumonia |
| Epigastric | Peptic ulcer disease、Perforated peptic ulcer★、Functional dyspepsia、GERD、Gastritis、Acute pancreatitis★、Chronic pancreatitis、Gastric cancer、Acute coronary syndrome★ |
| LUQ | Splenic infarction、Splenic rupture★ |
| Periumbilical／Diffuse | Early appendicitis、Small bowel obstruction★、Acute mesenteric ischemia★、Acute gastroenteritis、IBS、Constipation、Peritonitis／hollow viscus perforation★、Ruptured AAA★、DKA★ |
| RLQ | Acute appendicitis★、Crohn's disease、Infectious ileocecitis、Ectopic pregnancy★、Ovarian torsion★ |
| LLQ | Diverticulitis、Ischemic colitis、Ulcerative colitis、Colorectal cancer、Sigmoid volvulus★ |
| Suprapubic | Cystitis、Acute urinary retention、Pelvic inflammatory disease |
| Flank | Renal colic（urolithiasis）、Acute pyelonephritis |

- 一個疾病可以出現在多個位置群組（例如 appendicitis 同時在 periumbilical 與 RLQ）
- 婦科疾病的標亮可搭配「女性／懷孕可能」相關項目

---

## 7. 內容撰寫原則

- 內容由 Claude 起草、佑達審核；之後的增修都透過 Claude Code
- **不得從教科書直接抄錄**；POMD／Symptom to Diagnosis 只參考其結構與方法，內容依臨床知識與指引自行撰寫
- 英文問法要自然、道地，適合對英語系病人使用
- 每份疾病資料標註審核狀態（例如 `draft` ／ `reviewed`），方便追蹤哪些已經看過

---

## 8. 暫不處理（之後再議）

- 多主訴同時開啟與合併
- 多醫師協作／公開專案（屆時參考本版另開新專案重構）
- 內容審閱模式（先做出基本版再決定）
- 與 QuickHand（HIS 自動填入）串接
- 抽血、影像結果的點選與比對
- 任何機率或權重計算

---

## 9. 開發節奏建議

1. **M1 骨架**：完成三欄介面、點選、標亮、說明卡三色比對、HPI 產生與複製，先用 5～6 個疾病驗證流程
2. **M2 腹痛完整內容**：依第 6 節補齊所有疾病與項目
3. **M3 佑達試用與審核**：門診試用後依回饋調整，再決定審閱方式
