# 主訴設計說明：Unintentional weight loss（非刻意體重減輕）

> 狀態：**草稿，待佑達對齊**（尚未建立 `weight_loss.yaml`）。通用原則見 `DESIGN.md`。
> 標記：〔共用〕＝沿用既有項目（只顯示相關選項）；〔新〕＝新增項目；〔共〕＝與其他主訴共用的疾病。

## 1. 追問框架與理由

體重減輕本身不指向任何器官，所以先**確認是真的、有意義的減輕**，再用**食慾**一刀分流，最後**依病因類別逐一排除**（類似 abnormal_lft 的病因型，但多一個排序軸）：

1. **確認與量化**：是否刻意（節食、運動、GLP-1）、減了多少（> 5%／6–12 月才有臨床意義，> 10% 為 red flag）、多久、有沒有客觀紀錄（量過、衣服變鬆、別人說）。
2. **食慾分流**（同時是右欄排序）：
   - 食慾**變差** → 惡性腫瘤、憂鬱／失智／社會因素、慢性器官衰竭、感染、上消化道疾病
   - 食慾**正常或變好**卻瘦 → 甲狀腺亢進、控制不良的糖尿病、吸收不良（胰臟外分泌不足、Crohn、SIBO）
   - 「想吃但吃不下／不敢吃」→ 吞嚥困難、早飽、餐後痛、牙口問題
3. **依系統追問**，一個方向一段：GI（吞嚥、早飽、嘔吐、排便改變、油便、出血）→ 全身與感染（發燒、盜汗、淋巴結、咳嗽、TB 接觸、HIV 風險）→ 內分泌（怕熱心悸、多喝多尿、姿勢性頭暈／皮膚變黑）→ 心肺腎（喘、腳腫、COPD、CKD）→ 情緒、認知與生活（情緒低落、記憶退化、怕胖、獨居／經濟、牙口）。
4. **藥物、物質與病史**：GLP-1、SGLT2i、metformin、topiramate、甲狀腺素、興奮劑；酒精（沿用收合細項）、抽菸、**檳榔**（口腔癌，台灣脈絡）；癌症篩檢狀況、胃切除、慢性胰臟炎、B／C 肝。

段落草案：Patient → Weight loss → Intake & GI → Systemic & infection → Endocrine → Heart, lung & kidney → Mood, cognition & social → Medications, substances & history。

## 2. 病史項目

| 段落 | 項目 | 選項（草案） |
|---|---|---|
| Patient | sex, age_group〔共用〕 | |
| Weight loss | wl_intent〔新，single〕 | unintentional、partly intentional（減得比預期多）、intentional |
| | wl_amount〔新，single〕 | < 5%、5–10%、> 10%（red flag）；note 提示 kg 換算 |
| | wl_duration〔新；`timecourse_item`〕 | < 1 mo（acute）、1–6 mo（subacute）、6–12 mo、> 12 mo（chronic） |
| | appetite〔新，single；`group_item`〕 | decreased、normal、increased、wants to eat but can't（吃不下／不敢吃） |
| | wl_evidence〔新，presence〕 | weighed／records、clothes looser、others noticed |
| Intake & GI | assoc_gi〔共用〕 | nausea、vomiting、dysphagia、early satiety、heartburn、diarrhea、steatorrhea、bowel change、constipation、melena、hematochezia |
| | intake_barrier〔新，presence〕 | painful swallowing、dental／chewing problems、pain after eating（fear of eating）、mouth ulcer／non-healing sore |
| | pain_location〔共用，標籤 Abdominal pain〕 | |
| Systemic & infection | assoc_sys〔共用〕 | fever、night sweats、malaise、jaundice、pruritus |
| | wl_systemic〔新，presence〕 | lump／swollen glands、bone pain、persistent cough > 2 wk、hemoptysis、hoarseness |
| | tb_hiv_risk〔新，presence〕 | TB contact／prior TB、HIV risk（沿用 `risk.sti_risk`？見 Q4） |
| Endocrine | extraintestinal〔共用，只顯示 thyrotoxic〕 | heat intolerance／palpitations |
| | endo_sx〔新，presence〕 | thirst／polyuria（或沿用 `assoc_other.polyuria`）、dizziness on standing／salt craving、skin darkening |
| Heart, lung & kidney | assoc_other〔共用〕 | dyspnea、cough（若 wl_systemic 已有 cough 就不放） |
| | congestion_sx〔共用〕 | orthopnea、leg swelling、known heart failure |
| | organ_history〔新，presence〕 | COPD、CKD／dialysis |
| Mood, cognition & social | psych_social〔新，presence〕 | low mood／loss of interest、poor sleep、memory decline、fear of weight gain／restricting food、lives alone／difficulty getting food、financial difficulty |
| Medications, substances & history | wl_drugs〔新，presence〕 | SGLT2 inhibitor、topiramate、thyroxine、stimulants（ADHD 藥）、new or many medications；GLP-1、metformin 沿用既有項目（Q4） |
| | alcohol_use〔共用，細項〕 | |
| | risk〔共用，標籤 Past history〕 | smoking、diabetes、PUD、H. pylori、GI cancer family history、immunocompromised、liver disease |
| | betel〔新選項或項目〕 | betel nut chewing |
| | diarrhea_history〔共用，標籤 GI history〕 | gastrectomy／bariatric、chronic pancreatitis、hyperthyroidism |
| | screening〔新，presence〕 | colonoscopy／FIT、LDCT、mammography、Pap smear 最近有做（"Up to date" 的有／沒有） |

## 3. 理學檢查

- General & vitals：general（comfortable、ill、dehydrated、confused）、vitals（fever、tachycardia、hypotension、tachypnea）
- 新 `wasting_pe`〔新，presence〕：low BMI（< 18.5）、temporal wasting、muscle wasting、loose skin folds
- Head & neck：skin（pallor、icterus、virchow）、infection_pe（lymphadenopathy）、systemic_pe（goiter、tremor）、新 `oral_pe`（oral thrush、poor dentition、oral lesion／leukoplakia）、hyperpigmentation（adrenal）
- Chest：chest／congestion_pe（crackles、JVP、edema）；新 wheeze／reduced breath sounds？
- Abdomen：tenderness、palpable（mass、hepatomegaly、splenomegaly、ascites）
- Rectal：normal、mass、melena
- 預設點選：soft、non-tender（同其他主訴）。

## 4. 時程界線

`wl_duration`：< 1 月為 acute（DKA、急性感染、急性疾病後）；1–6 月為 subacute（惡性腫瘤、甲亢、TB、憂鬱）；> 6 月為 chronic（吸收不良、慢性器官衰竭、失智、飲食疾患）。定義上「有意義的體重減輕」= 6–12 月內 > 5%，所以 6–12 月與 > 12 月分開列。

## 5. 鑑別診斷分組

**分組軸**：病因類別。**排序項目**：`group_item: appetite`（Q1）。

| 群組 | 排序對應 | 疾病（★ = must-not-miss；〔共〕= 與其他主訴共用） |
|---|---|---|
| Malignancy | decreased、cant_eat | Gastric cancer〔共〕、Colorectal cancer〔共〕、Liver malignancy〔共〕、Pancreatic cancer ★〔新〕、Esophageal cancer ★〔新〕、Lung cancer ★〔新〕、Lymphoma ★〔新〕、Oral／head & neck cancer ★〔新，Q3〕 |
| Upper GI & intake | cant_eat | Peptic ulcer〔共〕、Gastric outlet obstruction ★〔共〕、Achalasia〔新，Q3〕 |
| Malabsorption | normal、increased | Chronic pancreatitis〔共〕、Crohn's disease〔共〕、SIBO〔共〕 |
| Endocrine & metabolic | normal、increased | Hyperthyroidism〔共〕、Uncontrolled diabetes〔新〕、Adrenal insufficiency ★〔新〕 |
| Infection | decreased | Pulmonary tuberculosis ★〔新〕、HIV infection ★〔新〕、Intestinal TB〔共〕 |
| Chronic organ disease | decreased | Heart failure（cardiac cachexia）〔共〕、COPD〔新〕、CKD〔新〕、Cirrhosis（Q3） |
| Psychiatric, cognitive & social | decreased | Depression〔新〕、Dementia／frailty〔新〕、Eating disorder ★〔新〕 |
| Drugs & substances | — | Drug-induced weight loss〔新〕、Alcohol use disorder（Q3） |

- 共用疾病補 `# weight_loss complaint` 特徵段。
- 台灣臨床脈絡：檳榔＋菸酒 → 口腔癌、食道癌；B 肝 → HCC；胃癌與 H. pylori；TB 在老年人仍不少見；國健署篩檢（糞便潛血 50–74 歲、LDCT 給有家族史或重度吸菸者、乳攝、子宮頸抹片）；GLP-1 減重用藥增加。
- 考慮過但不放（草案）：celiac disease（台灣少見）、pheochromocytoma（少見，體重減輕不是主要表現）、infective endocarditis（另以發燒主訴處理較合適）、parasitic infection。

## 6. 建議檢查

- 初步（約 70% 原因可由病史＋初步檢查找到）：CBC、ESR／CRP、electrolytes、Ca、creatinine、glucose／HbA1c、LFT、albumin、TSH、UA、FOBT／FIT、HIV、HBsAg／anti-HCV
- 依線索：morning cortisol（± ACTH stimulation）、fecal elastase、sputum AFB ×3、tumor markers 不作篩檢用
- 影像／內視鏡：CXR（初步必做）、腹部超音波、EGD、colonoscopy；初步皆陰性才考慮 CT chest／abdomen／pelvis
- 初步檢查全部正常時，「觀察 1–6 個月再評估」是合理做法（寫進 pitfalls）

## 7. HPI／PE 範例（示意）

> (115/11/19) unintentional weight loss of 5–10% of body weight over 1–6 months, with decreased appetite. Associated with early satiety and night sweats. Denied dysphagia, melena or fever. Smokes and chews betel nut. Drinks heavily, about 60–100 g of alcohol a day.

> General: in no acute distress. Wasting: temporal wasting, muscle wasting.
> Neck: a palpable left supraclavicular lymph node. Abdomen: soft, non-tender, epigastric mass.

## 8. 待對齊的問題

1. **右欄排序**：用 `appetite`（減少／正常或增加／想吃吃不下）當 `group_item`？或像 abnormal_lft 不設、固定病因順序？
   **建議**：用 appetite。食慾正常卻瘦是最有鑑別力的一題（甲亢、糖尿病、吸收不良）。
2. **時程**：< 1 月／1–6 月／6–12 月／> 12 月，對應 acute／subacute／subacute／chronic（6–12 月算 subacute 還是 chronic？）
   **建議**：6–12 月與 > 12 月都算 chronic；1–6 月 subacute。
3. **疾病範圍**：以下要不要放？(a) 口腔／頭頸癌（檳榔）(b) Achalasia (c) Cirrhosis（目前只有 `cirrhotic_ascites`，範圍是腹水）(d) Alcohol use disorder 獨立成疾病 (e) Dementia／frailty、social causes 當「疾病」（不算疾病但門診很常見）。
   **建議**：(a) 放；(b) 放（吞嚥困難＋體重減輕的重要鑑別）；(c) 不放，在 HCC／`alcohol_related_liver_disease` 處理；(d) 不放，併入 drug-induced weight loss 改名 "Medication / alcohol-related"；(e) 放 "Dementia / frailty with poor intake" 一個，社會因素寫在它的 pitfalls。
4. **藥物項目**：GLP-1 在 `distension_drugs`、metformin 在 `diarrhea_drugs`，若照「一個概念一種寫法」共用，左欄會有三個藥物項目。
   **建議**：新 `wl_drugs` 只放新藥（SGLT2i、topiramate、thyroxine、stimulants），GLP-1 與 metformin 用既有項目子集並改標籤；三個項目放在同一段，HPI 合併成一句 "Medications include ..."。
5. **檳榔**：加到共用 `risk` 當新選項（其他主訴看不到，因為它們都列子集），或另立項目？
   **建議**：加到 `risk`（與 smoking 並列），之後口腔／食道相關主訴可共用。
6. **癌症篩檢紀錄**（screening 項目）要不要放？
   **建議**：放，presence 的「有做／沒做」，HPI 輸出 "Up to date with ..." ／ "Not up to date with ..."。
7. **Must-not-miss**：表中 ★（惡性腫瘤、GOO、adrenal insufficiency、TB、HIV、eating disorder）可以嗎？
   **建議**：照表；depression 不標（但 pitfalls 提醒問自殺意念）。
