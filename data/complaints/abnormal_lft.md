# 主訴設計說明：Abnormal liver tests（肝功能異常）

> 資料檔：`abnormal_lft.yaml`（同資料夾）。通用原則見 `DESIGN.md`。2026-11-18 與佑達對齊後實作；新疾病皆為 `draft`。
> 標記：〔共用〕＝沿用既有項目（只顯示相關選項）；〔新〕＝新增項目；〔共〕＝與其他主訴共用的疾病。

## 1. 追問框架與理由

病人帶著異常的 AST／ALT 來，抽血型態（肝細胞型或膽汁鬱積型、升高幅度、AST/ALT 比值）由醫師自己判讀，**不做成可點選項目**（Q1）。工具只負責病史。

肝功能異常的鑑別是**逐一排除病因**，所以病史依**病因**分段，每段問完，右欄對應的病因群組就有了標亮依據：

1. 先問共通的：Patient、時程、肝膽症狀與警訊（黃疸、茶色尿、灰白便、癢、意識改變）。
2. 再依病因：Alcohol → Drugs & herbs → Viral hepatitis → Metabolic → Abdominal pain → Congestive / ischemic → Autoimmune & others。

Alcohol、Drugs & herbs、Viral hepatitis、Abdominal pain 四段都是「一題主項目常駐，細項收合」（2026-11-18 使用者要求，見第 2 節）。

順序的理由：
- 酒精、藥物與草藥在台灣門診最常見，也最需要細問，所以放最前面。
- 病毒性肝炎（B、C 肝）多半已知病史，問得快。
- 膽道與鬱血肝要靠症狀去抓。
- 自體免疫和其他原因最後才問。

## 2. 新功能：可收合的細項（Q2）

酒精需要細問種類、量、年數、戒酒多久，全部攤開會佔掉很大的版面。做法如下：

- 主訴 yaml 中，項目可以掛一個 `details` 子區塊：預設收合，只顯示一行標題，點開才看到細項。實作時改掛在項目上（不是段落上），這樣精簡版調整順序時細項會跟著主項目移動。
- 收合時，標題列顯示已點選內容的摘要，例如「Kaoliang · 40–60 g/day · 10–20 yr」。只要裡面有點選，就預設展開。
- 子段落可以附一段說明文字（`note`），放酒精克數換算表，點開才看得到。
- 完整版、精簡版都支援。這是通用功能，其他主訴之後也能用。

```yaml
  - section: Alcohol
    items:
      - item: alcohol_use
        details:
          label: Amount & duration
          note: "Grams of alcohol = mL × % × 0.8. Beer 5%: 600 mL bottle ≈ 24 g · Kaoliang 58%: 100 mL ≈ 46 g · ..."
          items: [alcohol_type, alcohol_amount, alcohol_years, alcohol_last, alcohol_pattern]
```

**另一個小改動**：這個主訴不需要右欄排序項目，所以 `group_item` 改成選填。右欄依病因的固定順序排列，另外仍可切換 By matches。

## 3. 病史項目（草案）

| 段落 | 項目 | 選項（草案） |
|---|---|---|
| Patient | sex, age_group〔共用〕 | 不放 repro_status（Q5） |
| Course & symptoms | lft_duration〔新〕 | first found／< 1 mo（acute）；1–6 mo（subacute）；> 6 mo（chronic） |
| | assoc_sys〔共用〕 | fever、chills、jaundice、dark urine、pale stool、pruritus、weight loss、malaise |
| | assoc_gi〔共用〕 | nausea、vomiting、anorexia、hematemesis、melena |
| | assoc_other〔共用〕 | confusion、dyspnea（標籤改為 Other symptoms） |
| | liver_warning〔新，presence〕 | easy bruising／bleeding、abdominal swelling（嘔血、黑便沿用 assoc_gi） |
| **Alcohol** | alcohol_use〔新，single〕 | never／rarely、occasional／social、regular drinker、heavy drinker、former drinker（Q3 保留） |
| ▸ 細項（收合） | alcohol_type〔新，multi〕 | beer、kaoliang／baijiu、rice wine（米酒）、tonic wine（藥酒）、wine、whiskey／brandy |
| | alcohol_amount〔新，single〕 | < 20 g/day、20–40、40–60、60–100、> 100 g/day |
| | alcohol_years〔新，single〕 | < 5 yr、5–10、10–20、> 20 yr |
| | alcohol_last〔新，single〕 | still drinking、stopped < 1 mo、1–6 mo、6–12 mo、> 1 yr |
| | alcohol_pattern〔新，presence〕 | recent binge、drinks daily、morning drink／shakes |
| **Drugs & herbs** | drug_timing〔新，single；主項目，標籤 Medications / herbs〕 | none、started < 3 mo ago、3–6 mo、long-term unchanged |
| ▸ 細項「Which drugs / herbs」 | liver_drugs〔新，presence〕 | antibiotics（amoxicillin-clavulanate 等）、anti-TB drugs、azole antifungals、high-dose acetaminophen、NSAID、statin、amiodarone、antiepileptics、methotrexate、chemotherapy／immunotherapy |
| | herbs〔新，presence〕 | Chinese herbal medicine、dietary supplements、weight-loss or bodybuilding products |
| **Viral hepatitis** | viral_history〔新，presence；主項目〕 | known HBV carrier、on HBV antivirals、recently stopped HBV antivirals、known HCV、HCV treated／cured、chemotherapy／immunosuppression |
| ▸ 細項「Exposure & other viruses」 | viral_exposure〔新，presence〕 | raw shellfish／undercooked pork、household hepatitis contact、tattoo／piercing、injection drug use、transfusion／dialysis |
| | viral_sx〔新，presence〕 | sore throat、swollen glands、rash、muscle aches、cough／runny nose（EBV、CMV、acute HIV、一般呼吸道病毒） |
| **Metabolic** | metabolic〔新，presence〕 | central obesity、dyslipidemia、hypertension、recent weight gain |
| **Abdominal pain** | pain_location〔共用；主項目〕 | ruq、epigastric |
| ▸ 細項「Pain details」 | pain_pattern、meal_relation、radiation〔共用〕 | attacks／constant；worse_eating、unrelated；right shoulder、back |
| **Congestive / ischemic** | congestion_sx〔新，presence〕 | orthopnea／PND、leg swelling、known heart failure／valve disease、recent hypotension／shock／sepsis（呼吸喘沿用 assoc_other） |
| **Autoimmune & others** | other_liver〔新，presence〕 | other autoimmune disease、family history of liver disease、strenuous exercise／muscle injury |
| | extraintestinal〔共用〕 | arthralgia、heat intolerance／palpitations（標籤改為 Joints / thyroid） |
| | risk〔共用〕 | diabetes、hypertriglyceridemia、gallstones、biliary_procedure、immunocompromised、travel、sti_risk（標籤改為 Other risk factors） |

說明：
- 一個項目在同一個主訴只能出現一次，所以 `risk` 的選項（travel、diabetes、gallstones……）集中放在最後一段 Other risk factors。
- 腹痛用的 `risk.alcohol`（Heavy alcohol use）在這裡不顯示，改由 alcohol 系列項目細問；`risk.liver_disease`（籠統的「慢性肝病／B、C 肝」）也不顯示，改由 viral_history 細問。

## 4. 理學檢查

- General & vitals：general、vitals（fever、tachycardia、hypotension）〔共用〕
- Skin & eyes：skin（icterus、pallor）〔共用〕；liver_pe〔新〕：asterixis、spider angiomata、palmar erythema、gynecomastia、excoriations
- congestion_pe〔新〕：raised JVP、hepatojugular reflux、pitting edema、bibasal crackles
- infection_pe〔新〕：cervical lymphadenopathy、tonsillar exudate、rash
- Abdomen：tenderness（RUQ 等）、abd_signs（Murphy）、palpable（hepatomegaly、liver tender、splenomegaly、gallbladder、ascites）〔共用〕
- 預設點選：沿用 soft、non-tender

## 5. 時程界線

`lft_duration`：< 1 個月為 acute；1–6 個月為 subacute；> 6 個月為 chronic（慢性肝炎的定義）。「First found（不知道多久）」不標時程。

## 6. 鑑別診斷分組（依病因，與左欄分段對應）

| 群組 | 疾病（★ = must-not-miss；〔共〕= 與腹痛共用） |
|---|---|
| Alcohol | Alcohol-associated hepatitis★、Alcohol-related liver disease（steatosis → cirrhosis） |
| Drugs & herbs | Drug- / herb-induced liver injury（DILI）、Acetaminophen toxicity★ |
| Viral | Acute hepatitis A / E、HBV flare / reactivation★、Chronic hepatitis B、Chronic hepatitis C、EBV infection、CMV hepatitis、Acute HIV infection★、Systemic viral infection（influenza、COVID-19、一般感冒等呼吸道病毒） |
| Metabolic | MASLD / MASH |
| Biliary / obstructive | Choledocholithiasis〔共〕、Acute cholangitis★〔共〕、Malignant biliary obstruction（pancreatic head、cholangiocarcinoma）、Liver abscess★〔共〕 |
| Congestive / ischemic | Congestive hepatopathy、Ischemic hepatitis★ |
| Autoimmune | Autoimmune hepatitis、Primary biliary cholangitis |
| Others / non-hepatic | Hepatocellular carcinoma / liver metastases、Muscle injury（AST from muscle）、Hyperthyroidism〔共，與腹瀉〕 |

疾病 id：alcoholic_hepatitis、alcohol_related_liver_disease、dili、acetaminophen_toxicity、acute_hepatitis_a_e、hbv_flare、chronic_hepatitis_b、chronic_hepatitis_c、masld、malignant_biliary_obstruction、congestive_hepatopathy、ischemic_hepatitis、autoimmune_hepatitis、primary_biliary_cholangitis、liver_malignancy、muscle_injury、ebv_infection、cmv_hepatitis、acute_hiv、systemic_viral_infection（新）；choledocholithiasis、acute_cholangitis、liver_abscess、hyperthyroidism（共用，前三個補上 `# abnormal liver tests complaint` 特徵）。

- **`acute_hepatitis`**（Q4）：腹痛的 RUQ 群組照舊使用 `acute_hepatitis`；這個主訴不列它，改用上表細分的疾病。兩邊內容會有部分重疊，這是刻意的。
- 台灣臨床脈絡：
  - B 肝 flare：停藥後、化療或免疫抑制時再活化。
  - 草藥與保健食品是 DILI 的大宗。
  - 酒類有高粱、米酒、藥酒。
  - Klebsiella 肝膿瘍。
  - HCC 篩檢族群。
- 考慮過但先不放：
  - Dengue：使用者決定不加（2026-11-18）。
  - Wilson disease：40 歲以下不明原因時考慮，寫在 pitfalls。
  - Hemochromatosis：台灣罕見。
  - Celiac。
  - 懷孕相關肝病（intrahepatic cholestasis of pregnancy、HELLP、AFLP）：之後若需要再加一個群組。
  - Budd–Chiari、PSC：罕見，寫在相關疾病的 pitfalls。

## 7. HPI 範例（實際輸出）

> (115/11/18) abnormal liver tests for 1–6 months. Associated with jaundice. Drinks heavily, mainly kaoliang, about 60–100 g of alcohol a day, for 10–20 years, still drinking.

收合時的摘要：`Kaoliang / spirits · 60–100 g/day · 10–20 yr · Still drinking`。
