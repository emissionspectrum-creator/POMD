# 主訴設計說明：Abdominal pain（腹痛）

> 資料檔：`abdominal_pain.yaml`（同資料夾）。通用原則見 `DESIGN.md`；本文件只寫腹痛特有的設計。

涵蓋慢性／亞急性（門診主體）與急性外科急腹症（must-not-miss）。

## 1. 病史追問框架

依 **LQQOPERA** 排列，前後各加一段：

| 段落 | 項目（`data/vocab/history.yaml`） |
|---|---|
| Patient | sex, age_group, repro_status |
| Location | pain_location, pain_migration |
| Quality | pain_quality, pain_pattern |
| Quantity | severity, nocturnal |
| Onset / duration | onset, duration, episodes |
| Precipitating factors | precipitant |
| Exacerbating / relieving | meal_relation, aggravating, relieving |
| Radiation | radiation |
| Associated symptoms | assoc_gi, assoc_sys, assoc_gu, assoc_other |
| Relevant history | risk |

- 不硬套框架：腹痛常用但不屬於 LQQOPERA 任一項的內容（排便習慣改變、與進食的關係、體重減輕、發燒、黃疸、GI bleeding、red flags 等），放在 Associated symptoms 或其他最合適的位置。
- 婦科疾病（ectopic pregnancy、ovarian torsion、PID）的標亮搭配 Patient 段的性別與 `repro_status`（懷孕可能）。
- 精簡版預設顯示全部病史題目，順序把 pain_location、duration 提前（見 yaml 的 `quick`）。

## 2. 理學檢查

- General & vitals：general, vitals, skin, chest
- Abdomen：abd_contour, bowel_sounds, guarding, tenderness, rebound, abd_signs, palpable, cva_tenderness, hernia
- Rectal & pelvic：rectal, pelvic
- **預設點選**：新病人自動帶入 Wall / guarding: Soft、Tenderness: Non-tender，PE 一開始就是 "Abdomen: soft, non-tender."。Non-tender 也會參與比對（典型有壓痛的疾病會顯示 Different）。

## 3. 時程界線

`duration` 選項：< 1 週（<6 h、6–24 h、1–3 d、4–7 d）為 acute；1–4 週為 subacute；> 1 個月（1–3 mo、>3 mo）為 chronic。

## 4. 鑑別診斷分組

依**位置**分組，排序項目為 `pain_location`（`location_item`）：點選位置後，該位置的群組排到最前面。

| 位置 | 疾病（★ = 資料中 `must_not_miss: true`；右欄不標示） |
|---|---|
| RUQ | Biliary colic、Acute cholecystitis★、Choledocholithiasis、Acute cholangitis★、Acute hepatitis、Liver abscess★、Right lower lobe pneumonia |
| Epigastric | Peptic ulcer disease、Perforated peptic ulcer★、Functional dyspepsia、GERD、Gastritis、Acute pancreatitis★、Chronic pancreatitis、Gastric cancer、Acute coronary syndrome★、Biliary colic |
| LUQ | Splenic infarction、Splenic rupture★、Acute pancreatitis★ |
| Periumbilical／Diffuse | Acute appendicitis★、Small bowel obstruction★、Acute mesenteric ischemia★、Acute gastroenteritis、IBS、Constipation、Peritonitis／hollow viscus perforation★、Ruptured AAA★、DKA★ |
| RLQ | Acute appendicitis★、Crohn's disease、Infectious ileocecitis、Ectopic pregnancy★、Ovarian torsion★、Diverticulitis |
| LLQ | Diverticulitis、Ischemic colitis、Ulcerative colitis、Colorectal cancer、Sigmoid volvulus★、Ectopic pregnancy★、Ovarian torsion★ |
| Suprapubic | Cystitis、Acute urinary retention、Pelvic inflammatory disease |
| Flank | Renal colic（urolithiasis）、Acute pyelonephritis、Ruptured AAA★ |

★ 以 `data/diseases/<id>.yaml` 的 `must_not_miss` 為準，本表只供閱讀。

分組上的決定：
- Early appendicitis 與 acute appendicitis 合併為同一疾病 `acute_appendicitis`，同時列在 Periumbilical／Diffuse 與 RLQ。
- 放進第二個位置群組的疾病：acute pancreatitis → LUQ、diverticulitis → RLQ（亞洲右側憩室炎常見）、ectopic pregnancy／ovarian torsion → LLQ（左右側皆可能）、ruptured AAA → Flank（常被誤認為腎絞痛）、biliary colic → Epigastric。
- 加入台灣臨床脈絡：Klebsiella 肝膿瘍、B 肝 flare、腸結核、草藥 DILI、胃癌盛行率與 EGD 年齡門檻。

## 5. HPI／PE 範例

HPI 以今天的民國日期開頭，依 LQQOPERA 順序組成第一句，之後是 Associated with／Denied／生育狀態／相關病史。實際產生的範例：

> (115/11/18) epigastric and RUQ pain for 1–3 days, described as colicky, severity 7/10, onset after a fatty or heavy meal, radiating to the right shoulder or scapula. Associated with nausea and vomiting. Denied fever or jaundice.

PE：

> Abdomen: soft, tenderness over the RUQ, no rebound tenderness, positive Murphy's sign.
