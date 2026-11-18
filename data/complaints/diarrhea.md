# 主訴設計說明：Diarrhea（腹瀉）

> 資料檔：`diarrhea.yaml`（同資料夾）。通用原則見 `DESIGN.md`；本文件只寫腹瀉特有的設計。
> 2026-11-18 與佑達對齊後實作；所有新疾病為 `draft`。

## 1. 追問框架與理由

腹瀉的鑑別不是靠「描述症狀本身」，而是靠**兩次分流**：

1. **時程**：acute（< 2 週）／persistent（2–4 週）／chronic（> 4 週）。急性多為感染、藥物，多數自限；慢性則轉向發炎、結構、吸收不良、功能性。這是第一個要問的問題。
2. **糞便型態**：watery／inflammatory（血便、黏液、發燒、裡急後重）／fatty（油、臭、浮、難沖）。決定機轉與檢查方向。

分流之後，再依時程追問重點不同的兩組問題：

- **急性 → 嚴重度與接觸史**：脫水程度決定處置；食物、旅遊、群聚、抗生素、住院決定病原方向。
- **慢性 → 器質性線索與病因**：夜間腹瀉、體重減輕、血便、50 歲以上新發生、家族史等 alarm features 區分 functional 與 organic；禁食是否停止（osmotic vs secretory）、用藥、手術史、甲狀腺／糖尿病等全身因素。

所以段落順序是：Patient → Time course → Stool → Abdominal pain → Associated symptoms → Exposures & triggers → Medications → Relevant history。

## 2. 病史項目

〔共用〕＝沿用既有項目，只顯示部分選項（yaml 的 `{item, options}`），必要時覆寫問法或標籤；〔新〕＝腹瀉新增的項目（`data/vocab/history.yaml` 的 Diarrhea 段）。

| 段落 | 項目 |
|---|---|
| Patient | sex, age_group〔共用〕。不放 repro_status |
| Time course | diarrhea_duration〔新〕、diarrhea_pattern〔新〕、episodes〔共用，改問法〕 |
| Stool | stool_character〔新〕、stool_frequency〔新〕、stool_volume〔新〕、nocturnal_stool〔新〕、fasting_effect〔新〕 |
| Abdominal pain | pain_location、pain_quality（cramping、colicky、dull、burning）、relieving（defecation、nothing）〔共用，改標籤與問法〕 |
| Associated symptoms | assoc_gi（nausea、vomiting、anorexia、bloating、tenesmus／urgency、melena）〔共用〕、continence〔新〕、assoc_sys（fever、chills、weight loss、night sweats、malaise；標籤改為 Systemic）〔共用〕、dehydration_sx〔新〕、extraintestinal〔新〕 |
| Exposures & triggers | exposure〔新〕、food_trigger〔新〕 |
| Medications | diarrhea_drugs〔新〕 |
| Relevant history | risk（travel、sick contacts、immunocompromised、IBD、family history of GI cancer、diabetes、alcohol、NSAID、new medication）〔共用〕、diarrhea_history〔新〕 |

設計上的決定：
- **共用詞彙**（Q1 採 (a)）：概念相同就沿用既有項目，只顯示需要的選項。例如 travel、sick contacts 仍是 `risk` 的選項，所以放在 Relevant history 段，不另立 exposure 選項。
- **另立新項目的情況**：描述主訴本身的項目（如 stool_character，相當於腹痛的 pain_quality）。腹痛的 `assoc_gi` 仍保留 diarrhea、bloody_diarrhea、steatorrhea 作為「伴隨症狀」；兩個主訴各自只顯示自己的那一套，疾病兩邊都寫特徵。
- **onset 不放**：它的「Sudden」選項標了 red flag，這是針對腹痛；對腹瀉，時程已由 duration 表達。
- **nocturnal 不共用**：腹痛的 `nocturnal` 片段寫的是被「痛」醒，所以另立 nocturnal_stool。
- **urgency 不另立**：沿用 `assoc_gi` 的 tenesmus（Tenesmus / urgency）；新項目 continence 只放大便失禁。

## 3. 理學檢查

- General & vitals：general（comfortable、ill、dehydrated、confused）、vitals（fever、tachycardia、hypotension）、hydration〔新〕、skin（pallor、icterus）、systemic_pe〔新：erythema nodosum、oral ulcers、goiter、tremor〕
- Abdomen：abd_contour、bowel_sounds、guarding、tenderness、rebound、palpable（mass、hepatomegaly）
- Rectal：rectal（含 hard stool：overflow diarrhea 的關鍵）
- 預設點選：與腹痛相同（soft、non-tender）

## 4. 時程界線

`diarrhea_duration`：<3 d、3–7 d、1–2 wk 為 acute；2–4 wk 為 subacute（persistent）；1–3 mo、>3 mo 為 chronic。
腹痛的 `duration` 把 1–4 wk 都算 subacute，對腹瀉來說界線不對，所以另立項目（Q2）。

## 5. 鑑別診斷分組

**分組軸**：機轉；時程只用來把急性感染切開，其餘時程由右欄的 A／S／C 徽章提示（Q3）。
**排序項目**：`group_item: stool_character`。

| 群組 | 排序對應 | 疾病（★ = must-not-miss；〔共〕= 與腹痛共用） |
|---|---|---|
| Acute infectious — inflammatory | bloody, mucus | Invasive bacterial enterocolitis（Campylobacter、Salmonella、Shigella）、STEC／EHEC★、C. difficile infection★、Amoebic colitis、Infectious ileocecitis〔共〕 |
| Acute infectious — watery | watery | Acute gastroenteritis（viral）〔共〕、Bacterial food poisoning（S. aureus、B. cereus、V. parahaemolyticus）、C. difficile infection★ |
| Drug-induced / iatrogenic | — | Drug-induced diarrhea、C. difficile infection★ |
| Chronic inflammatory / structural | bloody, mucus | Ulcerative colitis〔共〕、Crohn's disease〔共〕、Intestinal tuberculosis、Colorectal cancer〔共〕、Ischemic colitis〔共〕 |
| Chronic watery | watery, loose | IBS〔共〕、Microscopic colitis、Bile acid diarrhea、Lactose intolerance |
| Fatty / malabsorptive | greasy | Chronic pancreatitis〔共〕、SIBO |
| Systemic & mimics | — | Hyperthyroidism、Overflow diarrhea（fecal impaction） |

- 急性感染依「症候群」分，不依單一病原（Q4）。既有的 `acute_gastroenteritis` 當作 viral gastroenteritis。
- must-not-miss 只標 C. difficile 與 STEC。Ischemic colitis、CRC 沿用腹痛的標記（未標）（Q5）。
- C. difficile 同時放在三個群組（不一定有血便；抗生素史才是關鍵）。
- 共用疾病另外加上腹瀉的特徵，在 yaml 中以 `# diarrhea complaint` 註解分隔。各主訴只顯示、只計算自己有提供的項目與選項（DESIGN 4.6）。
- 台灣臨床脈絡：生食海鮮與 V. parahaemolyticus（夏季）、腸結核（mimics Crohn's，免疫抑制前要排除）、阿米巴（現多為 MSM／HIV）、乳糖不耐盛行率高、celiac 罕見。
- 考慮過但先不放：celiac disease（台灣罕見）、giardiasis、neuroendocrine tumor、diabetic autonomic diarrhea、CMV colitis。
- 重症狀況（toxic megacolon、HUS、敗血症、嚴重脫水）是併發症，寫在相關疾病的 pitfalls。

## 6. 建議檢查

見 yaml 的 `labs`／`imaging`。原則：
- 急性水瀉大多不需要檢查。
- 以下情況才做 stool culture：血便、發燒、重症、免疫不全、持續 > 7 天。
- 有抗生素或住院史時，測 C. difficile。
- 慢性腹瀉：fecal calprotectin、FIT、TSH、HbA1c、albumin；油便時加測 fecal elastase。
- 慢性腹瀉或有 alarm features 時做大腸鏡，並做隨機切片。

## 7. HPI／PE 範例（實際輸出）

> (115/11/18) watery diarrhea for less than 3 days, 6–10 times a day, large in volume. Periumbilical pain, described as crampy. Associated with nausea and vomiting. Denied fever. Recent exposure to raw or undercooked seafood. No antibiotics in the past 3 months. Relevant history includes sick contacts or a suspicious food exposure.

> General: dry mucous membranes.
> Vital signs: tachycardic, afebrile.
> Abdomen: hyperactive bowel sounds, soft, tenderness over the entire abdomen, no rebound tenderness.
