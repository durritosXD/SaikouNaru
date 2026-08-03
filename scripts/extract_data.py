import sqlite3
import json
import os
import re
import sys
import zipfile

# JLPT kanji sets
N5_KANJI = set("一二三四五六七八九十百千万円口目耳手足上下右左右中大中小月火水木金土日月年日木山川田人女子男子分時分半本休語何前後校高母父毎気生行来出入見書聞読話買立会生名本国方車代名先生長学間同今朝昼夜今週毎外南北西東白赤青黒新古長多少高安大")
N4_KANJI = set("不世主事京仕代以上会体作用例借品員商問坂堂場売夏夕多夜太妹姉始字学家家宿犬屋工市区店病院洋服着館重野風飯飲送計走起足転近送道通運部都重野銀開院集青音頭館親切料理特別同思意心考死民漢気強教文料画海漢字勉教試強答題業試説意楽英界写写真真事親有英急真室待貸族春旅昼兄弟姉妹海洋洗着物着夏服重地池村社町立病病院肉茶飯飲医始病勉開切終動使便用強買物売思知発待持特黒界特病別医勉買使写真昼試薬送教切動質問作主急病元黒強洋事家野注野界業説貸写送事元病院切薬特画親写")
N3_KANJI = set("政議連対部合市内相定回選米実関決全表約期取都和統以要勝再権保省和設受済委結派調局面打変制度段性過姿加第展感最職興引告身発受記法次格各確反情応認提案数向得権務求政務命点報和活原交受変組身命説談意界全引実性確調済求向度身界情政報結交引面性提反向次動性身格加感最命和展活姿法確面提関過報法反")
N2_KANJI = set("党協総区領県設改第済警面残役投軍文宿技格況等位警格減察施指術選球職失与応企営件示違初極勢適導幹判満株象配限与害負敗移衆争狙針才探突転企案追撃離傾退討補収倒張陸留懸討処")

def get_jlpt_level(kanji, rtk_num):
    if kanji in N5_KANJI:
        return "N5"
    if kanji in N4_KANJI:
        return "N4"
    if kanji in N3_KANJI:
        return "N3"
    if kanji in N2_KANJI:
        return "N2"
    
    # Fallback heuristic based on RTK index for 3,000 Kanji
    # RTK 1..250 -> mostly N5/N4
    # 251..600 -> N4/N3
    # 601..1200 -> N3/N2
    # 1201..2200 -> N1
    # 2201..3000 -> N1/Extra
    if rtk_num <= 150:
        return "N5"
    elif rtk_num <= 450:
        return "N4"
    elif rtk_num <= 950:
        return "N3"
    elif rtk_num <= 1800:
        return "N2"
    else:
        return "N1"

def clean_html(text):
    if not text:
        return ""
    # Strip basic inline HTML tags if needed or format nicely
    return text.strip()

def main():
    os.makedirs("src/data", exist_ok=True)
    os.makedirs("public/strokes", exist_ok=True)
    
    apkg_path = "Jp_Kanji_-_RTK_1_3_w_Strokes_Koohii_stories_Yomi_Samples.apkg"
    
    # Extract collection.anki2 and media from apkg
    with zipfile.ZipFile(apkg_path, "r") as z:
        z.extract("collection.anki2", "tmp_anki")
        media_mapping = json.loads(z.read("media").decode("utf-8"))
        
        # Extract stroke GIFs to public/strokes/
        print(f"Extracting {len(media_mapping)} media files...")
        for file_id, filename in media_mapping.items():
            if file_id in z.namelist() and (filename.endswith(".gif") or filename.endswith(".png") or filename.endswith(".svg")):
                target_path = os.path.join("public", "strokes", filename)
                with open(target_path, "wb") as f_out:
                    f_out.write(z.read(file_id))
                    
    conn = sqlite3.connect("tmp_anki/collection.anki2")
    c = conn.cursor()
    
    notes = c.execute("SELECT id, flds FROM notes ORDER BY id ASC").fetchall()
    cards = []
    
    for idx, (note_id, flds_str) in enumerate(notes):
        flds = flds_str.split("\x1f")
        if len(flds) < 11:
            continue
            
        kanji = flds[0].strip()
        rtk_frame_str = flds[1].strip()
        try:
            rtk_num = int(rtk_frame_str)
        except ValueError:
            rtk_num = idx + 1
            
        keyword = flds[2].strip()
        meaning = flds[3].strip()
        onyomi = flds[4].strip()
        kunyomi = flds[5].strip()
        koohii1 = clean_html(flds[6])
        koohii2 = clean_html(flds[7])
        on_words = clean_html(flds[8])
        kun_words = clean_html(flds[9])
        
        # Extract GIF filename from <img src="...gif"/>
        stroke_gif_match = re.search(r'src=["\']?([^"\'\s>]+)', flds[10])
        stroke_gif = stroke_gif_match.group(1) if stroke_gif_match else f"{kanji}.gif"
        
        jlpt = get_jlpt_level(kanji, rtk_num)
        
        card = {
            "id": f"kanji_{idx+1}",
            "kanji": kanji,
            "rtkNum": rtk_num,
            "keyword": keyword,
            "meaning": meaning,
            "onyomi": onyomi,
            "kunyomi": kunyomi,
            "koohii1": koohii1,
            "koohii2": koohii2,
            "onWords": on_words,
            "kunWords": kun_words,
            "strokeGif": stroke_gif,
            "jlpt": jlpt,
            "type": "kanji"
        }
        cards.append(card)
        
    out_path = os.path.join("src", "data", "kanji_rtk_database.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(cards, f, ensure_ascii=False, indent=2)
        
    print(f"Successfully processed {len(cards)} kanji cards to {out_path}!")

if __name__ == "__main__":
    main()
