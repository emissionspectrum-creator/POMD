# 主訴設計說明：Black stool（黑便）

> 資料檔：`black_stool.yaml`（同資料夾）。通用原則見 `DESIGN.md`。2026-11-19 與佑達對齊（Q1–Q7 照建議）後實作；新疾病皆為 `draft`。
> 標記：〔共用〕＝沿用既有項目（只顯示相關選項）；〔新〕＝新增項目；〔共〕＝與其他主訴共用的疾病。

## 1. 追問框架與理由

黑便的問診是**三步分流**，順序就是左欄段落順序：

1. **是不是真的 melena？** 先描述糞便（柏油狀、黏、特殊惡臭 vs 成形的黑或墨綠），再問「假黑便」的原因：鐵劑、鉍劑、活性碳、深色食物（豬血糕、鴨血、墨魚、黑芝麻）、中藥；以及吞下的血（流鼻血、牙齦出血、咳血）。這一步決定後面要不要緊張。
2. **嚴重度與進行中與否**：最後一次黑便是什麼時候、幾次、有無頭暈／暈厥／心悸／喘／胸痛，有無合併嘔血、咖啡渣樣嘔吐、暗紅色血便（暗紅色可能是很快的上消化道出血）。這是決定「今天要不要轉急診」的段落。工具**不計算** Glasgow-Blatchford score（不做權重），只把它的要素列在建議檢查的說明中。
3. **找來源（病因）**：
   - 消化性：NSAID／aspirin、H. pylori、潰瘍史、上腹痛、胃食道逆流
   - 門脈高壓：肝硬化、B／C 肝、酒精、已知靜脈瘤
   - 腫瘤：體重減輕、食慾差、早飽、吞嚥困難、家族史、排便習慣改變
   - 血管病灶：洗腎／CKD、主動脈瓣狹窄、腹主動脈手術史（aortoenteric fistula）
   - 劇烈嘔吐後才吐血（Mallory-Weiss）
   - 抗凝血／抗血小板藥物：不是病因，但會放大任何病灶的出血

段落：Patient → Stool & time course → Is it really melena? → Severity → Associated symptoms → Medications → Relevant history。

## 2. 病史項目

| 段落 | 項目 | 選項 |
|---|---|---|
| Patient | sex, age_group〔共用〕 | |
| Stool & time course | stool_appearance〔新，multi；`group_item`〕 | tarry, sticky, foul（惡臭併入此選項）、black but formed、dark green、maroon／dark red、mixed with fresh blood |
| | melena_duration〔新〕 | < 24 h、1–3 d、4–7 d（acute）；1–4 wk（subacute）；on and off > 1 mo（chronic） |
| | melena_count〔新〕 | once、2–3 times、4 or more |
| | melena_last〔新〕 | today、yesterday、> 2 days ago、normal stool since（Q4） |
| | episodes〔共用，改問法〕 | first／recurrent |
| Is it really melena? | melena_mimic〔新，presence〕 | oral iron、bismuth antacids、activated charcoal、dark foods（豬血糕、鴨血、墨魚、黑芝麻） |
| | herbs〔共用，只顯示 chinese_herbal〕 | Chinese herbal medicine |
| | swallowed_blood〔新，presence〕 | nosebleed、gum／dental bleeding、coughing up blood |
| Severity | blood_loss_sx〔新，presence〕 | dizzy on standing、syncope、palpitations、chest pain、short of breath、cold sweats、confusion、fatigue（Q3：合併成一題） |
| Associated symptoms | assoc_gi〔共用〕 | hematemesis、coffee-ground vomit〔新選項〕、retching before bleeding〔新選項〕、nausea、vomiting、anorexia、early satiety、dysphagia、heartburn、hematochezia、bowel change |
| | pain_location〔共用，標籤 Abdominal pain〕 | 全部位置 |
| | assoc_sys〔共用，標籤 Systemic〕 | weight loss、jaundice、fever、malaise |
| Medications | bleed_drugs〔新，presence〕 | aspirin、other antiplatelet、warfarin、DOAC、NSAID／COX-2（含成分不明止痛藥）、corticosteroids、SSRI（Q2） |
| Relevant history | risk〔共用〕 | pud、hpylori、liver_disease、alcohol、gi_cancer_fhx、ibd、atherosclerosis、af |
| | bleed_history〔新，presence〕 | prior GI bleeding、known varices、CKD／dialysis、aortic stenosis、aortic graft／AAA repair、prior gastric surgery |

設計上的決定：
- 「Black stool」在 `assoc_gi` 已有 melena 選項（腹痛、腹瀉用）；這個主訴本身就是黑便，所以不顯示該選項，改用 stool_appearance 描述。疾病的黑便特徵改寫成 `stool_appearance = tarry`。
- NSAID、抗凝在 `risk` 已有粗略選項（nsaid、anticoag）。黑便需要分清 aspirin、DAPT、warfarin、DOAC，所以另立 bleed_drugs，`risk` 在這個主訴不顯示 nsaid、anticoag（同一概念一個主訴只出現一次）。

## 3. 理學檢查

- General & vitals：general（comfortable、pale／diaphoretic、confused）、vitals（tachycardia、hypotension、tachypnea）、hydration（orthostatic、slow refill）、skin（pallor、icterus、liver stigmata、Virchow node）
- Chronic liver disease：liver_pe（asterixis、spider angiomata、palmar erythema）
- Abdomen：abd_contour、bowel_sounds（hyperactive：上消化道出血常見）、guarding、tenderness、rebound、palpable（mass、hepatomegaly、splenomegaly、ascites）
- Nose, mouth & skin：bleed_pe〔新〕（blood in nose／pharynx、mucocutaneous telangiectasias、bruising／purpura）
- Rectal：rectal（melena on glove、fresh blood、mass、normal）— **這是確認 melena 最重要的 PE**
- 預設點選：soft、non-tender（同腹痛）

## 4. 時程界線

`melena_duration`：today、1–3 d、4–7 d 為 acute；1–4 wk 為 subacute；intermittent > 1 mo 為 chronic。
急性大量出血多為潰瘍、靜脈瘤、Mallory-Weiss；間歇、慢性的黑便或缺鐵性貧血多為腫瘤、血管病灶、小腸病灶。

## 5. 鑑別診斷分組

**分組軸**：出血來源與機轉。
**排序項目**：`group_item: stool_appearance`（Q1）——tarry → 上消化道群組排前；maroon／mixed fresh blood → 小腸與右側大腸排前；black formed／dark green → 「Not true melena」排前。

| 群組 | 排序對應 | 疾病（★ = must-not-miss；〔共〕= 與其他主訴共用） |
|---|---|---|
| Peptic & mucosal (upper GI) | tarry | Peptic ulcer disease〔共〕、Gastritis（erosive gastritis／duodenitis）〔共〕、Erosive esophagitis〔新〕、Mallory-Weiss tear〔新；使用者確認維持此名稱〕 |
| Portal hypertension | tarry | Variceal bleeding★〔新〕（portal hypertensive gastropathy 寫在 pitfalls） |
| Upper GI tumor & vascular | tarry | Gastric cancer〔共〕、Dieulafoy lesion〔新〕、Angiodysplasia〔新〕、Aortoenteric fistula★〔新〕 |
| Small bowel & right colon | maroon, mixed | Angiodysplasia〔新〕、NSAID enteropathy〔新〕、Small bowel tumor（GIST、lymphoma）〔新〕、Meckel's diverticulum〔新〕、Crohn's disease〔共〕、Colorectal cancer〔共〕 |
| Not true melena | formed, dark_green | Pseudo-melena（iron、bismuth、food）〔新〕、Swallowed blood（epistaxis、hemoptysis）〔新〕 |

- PUD 保持 must_not_miss: false（腹痛已這樣標）；在說明卡以 pitfalls 提醒「出血性潰瘍是最常見的上消化道出血原因」。★ 只標 variceal bleeding、aortoenteric fistula（Q5）。
- 共用疾病補 `# black_stool complaint` 特徵段（PUD、gastritis、gastric cancer、CRC、Crohn's）。
- 台灣臨床脈絡：H. pylori 盛行率仍高、B 肝相關肝硬化、心血管病人 aspirin／clopidogrel／DOAC 使用普遍、地下電台或來路不明的酸痛藥可能含 NSAID 或類固醇、洗腎人口多（angiodysplasia）、豬血糕／鴨血造成假黑便、孕婦與貧血病人常吃鐵劑。
- 考慮過但先不放：hemobilia、hemosuccus pancreaticus、Cameron lesion、GAVE（寫進 angiodysplasia 或 variceal 的 pitfalls）、esophageal cancer（黑便少見）、coagulopathy（不是病灶，放在藥物與檢查）。

## 6. 建議檢查

- CBC（Hb；MCV 低表示慢性失血）、BUN／creatinine（BUN／Cr 比值高支持上消化道出血）、PT／INR、type & screen
- LFT、albumin、platelet（肝硬化線索）
- Ferritin／iron studies（慢性、間歇性）
- H. pylori（潰瘍確診後）
- Stool occult blood：只在懷疑假黑便時參考（鐵劑不會讓 guaiac 陽性；FIT 對上消化道出血不敏感）
- Glasgow-Blatchford score 的要素（BUN、Hb、SBP、HR、melena、syncope、肝病、心衰竭）列在說明中；工具不計算
- 影像／內視鏡：EGD（24 小時內）、EGD 陰性再做 colonoscopy、capsule endoscopy／CT enterography（小腸）、CT angiography（進行中的大量出血）、Meckel scan（年輕人）

## 7. HPI／PE 範例（實際輸出）

> (115/11/19) tarry, sticky, foul-smelling black stools for 1–3 days, 2–3 episodes, the last one today. This is the first such episode. Associated with dizziness on standing. Epigastric pain. Denied syncope or presyncope, hematemesis, or coffee-ground vomiting. No oral iron or dark foods (pig blood cake, duck blood, squid ink, black sesame). Medications include aspirin and NSAIDs or COX-2 inhibitors. Not taking direct oral anticoagulants. Relevant history includes peptic ulcer disease. No history of an aortic graft or AAA repair.

> General: pale and diaphoretic.
> Vital signs: tachycardic, normotensive.
> Skin & eyes: conjunctival pallor.
> Other: no blood in the nose or pharynx.
> Abdomen: hyperactive bowel sounds, soft, non-tender.
> Rectal exam: melena on the glove.

## 8. 對齊結果與實作差異

- Q1–Q5、Q7 照建議；Q6 照表（Mallory-Weiss tear 維持此名稱）。
- 與草稿不同之處：
  - 「foul smell」併入 tarry 選項，不另立選項：multi 項目的片段會以 and 串接，單獨的「惡臭」讀起來不通順。
  - Chinese herbal medicine 沿用 abnormal_lft 的 `herbs`（只顯示該選項），不放在 melena_mimic，避免同一概念兩種寫法。
  - assoc_gi 新增的 retching 只在本主訴顯示；腹痛改用 `{item, options}` 列出原有選項加上 coffee-ground vomit。
  - 「無痛」（painless）無法表達：`pain_location` 是 multi，不能寫 `= no ...`；改寫在 one_liner。
  - PE 新增 bleed_pe（鼻咽血塊、黏膜皮膚微血管擴張、瘀青）。
