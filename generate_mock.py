import json
import random
from datetime import datetime, timedelta

ticker_sectors = {
    "Bank": [
        "ABBANK", "ALARABANK", "BANKASIA", "BRACBANK", "CITYBANK", "DHAKABANK", 
        "DUTCHBANGL", "EBL", "EXIMBANK", "FIRSTSBANK", "GIB", "ICBIBANK", "IFIC", 
        "ISLAMIBANK", "JAMUNABANK", "MERCANBANK", "MIDLANDBNK", "MTB", "NBL", 
        "NCCBANK", "NRBBANK", "NRBCBANK", "ONEBANKPLC", "PREMIERBAN", "PRIMEBANK", 
        "PUBALIBANK", "RUPALIBANK", "SBACBANK", "SHAHJABANK", "SIBL", "SOUTHEASTB", 
        "STANDBANKL", "TRUSTBANK", "UCB", "UNIONBANK", "UTTARABANK"
    ],
    "Financial Institutions": [
        "BAYLEASING", "BDFINANCE", "BIFC", "DBH", "FAREASTFIN", "FASFIN", "FIRSTFIN", 
        "GSPFINANCE", "IDLC", "ILFSL", "IPDC", "ISLAMICFIN", "LANKABAFIN", "MIDASFIN", 
        "NHFIL", "PHOENIXFIN", "PLFSL", "PRIMEFIN", "UNIONCAP", "UNITEDFIN", "UTTARAFIN"
    ],
    "Engineering": [
        "AFTABAUTO", "AMANFEED", "ANWARGALV", "APOLOISPAT", "ARAMIT", "ATLASBANG", 
        "AZIZPIPES", "BBS", "BBSCABLES", "BDAUTOCA", "BDLAMPS", "BDWELDING", 
        "BENGALWTL", "BSRMLTD", "BSRMSTEEL", "COPPERTECH", "DOMINAGE", "EPGL", 
        "GPHISPAT", "GOLDENSON", "IFADAUTOS", "INDEXAGRO", "KDSALTD", "KAY&QUE", 
        "MIRAKHTER", "MONNOAGML", "NAHEEACP", "NPOLYMER", "NTLTUBES", "OAL", 
        "OIMEX", "QUASEMIND", "RANFOUNDRY", "RSRMSTEEL", "RUNNERAUTO", "SSSTEEL", 
        "SAIFPOWER", "SALAMCRST", "SHURWID", "SINGERBD", "WALTONHIL", "WMSHIPYARD"
    ],
    "Food & Allied": [
        "AMCL(PRAN)", "APEXFOODS", "BANGAS", "BATBC", "BDTHAIFOOD", "BEACHHATCH", 
        "EMERALDOIL", "FINEFOODS", "FUWANGFOOD", "GEMINISEA", "GHAIL", "LOVELLO", 
        "MEGCONMILK", "MEGHNAPET", "NTC", "OLYMPIC", "RAHIMAFOOD", "RDFOOD", 
        "SHYAMPSUG", "UNILEVERCL", "ZEALBANGLA"
    ],
    "Fuel & Power": [
        "AOL", "BARKAPOWER", "BPPL", "CVOPRL", "DESCO", "DOREENPWR", "EASTRNLUB", 
        "GBBPOWER", "INTRACO", "JAMUNAOIL", "KPCL", "LINDEBD", "LRBDL", "MJLBD", 
        "MPETROLEUM", "NAVANACNG", "PADMAOIL", "POWERGRID", "SPCL", "SUMITPOWER", 
        "TITASGAS", "UPGDCL"
    ],
    "Pharmaceuticals & Chemicals": [
        "ACI", "ACIFORMULA", "ACMELAB", "ACMEPL", "ACTIVEFINE", "ADVENT", "AFCAGRO", 
        "AMBEEPHA", "ASIATICLAB", "BEACONPHAR", "BXPHARMA", "CENTRALPHL", "FARCHEM", 
        "GHCL", "IBNSINA", "IBP", "JHRML", "JMISMDL", "KEYACOSMET", "KOHINOOR", 
        "LIBRAINFU", "MARICO", "NAVANAPHAR", "ORIONINFU", "ORIONPHARM", "PHARMAID", 
        "RECKITTBEN", "RENATA", "SALVO", "SILCOPHL", "SILVAPHL", "SQURPHARMA", 
        "TECHNODRUG", "WATACHEM"
    ],
    "Textile": [
        "ACFL", "AIL", "AL-HAJTEX", "ALIF", "ALLTEX", "ANLIMAYARN", "ARGONDENIM", 
        "CNATEX", "DACCADYE", "DELTASPINN", "DESHBANDHU", "DSHGARME", "DSSL", 
        "DULAMIACOT", "ENVOYTEX", "ESQUIRENIT", "ETL", "FAMILYTEX", "FEKDIL", 
        "GENNEXT", "HFL", "HRTEX", "HWAWELLTEX", "KTL", "MAKSONSPIN", "MALEKSPIN", 
        "MATINSPINN", "METROSPIN", "MHSML", "MLDYEING", "MONNOFABR", "NEWLINE", 
        "NURANI", "PDL", "PRIMETEX", "PTL", "QUEENSOUTH", "RAHIMTEXT", "REGENTTEX", 
        "RINGSHINE", "SAFKOSPINN", "SAIHAMCOT", "SAIHAMTEX", "SHASHADNIM", 
        "SHEPHERD", "SIMTEX", "SONARGAON", "SQUARETEXT", "STYLECRAFT", "TALLUSPIN", 
        "TAMIJTEX", "TOSRIFA", "TUNGHAI", "VFSTDL", "ZAHEENSPIN", "ZAHINTEX"
    ],
    "IT Sector": [
        "AAMRANET", "AAMRATECH", "ADNTEL", "AGNISYSL", "BDCOM", "DAFODILCOM", 
        "EGEN", "GENEXIL", "INTECH", "ISNLTD", "ITC"
    ],
    "Insurance": [
        "AGRANINS", "ASIAINS", "ASIAPACINS", "BGIC", "BNICL", "CENTRALINS", 
        "CITYGENINS", "CLICL", "CONTININS", "CRYSTALINS", "DELTALIFE", "DGIC", 
        "DHAKAINS", "EASTERNINS", "EASTLAND", "EIL", "FAREASTLIF", "FEDERALINS", 
        "GLOBALINS", "GREENDELT", "ICICL", "ISLAMIINS", "JANATAINS", "KARNAPHULI", 
        "MEGHNAINS", "MEGHNALIFE", "MERCINS", "NATLIFEINS", "NITOLINS", "NORTHRNINS", 
        "PADMALIFE", "PARAMOUNT", "PEOPLESINS", "PHENIXINS", "PIONEERINS", 
        "POPULARLIF", "PRAGATIINS", "PRAGATILIF", "PRIMEINSUR", "PRIMELIFE", 
        "PROGRESLIF", "PROVATIINS", "PURABIGEN", "RELIANCINS", "REPUBLIC", 
        "RUPALIINS", "RUPALILIFE", "SANDHANINS", "SICL", "SIPLC", "SLIPLC", 
        "SONARBAINS", "STANDARINS", "SUNLIFEINS", "TAKAFULINS", "TILIL", "UNIONINS"
    ],
    "Mutual Funds": [
        "ABB1STMF", "AIBL1STIMF", "CAPITECGBF", "CAPMBDBLMF", "CAPMIBBLMF", 
        "DBH1STMF", "EBL1STMF", "EBLNRBMF", "EXIM1STMF", "FBFIF", "GLDNJMF", 
        "GRAMEENS2", "GREENDELMF", "ICB3RDNRB", "ICBAGRANI1", "ICBAMCL2ND", 
        "ICBEPMF1S1", "ICBSONALI1", "IFIC1STMF", "IFILISLMF1", "LRGLOBMF1", 
        "MBL1STMF", "NCCBLMF1", "PF1STMF", "PHPMF1", "POPULAR1MF", "RELIANCE1", 
        "SEMLFBSLGF", "SEMLIBBLSF", "SEMLLECMF", "TRUSTB1MF", "VAMLBDMF1", 
        "VAMLRBBF", "1JANATAMF", "1STPRIMFMF"
    ],
    "Tannery Industries": [
        "APEXFOOT", "APEXTANRY", "BATASHOE", "FORTUNE", "LEGACYFOOT", "SAMATALETH"
    ],
    "Cement": [
        "ARAMITCEM", "CONFIDCEM", "CROWNCEMNT", "HEIDELBCEM", "LHB", "MEGHNACEM", "PREMIERCEM"
    ],
    "Ceramic Sector": [
        "FUWANGCER", "MONNOCERA", "RAKCERAMIC", "SPCERAMICS", "STANCERAM"
    ],
    "Telecommunication": [
        "GP", "ROBI", "BSCPLC"
    ],
    "Travel & Leisure": [
        "BESTHLDNG", "PENINSULA", "SEAPEARL", "UNIQUEHRL"
    ],
    "Paper & Printing": [
        "BPML", "HAKKANIPUL", "KPPL", "MONOSPOOL", "SONALIPAPR"
    ],
    "Services & Real Estate": [
        "BDSERVICE", "BSC", "EHL", "SAMORITA", "SAPORTL"
    ],
    "Jute": [
        "JUTESPINN", "NORTHERN", "SONALIANSH"
    ],
    "Corporate Bond": [
        "ABBLPBOND", "APSCLBOND", "BEXGSUKUK", "CBLPBOND", "DBLPBOND", 
        "IBBL2PBOND", "IBBLPBOND", "MBPLCPBOND", "MTBPBOND", "PBLPBOND", 
        "PREBPBOND", "SEB1PBOND", "SJIBLPBOND", "UCB2PBOND"
    ],
    "Miscellaneous": [
        "BERGERPBL", "BEXIMCO", "GQBALLPEN", "HAMI", "KBPPWBIL", "MAGURAPLEX", 
        "MIRACLEIND", "SAVAREFR", "SHARPIND", "SINOBANGLA", "SKTRIMS", "USMANIAGL", "YPL"
    ]
}

categories = [
    "project_finance", 
    "distress_bankruptcy", 
    "privatization", 
    "workforce_layoffs",
    "dividend_declaration"
]

all_tickers = []
for sec, ticks in ticker_sectors.items():
    for t in ticks:
        all_tickers.append({"ticker": t, "industry": sec})

news_data = []

start_date = datetime.strptime("2021-01-01", "%Y-%m-%d")
end_date = datetime.now()

id_counter = 1

for t_info in all_tickers:
    # Generate 3-10 news records per ticker
    num_news = random.randint(3, 10)
    for _ in range(num_news):
        rand_days = random.randint(0, (end_date - start_date).days)
        post_date = start_date + timedelta(days=rand_days)
        
        cat = random.choice(categories)
        news_title = f"{t_info['ticker']} announces important updates on {cat.replace('_', ' ')}"
        news_text = f"We are writing to announce that {t_info['ticker']} has issued a decision regarding {cat}. The board has approved several resolutions during the last quarter."
        value_cr = round(random.uniform(10.0, 500.0), 2)

        news_data.append({
            "id": id_counter,
            "Date": post_date.strftime("%Y-%m-%d"),
            "Ticker": t_info['ticker'],
            "Industry": t_info['industry'],
            "Category": cat,
            "Announced_Value_Local": f"Tk {value_cr} crore",
            "Standardized_Value_Tk_Cr": value_cr,
            "News_Title": news_title,
            "News_Text": news_text,
            "Source_URL": f"https://www.dsebd.org/old_news.php?inst={t_info['ticker']}&criteria=3&archive=news"
        })
        id_counter += 1

with open("public/newsData.json", "w") as f:
    json.dump({
        "tickersList": all_tickers,
        "newsList": news_data
    }, f)

print(f"Generated {len(news_data)} news items for {len(all_tickers)} tickers in public/newsData.json")
