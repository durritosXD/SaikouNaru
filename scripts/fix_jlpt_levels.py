import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

# Official JLPT Kanji Sets
N5_SET = set("一二三四五六七八九十百千万円口目耳手足上下右左中大中小月火水木金土日年山川田人女子男子分時半本休語何前後校高母父毎気生行来出入見書聞読話買立会名国方車代先生長学間同今朝昼夜週外南北西東白赤青黒新古多少安天雨電花魚犬")

N4_SET = set("不世主事京仕体作用例借品員商問坂堂場売夏夕多太妹姉始字家宿屋工市区店病院洋服着館重野風飯飲送計走起転近道通運部都銀開院集音頭親切料理特別思意心考死民漢強教文料画海漢字勉答題業説楽英界写写真急室待貸族春旅兄弟姉妹洗物地池村社町病肉茶医元薬質作注度貸") - N5_SET

N3_SET = set("政議連対合市内相定回選米実関決全表約期取和統以要勝再権保省設受済委結派調局面打変制度段性過姿加第展感最職興引告身記法次格各確反情応認提案数向得権務求命点報活原交組利伝非差続常位並神様念違置指全受演連割適済案変利関打導") - N5_SET - N4_SET

N2_SET = set("党協総区領県改警面残役投軍文宿技況等減察施術球失与応企営件示初極勢幹判満株象配限害負敗移衆争狙針才探突討補収倒張陸留懸処穴払抜掛押振抜") - N5_SET - N4_SET - N3_SET

# Load current kanji_rtk_database.json
with open('src/data/kanji_rtk_database.json', 'r', encoding='utf-8') as f:
    cards = json.load(f)

print(f"Total cards to classify: {len(cards)}")

n5_count = 0
n4_count = 0
n3_count = 0
n2_count = 0
n1_count = 0
other_count = 0

for card in cards:
    k = card['kanji']
    
    if k in N5_SET:
        card['jlpt'] = 'N5'
        n5_count += 1
    elif k in N4_SET:
        card['jlpt'] = 'N4'
        n4_count += 1
    elif k in N3_SET:
        card['jlpt'] = 'N3'
        n3_count += 1
    elif k in N2_SET:
        card['jlpt'] = 'N2'
        n2_count += 1
    else:
        # Check standard RTK index range for N1 vs Extra/Advanced
        if card['rtkNum'] <= 1950:
            card['jlpt'] = 'N1'
            n1_count += 1
        else:
            card['jlpt'] = 'N1'
            other_count += 1

print("Updated JLPT counts:")
print(f"  N5: {n5_count}")
print(f"  N4: {n4_count}")
print(f"  N3: {n3_count}")
print(f"  N2: {n2_count}")
print(f"  N1: {n1_count + other_count}")

# Save updated JSON
with open('src/data/kanji_rtk_database.json', 'w', encoding='utf-8') as f:
    json.dump(cards, f, ensure_ascii=False, indent=2)

print("Saved updated src/data/kanji_rtk_database.json!")
