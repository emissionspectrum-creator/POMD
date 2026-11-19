# 主訴設計說明：Abdominal distension / fullness（腹脹）

> 資料檔：`abdominal_distension.yaml`（同資料夾）。通用原則見 `DESIGN.md`。2026-11-19 與佑達對齊（pregnancy 不放，其他照建議）後實作；新疾病皆為 `draft`。
> 標記：〔共用〕＝沿用既有項目（只顯示相關選項）；〔新〕＝新增項目；〔共〕＝與其他主訴共用的疾病。

## 1. 追問框架與理由

腹脹的第一步是分清**主觀的脹（bloating）**還是**客觀的膨大（distension）**，再依機轉找原因（F's：flatus／feces、fluid、fat、mass／organ，加上阻塞與胃排空）：

1. **型態、部位、時程**：起伏不定、早上平晚上脹（功能性）／餐後上腹飽脹（胃排空、消化不良）／數小時到數天內快速變大（阻塞）／腹圍持續變大（腹水、腫瘤）／局部腫塊。這一題同時決定右欄排序。
2. **伴隨症狀與警訊**：嘔吐（尤其吐出隔夜食物）、不能排氣排便、體重減輕、黑便、血便、發燒、黃疸。
3. **依機轉追問**，一個方向一段：
   - Gas & bowel：與進食關係、排氣排便後是否改善、乳製品／代糖／油膩食物
   - Liver, heart & kidney（腹水）：酒精（沿用 abnormal_lft 的收合細項）、B／C 肝、心衰竭症狀、泡泡尿／眼皮腫、結核、已知癌症
   - Pelvic & urinary：排尿、異常陰道出血、停經、經血過多、已知肌瘤／卵巢囊腫、卵巢癌／乳癌家族史
4. **藥物與病史**：GLP-1 agonist、纖維／lactulose／acarbose、PPI、metformin、糖尿病、腹部手術、疝氣、鴉片類／抗膽鹼藥、慢性便秘、潰瘍、H. pylori、GI 癌家族史、胃或腸切除。

段落：Patient → Character & time course → Associated symptoms → Gas & bowel → Liver, heart & kidney → Pelvic & urinary → Medications & history。

## 2. 病史項目

| 段落 | 項目 | 選項 |
|---|---|---|
| Patient | sex, age_group〔共用〕 | |
| Character & time course | distension_pattern〔新，multi；`group_item`〕 | comes and goes／worse by evening、upper fullness after meals、rapid over hours–days、steadily growing girth、localized lump |
| | distension_site〔新，multi〕 | upper、whole、lower |
| | distension_duration〔新〕 | < 24 h、1–7 d（acute）；1–4 wk、1–3 mo（subacute）；> 3 mo（chronic） |
| | episodes〔共用，改問法〕 | first／recurrent |
| | bloating_features〔新，presence〕 | clothes／belt tighter、visibly bigger、belching、lots of gas |
| Associated symptoms | assoc_gi〔共用〕 | nausea、vomiting、vomiting old food〔新選項〕、no stool or flatus、early satiety、anorexia、heartburn、constipation、diarrhea、bowel change、steatorrhea、melena、hematochezia |
| | pain_location〔共用，標籤 Abdominal pain〕 | 全部位置 |
| | assoc_sys〔共用，標籤 Systemic〕 | weight loss、fever、night sweats、jaundice、malaise |
| Gas & bowel | meal_relation〔共用，標籤 Meals〕 | worse after eating、unrelated |
| | relieving〔共用〕 | bowel movement／passing gas、vomiting、nothing |
| | food_trigger〔共用〕 | dairy、sugar-free、fatty meals |
| Liver, heart & kidney | alcohol_use〔共用，細項：type、amount、years、last〕 | |
| | viral_history〔共用〕 | HBV、on HBV antivirals、HCV、HCV cured |
| | congestion_sx〔共用〕 | orthopnea、leg swelling、known heart failure |
| | ascites_clues〔新，presence〕 | frothy urine／puffy face、prior TB／contact、known cancer |
| Pelvic & urinary | assoc_gu〔共用〕 | unable to void、frequency、vaginal bleeding |
| | gyn_clues〔新，presence〕 | postmenopausal、heavy periods、known fibroids／ovarian cyst、family history of ovarian／breast cancer |
| Medications & history | distension_drugs〔新，presence〕 | GLP-1 agonist、fiber／lactulose／acarbose |
| | diarrhea_drugs〔共用，標籤 Other medications〕 | PPI、metformin |
| | risk〔共用，標籤 Past history〕 | diabetes、prior surgery、hernia、opioid／anticholinergic、chronic constipation、PUD、H. pylori、GI cancer family history |
| | diarrhea_history〔共用，標籤 GI surgery〕 | gastric surgery、bowel resection |

設計上的決定：
- 「Bloating」是 assoc_gi 的選項，但本主訴就是腹脹，所以不顯示，改用 distension_pattern 描述。
- assoc_gi 新增 vomiting of old food（胃出口阻塞、gastroparesis 的關鍵症狀）；其他主訴本來就列選項子集，所以不受影響。

## 3. 理學檢查

- General & vitals：general（comfortable、ill、dehydrated、confused）、vitals（fever、tachycardia、hypotension、tachypnea）、skin（icterus、pallor、Virchow node）、liver_pe（spider、palmar erythema、asterixis）、congestion_pe（JVP、edema、crackles）
- Abdomen：abd_contour、distension_pe〔新〕（bulging flanks、flank dullness、fluid wave、tympanic throughout、succussion splash、visible peristalsis、dilated abdominal veins）、bowel_sounds、guarding、tenderness、rebound、palpable（shifting dullness、hepatomegaly、splenomegaly、mass、bladder）、hernia
- Rectal：normal、hard stool、empty、mass、melena
- 不放骨盆腔檢查（Q6）。預設點選：soft、non-tender。
- shifting dullness 沿用 `palpable.ascites`，不在 distension_pe 重複。
- 共用的 `abd_contour` marked 原本是「markedly distended and tympanic」，腹水病人會輸出互相矛盾的句子；改成「markedly distended」，叩診交給 distension_pe 記錄。

## 4. 時程界線

`distension_duration`：< 1 週為 acute（阻塞、ileus、SBP、尿滯留）；1 週–3 月為 subacute（腹水、惡性腫瘤、TB）；> 3 月為 chronic（功能性，大致對應 Rome IV 的 3 個月）。

## 5. 鑑別診斷分組

**分組軸**：機轉。**排序項目**：`group_item: distension_pattern`（Q2）。

| 群組 | 排序對應 | 疾病（★ = must-not-miss；〔共〕= 與其他主訴共用） |
|---|---|---|
| Gas & functional | fluctuating | Functional bloating／distension〔新〕、IBS〔共〕、SIBO〔共〕、Lactose intolerance〔共〕、Constipation〔共〕 |
| Upper GI & gastric emptying | postprandial | Functional dyspepsia〔共〕、Gastroparesis〔新〕、Gastric outlet obstruction★〔新〕、Gastric cancer〔共〕、PUD〔共〕 |
| Obstruction & ileus | rapid | Small bowel obstruction★〔共〕、Sigmoid volvulus★〔共〕、Colorectal cancer〔共〕、Colonic pseudo-obstruction（Ogilvie）〔新〕 |
| Ascites | progressive | Cirrhosis with ascites〔新〕、Malignant ascites★〔新〕、SBP★〔新〕、Heart failure〔新〕、Nephrotic syndrome〔新〕、TB peritonitis〔新〕 |
| Mass & organomegaly | progressive, lump | Ovarian tumor★〔新〕、Uterine fibroids〔新〕、Acute urinary retention〔共〕、Liver malignancy〔共〕 |

- 共用疾病補 `# abdominal_distension complaint` 特徵段。
- Heart failure 另立新疾病，不沿用 congestive_hepatopathy（Q4：那個疾病的範圍是肝指數異常）。
- 台灣臨床脈絡：B 肝相關肝硬化、高粱與藥酒、GLP-1 agonist 使用增加、TB 在老年人仍不少見、胃癌盛行率較高（EGD 年齡門檻較低）。
- 考慮過但不放：pregnancy（Q4，使用者決定）；obesity（寫在 functional bloating 的 pitfalls）；celiac disease（台灣少見）；Budd-Chiari、pancreatic ascites、chylous ascites（少見，先不放）。

## 6. 建議檢查

- CBC、electrolytes、creatinine、glucose；LFT、albumin、PT／INR；HBsAg、anti-HCV
- Urine protein（nephrotic）、NT-proBNP（cardiac ascites）
- Diagnostic paracentesis：cell count（PMN ≥ 250 = SBP）、SAAG、total protein、culture、cytology、ADA
- CA-125（骨盆腔腫塊；任何腹水都會升高）、CEA、AFP、TSH、HbA1c、breath test
- 影像／內視鏡：腹部超音波（first-line）、KUB、CT、骨盆腔／經陰道超音波、EGD、colonoscopy、gastric emptying scintigraphy、echocardiography

## 7. HPI／PE 範例（實際輸出）

> (115/11/19) a steadily increasing abdominal girth involving the whole abdomen for 1–3 months. Associated with clothes and belt becoming tighter. Denied unintentional weight loss. Drinks heavily, about 60–100 g of alcohol a day. Relevant history includes chronic hepatitis B. No history of orthopnea or paroxysmal nocturnal dyspnea.

> Other: spider angiomata, JVP not raised.
> Abdomen: markedly distended, dullness in the flanks, soft, non-tender, shifting dullness.

> (115/11/19) upper abdominal fullness after meals involving the upper abdomen. Associated with vomiting of food eaten many hours earlier. Relevant history includes diabetes mellitus.

## 8. 對齊結果與實作差異

- Q1–Q3、Q5、Q6 照建議；Q4 不放 pregnancy，heart failure 另立新疾病。
- 與討論時不同之處：
  - 「Red flags」不另立一段：assoc_gi 一個主訴只能出現一次，所以把嘔吐、不能排氣、出血、體重減輕都放在 Associated symptoms（標 red flag）。
  - 腹水線索段命名為「Liver, heart & kidney」；nephrotic、TB、已知癌症合併成新的 ascites_clues。
  - 共用 `abd_contour` 的 marked 片段拿掉「and tympanic」（見第 3 節）。
  - must-not-miss 照討論時的表：Ogilvie、TB peritonitis 不標。
