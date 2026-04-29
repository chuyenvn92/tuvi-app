import { callGemini } from "@/lib/gemini";
import type { TruCanChi } from "@/lib/tuvi";

interface TuviBanMenh {
  nguHanh: string;
  tenGoi: string;
}

export interface AIHomNay {
  tomTat: string;
  chiTiet: string;
  mayMan: number;
  taiLoc: number;
  tinhDuyen: number;
  luuY: string;
}

export interface AIThang {
  taiLoc: string;
  sucKhoe: string;
  tinhCam: string;
  congDanh: string;
}

export interface TuviPayload {
  hoTen: string;
  tuTru: {
    nam: TruCanChi;
    thang: TruCanChi;
    ngay: TruCanChi;
    gio: TruCanChi;
  };
  banMenh: TuviBanMenh;
  conGiap: string;
  cungMenh: string;
  loai: "homNay" | "thang";
}

export type TuviLoai = TuviPayload["loai"];
type TuviAIResultMap = {
  homNay: AIHomNay;
  thang: AIThang;
};

const THIEN_CAN_ORDER = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
const DIA_CHI_ORDER = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
const MENH_SCORE_BONUS: Record<string, number> = { Kim: 1, Mộc: 0, Thủy: 1, Hỏa: 0, Thổ: 0 };
const HANH_TONE: Record<string, { tone: string; pace: string; strength: string; softSpot: string }> = {
  Kim: {
    tone: "rõ ràng và dứt khoát",
    pace: "chắc và chậm vừa đủ, ít hợp với sự vội vàng",
    strength: "độ sắc bén trong quyết định",
    softSpot: "sự cứng tay quá mức trong lời nói",
  },
  Mộc: {
    tone: "mềm mà có độ mở",
    pace: "mở dần từng bước và cần khoảng thở để phát triển",
    strength: "khả năng xoay chuyển và thích nghi",
    softSpot: "dễ phân tán khi ôm quá nhiều việc",
  },
  Thủy: {
    tone: "linh hoạt và giàu cảm nhận",
    pace: "uyển chuyển, hợp quan sát trước khi chốt",
    strength: "trực giác và khả năng đọc tình huống",
    softSpot: "dao động cảm xúc khi nhịp bên ngoài thay đổi",
  },
  Hỏa: {
    tone: "nhiệt và có sức đẩy",
    pace: "nhanh lúc vào nhịp nhưng vẫn cần giữ độ bền",
    strength: "sự chủ động và khí thế",
    softSpot: "dễ quá tay nếu hưng phấn lên cao",
  },
  Thổ: {
    tone: "ổn định và thực tế",
    pace: "chậm mà chắc, càng rõ nền càng dễ lên",
    strength: "khả năng giữ thế cân bằng",
    softSpot: "dễ chậm nhịp khi phải đổi hướng liên tục",
  },
};

const STEM_MOOD: Record<string, string> = {
  "Giáp": "khí thế mở đầu",
  "Ất": "độ mềm và sự khéo léo",
  "Bính": "nguồn sáng rõ, dễ bộc lộ",
  "Đinh": "sự tinh tế và chiều sâu nội tâm",
  "Mậu": "cảm giác vững nền",
  "Kỷ": "khả năng giữ nhịp và điều tiết",
  "Canh": "tính quyết đoán, thích xử lý thẳng",
  "Tân": "con mắt kỹ và độ chỉnh chu",
  "Nhâm": "tầm nhìn rộng, thích xoay sở",
  "Quý": "độ nhạy cảm và trực giác kín đáo",
};

const BRANCH_MOOD: Record<string, string> = {
  "Tý": "nhanh trí và dễ nắm thời cơ",
  "Sửu": "bền bỉ, trọng sự chắc chắn",
  "Dần": "mạnh dạn, thích chủ động",
  "Mão": "mềm mỏng, thiên về hòa khí",
  "Thìn": "khí thế lớn, dễ muốn làm tới cùng",
  "Tỵ": "sâu và kín, hợp suy tính trước",
  "Ngọ": "rõ lửa, dễ bùng ý tưởng",
  "Mùi": "nhẹ nhàng, thiên về giữ hòa hợp",
  "Thân": "linh hoạt, biết xoay chuyển",
  "Dậu": "chỉnh chu, chú ý chi tiết",
  "Tuất": "trực tính, trọng sự đáng tin",
  "Hợi": "thoáng và rộng lòng, hợp nới nhịp",
};

function clampScore(score: number): number {
  return Math.max(4, Math.min(10, score));
}

function stemIndex(can: string): number {
  return Math.max(0, THIEN_CAN_ORDER.indexOf(can));
}

function branchIndex(chi: string): number {
  return Math.max(0, DIA_CHI_ORDER.indexOf(chi));
}

function baseSeed(payload: TuviPayload): number {
  const tru = payload.tuTru;
  return (
    stemIndex(tru.nam.can) +
    branchIndex(tru.nam.chi) +
    stemIndex(tru.thang.can) +
    branchIndex(tru.thang.chi) +
    stemIndex(tru.ngay.can) +
    branchIndex(tru.ngay.chi) +
    stemIndex(tru.gio.can) +
    branchIndex(tru.gio.chi) +
    branchIndex(payload.conGiap) +
    MENH_SCORE_BONUS[payload.banMenh.nguHanh] +
    payload.hoTen.trim().length +
    payload.cungMenh.length
  );
}

function pick<T>(items: T[], seed: number): T {
  return items[Math.abs(seed) % items.length];
}

function pickDistinct<T>(items: T[], seed: number, avoid?: T): T {
  if (items.length === 1) return items[0];
  let chosen = pick(items, seed);
  if (avoid !== undefined && chosen === avoid) {
    chosen = pick(items, seed + 1);
  }
  return chosen;
}

function relationshipBand(value: number): "cao" | "vua" | "thap" {
  if (value >= 8) return "cao";
  if (value >= 6) return "vua";
  return "thap";
}

function buildProfileContext(payload: TuviPayload) {
  const hanh = HANH_TONE[payload.banMenh.nguHanh] ?? HANH_TONE.Thổ;
  const ngayStemMood = STEM_MOOD[payload.tuTru.ngay.can] ?? "nhịp riêng";
  const ngayBranchMood = BRANCH_MOOD[payload.tuTru.ngay.chi] ?? "độ linh hoạt";
  const gioStemMood = STEM_MOOD[payload.tuTru.gio.can] ?? "cách phản ứng trực diện";
  const gioBranchMood = BRANCH_MOOD[payload.tuTru.gio.chi] ?? "một nhịp kín đáo";
  const ngayMood = `${ngayStemMood}, đi cùng ${ngayBranchMood}`;
  const gioMood = `${gioStemMood}, đi cùng ${gioBranchMood}`;

  return {
    hanh,
    ngayMood,
    gioMood,
    profileLine: `Mệnh ${payload.banMenh.nguHanh} khiến tổng thể thiên về ${hanh.tone}, còn trụ ngày lại nhấn vào ${ngayMood}.`,
  };
}

function buildScoreTriplet(payload: TuviPayload) {
  const seed = baseSeed(payload);
  const namSeed = stemIndex(payload.tuTru.nam.can) + branchIndex(payload.tuTru.nam.chi);
  const ngaySeed = stemIndex(payload.tuTru.ngay.can) + branchIndex(payload.tuTru.ngay.chi);
  const gioSeed = stemIndex(payload.tuTru.gio.can) + branchIndex(payload.tuTru.gio.chi);

  const mayMan = clampScore(5 + (seed % 4) + (namSeed % 2));
  const taiLoc = clampScore(5 + ((seed + ngaySeed + 2) % 4) + MENH_SCORE_BONUS[payload.banMenh.nguHanh]);
  const tinhDuyen = clampScore(5 + ((seed + gioSeed + 1) % 4) + (payload.cungMenh.length % 2));

  return { mayMan, taiLoc, tinhDuyen };
}

function buildHomNay(payload: TuviPayload): AIHomNay {
  const seed = baseSeed(payload);
  const { mayMan, taiLoc, tinhDuyen } = buildScoreTriplet(payload);
  const profile = buildProfileContext(payload);
  const mayManBand = relationshipBand(mayMan);
  const taiLocBand = relationshipBand(taiLoc);
  const tinhDuyenBand = relationshipBand(tinhDuyen);

  const summaryLead =
    mayManBand === "cao"
      ? "vượng khí hơn thường lệ"
      : mayManBand === "vua"
        ? "khá cân bằng"
        : "nhiều chỗ cần giữ nhịp";

  const actionHint =
    taiLocBand === "cao"
      ? "hợp chốt những việc đang có đà"
      : taiLocBand === "vua"
        ? "hợp giữ tiến độ và làm chắc từng bước"
        : "hợp quan sát kỹ trước khi quyết định tiền bạc";

  const emotionalHint =
    tinhDuyenBand === "cao"
      ? "các cuộc trò chuyện dễ vào nhịp hơn"
      : tinhDuyenBand === "vua"
        ? "nên giữ giọng nhẹ để mọi thứ trôi hơn"
        : "càng cần nói chậm và rõ để tránh lệch ý";

  const openingOptions = [
    `${payload.hoTen} có một ngày ${summaryLead}, ${actionHint}.`,
    `Nhịp hôm nay của ${payload.hoTen} nhìn chung ${summaryLead}, đặc biệt nếu bạn biết giữ đúng trọng tâm.`,
    `Hôm nay mang màu sắc ${summaryLead} với ${payload.hoTen}; làm ít mà chắc sẽ sáng hơn làm nhiều mà rối.`,
  ];

  const detailOptions = [
    `${profile.profileLine} Vì vậy, cách tốt nhất là giữ nhịp ${profile.hanh.pace}, đừng nóng ở những việc chưa rõ.`,
    `Trụ ngày ${payload.tuTru.ngay.can} ${payload.tuTru.ngay.chi} khiến bạn dễ hành động theo cảm nhận tức thời hơn bình thường; nếu chậm một nhịp để rà lại, kết quả thường đẹp hơn.`,
    `Cung ${payload.cungMenh} cho cảm giác bạn hợp với lối xử lý mềm mà chắc: vẫn chủ động, nhưng tránh đẩy mọi chuyện lên quá căng ngay từ đầu.`,
    `Trụ giờ ${payload.tuTru.gio.can} ${payload.tuTru.gio.chi} làm nổi bật ${profile.gioMood}, nên càng về cuối ngày bạn càng cần giữ đầu óc gọn và bớt ôm nhiều đầu việc.`,
  ];

  const secondDetailOptions = [
    `Về tài lộc, hôm nay điểm sáng nằm ở ${profile.hanh.strength}; hợp nhất là những việc cần tỉnh táo, chốt gọn và có tiêu chuẩn rõ.`,
    `Về tương tác, ${emotionalHint}; nếu đang có điều muốn nói, cứ nói thẳng nhưng giữ độ mềm sẽ dễ được đón nhận hơn.`,
    `Điều dễ làm bạn hụt nhịp nhất hôm nay lại nằm ở ${profile.hanh.softSpot}; chỉ cần tiết chế chỗ đó, cả ngày sẽ đi êm hơn nhiều.`,
    `Nếu cần ưu tiên một việc, nên chọn việc có kết quả nhìn thấy được trong ngắn hạn; cảm giác hoàn thành sớm sẽ giúp vận khí của bạn mở ra tốt hơn.`,
  ];

  return {
    tomTat: pick(openingOptions, seed),
    chiTiet: `${pick(detailOptions, seed + 1)} ${pickDistinct(secondDetailOptions, seed + 4, detailOptions[0] as never)}`,
    mayMan,
    taiLoc,
    tinhDuyen,
    luuY:
      taiLoc >= tinhDuyen
        ? "Nếu phải chốt việc quan trọng, hãy chọn lúc đầu óc đang gọn và chưa bị chia nhỏ bởi quá nhiều cuộc trao đổi."
        : "Nếu có chuyện cần nói rõ, nên đi từ ý chính trước rồi mới thêm cảm xúc; như vậy sẽ dễ được lắng nghe hơn.",
  };
}

function buildThang(payload: TuviPayload): AIThang {
  const seed = baseSeed(payload);
  const intensity = (seed % 3 + 3) % 3;
  const profile = buildProfileContext(payload);
  const monthMood = [
    `Tháng này hợp với cách đi ${profile.hanh.pace}, càng vững nền càng dễ nhìn ra cơ hội đúng lúc.`,
    `Nhịp tháng thiên về sự bền bỉ hơn là bứt tốc; việc nào cần đường dài sẽ sáng hơn việc chỉ trông vào hưng phấn nhất thời.`,
    `Không khí chung của tháng nghiêng về chuyện giữ thế và nắn lại ưu tiên, hơn là lao đi theo cảm hứng.`,
  ];

  const taiLocOptions = [
    `${pick(monthMood, seed)} Về tiền bạc, bạn hợp với các quyết định chắc tay, nhất là những khoản đã có chuẩn bị từ trước.`,
    `Tài lộc tháng này không đến theo kiểu bùng nổ, nhưng có cửa sáng ở những việc biết làm tới nơi tới chốn và giữ kỷ luật chi tiêu.`,
    `Dòng tiền có thể lên xuống thất thường hơn cảm giác ban đầu, nên càng cần chia rõ đâu là khoản cần giữ, đâu là khoản có thể thử.`,
    `Nếu biết tận dụng ${profile.hanh.strength}, tài lộc tháng này vẫn có thể nhích lên khá rõ, nhất là từ các cơ hội nhỏ nhưng đúng thời điểm.`,
  ];
  const sucKhoeOptions = [
    `Sức khỏe tháng này thiên về chuyện giữ độ bền. Chỉ cần ngủ đúng nhịp và đừng để lịch sinh hoạt rối quá lâu, thể trạng sẽ ổn.`,
    `Khối việc trong tháng dễ kéo tâm trí đi trước cơ thể, nên điều cần giữ không phải cố thêm, mà là biết nghỉ trước khi mệt dồn lại.`,
    `Thể lực không phải điểm yếu lớn, nhưng ${profile.hanh.softSpot} có thể khiến bạn hao năng lượng nhanh hơn nếu ôm nhiều việc liên tiếp.`,
    `Cơ thể tháng này hợp với nhịp điều độ: ăn ngủ gọn, giảm xao động nhỏ, bạn sẽ thấy sức mình lên lại khá nhanh.`,
  ];
  const tinhCamOptions = [
    `Tình cảm tháng này hợp với lối nói chuyện thẳng mà ấm. Càng rõ lòng, càng dễ tránh những hiểu lầm không đáng có.`,
    `Nếu đang chờ một cuộc trò chuyện quan trọng, tháng này khá hợp để mở lời, miễn là bạn chọn đúng lúc và giữ giọng nhẹ.`,
    `Mối quan hệ trong tháng không thiếu cơ hội tiến lên, chỉ cần bớt đoán ý nhau và tăng những tín hiệu rõ ràng hơn.`,
    `Điều đẹp nhất của tháng này nằm ở sự đều đặn: quan tâm nhỏ nhưng liên tục sẽ có giá trị hơn một lần bộc lộ thật lớn.`,
  ];
  const congDanhOptions = [
    `Công danh tháng này sáng ở những việc cần độ tin cậy. Càng làm gọn, đúng nhịp và có chuẩn, bạn càng dễ được ghi nhận.`,
    `Đây là thời điểm hợp để củng cố vị thế hơn là đổi hướng liên tục. Làm chắc phần đang có sẽ mở ra bước kế tiếp đẹp hơn.`,
    `Khối lượng việc có thể tăng dần theo tháng, nên bí quyết không nằm ở cố nhiều hơn, mà ở chốt ưu tiên sớm và giữ đầu việc thật sạch.`,
    `Nếu cần bứt lên, hãy chọn đúng một mũi nhọn thay vì dàn trải. Tháng này thưởng cho sự tập trung nhiều hơn cho sự phô trương.`,
  ];

  return {
    taiLoc: pick(taiLocOptions, seed + intensity),
    sucKhoe: pickDistinct(sucKhoeOptions, seed + intensity + 1, taiLocOptions[0] as never),
    tinhCam: pickDistinct(tinhCamOptions, seed + intensity + 2, sucKhoeOptions[0] as never),
    congDanh: pickDistinct(congDanhOptions, seed + intensity + 3, tinhCamOptions[0] as never),
  };
}

function getTodayCanChi() {
  const today = new Date();
  const dd = today.getDate(), mm = today.getMonth() + 1, yy = today.getFullYear();
  const THIEN_CAN_L = ['Giáp','Ất','Bính','Đinh','Mậu','Kỷ','Canh','Tân','Nhâm','Quý'];
  const DIA_CHI_L = ['Tý','Sửu','Dần','Mão','Thìn','Tỵ','Ngọ','Mùi','Thân','Dậu','Tuất','Hợi'];
  const fn = (v: number, b: number) => ((v % b) + b) % b;
  const a = Math.floor((14 - mm) / 12);
  const y = yy + 4800 - a;
  const mv = mm + 12 * a - 3;
  let jd = dd + Math.floor((153 * mv + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  if (jd < 2299161) jd = dd + Math.floor((153 * mv + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
  return {
    ngay: `${dd}/${mm}/${yy}`,
    canChiNgay: `${THIEN_CAN_L[fn(jd + 9, 10)]} ${DIA_CHI_L[fn(jd + 1, 12)]}`,
    canChiNam: `${THIEN_CAN_L[fn(yy - 4, 10)]} ${DIA_CHI_L[fn(yy - 4, 12)]}`,
  };
}

function parseGeminiJSON<T>(raw: string): T | null {
  try { return JSON.parse(raw.trim()) as T; } catch {}
  const md = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (md) { try { return JSON.parse(md[1].trim()) as T; } catch {} }
  const obj = raw.match(/\{[\s\S]*\}/);
  if (obj) { try { return JSON.parse(obj[0]) as T; } catch {} }
  return null;
}

const TUVI_SYSTEM_PROMPT = `Bạn là chuyên gia tử vi theo phương pháp Tứ Trụ Bát Tự.

Ngũ hành tương sinh: Mộc→Hỏa→Thổ→Kim→Thủy→Mộc
Ngũ hành tương khắc: Mộc khắc Thổ, Thổ khắc Thủy, Thủy khắc Hỏa, Hỏa khắc Kim, Kim khắc Mộc
Can ngũ hành: Giáp/Ất=Mộc, Bính/Đinh=Hỏa, Mậu/Kỷ=Thổ, Canh/Tân=Kim, Nhâm/Quý=Thủy
Chi ngũ hành: Dần/Mão=Mộc, Tỵ/Ngọ=Hỏa, Thìn/Tuất/Sửu/Mùi=Thổ, Thân/Dậu=Kim, Tý/Hợi=Thủy

Cách phân tích: xác định ngũ hành của can chi hôm nay → so với bản mệnh → tương sinh=thuận, tương khắc=cần thận trọng, trùng=bổ trợ.
Viết tiếng Việt, tự nhiên, không huyền bí. Chỉ trả về JSON thuần túy, không markdown.`;

async function buildHomNayWithGemini(payload: TuviPayload): Promise<AIHomNay | null> {
  const today = getTodayCanChi();
  const { mayMan, taiLoc, tinhDuyen } = buildScoreTriplet(payload);
  const prompt = `Hôm nay ${today.ngay}, ngày can chi ${today.canChiNgay}, năm ${today.canChiNam}.

Người xem:
- Tên: ${payload.hoTen}
- Tứ Trụ: Năm ${payload.tuTru.nam.can} ${payload.tuTru.nam.chi} | Tháng ${payload.tuTru.thang.can} ${payload.tuTru.thang.chi} | Ngày ${payload.tuTru.ngay.can} ${payload.tuTru.ngay.chi} | Giờ ${payload.tuTru.gio.can} ${payload.tuTru.gio.chi}
- Bản mệnh: ${payload.banMenh.nguHanh} (${payload.banMenh.tenGoi}), tuổi ${payload.conGiap}, cung ${payload.cungMenh}

Điểm số đã tính: May mắn ${mayMan}/10, Tài lộc ${taiLoc}/10, Tình duyên ${tinhDuyen}/10.

Dựa trên quan hệ ngũ hành giữa can chi hôm nay và Tứ Trụ, hãy trả về JSON:
{"tomTat":"1 câu tóm tắt vận hạn hôm nay (≤20 từ, nhắc tên ${payload.hoTen})","chiTiet":"2-3 câu phân tích sâu, tham chiếu can chi cụ thể","luuY":"1 câu lưu ý thực tế và tích cực"}`;

  try {
    const raw = await callGemini(TUVI_SYSTEM_PROMPT, [{ role: "user", parts: [{ text: prompt }] }], { temperature: 0.7, maxOutputTokens: 400 });
    const parsed = parseGeminiJSON<{ tomTat: string; chiTiet: string; luuY: string }>(raw);
    if (parsed?.tomTat && parsed?.chiTiet && parsed?.luuY) {
      return { ...parsed, mayMan, taiLoc, tinhDuyen };
    }
  } catch {}
  return null;
}

async function buildThangWithGemini(payload: TuviPayload): Promise<AIThang | null> {
  const today = getTodayCanChi();
  const prompt = `Hôm nay ${today.ngay}, năm ${today.canChiNam}.

Người xem:
- Tên: ${payload.hoTen}
- Tứ Trụ: Năm ${payload.tuTru.nam.can} ${payload.tuTru.nam.chi} | Tháng ${payload.tuTru.thang.can} ${payload.tuTru.thang.chi} | Ngày ${payload.tuTru.ngay.can} ${payload.tuTru.ngay.chi} | Giờ ${payload.tuTru.gio.can} ${payload.tuTru.gio.chi}
- Bản mệnh: ${payload.banMenh.nguHanh} (${payload.banMenh.tenGoi}), tuổi ${payload.conGiap}, cung ${payload.cungMenh}

Phân tích vận hạn tháng này dựa trên Tứ Trụ và bản mệnh. Trả về JSON:
{"taiLoc":"1-2 câu tài lộc tháng này (dựa trên ngũ hành cụ thể)","sucKhoe":"1-2 câu sức khỏe","tinhCam":"1-2 câu tình cảm","congDanh":"1-2 câu công danh sự nghiệp"}`;

  try {
    const raw = await callGemini(TUVI_SYSTEM_PROMPT, [{ role: "user", parts: [{ text: prompt }] }], { temperature: 0.7, maxOutputTokens: 400 });
    const parsed = parseGeminiJSON<AIThang>(raw);
    if (parsed?.taiLoc && parsed?.sucKhoe && parsed?.tinhCam && parsed?.congDanh) {
      return parsed;
    }
  } catch {}
  return null;
}

export async function generateTuviAI<TLoai extends TuviLoai>(
  payload: TuviPayload & { loai: TLoai },
  _apiKey?: string
): Promise<TuviAIResultMap[TLoai]> {
  if (payload.loai === "homNay") {
    const result = await buildHomNayWithGemini(payload) ?? buildHomNay(payload);
    return result as TuviAIResultMap[TLoai];
  }
  const result = await buildThangWithGemini(payload) ?? buildThang(payload);
  return result as TuviAIResultMap[TLoai];
}
