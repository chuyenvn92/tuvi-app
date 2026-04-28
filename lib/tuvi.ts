// ============================================================
// Tính toán Tử Vi cơ bản
// Thuật toán âm lịch: Hồ Ngọc Đức (www.informatik.uni-leipzig.de/~duc)
// ============================================================

// Chuyển dương lịch → âm lịch (trả về [ngayAm, thangAm, namAm])
export function solarToLunar(dd: number, mm: number, yy: number): [number, number, number] {
  const PI = Math.PI;

  function INT(d: number) { return Math.floor(d); }

  function jdFromDate(dd: number, mm: number, yy: number) {
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
    const T2 = T * T; const dr = PI / 180; const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
    const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T2;
    let DL = 1.9146 - 0.004817 * T - 0.000014 * T2;
    DL = DL * Math.sin(dr * M) + 0.019993 - 0.000101 * T;
    DL = DL * Math.sin(dr * 2 * M) + 0.00029 * Math.sin(dr * 3 * M);
    let L = L0 + DL;
    L = L - 360 * INT(L / 360);
    return INT(L / 30);
  }

  function getLunarMonth11(yy: number, timeZone: number) {
    const off = jdFromDate(31, 12, yy) - 2415021;
    const k = INT(off / 29.530588853);
    let nm = NewMoon(k);
    const sunLong = SunLongitude(nm);
    if (sunLong >= 9) nm = NewMoon(k - 1);
    return INT(nm + 0.5 + timeZone / 24);
  }

  function getLeapMonthOffset(a11: number, timeZone: number) {
    const k = INT((a11 - 2415021.076998695) / 29.530588853 + 0.5);
    let last = 0; let i = 1;
    let arc = SunLongitude(INT(NewMoon(k + i) + 0.5 + timeZone / 24));
    do {
      last = arc;
      i++;
      arc = SunLongitude(INT(NewMoon(k + i) + 0.5 + timeZone / 24));
    } while (arc !== last && i < 14);
    return i - 1;
  }

  const timeZone = 7;
  const dayNumber = jdFromDate(dd, mm, yy);
  const k = INT((dayNumber - 2415021.076998695) / 29.530588853);
  let monthStart = INT(NewMoon(k + 1) + 0.5 + timeZone / 24);
  if (monthStart > dayNumber) monthStart = INT(NewMoon(k) + 0.5 + timeZone / 24);

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
  const canIdx = (year - 4) % 10;
  const chiIdx = (year - 4) % 12;
  return {
    can: THIEN_CAN[canIdx],
    chi: DIA_CHI[chiIdx],
    canChi: `${THIEN_CAN[canIdx]} ${DIA_CHI[chiIdx]}`,
  };
}

// Tính bản mệnh ngũ hành (nạp âm)
export function getBanMenh(year: number) {
  const viTri = (year - 4) % 60; // vị trí trong chu kỳ 60 năm
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
  const viTri = ((2 + thangAm - 1) - gioIdx + 120) % 12;
  return DIA_CHI[viTri];
}

// Mô tả ngũ hành
export const NGU_HANH_INFO: Record<string, { emoji: string; moTa: string; mauSac: string }> = {
  'Kim': {
    emoji: '⚙️',
    mauSac: '#FFD700',
    moTa: 'Người mệnh Kim cứng rắn, quyết đoán, có ý chí mạnh mẽ. Thích sự công bằng, nguyên tắc và trật tự. Thường thành công trong lĩnh vực tài chính, kỹ thuật.',
  },
  'Mộc': {
    emoji: '🌿',
    mauSac: '#4CAF50',
    moTa: 'Người mệnh Mộc nhân từ, phóng khoáng, yêu thiên nhiên. Có khả năng sáng tạo và tư duy linh hoạt. Phát triển tốt trong giáo dục, nghệ thuật, môi trường.',
  },
  'Thủy': {
    emoji: '💧',
    mauSac: '#2196F3',
    moTa: 'Người mệnh Thủy thông minh, linh hoạt, khéo léo trong giao tiếp. Có trực giác nhạy bén và khả năng thích nghi cao. Thích hợp với nghề tư vấn, nghiên cứu.',
  },
  'Hỏa': {
    emoji: '🔥',
    mauSac: '#FF5722',
    moTa: 'Người mệnh Hỏa nhiệt tình, năng động, đam mê và có sức lôi cuốn. Lãnh đạo bẩm sinh, dũng cảm đối mặt thử thách. Thành công trong kinh doanh, chính trị.',
  },
  'Thổ': {
    emoji: '🏔️',
    mauSac: '#795548',
    moTa: 'Người mệnh Thổ trung thực, kiên nhẫn, đáng tin cậy và thực tế. Có nền tảng vững chắc, giỏi tích lũy tài sản. Phù hợp với bất động sản, nông nghiệp, y tế.',
  },
};

// Mô tả con giáp
export const CON_GIAP_INFO: Record<string, { emoji: string; moTa: string }> = {
  'Tý':  { emoji: '🐭', moTa: 'Thông minh, nhanh nhẹn, khéo léo và có tài kinh doanh. Nhạy cảm, chu đáo với người thân.' },
  'Sửu': { emoji: '🐂', moTa: 'Cần cù, kiên trì, đáng tin cậy. Làm việc chăm chỉ và luôn hoàn thành mục tiêu.' },
  'Dần': { emoji: '🐯', moTa: 'Mạnh mẽ, dũng cảm, có sức hút tự nhiên. Sinh ra để lãnh đạo và chinh phục.' },
  'Mão': { emoji: '🐰', moTa: 'Khéo léo, tinh tế, nhạy cảm với cái đẹp. Có tài ngoại giao và được nhiều người yêu mến.' },
  'Thìn': { emoji: '🐲', moTa: 'Tài năng, hoài bão lớn, tự tin và đầy năng lượng. Có khả năng thành công vượt trội.' },
  'Tỵ':  { emoji: '🐍', moTa: 'Sâu sắc, khôn ngoan, trực giác nhạy bén. Thường có tư duy chiến lược xuất sắc.' },
  'Ngọ': { emoji: '🐴', moTa: 'Nhiệt huyết, tự do, yêu cuộc sống. Luôn năng động và mang lại khí thế cho mọi người.' },
  'Mùi': { emoji: '🐑', moTa: 'Hiền lành, nghệ sĩ, giàu cảm xúc. Có tâm hồn nhân hậu và yêu thích sự hài hòa.' },
  'Thân': { emoji: '🐒', moTa: 'Thông minh, hài hước, sáng tạo và linh hoạt. Giỏi giải quyết vấn đề một cách độc đáo.' },
  'Dậu': { emoji: '🐓', moTa: 'Cẩn thận, chăm chỉ, có tổ chức. Luôn hoàn thành công việc với chất lượng cao.' },
  'Tuất': { emoji: '🐕', moTa: 'Trung thành, công bằng, đáng tin cậy. Người bạn đồng hành lý tưởng trong cuộc sống.' },
  'Hợi': { emoji: '🐷', moTa: 'Chân thành, hào phóng, lạc quan. Mang lại may mắn và niềm vui cho những người xung quanh.' },
};

// Điểm may mắn hôm nay (giả lập dựa trên ngày + ngũ hành)
export function getDiemHomNay(ngaySinh: string, nguHanh: string) {
  const today = new Date();
  const seed = today.getDate() + today.getMonth() + ngaySinh.length + nguHanh.length;
  const mayMan = 5 + (seed % 5);
  const taiLoc = 4 + ((seed + 2) % 6);
  const tinhDuyen = 4 + ((seed + 4) % 6);
  return { mayMan, taiLoc, tinhDuyen };
}
