# 主訴設計說明：Unintentional weight loss（非刻意體重減輕）

> 資料檔：`weight_loss.yaml`（同資料夾）。通用原則見 `DESIGN.md`。2026-11-19 與佑達對齊（Q3：口腔／頭頸癌、achalasia、cirrhosis、酒精使用障礙都不放，失智／衰弱放；其他照建議）後實作；新疾病皆為 `draft`。
> 標記：〔共用〕＝沿用既有項目（只顯示相關選項）；〔新〕＝新增項目；〔共〕＝與其他主訴共用的疾病。

## 1. 追問框架與理由

體重減輕本身不指向任何器官，所以先**確認是真的、有意義的減輕**，再用**食慾**分流，最後**依系統逐段排除**：

1. **確認與量化**：是否刻意、減了多少（6–12 月內 > 5% 才有意義，> 10% 為 red flag）、多久、有沒有客觀證據（量過、衣服變鬆、別人說）。
2. **食慾分流**（同時是右欄排序）：
   - 食慾**變差** → 惡性腫瘤、感染、慢性器官疾病、憂鬱／失智／飲食疾患
   - 食慾**正常或變好**卻瘦 → 甲狀腺亢進、控制不良的糖尿病、吸收不良
   - **想吃但吃不下** → 上消化道（PUD、胃出口阻塞、食道癌、胃癌）與惡性腫瘤
3. **依系統追問**：Intake & GI → Systemic & chest → Endocrine → Heart, lung & kidney → Mood, cognition & social。
4. **藥物、物質與病史**：GLP-1、metformin、SGLT2i、topiramate、thyroxine、stimulants；酒精（收合細項）；抽菸、檳榔；癌症篩檢紀錄。

## 2. 病史項目

| 段落 | 項目 | 選項 |
|---|---|---|
| Patient | sex, age_group〔共用〕 | |
| Weight loss | wl_intent〔新，single；預設 unintentional〕 | not trying、dieting but more than expected、intentional |
| | wl_amount〔新〕 | < 5%、5–10%、> 10%（red flag） |
| | wl_duration〔新；`timecourse_item`〕 | < 1 mo、1–6 mo、6–12 mo、> 12 mo |
| | appetite〔新，single；`group_item`〕 | decreased、normal、increased、wants to eat but can't |
| | wl_evidence〔新，presence〕 | documented weights、clothes looser、others noticed（HPI 只輸出 present） |
| Intake & GI | assoc_gi〔共用〕 | nausea、vomiting、dysphagia、early satiety、heartburn、diarrhea、steatorrhea、bowel change、constipation、melena、hematochezia |
| | intake_barrier〔新，presence〕 | painful swallowing、teeth／chewing problems |
| | pain_location〔共用，標籤 Abdominal pain〕 | |
| Systemic & chest | assoc_sys〔共用，標籤 Systemic〕 | fever、night sweats、malaise、jaundice、pruritus |
| | wl_systemic〔新，presence〕 | lump／swollen glands、bone／back pain、hemoptysis、persistent hoarseness |
| | assoc_other〔共用，標籤 Chest & other〕 | cough（> 2 週）、dyspnea、thirst／polyuria |
| | ascites_clues〔共用，標籤 TB & cancer history〕 | prior TB／TB contact、known cancer |
| Endocrine | extraintestinal〔共用，標籤 Thyroid〕 | heat intolerance／palpitations |
| | endo_sx〔新，標籤 Adrenal〕 | salt craving、skin darkening |
| Heart, lung & kidney | congestion_sx〔共用〕 | orthopnea、leg swelling、known heart failure |
| | organ_history〔新〕 | COPD、CKD／dialysis |
| Mood, cognition & social | psych_social〔新〕 | low mood、poor sleep、memory decline、needs help with shopping／meals、lives alone、financial difficulty、fear of weight gain／restricting |
| Medications, substances & history | distension_drugs〔共用，只顯示 GLP-1〕 | |
| | diarrhea_drugs〔共用，只顯示 metformin，標籤 Diabetes tablets〕 | |
| | wl_drugs〔新〕 | SGLT2 inhibitor、topiramate、thyroxine、stimulants |
| | alcohol_use〔共用，細項：type、amount、years、last〕 | |
| | risk〔共用，標籤 Past history〕 | smoking、**betel nut**〔新選項〕、diabetes、PUD、H. pylori、liver disease、GI cancer family history、immunocompromised、sexual risk、new drug／herb |
| | diarrhea_history〔共用，標籤 GI & thyroid history〕 | gastrectomy／bariatric、chronic pancreatitis、hyperthyroidism |
| | screening〔新〕 | FIT／colonoscopy、LDCT、mammogram、Pap smear（HPI："Up to date with …"／"Not up to date with …"） |

## 3. 理學檢查

- General & vitals：general、vitals、wasting_pe〔新〕（BMI < 18.5、temporal wasting、muscle wasting）
- Head, neck & skin：skin（pallor、icterus、Virchow node）、infection_pe（cervical nodes，標籤 Neck nodes）、wl_head_pe〔新〕（oral thrush、poor dentition、buccal／palmar crease pigmentation、axillary／inguinal nodes）、systemic_pe（goiter、tremor，標籤 Thyroid）
- Chest：lung_pe〔新〕（wheeze、reduced breath sounds、clubbing）、congestion_pe（JVP、edema、crackles）
- Abdomen：guarding、tenderness、palpable（hepatomegaly、splenomegaly、mass、ascites）
- Rectal：normal、mass、melena
- 預設：wl_intent = unintentional、soft、non-tender。

## 4. 時程界線

`wl_duration`：< 1 月 acute；1–6 月 subacute；6–12 月與 > 12 月 chronic（Q2）。

## 5. 鑑別診斷分組

**分組軸**：病因類別。**排序項目**：`group_item: appetite`。

| 群組 | 排序對應 | 疾病（★ = must-not-miss；〔共〕= 與其他主訴共用） |
|---|---|---|
| Malignancy | decreased、cant_eat | Gastric cancer〔共〕、Colorectal cancer〔共〕、Pancreatic cancer★、Liver malignancy〔共〕、Esophageal cancer★、Lung cancer★、Lymphoma★ |
| Upper GI & intake | cant_eat | PUD〔共〕、Gastric outlet obstruction★〔共〕、Esophageal cancer★、Gastric cancer〔共〕 |
| Malabsorption | normal、increased | Chronic pancreatitis〔共〕、Crohn's disease〔共〕、SIBO〔共〕 |
| Endocrine & metabolic | normal、increased | Hyperthyroidism〔共〕、Uncontrolled diabetes、Adrenal insufficiency★ |
| Infection | decreased | Pulmonary TB★、HIV infection (advanced)★、Intestinal TB〔共〕 |
| Chronic organ disease | decreased | Heart failure〔共〕、COPD、CKD |
| Psychiatric, cognitive & social | decreased | Depression、Dementia／frailty with poor intake、Eating disorder★ |
| Medications & alcohol | — | Medication- or alcohol-related weight loss |

- 共用疾病補 `# weight_loss complaint` 特徵段：gastric cancer、colorectal cancer、liver malignancy、PUD、GOO、chronic pancreatitis、Crohn's、SIBO、hyperthyroidism、intestinal TB、heart failure。
- `heart_failure` 原名「Heart failure (cardiac ascites)」改為「Heart failure」，one_liner 補上 cardiac cachexia。
- 台灣臨床脈絡：檳榔＋菸酒 → 食道癌；B 肝 → HCC；不抽菸女性的肺腺癌（LDCT 家族史資格）；TB 通報；含類固醇的草藥／地下電台藥 → 次發性腎上腺功能不全；長照 2.0；HIV 由指定醫院免費治療。
- 不放：口腔／頭頸癌、achalasia、cirrhosis、酒精使用障礙（Q3，使用者決定；酒精併入 medication／alcohol-related）、celiac disease、pheochromocytoma、infective endocarditis。

## 6. 建議檢查

- 初步：CBC、ESR／CRP、electrolytes、Ca、creatinine、glucose／HbA1c、LFT、albumin、TSH、UA、FIT、HIV、HBsAg／anti-HCV、CXR
- 依線索：morning cortisol、sputum AFB × 3、fecal elastase、PHQ-9／Mini-Cog
- 影像／內視鏡：腹部超音波、EGD、colonoscopy；初步皆陰性但仍懷疑時 CT chest／abdomen／pelvis；LDCT（國健署資格）

## 7. HPI／PE 範例（實際輸出）

> (115/11/19) unintentional weight loss of 5–10% of body weight over 1–6 months, with a preserved desire to eat but difficulty eating enough. Supported by looser clothes. Associated with dysphagia. Denied melena or fever. Drinks heavily, about 60–100 g of alcohol a day. Relevant history includes smoking and betel nut chewing. Not up to date with colorectal cancer screening.

> Nutrition: temporal wasting.
> Head, neck & skin: a palpable left supraclavicular lymph node.
> Abdomen: soft, non-tender.

## 8. 對齊結果與實作差異

- Q1、Q2、Q4–Q7 照建議；Q3 只放 dementia／frailty。
- 與草稿不同之處：
  - 不另立 tb_hiv_risk：TB 史沿用 `ascites_clues.tb`（同時顯示 known cancer），HIV 風險用 `risk.sti_risk`。
  - 多喝多尿、咳嗽、喘沿用 `assoc_other`（一個主訴只能出現一次，所以放在 Systemic & chest 一段）；姿勢性頭暈不放（`blood_loss_sx` 已有，但不值得為一個選項多一個項目），adrenal 只問 salt craving 與 skin darkening，靠 PE 的 hypotension、pigmentation 補足。
  - 「Pain after eating／fear of eating」與口腔潰瘍不放（後者是為口腔癌設計，Q3 已不放）。
  - Chest PE 另立 `lung_pe`：共用 `chest` 在腹痛整個顯示，加選項會出現在腹痛。
  - wl_intent 設預設 unintentional：只有預設時視為未點選。
