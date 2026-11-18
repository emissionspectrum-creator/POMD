#!/usr/bin/env python3
"""Build dist/POMD.html and dist/POMD-history.html from src/ (code) and data/ (content).

Usage:
    python3 build.py          # validate data, then build both pages
    python3 build.py --check  # validate only

Requires PyYAML.
"""

import json
import re
import sys
from datetime import date
from pathlib import Path

import yaml

APP_VERSION = "0.6.1"

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
DATA = ROOT / "data"
DIST = ROOT / "dist" / "POMD.html"
DIST_QUICK = ROOT / "dist" / "POMD-history.html"  # history-only quick page

ITEM_TYPES = {"single", "multi", "presence"}
ITEM_KEYS = {"id", "label", "type", "template", "join", "ask", "options"}
OPTION_KEYS = {"id", "label", "frag", "frag_neg", "exclusive", "red_flag", "tc"}
TC_VALUES = {"acute", "subacute", "chronic"}
JOIN_VALUES = {"and", "or", ","}
COMPLAINT_KEYS = {"id", "name", "group_item", "timecourse_item", "history", "pe",
                  "labs", "imaging", "ddx", "hpi", "pe_text", "quick", "defaults"}
DISEASE_KEYS = {"id", "name", "must_not_miss", "timecourse", "status", "one_liner",
                "symptoms", "pe", "labs", "imaging", "pitfalls"}
DISEASE_STATUS = {"draft", "reviewed"}
SENTENCE_KEYS = {"lead", "parts", "sep", "end", "always"}
ID_RE = re.compile(r"^[a-z0-9_]+$")
# "item = a | b"  or (presence items)  "item = a | b"  /  "item = no a | b"
MATCH_RE = re.compile(r"^\s*([a-z0-9_]+)\s*=\s*(no\s+)?([a-z0-9_]+(?:\s*\|\s*[a-z0-9_]+)*)\s*$")
PLACEHOLDER_RE = re.compile(r"\{([^{}]*)\}")
TEXT_VARS = {"date_roc"}  # {@name} values supplied by the page (see core.textVars)


class Errors:
    def __init__(self):
        self.errors = []
        self.warnings = []

    def err(self, where, msg):
        self.errors.append(f"{where}: {msg}")

    def warn(self, where, msg):
        self.warnings.append(f"{where}: {msg}")


def load_yaml(path):
    try:
        with open(path, encoding="utf-8") as f:
            return yaml.safe_load(f)
    except yaml.YAMLError as exc:
        raise SystemExit(f"ERROR: YAML syntax error in {path.relative_to(ROOT)}:\n{exc}\n"
                         "(Hint: a value starting with a quote, or containing ': ' or ' #', must be fully quoted.)")


def check_keys(e, where, obj, allowed):
    if not isinstance(obj, dict):
        e.err(where, f"expected a mapping, got {type(obj).__name__}")
        return False
    extra = set(obj) - allowed
    if extra:
        e.err(where, f"unknown keys {sorted(extra)} (unquoted comma inside {{...}}?)")
    return True


def as_str_list(e, where, value):
    if value is None:
        return []
    if not isinstance(value, list) or not all(isinstance(x, str) for x in value):
        e.err(where, "expected a list of strings")
        return []
    return value


# ---------- vocabulary ----------

def load_items(e):
    items = {}
    for path in sorted((DATA / "vocab").glob("*.yaml")):
        rel = path.relative_to(ROOT)
        doc = load_yaml(path) or []
        for raw in doc:
            where = f"{rel}:{raw.get('id', '?') if isinstance(raw, dict) else '?'}"
            if not check_keys(e, where, raw, ITEM_KEYS):
                continue
            iid = raw.get("id")
            if not isinstance(iid, str) or not ID_RE.match(iid):
                e.err(where, f"bad item id {iid!r}")
                continue
            if iid in items:
                e.err(where, "duplicate item id")
                continue
            itype = raw.get("type")
            if itype not in ITEM_TYPES:
                e.err(where, f"type must be one of {sorted(ITEM_TYPES)}")
            if "label" not in raw:
                e.err(where, "missing label")
            tpl = raw.get("template")
            if tpl is not None and (not isinstance(tpl, str) or tpl.count("{}") != 1):
                e.err(where, "template must contain exactly one {}")
            if tpl is not None and itype == "presence":
                e.err(where, "presence items cannot have a template")
            if raw.get("join", "and") not in JOIN_VALUES:
                e.err(where, f"join must be one of {sorted(JOIN_VALUES)}")
            item = {
                "id": iid,
                "label": str(raw.get("label", iid)),
                "type": itype,
                "ask": as_str_list(e, where + ".ask", raw.get("ask")),
                "options": [],
            }
            for k in ("template", "join"):
                if k in raw:
                    item[k] = raw[k]
            seen = set()
            for o in raw.get("options") or []:
                owhere = f"{where}.{o.get('id', '?') if isinstance(o, dict) else '?'}"
                if not check_keys(e, owhere, o, OPTION_KEYS):
                    continue
                oid = o.get("id")
                if not isinstance(oid, str) or not ID_RE.match(oid):
                    e.err(owhere, f"bad option id {oid!r}")
                    continue
                if oid in seen:
                    e.err(owhere, "duplicate option id")
                seen.add(oid)
                if "label" not in o:
                    e.err(owhere, "missing label")
                opt = {"id": oid, "label": str(o.get("label", oid)), "frag": str(o.get("frag", o.get("label", oid)))}
                if "frag_neg" in o:
                    if itype != "presence":
                        e.err(owhere, "frag_neg is only for presence items")
                    opt["frag_neg"] = str(o["frag_neg"])
                if o.get("exclusive"):
                    if itype != "multi":
                        e.err(owhere, "exclusive is only meaningful for multi items")
                    opt["exclusive"] = True
                if o.get("red_flag"):
                    opt["red_flag"] = True
                if "tc" in o:
                    tc = o["tc"]
                    if not isinstance(tc, list) or not set(tc) <= TC_VALUES:
                        e.err(owhere, f"tc must be a list drawn from {sorted(TC_VALUES)}")
                    else:
                        opt["tc"] = tc
                item["options"].append(opt)
            if not item["options"]:
                e.err(where, "item has no options")
            items[iid] = item
    return items


# ---------- diseases ----------

def parse_match(e, where, expr, items):
    m = MATCH_RE.match(expr) if isinstance(expr, str) else None
    if not m:
        e.err(where, f"cannot parse match {expr!r} (expected 'item = opt | opt' or 'item = no opt')")
        return None
    iid, neg, opts = m.group(1), m.group(2), [x.strip() for x in m.group(3).split("|")]
    item = items.get(iid)
    if not item:
        e.err(where, f"unknown item {iid!r}")
        return None
    valid = {o["id"] for o in item["options"]}
    for o in opts:
        if o not in valid:
            e.err(where, f"unknown option {o!r} for item {iid!r}")
    feat = {"item": iid, "options": opts}
    if item["type"] == "presence":
        feat["state"] = "absent" if neg else "present"
    elif neg:
        e.err(where, "'no' is only allowed for presence items")
    return feat


def load_diseases(e, items):
    diseases = {}
    for path in sorted((DATA / "diseases").glob("*.yaml")):
        rel = path.relative_to(ROOT)
        raw = load_yaml(path)
        where = str(rel)
        if not check_keys(e, where, raw, DISEASE_KEYS):
            continue
        did = raw.get("id")
        if did != path.stem:
            e.err(where, f"id {did!r} must equal the file name {path.stem!r}")
            continue
        for k in ("name", "one_liner"):
            if not isinstance(raw.get(k), str) or not raw[k].strip():
                e.err(where, f"missing {k}")
        tc = raw.get("timecourse")
        if not isinstance(tc, list) or not tc or not set(tc) <= TC_VALUES:
            e.err(where, f"timecourse must be a non-empty list drawn from {sorted(TC_VALUES)}")
            tc = []
        status = raw.get("status")
        if status not in DISEASE_STATUS:
            e.err(where, f"status must be one of {sorted(DISEASE_STATUS)}")
        d = {
            "id": did,
            "name": raw.get("name", did),
            "must_not_miss": bool(raw.get("must_not_miss", False)),
            "timecourse": tc,
            "status": status,
            "one_liner": " ".join(str(raw.get("one_liner", "")).split()),
        }
        for section in ("symptoms", "pe"):
            feats = []
            for i, f in enumerate(raw.get(section) or []):
                fwhere = f"{where}.{section}[{i}]"
                if not check_keys(e, fwhere, f, {"when", "text"}):
                    continue
                feat = parse_match(e, fwhere, f.get("when"), items)
                if feat is None:
                    continue
                if not isinstance(f.get("text"), str):
                    e.err(fwhere, "missing text")
                feat["text"] = str(f.get("text", ""))
                feats.append(feat)
            d[section] = feats
        for section in ("labs", "imaging", "pitfalls"):
            d[section] = [" ".join(s.split()) for s in as_str_list(e, f"{where}.{section}", raw.get(section))]
        if not d["symptoms"] and not d["pe"]:
            e.warn(where, "no comparable features")
        diseases[did] = d
    return diseases


# ---------- complaints ----------

def check_template(e, where, tpl, items, allowed_items):
    if not isinstance(tpl, str):
        e.err(where, "template must be a string")
        return
    depth = 0
    for c in tpl:
        if c == "[":
            depth += 1
            if depth > 1:
                e.err(where, "nested [...] is not supported")
        elif c == "]":
            depth -= 1
            if depth < 0:
                e.err(where, "unbalanced ]")
    if depth != 0:
        e.err(where, "unbalanced [")
    for body in PLACEHOLDER_RE.findall(tpl):
        if body.startswith("@"):
            if body[1:].strip() not in TEXT_VARS:
                e.err(where, f"unknown text variable {{{body}}} (known: {', '.join(sorted(TEXT_VARS))})")
            continue
        refs = body.split("|", 1)[0]
        for ref in refs.split(","):
            ref = ref.strip()
            mode = ref[-1] if ref and ref[-1] in "+-*" else ""
            iid = ref[:-1] if mode else ref
            item = items.get(iid)
            if not item:
                e.err(where, f"unknown item {iid!r} in placeholder")
                continue
            if iid not in allowed_items:
                e.warn(where, f"item {iid!r} is used in text but not shown in this complaint")
            if mode and item["type"] != "presence":
                e.err(where, f"'{mode}' suffix is only for presence items ({iid})")


def check_text_spec(e, where, spec, items, allowed_items):
    if not check_keys(e, where, spec, {"joiner", "sentences"}):
        return
    for i, s in enumerate(spec.get("sentences") or []):
        swhere = f"{where}.sentences[{i}]"
        if not check_keys(e, swhere, s, SENTENCE_KEYS):
            continue
        for p in s.get("parts") or []:
            check_template(e, swhere, p, items, allowed_items)


def suggestion_list(e, where, value):
    out = []
    for x in value or []:
        if not check_keys(e, where, x, {"name", "note"}):
            continue
        out.append({"name": str(x.get("name", "")), "note": str(x.get("note", ""))})
    return out


def load_complaints(e, items, diseases):
    complaints = []
    used_diseases = set()
    views = {}  # disease id -> [(shown items, item_options) of each complaint listing it]
    for path in sorted((DATA / "complaints").glob("*.yaml")):
        rel = path.relative_to(ROOT)
        raw = load_yaml(path)
        where = str(rel)
        if not check_keys(e, where, raw, COMPLAINT_KEYS):
            continue
        # Section items are item ids, or {item: id, options: [...], ask: [...], label: ..., details: {...}}
        # to show only some options, replace the English phrasing or label, or attach a collapsible
        # block of sub-items ({label, note, items}). Output keeps plain ids in the sections and collects
        # the overrides in `item_options` / `item_ask` / `item_label` / `item_details`.
        shown = set()
        item_options = {}
        item_ask = {}
        item_label = {}
        item_details = {}

        def add_entry(entry, iwhere, allow_details):
            iid = entry
            keys = {"item", "options", "ask", "label"} | ({"details"} if allow_details else set())
            if isinstance(entry, dict):
                if not check_keys(e, iwhere, entry, keys):
                    return None
                iid = entry.get("item")
            if iid not in items:
                e.err(iwhere, f"unknown item {iid!r}")
                return None
            if iid in shown:
                e.err(iwhere, f"item {iid!r} listed twice")
                return None
            shown.add(iid)
            if not isinstance(entry, dict):
                return iid
            if "label" in entry:
                if isinstance(entry["label"], str) and entry["label"].strip():
                    item_label[iid] = entry["label"]
                else:
                    e.err(iwhere, f"{iid}: label must be a non-empty string")
            if "ask" in entry:
                asks = as_str_list(e, f"{iwhere}.{iid}.ask", entry["ask"])
                if asks:
                    item_ask[iid] = asks
            if "options" in entry:
                known = [o["id"] for o in items[iid]["options"]]
                sub = entry.get("options")
                if not isinstance(sub, list) or not sub:
                    e.err(iwhere, f"{iid}: options must be a non-empty list")
                    sub = []
                for oid in sub:
                    if oid not in known:
                        e.err(iwhere, f"{iid}: unknown option {oid!r}")
                if len(set(sub)) != len(sub):
                    e.err(iwhere, f"{iid}: option listed twice")
                # Keep the vocabulary's option order.
                item_options[iid] = [o for o in known if o in sub]
            if "details" in entry:
                det = entry["details"]
                dwhere = f"{iwhere}.{iid}.details"
                if check_keys(e, dwhere, det, {"label", "note", "items"}):
                    if not isinstance(det.get("label"), str) or not det["label"].strip():
                        e.err(dwhere, "missing label")
                    if "note" in det and not isinstance(det["note"], str):
                        e.err(dwhere, "note must be a string")
                    sub_ids = [x for x in (add_entry(d, dwhere, False) for d in det.get("items") or []) if x]
                    if not sub_ids:
                        e.err(dwhere, "details need at least one item")
                    item_details[iid] = {"label": str(det.get("label", "")), "items": sub_ids}
                    if det.get("note"):
                        item_details[iid]["note"] = " ".join(det["note"].split())
            return iid

        columns = {}
        for col in ("history", "pe"):
            columns[col] = []
            for sec in raw.get(col) or []:
                if not check_keys(e, f"{where}.{col}", sec, {"section", "items"}):
                    continue
                iwhere = f"{where}.{col}.{sec.get('section', '?')}"
                ids = [x for x in (add_entry(entry, iwhere, True) for entry in sec.get("items") or []) if x]
                columns[col].append({"section": sec.get("section"), "items": ids})
        history_ids = [iid for sec in columns["history"] for iid in sec["items"]]
        quick = raw.get("quick")
        if quick is None:
            quick_show = list(history_ids)
        else:
            quick_show = []
            if check_keys(e, f"{where}.quick", quick, {"show"}):
                for iid in quick.get("show") or []:
                    if iid not in history_ids:
                        e.err(f"{where}.quick.show", f"item {iid!r} is not in this complaint's history")
                    elif iid in quick_show:
                        e.err(f"{where}.quick.show", f"item {iid!r} listed twice")
                    else:
                        quick_show.append(iid)
        defaults = {}
        raw_defaults = raw.get("defaults") or {}
        if not isinstance(raw_defaults, dict):
            e.err(f"{where}.defaults", "must be a mapping of item id -> [option ids]")
            raw_defaults = {}
        for iid, opts in raw_defaults.items():
            dwhere = f"{where}.defaults.{iid}"
            item = items.get(iid)
            if not item:
                e.err(dwhere, "unknown item")
                continue
            if iid not in shown:
                e.err(dwhere, "item is not shown in this complaint")
            if item["type"] == "presence":
                e.err(dwhere, "defaults are only supported for single / multi items")
                continue
            opts = opts if isinstance(opts, list) else [opts]
            known = set(item_options.get(iid) or [o["id"] for o in item["options"]])
            for oid in opts:
                if oid not in known:
                    e.err(dwhere, f"option {oid!r} is not offered in this complaint")
            if item["type"] == "single" and len(opts) > 1:
                e.err(dwhere, "single item can have only one default")
            defaults[iid] = [str(o) for o in opts]
        # group_item is optional (without it, groups keep the complaint's order).
        for k in ("group_item", "timecourse_item"):
            if (k == "timecourse_item" or k in raw) and raw.get(k) not in shown:
                e.err(where, f"{k} {raw.get(k)!r} must be an item shown in this complaint")
        group_iid = raw.get("group_item")
        group_opts = set(item_options.get(group_iid) or
                         [o["id"] for o in items[group_iid]["options"]] if group_iid in items else [])
        complaint_diseases = set()
        for g in raw.get("ddx") or []:
            gwhere = f"{where}.ddx.{g.get('group', '?') if isinstance(g, dict) else '?'}"
            if not check_keys(e, gwhere, g, {"group", "options", "diseases"}):
                continue
            if g.get("options") and not group_iid:
                e.err(gwhere, "group options need a group_item")
            for l in g.get("options") or []:
                if group_iid and l not in group_opts:
                    e.err(gwhere, f"option {l!r} is not offered for group_item {group_iid!r}")
            seen = set()
            for did in g.get("diseases") or []:
                if did not in diseases:
                    e.err(gwhere, f"unknown disease {did!r}")
                if did in seen:
                    e.err(gwhere, f"disease {did!r} listed twice in the same group")
                seen.add(did)
                complaint_diseases.add(did)
        used_diseases |= complaint_diseases
        for did in complaint_diseases & set(diseases):
            views.setdefault(did, []).append((shown, item_options))
        for k in ("hpi", "pe_text"):
            check_text_spec(e, f"{where}.{k}", raw.get(k) or {}, items, shown)
        complaints.append({
            "id": raw.get("id"),
            "name": raw.get("name"),
            "group_item": group_iid,
            "timecourse_item": raw.get("timecourse_item"),
            "history": columns["history"],
            "pe": columns["pe"],
            "item_options": item_options,
            "item_ask": item_ask,
            "item_label": item_label,
            "item_details": item_details,
            "labs": suggestion_list(e, f"{where}.labs", raw.get("labs")),
            "imaging": suggestion_list(e, f"{where}.imaging", raw.get("imaging")),
            "ddx": raw.get("ddx") or [],
            "hpi": raw.get("hpi") or {},
            "pe_text": raw.get("pe_text") or {},
            "quick": {"show": quick_show},
            "defaults": defaults,
        })
    for did in sorted(set(diseases) - used_diseases):
        e.warn(f"data/diseases/{did}.yaml", "not referenced by any complaint")
    # A shared disease may use items that only some of its complaints show (DESIGN 4.6),
    # but every feature should take part in at least one of them.
    for did, vs in sorted(views.items()):
        for f in diseases[did]["symptoms"] + diseases[did]["pe"]:
            if not any(f["item"] in shown and (f["item"] not in subs or set(f["options"]) & set(subs[f["item"]]))
                       for shown, subs in vs):
                e.warn(f"data/diseases/{did}.yaml",
                       f"feature {f['item']} = {'|'.join(f['options'])} is not offered by any complaint listing it")
    return complaints


# ---------- output ----------

def build_html(data, template_name="index.html", app_name="app.js"):
    template = (SRC / template_name).read_text(encoding="utf-8")
    css = (SRC / "style.css").read_text(encoding="utf-8")
    core = (SRC / "core.js").read_text(encoding="utf-8")
    app = (SRC / app_name).read_text(encoding="utf-8")
    payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    # Never let content close the <script> element early.
    payload = payload.replace("</", "<\\/")
    replacements = {
        "/*__CSS__*/": css,
        "/*__DATA__*/": f"window.POMD_DATA = {payload};",
        "/*__CORE__*/": core,
        "/*__APP__*/": app,
        "__VERSION__": f"v{APP_VERSION} · built {date.today().isoformat()}",
    }
    for key, value in replacements.items():
        if key not in template:
            raise SystemExit(f"src/{template_name} is missing placeholder {key}")
        template = template.replace(key, value)
    return template


def main():
    check_only = "--check" in sys.argv[1:]
    e = Errors()
    items = load_items(e)
    diseases = load_diseases(e, items)
    complaints = load_complaints(e, items, diseases)

    for w in e.warnings:
        print(f"warning: {w}")
    for x in e.errors:
        print(f"ERROR: {x}")
    if e.errors:
        print(f"\n{len(e.errors)} error(s); build aborted.")
        return 1
    print(f"OK: {len(items)} items, {len(diseases)} diseases, {len(complaints)} complaint(s).")
    if check_only:
        return 0

    data = {"version": APP_VERSION, "items": items, "diseases": diseases, "complaints": complaints}
    # The quick page needs only the history items and HPI spec; no diseases.
    quick_data = {
        "version": APP_VERSION,
        "items": items,
        "complaints": [{k: c[k] for k in ("id", "name", "history", "item_options", "item_ask", "item_label",
                                          "item_details", "hpi", "quick", "defaults")}
                       for c in complaints],
    }
    pages = [
        (DIST, build_html(data)),
        (DIST_QUICK, build_html(quick_data, "history.html", "history.js")),
    ]
    DIST.parent.mkdir(exist_ok=True)
    for path, html in pages:
        path.write_text(html, encoding="utf-8", newline="\n")
        print(f"Wrote {path.relative_to(ROOT)} ({len(html.encode('utf-8')) // 1024} KB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
