"""
src/build_menu.py  – Phase 1
Create data/mess_menu_weekly.csv

Columns:
  weekday, slot, items,
  has_dessert, is_fast_food_item, has_nonveg_option, is_special_item
"""

import pandas as pd
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "data" / "mess_menu_weekly.csv"

DESSERT_KEYWORDS = {
    "gulab jamun", "custard", "halwa", "milk cake",
    "kaju katli", "ice-cream", "sewai", "jalebi",
}
FASTFOOD_KEYWORDS = {
    "samosa", "pav bhaji", "chole bhature", "masala dosa",
    "pasta", "chowmein", "manchurian", "uttapam",
}
NONVEG_KEYWORDS = {"chicken", "egg"}
SPECIAL_KEYWORDS = {
    "biryani", "kaju katli", "ice-cream", "gulab jamun",
    "custard", "milk cake", "sewai", "jalebi", "litti chokha",
    "pav bhaji", "chole bhature",
}

# (weekday, slot) → items string
MENU = {
    ("Monday",    "breakfast"): "Chola samosa, meethi chutney, hari chutney, dalia; bread, butter, jam, egg/banana, tea, coffee, milk",
    ("Monday",    "lunch"):     "Punjabi kadhi-pakode, aloo-shimlamirch, pineapple raita, jeera rice, roti; salad, mix achaar",
    ("Monday",    "dinner"):    "Egg curry / Kadhai paneer, moong daal, rice, roti, gulab jamun; salad, mix achaar",

    ("Tuesday",   "breakfast"): "Uttapam, sambhar, coconut chutney, cornflakes; bread, butter, jam, egg/banana, tea, coffee, milk",
    ("Tuesday",   "lunch"):     "Litti chokha, arhar daal, rice, lassi, sambhar; salad, mix achaar",
    ("Tuesday",   "dinner"):    "Veg kofta curry, arhar daal tadka, rice, roti, fruit custard; salad, mix achaar",

    ("Wednesday", "breakfast"): "Pav bhaji, dalia, sprouts; bread, butter, jam, egg/banana, tea, coffee, milk",
    ("Wednesday", "lunch"):     "Kali masoor daal, kaddu sabzi, dahi, rice, puri, sambhar; salad, mix achaar",
    ("Wednesday", "dinner"):    "Chana masala, roti, arhar daal, veg fried rice, sooji halwa; salad, mix achaar",

    ("Thursday",  "breakfast"): "Medu vada, sambhar, coconut chutney, cornflakes; bread, butter, jam, egg/banana, tea, coffee, milk",
    ("Thursday",  "lunch"):     "Safed matar masala, dal makhni, veg pulao, chaach, sambhar, roti; salad, mix achaar",
    ("Thursday",  "dinner"):    "Aloo-pattagobhi, roti, rajma, rice, milk cake; salad, mix achaar",

    ("Friday",    "breakfast"): "Poha + Haldiram bhujiya, jalebi, dalia; bread, butter, jam, egg/banana, tea, coffee, milk",
    ("Friday",    "lunch"):     "Aloo bhujiya, chana daal tadka, rice, roti, dahi; salad, mix achaar",
    ("Friday",    "dinner"):    "Chicken curry/Paneer-pyaaz paratha, chutney, daal, rice, kaju katli; salad, mix achaar",

    ("Saturday",  "breakfast"): "Masala dosa, coconut chutney, sambhar, cornflakes; bread, butter, jam, egg/banana, tea, coffee, milk",
    ("Saturday",  "lunch"):     "Chole bhature, rice, boondi raita, sambhar; salad, mix achaar",
    ("Saturday",  "dinner"):    "Soyabean-aloo, arhar dal tadka, veg pulao, roti, ice-cream; salad, mix achaar",

    ("Sunday",    "breakfast"): "Aloo-pyaaz paratha, dahi, chutney, cornflakes; bread, butter, jam, egg/banana, tea, coffee, milk",
    ("Sunday",    "lunch"):     "Aloo jhol, arhar dal tadka, mix-veg raita, veg biryani, roti; salad, mix achaar",
    ("Sunday",    "dinner"):    "Pasta / chowmein, veg manchurian, mix daal, rice, roti, sewai; salad, mix achaar",
}


def flag(items_lower, keywords):
    return int(any(kw in items_lower for kw in keywords))


def build_menu():
    rows = []
    for (weekday, slot), items in MENU.items():
        il = items.lower()
        # has_nonveg_option: only BH-3 dinner on Mon and Fri has non-veg
        nonveg = 1 if (slot == "dinner" and weekday in ("Monday", "Friday")
                       and flag(il, NONVEG_KEYWORDS)) else 0
        rows.append({
            "weekday":          weekday,
            "slot":             slot,
            "items":            items,
            "has_dessert":      flag(il, DESSERT_KEYWORDS),
            "is_fast_food_item": flag(il, FASTFOOD_KEYWORDS),
            "has_nonveg_option": nonveg,
            "is_special_item":  flag(il, SPECIAL_KEYWORDS),
        })
    df = pd.DataFrame(rows)
    # canonical weekday order
    order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    df["weekday"] = pd.Categorical(df["weekday"], categories=order, ordered=True)
    df = df.sort_values(["weekday", "slot"]).reset_index(drop=True)
    df.to_csv(OUT, index=False)
    print(f"[build_menu] Saved {len(df)} rows → {OUT}")
    return df


if __name__ == "__main__":
    build_menu()
