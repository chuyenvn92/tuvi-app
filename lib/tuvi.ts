// ============================================================
// Tính toán Tử Vi cơ bản
// Thuật toán âm lịch: Hồ Ngọc Đức (www.informatik.uni-leipzig.de/~duc)
// ============================================================

// Helper: Tính Julian Day Number từ dương lịch
export function jdFromDate(dd: number, mm: number, yy: number): number {
  const a = Math.floor((14 - mm) / 12);
  const y = yy + 4800 - a;
  const m = mm + 12 * a - 3;
  let jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  if (jd < 2299161) jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
  return jd;
}

// ============================================================
// TỨ TRỤ (Tứ Trụ Bát Tự)
// Tính Can Chi của năm, tháng, ngày, giờ sinh
// ============================================================
export interface TruCanChi { can: string; chi: string; }
export type MucDoDanhGia = 'Hanh thông' | 'Bình ổn' | 'Cần lưu ý';

export interface DanhGiaThamKhao {
  mucDo: MucDoDanhGia;
  tieuDe: string;
  moTa: string;
  mauSac: string;
}

export interface VanHanThangInfo extends DanhGiaThamKhao {
  thang: number;
  nguHanhThang: string;
}

function mod(value: number, base: number): number {
  return ((value % base) + base) % base;
}

const GIO_CHI_IDX: Record<string, number> = {
  'Tý (23h-1h)': 0, 'Sửu (1h-3h)': 1, 'Dần (3h-5h)': 2, 'Mão (5h-7h)': 3,
  'Thìn (7h-9h)': 4, 'Tỵ (9h-11h)': 5, 'Ngọ (11h-13h)': 6, 'Mùi (13h-15h)': 7,
  'Thân (15h-17h)': 8, 'Dậu (17h-19h)': 9, 'Tuất (19h-21h)': 10, 'Hợi (21h-23h)': 11,
};

export function getTuTru(
  dd: number, mm: number, yy: number,
  gioSinh: string,
  thangAm: number, namAm: number
): { nam: TruCanChi; thang: TruCanChi; ngay: TruCanChi; gio: TruCanChi } {
  // --- Năm ---
  const namCanIdx = mod(namAm - 4, 10);
  const namChiIdx = mod(namAm - 4, 12);

  // --- Tháng ---
  // Chi tháng: tháng 1 âm = Dần (idx 2), tháng 2 = Mão (3), ...
  const thangChiIdx = (thangAm + 1) % 12;
  // Can tháng phụ thuộc vào can năm (quy tắc ngũ hổ độn nguyệt)
  // Giáp/Kỷ → tháng 1 âm bắt đầu Bính (2); Ất/Canh → Mậu (4); Bính/Tân → Canh (6); Đinh/Nhâm → Nhâm (8); Mậu/Quý → Giáp (0)
  const thangCanStart = [2, 4, 6, 8, 0][namCanIdx % 5];
  const thangCanIdx = mod(thangCanStart + thangAm - 1, 10);

  // --- Ngày ---
  // Can Chi ngày có thể tính trực tiếp từ JDN, tránh lệch mốc tham chiếu.
  const jd = jdFromDate(dd, mm, yy);
  const ngayCanIdx = mod(jd + 9, 10);
  const ngayChiIdx = mod(jd + 1, 12);

  // --- Giờ ---
  // Chi giờ: từ tên giờ sinh
  const gioChiIdx = GIO_CHI_IDX[gioSinh] ?? 0;
  // Can giờ phụ thuộc vào can ngày (quy tắc ngũ thử độn thời)
  // Giáp/Kỷ → giờ Tý bắt đầu Giáp (0); Ất/Canh → Bính (2); Bính/Tân → Mậu (4); Đinh/Nhâm → Canh (6); Mậu/Quý → Nhâm (8)
  const gioCanStart = [0, 2, 4, 6, 8][ngayCanIdx % 5];
  const gioCanIdx = mod(gioCanStart + gioChiIdx, 10);

  return {
    nam:   { can: THIEN_CAN[namCanIdx],   chi: DIA_CHI[namChiIdx] },
    thang: { can: THIEN_CAN[thangCanIdx], chi: DIA_CHI[thangChiIdx] },
    ngay:  { can: THIEN_CAN[ngayCanIdx],  chi: DIA_CHI[ngayChiIdx] },
    gio:   { can: THIEN_CAN[gioCanIdx],   chi: DIA_CHI[gioChiIdx] },
  };
}

// Chuyển dương lịch → âm lịch (trả về [ngayAm, thangAm, namAm])
export function solarToLunar(dd: number, mm: number, yy: number): [number, number, number] {
  const PI = Math.PI;
  const timeZone = 7;

  function INT(d: number) { return Math.floor(d); }

  function jdFromDateLocal(dd: number, mm: number, yy: number) {
    const a = INT((14 - mm) / 12);
    const y = yy + 4800 - a;
    const m = mm + 12 * a - 3;
    let jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - INT(y / 100) + INT(y / 400) - 32045;
    if (jd < 2299161) jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - 32083;
    return jd;
  }

  function NewMoon(k: number) {
    const T = k / 1236.85;
    const T2 = T * T; const T3 = T2 * T; const dr = PI / 180;
    let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
    Jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
    const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
    const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
    const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
    let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
    C1 -= 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
    C1 -= 0.0004 * Math.sin(dr * 3 * Mpr);
    C1 += 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
    C1 -= 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
    C1 -= 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
    C1 += 0.0010 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (M + 2 * Mpr));
    let deltat: number;
    if (T < -11) deltat = 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3;
    else deltat = -0.000278 + 0.000265 * T + 0.000262 * T2;
    return Jd1 + C1 - deltat;
  }

  function SunLongitude(jdn: number) {
    const T = (jdn - 2451545.0) / 36525;
    const T2 = T * T;
    const dr = PI / 180;
    const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
    const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T2;
    let DL = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
    DL += (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.00029 * Math.sin(dr * 3 * M);
    let L = L0 + DL;
    L *= dr;
    L -= PI * 2 * INT(L / (PI * 2));
    return L;
  }

  function getSunLongitude(dayNumber: number, tz: number) {
    return INT(SunLongitude(dayNumber - 0.5 - tz / 24) / PI * 6);
  }

  function getNewMoonDay(k: number, tz: number) {
    return INT(NewMoon(k) + 0.5 + tz / 24);
  }

  function getLunarMonth11(yy: number, timeZone: number) {
    const off = jdFromDateLocal(31, 12, yy) - 2415021;
    const k = INT(off / 29.530588853);
    let nm = getNewMoonDay(k, timeZone);
    const sunLong = getSunLongitude(nm, timeZone);
    if (sunLong >= 9) nm = getNewMoonDay(k - 1, timeZone);
    return nm;
  }

  function getLeapMonthOffset(a11: number, timeZone: number) {
    const k = INT((a11 - 2415021.076998695) / 29.530588853 + 0.5);
    let last = 0;
    let i = 1;
    let arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
    do {
      last = arc;
      i++;
      arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
    } while (arc !== last && i < 14);
    return i - 1;
  }

  const dayNumber = jdFromDateLocal(dd, mm, yy);
  const k = INT((dayNumber - 2415021.076998695) / 29.530588853);
  let monthStart = getNewMoonDay(k + 1, timeZone);
  if (monthStart > dayNumber) monthStart = getNewMoonDay(k, timeZone);

  let a11 = getLunarMonth11(yy, timeZone);
  let b11 = a11;
  let lunarYear: number;
  if (a11 >= monthStart) {
    lunarYear = yy;
    a11 = getLunarMonth11(yy - 1, timeZone);
  } else {
    lunarYear = yy + 1;
    b11 = getLunarMonth11(yy + 1, timeZone);
  }

  const lunarDay = dayNumber - monthStart + 1;
  const diff = INT((monthStart - a11) / 29);
  let lunarMonth = diff + 11;
  if (b11 - a11 > 365) {
    const leapMonthDiff = getLeapMonthOffset(a11, timeZone);
    if (diff >= leapMonthDiff) lunarMonth = diff + 10;
  }
  if (lunarMonth > 12) lunarMonth -= 12;
  if (lunarMonth >= 11 && diff < 4) lunarYear -= 1;

  return [lunarDay, lunarMonth, lunarYear];
}

export const THIEN_CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
export const DIA_CHI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
export const NGU_HANH = ['Kim', 'Mộc', 'Thủy', 'Hỏa', 'Thổ'];

// Nạp âm ngũ hành theo vị trí trong chu kỳ 60 năm (theo cặp)
// Mỗi cặp Can Chi liên tiếp có cùng ngũ hành
const NAP_AM: { nguHanh: string; tenGoi: string }[] = [
  { nguHanh: 'Kim',  tenGoi: 'Hải Trung Kim' },   // Giáp Tý, Ất Sửu (0,1)
  { nguHanh: 'Hỏa', tenGoi: 'Lô Trung Hỏa' },     // Bính Dần, Đinh Mão (2,3)
  { nguHanh: 'Mộc', tenGoi: 'Đại Lâm Mộc' },       // Mậu Thìn, Kỷ Tỵ (4,5)
  { nguHanh: 'Thổ', tenGoi: 'Lộ Bàng Thổ' },       // Canh Ngọ, Tân Mùi (6,7)
  { nguHanh: 'Kim',  tenGoi: 'Kiếm Phong Kim' },    // Nhâm Thân, Quý Dậu (8,9)
  { nguHanh: 'Hỏa', tenGoi: 'Sơn Đầu Hỏa' },       // Giáp Tuất, Ất Hợi (10,11)
  { nguHanh: 'Thủy', tenGoi: 'Giản Hạ Thủy' },     // Bính Tý, Đinh Sửu (12,13)
  { nguHanh: 'Thổ', tenGoi: 'Thành Đầu Thổ' },     // Mậu Dần, Kỷ Mão (14,15)
  { nguHanh: 'Kim',  tenGoi: 'Bạch Lạp Kim' },      // Canh Thìn, Tân Tỵ (16,17)
  { nguHanh: 'Mộc', tenGoi: 'Dương Liễu Mộc' },    // Nhâm Ngọ, Quý Mùi (18,19)
  { nguHanh: 'Thủy', tenGoi: 'Tuyền Trung Thủy' }, // Giáp Thân, Ất Dậu (20,21)
  { nguHanh: 'Thổ', tenGoi: 'Ốc Thượng Thổ' },     // Bính Tuất, Đinh Hợi (22,23)
  { nguHanh: 'Hỏa', tenGoi: 'Tích Lịch Hỏa' },     // Mậu Tý, Kỷ Sửu (24,25)
  { nguHanh: 'Mộc', tenGoi: 'Tùng Bách Mộc' },     // Canh Dần, Tân Mão (26,27)
  { nguHanh: 'Thủy', tenGoi: 'Trường Lưu Thủy' },  // Nhâm Thìn, Quý Tỵ (28,29)
  { nguHanh: 'Kim',  tenGoi: 'Sa Trung Kim' },       // Giáp Ngọ, Ất Mùi (30,31)
  { nguHanh: 'Hỏa', tenGoi: 'Sơn Hạ Hỏa' },        // Bính Thân, Đinh Dậu (32,33)
  { nguHanh: 'Mộc', tenGoi: 'Bình Địa Mộc' },      // Mậu Tuất, Kỷ Hợi (34,35)
  { nguHanh: 'Thổ', tenGoi: 'Bích Thượng Thổ' },   // Canh Tý, Tân Sửu (36,37)
  { nguHanh: 'Kim',  tenGoi: 'Kim Bạch Kim' },       // Nhâm Dần, Quý Mão (38,39)
  { nguHanh: 'Hỏa', tenGoi: 'Phú Đăng Hỏa' },      // Giáp Thìn, Ất Tỵ (40,41)
  { nguHanh: 'Thủy', tenGoi: 'Thiên Hà Thủy' },    // Bính Ngọ, Đinh Mùi (42,43)
  { nguHanh: 'Thổ', tenGoi: 'Đại Dịch Thổ' },      // Mậu Thân, Kỷ Dậu (44,45)
  { nguHanh: 'Kim',  tenGoi: 'Thoa Xuyến Kim' },    // Canh Tuất, Tân Hợi (46,47)
  { nguHanh: 'Mộc', tenGoi: 'Tang Đố Mộc' },       // Nhâm Tý, Quý Sửu (48,49)
  { nguHanh: 'Thủy', tenGoi: 'Đại Khê Thủy' },     // Giáp Dần, Ất Mão (50,51)
  { nguHanh: 'Thổ', tenGoi: 'Sa Trung Thổ' },      // Bính Thìn, Đinh Tỵ (52,53)
  { nguHanh: 'Hỏa', tenGoi: 'Thiên Thượng Hỏa' },  // Mậu Ngọ, Kỷ Mùi (54,55)
  { nguHanh: 'Mộc', tenGoi: 'Thạch Lựu Mộc' },    // Canh Thân, Tân Dậu (56,57)
  { nguHanh: 'Thủy', tenGoi: 'Đại Hải Thủy' },     // Nhâm Tuất, Quý Hợi (58,59)
];

// Tính Can Chi năm
export function getCanChiNam(year: number) {
  const canIdx = mod(year - 4, 10);
  const chiIdx = mod(year - 4, 12);
  return {
    can: THIEN_CAN[canIdx],
    chi: DIA_CHI[chiIdx],
    canChi: `${THIEN_CAN[canIdx]} ${DIA_CHI[chiIdx]}`,
  };
}

// Tính bản mệnh ngũ hành (nạp âm)
export function getBanMenh(year: number) {
  const viTri = mod(year - 4, 60); // vị trí trong chu kỳ 60 năm
  const idx = Math.floor(viTri / 2); // mỗi cặp 2 năm
  return NAP_AM[idx];
}

// Địa chi giờ sinh
const GIO_DIA_CHI: Record<string, string> = {
  'Tý (23h-1h)':   'Tý',
  'Sửu (1h-3h)':   'Sửu',
  'Dần (3h-5h)':   'Dần',
  'Mão (5h-7h)':   'Mão',
  'Thìn (7h-9h)':  'Thìn',
  'Tỵ (9h-11h)':   'Tỵ',
  'Ngọ (11h-13h)': 'Ngọ',
  'Mùi (13h-15h)': 'Mùi',
  'Thân (15h-17h)':'Thân',
  'Dậu (17h-19h)': 'Dậu',
  'Tuất (19h-21h)':'Tuất',
  'Hợi (21h-23h)': 'Hợi',
};

// Tính cung mệnh theo tháng âm lịch và giờ sinh
// Công thức: an Mệnh từ Dần, thuận chiều theo tháng, nghịch chiều theo giờ
export function getCungMenh(thangAm: number, gioSinh: string): string {
  const gioIdx = DIA_CHI.indexOf(GIO_DIA_CHI[gioSinh] ?? 'Tý');
  // Vị trí cung = (Dần=2 + tháng - 1) - gioIdx, tính theo mod 12
  const viTri = mod(2 + thangAm - 1 - gioIdx, 12);
  return DIA_CHI[viTri];
}

// Mô tả ngũ hành
export const NGU_HANH_INFO: Record<string, { emoji: string; moTa: string; mauSac: string }> = {
  'Kim': {
    emoji: '⚙️',
    mauSac: '#FFD700',
    moTa: 'Mệnh Kim mang theo sự rõ ràng và dứt khoát — người có xu hướng nói thẳng, làm thật và coi trọng nguyên tắc. Sức mạnh lớn nhất là độ sắc bén trong quyết định, điểm cần chú ý là đừng để cái cứng thành cái lạnh.',
  },
  'Mộc': {
    emoji: '🌿',
    mauSac: '#4CAF50',
    moTa: 'Mệnh Mộc nghiêng về sự phát triển và mở rộng — thích học, thích khám phá, dễ thấu cảm với người khác. Linh hoạt là điểm mạnh, nhưng đôi khi cũng là lý do ôm quá nhiều thứ một lúc.',
  },
  'Thủy': {
    emoji: '💧',
    mauSac: '#2196F3',
    moTa: 'Mệnh Thủy nhạy cảm và uyển chuyển — đọc người nhanh, xử lý tình huống giỏi và thường hiểu điều người khác chưa nói ra. Trực giác là tài sản lớn, nhưng cũng dễ dao động khi môi trường xung quanh thay đổi.',
  },
  'Hỏa': {
    emoji: '🔥',
    mauSac: '#FF5722',
    moTa: 'Mệnh Hỏa rực và chủ động — khi đã bắt đầu thì đi tới cùng, truyền được năng lượng cho những người xung quanh. Điểm cần chú ý là giữ được nhịp bền chứ không chỉ bùng mạnh lúc đầu.',
  },
  'Thổ': {
    emoji: '🏔️',
    mauSac: '#795548',
    moTa: 'Mệnh Thổ vững và đáng tin — không vội, không hấp tấp, nhưng khi đã làm thì làm tới nơi. Nền tảng ổn định là thế mạnh tự nhiên, thứ cần cân bằng là tránh để sự thận trọng trở thành lực cản.',
  },
};

// Mô tả con giáp
export const CON_GIAP_INFO: Record<string, { emoji: string; moTa: string }> = {
  'Tý':  { emoji: '🐭', moTa: 'Tuổi Tý nhanh trí và nhạy bén — thấy cơ hội sớm, xử lý tình huống khéo, và thường hiểu ý người khác trước khi họ nói hết câu. Cái cần giữ là đừng để nhịp nhanh quá thành vội vàng.' },
  'Sửu': { emoji: '🐂', moTa: 'Tuổi Sửu bền và chắc — không bùng nhanh nhưng đi được xa. Một khi đã cam kết thì ít khi bỏ giữa chừng, và đó chính là thứ người xung quanh tin tưởng nhất ở bạn.' },
  'Dần': { emoji: '🐯', moTa: 'Tuổi Dần có năng lượng lớn và cái nhìn dứt khoát — thích đi trước, không ngại thử thách, và dễ kéo người khác theo nhịp của mình. Điều cần cân bằng là biết lúc nào nên giữ lại.' },
  'Mão': { emoji: '🐰', moTa: 'Tuổi Mão tinh tế và có duyên — không ồn ào nhưng để lại ấn tượng lâu. Xử lý mối quan hệ khéo, biết lúc nào nên nói và lúc nào nên im.' },
  'Thìn': { emoji: '🐲', moTa: 'Tuổi Thìn đầy khí thế và hoài bão — khi đã muốn thì muốn lớn, khi đã làm thì làm tới cùng. Thử thách không nằm ở việc có đủ sức không, mà là biết chọn đúng việc để dồn sức.' },
  'Tỵ':  { emoji: '🐍', moTa: 'Tuổi Tỵ sâu và kín — quan sát nhiều trước khi hành động, hiếm khi lộ bài sớm. Trực giác thường đúng, và đó là thứ nên tin tưởng hơn là bỏ qua.' },
  'Ngọ': { emoji: '🐴', moTa: 'Tuổi Ngọ sống động và thật — cảm xúc bộc lộ rõ, không giỏi che giấu điều mình thích hay ghét. Năng lượng lớn khi vào nhịp, điều cần giữ là sức bền chứ không chỉ sức bùng.' },
  'Mùi': { emoji: '🐑', moTa: 'Tuổi Mùi nhẹ và ấm — không tranh, không đối đầu, nhưng có khả năng giữ mối quan hệ lâu dài mà ít người làm được. Điểm mạnh lớn nhất lại chính là sự ổn định trong cảm xúc.' },
  'Thân': { emoji: '🐒', moTa: 'Tuổi Thân linh hoạt và sáng tạo — ít khi bí bách, luôn tìm ra lối đi kể cả khi người khác đã bỏ cuộc. Cái cần chú ý là giữ được hướng đi thay vì đổi quá nhiều vì chán.' },
  'Dậu': { emoji: '🐓', moTa: 'Tuổi Dậu chỉnh chu và kỹ lưỡng — làm thì làm đến nơi đến chốn, ít khi để sót lỗi nhỏ. Thứ cần cân bằng đôi khi là buông bớt sự hoàn hảo khi không thực sự cần thiết.' },
  'Tuất': { emoji: '🐕', moTa: 'Tuổi Tuất trực và trung thành — nói thật, giữ lời, không thích vòng vo. Người tin tưởng bạn thường tin rất sâu, và đó là tài sản ít người có được.' },
  'Hợi': { emoji: '🐷', moTa: 'Tuổi Hợi thoáng và rộng lòng — không giữ thù, không cạnh tranh vô nghĩa, dễ để người khác cảm thấy thoải mái khi ở bên. Bình yên không phải là điểm yếu — đó là cái bạn mang lại cho người xung quanh.' },
};

export function getThongDiepHomNay(conGiap: string, chiNgay: string): DanhGiaThamKhao {
  const quanHe = getTuongHop(conGiap, chiNgay);

  if (quanHe.loai === 'tam-hop' || quanHe.loai === 'luc-hop') {
    return {
      mucDo: 'Hanh thông',
      tieuDe: `Ngày ${chiNgay} hợp nhịp với tuổi ${conGiap}`,
      moTa: 'Theo địa chi, ngày và tuổi của bạn thuộc nhóm tương hỗ — lúc tốt để chủ động hơn, đặc biệt với những việc cần phối hợp hoặc cần một bước đẩy mạnh.',
      mauSac: getDanhGiaColor('Hanh thông'),
    };
  }

  if (quanHe.loai === 'tuong-xung') {
    return {
      mucDo: 'Cần lưu ý',
      tieuDe: `Ngày ${chiNgay} xung với tuổi ${conGiap}`,
      moTa: 'Ngày và tuổi của bạn thuộc cặp tương xung — không phải điềm xấu, nhưng là lúc nên giữ nhịp chậm lại, kiểm tra kỹ trước khi quyết định những việc quan trọng.',
      mauSac: getDanhGiaColor('Cần lưu ý'),
    };
  }

  return {
    mucDo: 'Bình ổn',
    tieuDe: `Ngày ${chiNgay} không có tín hiệu đặc biệt với tuổi ${conGiap}`,
    moTa: 'Không có quan hệ địa chi nổi bật giữa ngày và tuổi của bạn hôm nay. Nhịp ngày phụ thuộc nhiều vào bạn hơn là can chi.',
    mauSac: getDanhGiaColor('Bình ổn'),
  };
}

// Giờ hoàng đạo/hắc đạo dựa theo chi ngày thật (tính từ JD)
// Bảng hoàng đạo chuẩn: 6 giờ tốt (hoàng đạo) theo chi ngày
const HOANG_DAO: Record<string, number[]> = {
  'Tý':   [0, 1, 3, 5, 7, 10],  // Tý,Sửu,Mão,Tỵ,Mùi,Tuất
  'Sửu':  [2, 3, 5, 6, 8, 11],  // Dần,Mão,Tỵ,Ngọ,Thân,Hợi
  'Dần':  [4, 5, 7, 8, 10, 1],  // Thìn,Tỵ,Mùi,Thân,Tuất,Sửu
  'Mão':  [0, 2, 4, 6, 8, 10],  // Tý,Dần,Thìn,Ngọ,Thân,Tuất
  'Thìn': [1, 2, 4, 6, 9, 11],  // Sửu,Dần,Thìn,Ngọ,Dậu,Hợi
  'Tỵ':   [1, 4, 6, 7, 9, 10],  // Sửu,Thìn,Ngọ,Mùi,Dậu,Tuất
  'Ngọ':  [0, 1, 3, 5, 7, 10],  // (= Tý)
  'Mùi':  [2, 3, 5, 6, 8, 11],  // (= Sửu)
  'Thân': [4, 5, 7, 8, 10, 1],  // (= Dần)
  'Dậu':  [0, 2, 4, 6, 8, 10],  // (= Mão)
  'Tuất': [1, 2, 4, 6, 9, 11],  // (= Thìn)
  'Hợi':  [1, 4, 6, 7, 9, 10],  // (= Tỵ)
};

const GIO_LABEL = [
  'Tý (23h-1h)', 'Sửu (1h-3h)', 'Dần (3h-5h)', 'Mão (5h-7h)',
  'Thìn (7h-9h)', 'Tỵ (9h-11h)', 'Ngọ (11h-13h)', 'Mùi (13h-15h)',
  'Thân (15h-17h)', 'Dậu (17h-19h)', 'Tuất (19h-21h)', 'Hợi (21h-23h)',
];

function getDanhGiaColor(mucDo: MucDoDanhGia): string {
  if (mucDo === 'Hanh thông') return '#4ade80';
  if (mucDo === 'Cần lưu ý') return '#f87171';
  return '#facc15';
}

export function getGioTotXau() {
  const today = new Date();
  const jd = jdFromDate(today.getDate(), today.getMonth() + 1, today.getFullYear());
  const canNgayHom = THIEN_CAN[mod(jd + 9, 10)];
  const chiNgayHom = DIA_CHI[mod(jd + 1, 12)];
  const hoangDaoIdx = HOANG_DAO[chiNgayHom] ?? [0, 2, 4, 6, 8, 10];
  const gioTot = hoangDaoIdx.map(i => GIO_LABEL[i]);
  const gioXau = [0,1,2,3,4,5,6,7,8,9,10,11]
    .filter(i => !hoangDaoIdx.includes(i))
    .map(i => GIO_LABEL[i]);
  return { gioTot, gioXau, chiNgay: chiNgayHom, canNgay: canNgayHom };
}

// ============================================================
// THẦN SÁT & GIỜ CHI TIẾT
// ============================================================

export interface ThanSat {
  ten: string;
  loai: 'tot' | 'xau';
  emoji: string;
  moTa: string;
}

export interface GioChiTiet {
  label: string;
  chi: string;
  nguHanh: string;
  isHoangDao: boolean;
  sao: 0 | 1 | 2 | 3;
  viecPhuHop: string[];
}

const QUY_NHAN_MAP: Record<string, string[]> = {
  'Giáp': ['Sửu', 'Mùi'], 'Mậu': ['Sửu', 'Mùi'],
  'Ất': ['Tý', 'Thân'], 'Kỷ': ['Tý', 'Thân'],
  'Bính': ['Hợi', 'Dậu'], 'Đinh': ['Hợi', 'Dậu'],
  'Canh': ['Dần', 'Ngọ'], 'Tân': ['Dần', 'Ngọ'],
  'Nhâm': ['Mão', 'Tỵ'], 'Quý': ['Mão', 'Tỵ'],
};

const VAN_XUONG_MAP: Record<string, string> = {
  'Giáp': 'Tỵ', 'Ất': 'Ngọ', 'Bính': 'Thân', 'Đinh': 'Dậu',
  'Mậu': 'Thân', 'Kỷ': 'Dậu', 'Canh': 'Hợi', 'Tân': 'Tý',
  'Nhâm': 'Dần', 'Quý': 'Mão',
};

const LOC_THAN_MAP: Record<string, string> = {
  'Giáp': 'Dần', 'Ất': 'Mão', 'Bính': 'Tỵ', 'Đinh': 'Ngọ',
  'Mậu': 'Tỵ', 'Kỷ': 'Ngọ', 'Canh': 'Thân', 'Tân': 'Dậu',
  'Nhâm': 'Hợi', 'Quý': 'Tý',
};

const TAM_HOP_IDX: Record<string, number> = {
  'Thân': 0, 'Tý': 0, 'Thìn': 0,
  'Dần': 1, 'Ngọ': 1, 'Tuất': 1,
  'Tỵ': 2, 'Dậu': 2, 'Sửu': 2,
  'Hợi': 3, 'Mão': 3, 'Mùi': 3,
};
const KIEP_SAT_CHI_LIST = ['Tỵ', 'Hợi', 'Dần', 'Thân'];
const TAI_SAT_CHI_LIST = ['Ngọ', 'Tý', 'Mão', 'Dậu'];

const XUNG_MAP: Record<string, string> = {
  'Tý': 'Ngọ', 'Ngọ': 'Tý', 'Sửu': 'Mùi', 'Mùi': 'Sửu',
  'Dần': 'Thân', 'Thân': 'Dần', 'Mão': 'Dậu', 'Dậu': 'Mão',
  'Thìn': 'Tuất', 'Tuất': 'Thìn', 'Tỵ': 'Hợi', 'Hợi': 'Tỵ',
};

const CHI_NGU_HANH_GIO: Record<string, string> = {
  'Tý': 'Thủy', 'Hợi': 'Thủy',
  'Dần': 'Mộc', 'Mão': 'Mộc',
  'Tỵ': 'Hỏa', 'Ngọ': 'Hỏa',
  'Thìn': 'Thổ', 'Tuất': 'Thổ', 'Sửu': 'Thổ', 'Mùi': 'Thổ',
  'Thân': 'Kim', 'Dậu': 'Kim',
};

const VIEC_PHU_HOP_GIO: Record<string, string[]> = {
  'Tý':   ['Cầu tài', 'Gặp quý nhân'],
  'Sửu':  ['Ký kết', 'Xây dựng', 'Động thổ'],
  'Dần':  ['Xuất hành', 'Khởi sự', 'Mở hàng'],
  'Mão':  ['Học hành', 'Gặp gỡ', 'Đàm phán'],
  'Thìn': ['Ký kết', 'Đàm phán', 'Họp bàn'],
  'Tỵ':   ['Tài lộc', 'Khai trương', 'Thu tiền'],
  'Ngọ':  ['Gặp quý nhân', 'Cầu tài', 'Xuất hành'],
  'Mùi':  ['Hợp tác', 'Xã giao', 'Giải tranh chấp'],
  'Thân': ['Ký kết', 'Thu tiền', 'Đàm phán'],
  'Dậu':  ['Tài lộc', 'Đầu tư', 'Cầu tài'],
  'Tuất': ['Cầu an', 'Tổng kết', 'Gặp gia đình'],
  'Hợi':  ['Nghỉ ngơi', 'Tích lũy', 'Lên kế hoạch'],
};

export function getThanSatHomNay(
  tuTru: { nam: TruCanChi },
  canNgayHom: string,
  chiNgayHom: string,
): ThanSat[] {
  const result: ThanSat[] = [];
  const chiNamSinh = tuTru.nam.chi;
  const canNamSinh = tuTru.nam.can;

  if ((QUY_NHAN_MAP[canNgayHom] ?? []).includes(chiNgayHom)) {
    result.push({ ten: 'Thiên Ất Quý Nhân', loai: 'tot', emoji: '⭐', moTa: 'Ngày có quý nhân phù trợ — hợp để gặp gỡ, nhờ vả, đàm phán; việc khó dễ hóa suôn sẻ.' });
  }
  if (VAN_XUONG_MAP[canNamSinh] === chiNgayHom) {
    result.push({ ten: 'Văn Xương', loai: 'tot', emoji: '📚', moTa: 'Sao học vấn chiếu sáng — tốt cho học hành, thi cử, ký kết giấy tờ và mọi việc cần sự rõ ràng.' });
  }
  if (LOC_THAN_MAP[canNgayHom] === chiNgayHom) {
    result.push({ ten: 'Lộc Thần', loai: 'tot', emoji: '💰', moTa: 'Ngày Lộc Thần — tài khí vượng, hợp để khai trương, thu tiền, khởi động việc kinh doanh.' });
  }

  const groupIdx = TAM_HOP_IDX[chiNamSinh];
  if (groupIdx !== undefined) {
    if (KIEP_SAT_CHI_LIST[groupIdx] === chiNgayHom) {
      result.push({ ten: 'Kiếp Sát', loai: 'xau', emoji: '⚠️', moTa: 'Kiếp Sát chiếu — cẩn thận tài vật, tránh mang nhiều tiền mặt, đề phòng kẻ xấu lợi dụng.' });
    }
    if (TAI_SAT_CHI_LIST[groupIdx] === chiNgayHom) {
      result.push({ ten: 'Tai Sát', loai: 'xau', emoji: '🔴', moTa: 'Tai Sát chiếu — đề phòng tai nạn nhỏ, hạn chế đi xa, cẩn thận khi vận hành xe cộ máy móc.' });
    }
  }

  const curYearChi = DIA_CHI[mod(new Date().getFullYear() - 4, 12)];
  if (XUNG_MAP[curYearChi] === chiNgayHom) {
    result.push({ ten: 'Tuế Phá', loai: 'xau', emoji: '💥', moTa: 'Ngày Tuế Phá — hạn chế khởi sự việc lớn, ký kết quan trọng hoặc di chuyển xa.' });
  }

  return result;
}

function getQuanHeGio(nguHanhNguoi: string, nguHanhGio: string): 'duoc-sinh' | 'trung-tinh' | 'sinh' | 'khac' | 'bi-khac' {
  if (nguHanhNguoi === nguHanhGio) return 'trung-tinh';
  const rel = TUONG_SINH_KHAC[nguHanhNguoi];
  if (!rel) return 'trung-tinh';
  if (nguHanhGio === rel.biSinh) return 'duoc-sinh';
  if (nguHanhGio === rel.sinh) return 'sinh';
  if (nguHanhGio === rel.biKhac) return 'bi-khac';
  if (nguHanhGio === rel.khac) return 'khac';
  return 'trung-tinh';
}

export function getGioChiTiet(nguHanhBanMenh: string, chiNgayHom: string): GioChiTiet[] {
  const hoangDaoIdxs = HOANG_DAO[chiNgayHom] ?? [0, 2, 4, 6, 8, 10];
  return GIO_LABEL.map((label, idx) => {
    const chi = DIA_CHI[idx];
    const nguHanh = CHI_NGU_HANH_GIO[chi] ?? 'Thổ';
    const isHoangDao = hoangDaoIdxs.includes(idx);
    const quanHe = getQuanHeGio(nguHanhBanMenh, nguHanh);

    let sao: 0 | 1 | 2 | 3;
    if (!isHoangDao) {
      sao = quanHe === 'duoc-sinh' ? 1 : 0;
    } else {
      sao = quanHe === 'duoc-sinh' ? 3 : quanHe === 'bi-khac' ? 1 : 2;
    }

    return { label, chi, nguHanh, isHoangDao, sao, viecPhuHop: VIEC_PHU_HOP_GIO[chi] ?? [] };
  });
}

// Màu, số, hướng may mắn theo ngũ hành
export const MAY_MAN_INFO: Record<string, {
  mauSac: { ten: string; hex: string }[];
  conSo: number[];
  huong: string[];
}> = {
  'Kim': {
    mauSac: [{ ten: 'Trắng', hex: '#f1f5f9' }, { ten: 'Vàng', hex: '#fbbf24' }, { ten: 'Bạc', hex: '#94a3b8' }],
    conSo: [6, 7, 8],
    huong: ['Tây', 'Tây Bắc'],
  },
  'Mộc': {
    mauSac: [{ ten: 'Xanh lá', hex: '#4ade80' }, { ten: 'Xanh cyan', hex: '#22d3ee' }, { ten: 'Nâu', hex: '#a16207' }],
    conSo: [3, 4, 8],
    huong: ['Đông', 'Đông Nam'],
  },
  'Thủy': {
    mauSac: [{ ten: 'Đen', hex: '#475569' }, { ten: 'Xanh dương', hex: '#60a5fa' }, { ten: 'Xám', hex: '#9ca3af' }],
    conSo: [1, 6, 7],
    huong: ['Bắc', 'Đông Bắc'],
  },
  'Hỏa': {
    mauSac: [{ ten: 'Đỏ', hex: '#f87171' }, { ten: 'Hồng', hex: '#f472b6' }, { ten: 'Tím', hex: '#c084fc' }],
    conSo: [2, 7, 9],
    huong: ['Nam', 'Đông Nam'],
  },
  'Thổ': {
    mauSac: [{ ten: 'Vàng', hex: '#fbbf24' }, { ten: 'Cam', hex: '#fb923c' }, { ten: 'Nâu', hex: '#92400e' }],
    conSo: [2, 5, 8],
    huong: ['Trung tâm', 'Tây Nam'],
  },
};

// Vận hạn tháng theo ngũ hành và tháng dương lịch
export function getVanHanThang(nguHanh: string, thangAm?: number): VanHanThangInfo {
  const now = new Date();
  const thangHienTai =
    thangAm ?? solarToLunar(now.getDate(), now.getMonth() + 1, now.getFullYear())[1];
  const chiIdx = mod(thangHienTai + 1, 12);
  const nguHanhThang = CHI_THANG_NGU_HANH[chiIdx];
  const base = getDanhGiaNguHanh(nguHanh, nguHanhThang);

  return {
    thang: thangHienTai,
    nguHanhThang,
    ...base,
    mauSac: getDanhGiaColor(base.mucDo),
  };
}

// Tương hợp con giáp (tam hợp, lục hợp, tương xung, tương hại)
const TAM_HOP: string[][] = [
  ['Thân', 'Tý', 'Thìn'],
  ['Dần', 'Ngọ', 'Tuất'],
  ['Tỵ', 'Dậu', 'Sửu'],
  ['Hợi', 'Mão', 'Mùi'],
];
const LUC_HOP: [string, string][] = [
  ['Tý', 'Sửu'], ['Dần', 'Hợi'], ['Mão', 'Tuất'],
  ['Thìn', 'Dậu'], ['Tỵ', 'Thân'], ['Ngọ', 'Mùi'],
];
const TUONG_XUNG: [string, string][] = [
  ['Tý', 'Ngọ'], ['Sửu', 'Mùi'], ['Dần', 'Thân'],
  ['Mão', 'Dậu'], ['Thìn', 'Tuất'], ['Tỵ', 'Hợi'],
];

export function getTuongHop(chi1: string, chi2: string): {
  loai: 'tam-hop' | 'luc-hop' | 'tuong-xung' | 'trung-tinh';
  xepLoai: string; moTa: string; mauSac: string;
} {
  const isTamHop = TAM_HOP.some(g => g.includes(chi1) && g.includes(chi2));
  const isLucHop = LUC_HOP.some(([a, b]) => (a === chi1 && b === chi2) || (a === chi2 && b === chi1));
  const isXung = TUONG_XUNG.some(([a, b]) => (a === chi1 && b === chi2) || (a === chi2 && b === chi1));

  if (isTamHop) return {
    loai: 'tam-hop', xepLoai: 'Tam hợp',
    moTa: 'Hai tuổi cùng nhóm tam hợp — theo quan niệm truyền thống, đây là cặp có xu hướng đồng điệu và bổ trợ nhau trong dài hạn, dễ tạo nền tảng chung.',
    mauSac: '#4ade80',
  };
  if (isLucHop) return {
    loai: 'luc-hop', xepLoai: 'Lục hợp',
    moTa: 'Cặp lục hợp — hai tuổi này có xu hướng bổ sung cho nhau khá tự nhiên, ít xung đột nhịp điệu hơn so với nhiều cặp khác.',
    mauSac: '#60a5fa',
  };
  if (isXung) return {
    loai: 'tuong-xung', xepLoai: 'Tương xung',
    moTa: 'Cặp tương xung — truyền thống cho rằng hai tuổi này dễ va chạm nhịp điệu hơn. Không phải định mệnh, nhưng cần thêm sự thấu hiểu và kiên nhẫn từ cả hai phía.',
    mauSac: '#f87171',
  };
  return {
    loai: 'trung-tinh',
    xepLoai: 'Bình thường',
    moTa: 'Hai tuổi không thuộc nhóm tam hợp, lục hợp hay tương xung — mối quan hệ hoàn toàn phụ thuộc vào con người, không phải tuổi tác.',
    mauSac: '#facc15',
  };
}

// Ngũ hành theo chi tháng âm lịch
// Tháng 1 âm = Dần (Mộc), tháng 2 = Mão (Mộc), tháng 3 = Thìn (Thổ)...
const CHI_THANG_NGU_HANH: string[] = [
  'Thủy', // Tý - tháng 11 âm → nhưng ta dùng index 0-11 cho tháng 1-12 âm
  'Thổ',  // Sửu - tháng 12 âm
  'Mộc',  // Dần - tháng 1 âm
  'Mộc',  // Mão - tháng 2 âm
  'Thổ',  // Thìn - tháng 3 âm
  'Hỏa',  // Tỵ - tháng 4 âm
  'Hỏa',  // Ngọ - tháng 5 âm
  'Thổ',  // Mùi - tháng 6 âm
  'Kim',  // Thân - tháng 7 âm
  'Kim',  // Dậu - tháng 8 âm
  'Thổ',  // Tuất - tháng 9 âm
  'Thủy', // Hợi - tháng 10 âm
];

// Quan hệ ngũ hành: [sinh, bị sinh, khắc, bị khắc]
const TUONG_SINH_KHAC: Record<string, { sinh: string; biSinh: string; khac: string; biKhac: string }> = {
  'Mộc': { sinh: 'Hỏa', biSinh: 'Thủy', khac: 'Thổ', biKhac: 'Kim' },
  'Hỏa': { sinh: 'Thổ', biSinh: 'Mộc', khac: 'Kim', biKhac: 'Thủy' },
  'Thổ': { sinh: 'Kim', biSinh: 'Hỏa', khac: 'Thủy', biKhac: 'Mộc' },
  'Kim': { sinh: 'Thủy', biSinh: 'Thổ', khac: 'Mộc', biKhac: 'Hỏa' },
  'Thủy': { sinh: 'Mộc', biSinh: 'Kim', khac: 'Hỏa', biKhac: 'Thổ' },
};

function getDanhGiaNguHanh(nguHanhNguoi: string, nguHanhThang: string): Omit<DanhGiaThamKhao, 'mauSac'> {
  if (nguHanhNguoi === nguHanhThang) {
    return {
      mucDo: 'Hanh thông',
      tieuDe: 'Tháng cùng ngũ hành với bản mệnh',
      moTa: 'Ngũ hành tháng và bản mệnh trùng nhau — nền tảng ổn, hợp để giữ nhịp đều và tiếp tục các kế hoạch đang có.',
    };
  }
  const rel = TUONG_SINH_KHAC[nguHanhNguoi];
  if (!rel) {
    return {
      mucDo: 'Bình ổn',
      tieuDe: 'Tháng bình ổn',
      moTa: 'Không có tín hiệu ngũ hành nổi bật tháng này — mọi thứ phụ thuộc vào cách bạn điều phối hơn là yếu tố bên ngoài.',
    };
  }
  if (nguHanhThang === rel.biSinh) {
    return {
      mucDo: 'Hanh thông',
      tieuDe: 'Tháng tương sinh cho bản mệnh',
      moTa: 'Ngũ hành tháng đang sinh cho bản mệnh — theo lý ngũ hành, đây là lúc năng lượng được bồi thêm, hợp để đẩy nhanh những việc đang dang dở.',
    };
  }
  if (nguHanhThang === rel.sinh) {
    return {
      mucDo: 'Bình ổn',
      tieuDe: 'Bản mệnh đang sinh xuất',
      moTa: 'Tháng này bạn có xu hướng cho đi nhiều hơn nhận lại — hợp để giữ nhịp đều, tránh dàn trải sức lực quá mỏng.',
    };
  }
  if (nguHanhThang === rel.biKhac) {
    return {
      mucDo: 'Cần lưu ý',
      tieuDe: 'Tháng có yếu tố khắc bản mệnh',
      moTa: 'Ngũ hành tháng khắc bản mệnh — hợp để phòng thủ hơn tấn công: kiểm tra kỹ hơn, tránh quyết định vội, chú ý sức bền.',
    };
  }
  if (nguHanhThang === rel.khac) {
    return {
      mucDo: 'Bình ổn',
      tieuDe: 'Bản mệnh đang ở thế chủ động',
      moTa: 'Bản mệnh đang khắc ngũ hành tháng — có thể chủ động, nhưng nên phân bổ sức lực hợp lý và tránh ép quá mức.',
    };
  }
  return {
    mucDo: 'Bình ổn',
    tieuDe: 'Tháng bình ổn',
    moTa: 'Không có tín hiệu ngũ hành nổi bật tháng này — nhịp phụ thuộc nhiều vào cách bạn điều phối hơn là yếu tố bên ngoài.',
  };
}

export function getVanHanNam(nguHanh: string): VanHanThangInfo[] {
  return Array.from({ length: 12 }, (_, i) => {
    const thangAm = i + 1;
    const chiIdx = mod(thangAm + 1, 12); // Dần=2, Mão=3, ...
    const nguHanhThang = CHI_THANG_NGU_HANH[chiIdx];
    const base = getDanhGiaNguHanh(nguHanh, nguHanhThang);

    return {
      thang: thangAm,
      nguHanhThang,
      ...base,
      mauSac: getDanhGiaColor(base.mucDo),
    };
  });
}
