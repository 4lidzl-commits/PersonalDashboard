export type Quote = { t: string; a: string };

export const QUOTES: Quote[] = [
  { t: "Mutluluk; dışarıdaki olaylara değil, düşüncelerinin niteliğine bağlıdır.", a: "Marcus Aurelius" },
  { t: "Zihin, engellenen hareketi kendi yararına çevirir. Eylemin önündeki engel, eylemin ta kendisine dönüşür; yoldaki engel, yol olur.", a: "Marcus Aurelius" },
  { t: "Sahip olduğun en değerli şey dikkatindir. Onu bilgece harca.", a: "Marcus Aurelius" },
  { t: "Sabah uyandığında kendine de ki: bugün nankör, kibirli insanlarla karşılaşacağım. Ama hiçbiri beni iyiyi yapmaktan alıkoyamaz.", a: "Marcus Aurelius" },
  { t: "Öfkenin sonuçları, nedenlerinden çok daha ağırdır.", a: "Marcus Aurelius" },
  { t: "İçindeki kaleyi güçlendir; orayı kimse işgal edemez.", a: "Marcus Aurelius" },
  { t: "Yaptığın her işi, son işinmiş gibi ciddiyetle yap.", a: "Marcus Aurelius" },
  { t: "Gereksiz olanı söyleme, gereksiz olanı yapma; zamandan da sıkıntıdan da tasarruf edersin.", a: "Marcus Aurelius" },
  { t: "Evren değişimdir; hayat ise bizim ona ne dediğimizdir.", a: "Marcus Aurelius" },
  { t: "Kendi zihnini dinlemeyi öğrenmedikçe hiçbir yerde huzur bulamazsın.", a: "Marcus Aurelius" },
  { t: "Hayat kısa değildir; onu biz kısaltırız. Zamanımız boldur, savurganlığımız büyüktür.", a: "Seneca" },
  { t: "Yoksulluk az şeye sahip olmak değil, çok şey istemektir.", a: "Seneca" },
  { t: "Zorluklar zihni güçlendirir; tıpkı emeğin bedeni güçlendirdiği gibi.", a: "Seneca" },
  { t: "Korktuğumuz şeylerin çoğu başımıza gelmez; acının büyüğü zihinde yaşanır.", a: "Seneca" },
  { t: "Şans, hazırlıkla fırsatın buluştuğu yerdir.", a: "Seneca" },
  { t: "Sade bir hayat, büyük bir özgürlüktür.", a: "Seneca" },
  { t: "Yarını beklemek, bugünün elden gitmesine izin vermektir.", a: "Seneca" },
  { t: "Acele etmeden yaşa; her meyvenin bir vakti vardır.", a: "Seneca" },
  { t: "Kimi zaman geri çekilmek de bir zaferdir.", a: "Seneca" },
  { t: "Günün sonunda kendinle baş başa kalmaktan korkmayan, kendini iyi yetiştirmiştir.", a: "Seneca" },
  { t: "Bazı şeyler elimizdedir, bazıları değildir. Huzur, bu ayrımı her sabah hatırlamaktan geçer.", a: "Epiktetos" },
  { t: "İnsanları sarsan olaylar değil, olaylar hakkındaki düşünceleridir.", a: "Epiktetos" },
  { t: "Önce nasıl biri olmak istediğine karar ver; sonra gerekeni yap.", a: "Epiktetos" },
  { t: "Hiçbir şeyi kaybetmezsin; yalnızca sahibine geri verirsin.", a: "Epiktetos" },
  { t: "Kontrolün dışındakine harcanan her dakika, kontrolün içindekinden çalınmıştır.", a: "Epiktetos" },
  { t: "Kimseyi özgür sayma, kendi kendinin efendisi olmadıkça.", a: "Epiktetos" },
  { t: "Duymak istediklerini değil, doğruyu ara; o seni özgür kılar.", a: "Epiktetos" },
  { t: "Az konuş, çok dinle; iki kulağımız ve tek ağzımız olması tesadüf değildir.", a: "Epiktetos" },
  { t: "İrade dışında hiçbir şey tamamen sana ait değildir; öyleyse onu eğit.", a: "Epiktetos" },
  { t: "Söz ustası olmadan önce, eylem ustası ol.", a: "Epiktetos" },
  { t: "Engel mi var? O, antrenman alanındır.", a: "Marcus Aurelius" },
  { t: "Doğruluk pahasına bile kimseye zarar verme; erdem, tek gerçek iyiliktir.", a: "Marcus Aurelius" },
  { t: "Disiplin; arzuların değil, aklın emrinde olmaktır.", a: "Stoa Öğretisi" },
  { t: "Her gün, hesabını kendine veren bir gün olsun.", a: "Seneca" },
];

export function quoteOfDay(now = new Date()): Quote {
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000);
  return QUOTES[dayOfYear % QUOTES.length];
}
