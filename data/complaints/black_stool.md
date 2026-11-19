# 主訴設計說明：Black stool（黑便）

> 狀態：**草稿，待佑達對齊**（尚未建立 `black_stool.yaml`）。通用原則見 `DESIGN.md`。
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

## 2. 病史項目（草案）

| 段落 | 項目 | 選項（草案） |
|---|---|---|
| Patient | sex, age_group〔共用〕 | |
| Stool & time course | stool_appearance〔新，multi〕 | tarry／sticky（tarry, black, sticky）、foul smell、black but formed、dark green / greenish-black、maroon / dark red、mixed with fresh blood |
| | melena_duration〔新，single〕 | today（< 24 h）、1–3 d、4–7 d → acute；1–4 wk → subacute；intermittent > 1 mo → chronic |
| | melena_count〔新，single〕 | once、2–3 times、≥ 4 times；last episode: today／ongoing（Q4） |
| | episodes〔共用，改問法〕 | first episode／recurrent（「以前也解過黑便嗎？」） |
| Is it really melena? | melena_mimic〔新，presence〕 | oral iron、bismuth（含鉍胃藥）、activated charcoal、dark foods（pig blood cake／duck blood、squid ink、black sesame）、Chinese herbal medicine |
| | swallowed_blood〔新，presence〕 | nosebleed、gum／dental bleeding、coughing up blood |
| Severity | assoc_other〔共用，標籤改為 Blood loss symptoms〕 | syncope、chest pain、dyspnea、diaphoresis、confusion |
| | blood_loss_sx〔新，presence〕 | dizziness on standing、palpitations、fatigue／exertional dyspnea（與 assoc_other 合併成一題也可，Q3） |
| Associated symptoms | assoc_gi〔共用〕 | hematemesis、**coffee-ground vomit〔新選項〕**、**retching before bleeding〔新選項〕**、nausea、vomiting、anorexia、early satiety、dysphagia、heartburn、hematochezia、bowel change |
| | pain_location〔共用，標籤 Pain location〕 | 全部位置 + None |
| | assoc_sys〔共用，標籤 Systemic〕 | weight loss、jaundice、fever、malaise |
| Medications | bleed_drugs〔新，presence〕 | aspirin、other antiplatelet（clopidogrel、ticagrelor）、warfarin、DOAC、NSAID／COX-2（含成分不明的止痛藥、酸痛藥）、corticosteroids、SSRI（Q2） |
| Relevant history | risk〔共用〕 | pud、hpylori、liver_disease、alcohol、gi_cancer_fhx、ibd、atherosclerosis、af |
| | bleed_history〔新，presence〕 | prior GI bleeding、known varices／cirrhosis、CKD／dialysis、aortic stenosis、aortic graft／AAA repair、prior gastric surgery |

設計上的決定：
- 「Black stool」在 `assoc_gi` 已有 melena 選項（腹痛、腹瀉用）；這個主訴本身就是黑便，所以不顯示該選項，改用 stool_appearance 描述。疾病的黑便特徵改寫成 `stool_appearance = tarry`。
- NSAID、抗凝在 `risk` 已有粗略選項（nsaid、anticoag）。黑便需要分清 aspirin、DAPT、warfarin、DOAC，所以另立 bleed_drugs，`risk` 在這個主訴不顯示 nsaid、anticoag（同一概念一個主訴只出現一次）。

## 3. 理學檢查

- General & vitals：general（comfortable、pale／diaphoretic、confused）、vitals（tachycardia、hypotension、tachypnea）、hydration（orthostatic、slow refill）、skin（pallor、icterus、liver stigmata、Virchow node）
- Liver：liver_pe（asterixis、spider angiomata、palmar erythema）
- Abdomen：abd_contour、bowel_sounds（hyperactive：上消化道出血常見）、guarding、tenderness、rebound、palpable（mass、hepatomegaly、splenomegaly、ascites）
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
| Peptic & mucosal (upper GI) | tarry | Peptic ulcer disease〔共〕、Gastritis（erosive gastritis／duodenitis）〔共〕、Erosive esophagitis〔新〕、Mallory-Weiss tear〔新〕 |
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

## 7. HPI／PE 範例（示意）

> (115/11/19) tarry, sticky black stools with a foul smell for 1–3 days, 2–3 times, last episode today. First episode. Associated with dizziness on standing and epigastric pain. Denied hematemesis, coffee-ground vomiting, or syncope. No oral iron, bismuth, or dark foods. Medications include aspirin and NSAIDs. Relevant history includes peptic ulcer disease.

> General: pale and diaphoretic.
> Vital signs: tachycardic, normotensive.
> Abdomen: hyperactive bowel sounds, soft, tenderness over the epigastrium, no rebound tenderness.
> Rectal exam: melena on the glove.

## 8. 待對齊的問題

1. **右欄排序項目**：用 stool_appearance 當 `group_item`（tarry → 上消化道、maroon → 小腸／右側大腸、成形黑／墨綠 → 假黑便），還是不設、依固定順序？**建議：設 stool_appearance。**
2. **藥物**：另立 bleed_drugs（分 aspirin、其他抗血小板、warfarin、DOAC、NSAID、類固醇、SSRI），還是沿用 `risk` 的 nsaid、anticoag 兩個粗選項？**建議：另立**（處置因藥物不同差很多）。
3. **嚴重度**：assoc_other（暈厥、胸痛、喘、冒冷汗、意識改變）＋新的 blood_loss_sx（起身頭暈、心悸、疲倦）分兩題，還是合併成一題新項目？**建議：合併成一題新項目 `blood_loss_sx`**（assoc_other 有 cough、polyuria 等不相干選項，且一題比較好問）。
4. **次數／最後一次**：只問次數（melena_count），還是另外問「最後一次是何時（today／yesterday／> 2 days ago）」？**建議：兩題都要**；最後一次是判斷是否仍在出血的關鍵。
5. **must-not-miss**：只標 variceal bleeding、aortoenteric fistula？還是 PUD（出血性潰瘍）也標？**建議：只標這兩個**，PUD 維持腹痛的標記（不標）。
6. **疾病範圍**：上表 11 個新疾病（erosive esophagitis、Mallory-Weiss、variceal bleeding、Dieulafoy、angiodysplasia、aortoenteric fistula、NSAID enteropathy、small bowel tumor、Meckel's、pseudo-melena、swallowed blood）是否合適？要刪減或補充？**建議：照表。**
7. **id 與名稱**：`black_stool`／「Black stool」（下拉選單顯示），還是 `melena`／「Melena」？**建議：`black_stool`**，因為病人說的是黑便，是否為真 melena 正是要問的。
