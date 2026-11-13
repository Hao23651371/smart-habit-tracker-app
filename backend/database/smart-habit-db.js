db = db.getSiblingDB("smart_habit_tracker");
// ---------- Hàm tạo collection nếu chưa có ----------
function ensure(name, validator) {
  const exists = db.getCollectionNames().includes(name);
  if (!exists) {
    db.createCollection(name, validator ? { validator: { $jsonSchema: validator } } : {});
    print("Đã tạo: " + name);
  } else {
    print("Đã có: " + name);
  }
}

// ---------- 1. users (đã có, chỉ thêm index) ----------
ensure("users");
db.users.createIndex({ email: 1 }, { unique: true });

// ---------- 2. categories ----------
ensure("categories");
db.categories.createIndex({ userId: 1 });
db.categories.createIndex({ code: 1, userId: 1 }, { unique: true });

// ---------- 3. habits ----------
ensure("habits", {
  bsonType: "object",
  required: ["userId", "title", "frequency", "goalType", "status"],
  properties: {
    frequency: { enum: ["daily", "weekly"] },
    goalType:  { enum: ["check", "count", "duration"] },
    status:    { enum: ["active", "archived"] },
    timeSlot:  { enum: ["morning", "noon", "afternoon", "evening", null] }
  }
});
db.habits.createIndex({ userId: 1, status: 1 });

// ---------- 4. habit_logs ----------
ensure("habit_logs", {
  bsonType: "object",
  required: ["userId", "habitId", "date", "status"],
  properties: {
    date:   { bsonType: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
    status: { enum: ["done", "skipped"] }
  }
});
db.habit_logs.createIndex({ habitId: 1, date: 1 }, { unique: true });
db.habit_logs.createIndex({ userId: 1, date: 1 });

// ---------- 5. achievements ----------
ensure("achievements");
db.achievements.createIndex({ code: 1 }, { unique: true });

// ---------- 6. user_achievements ----------
ensure("user_achievements");
db.user_achievements.createIndex({ userId: 1, achievementId: 1 }, { unique: true });

// ---------- 7. chat_messages ----------
ensure("chat_messages", {
  bsonType: "object",
  required: ["userId", "role", "content"],
  properties: { role: { enum: ["user", "assistant"] } }
});
db.chat_messages.createIndex({ userId: 1, createdAt: 1 });

// ---------- 8. habit_templates ----------
ensure("habit_templates");
db.habit_templates.createIndex({ categoryCode: 1, level: 1, timeSlot: 1 });
db.categories.deleteMany({ isDefault: true });
db.categories.insertMany([
  { userId: null, name: "Sức khỏe",  code: "health",   icon: "heart",    color: "#22C55E", isDefault: true },
  { userId: null, name: "Học tập",   code: "study",    icon: "book",     color: "#7C5CFC", isDefault: true },
  { userId: null, name: "Giấc ngủ",  code: "sleep",    icon: "moon",     color: "#6366F1", isDefault: true },
  { userId: null, name: "Tinh thần", code: "mind",     icon: "lotus",    color: "#F59E0B", isDefault: true },
  { userId: null, name: "Công việc", code: "work",     icon: "briefcase",color: "#0EA5E9", isDefault: true },
  { userId: null, name: "Tài chính", code: "finance",  icon: "wallet",   color: "#14B8A6", isDefault: true }
]);
db.achievements.deleteMany({});
db.achievements.insertMany([
  // ---- Khởi đầu mới ----
  { code: "FIRST_HABIT",       name: "Bước đầu tiên",         description: "Tạo thói quen đầu tiên",                        icon: "plus-circle", group: "start",   condition: { type: "FIRST_HABIT", value: 1 } },
  { code: "FIRST_CHECKIN",     name: "Khởi động",             description: "Thực hiện check-in lần đầu tiên",               icon: "check-circle",group: "start",   condition: { type: "TOTAL_DONE", value: 1 } },
  { code: "HABIT_BUILDER_5",   name: "Người kiến tạo",        description: "Thiết lập từ 5 thói quen đa dạng",              icon: "grid",        group: "start",   condition: { type: "FIRST_HABIT", value: 5 } },
  { code: "HABIT_MASTER_15",   name: "Kiến trúc sư thói quen",description: "Thiết lập và quản lý từ 15 thói quen chất lượng",icon: "layers",    group: "start",   condition: { type: "FIRST_HABIT", value: 15 } },

  // ---- Duy trì chuỗi ngày liên tiếp ----
  { code: "STREAK_3",          name: "Đà tăng tốc (3 ngày)",   description: "Giữ chuỗi 3 ngày liên tiếp (bắt đầu tính Streak)",icon: "zap",      group: "streak",  condition: { type: "STREAK", value: 3 } },
  { code: "STREAK_7",          name: "Kiên trì 1 tuần",       description: "Giữ chuỗi 7 ngày liên tiếp không bỏ lỡ",        icon: "award",       group: "streak",  condition: { type: "STREAK", value: 7 } },
  { code: "WATER_MASTER",      name: "Kiện tướng uống nước",   description: "Đạt chuỗi từ 10 - 12 ngày liên tục uống nước ấm",icon: "droplet",   group: "streak",  condition: { type: "WATER_STREAK", value: 10 } },
  { code: "STREAK_12",         name: "Chuỗi vàng 12 ngày",     description: "Đạt chuỗi 12 ngày liên tiếp thực hiện thói quen",icon: "trending-up",group: "streak",condition: { type: "STREAK", value: 12 } },
  { code: "STREAK_14",         name: "Bứt phá 2 tuần",        description: "Giữ chuỗi 14 ngày liên tục không đứt quãng",    icon: "activity",    group: "streak",  condition: { type: "STREAK", value: 14 } },
  { code: "WATER_PRO_21",      name: "Thủy thần trường thọ",  description: "Đạt chuỗi 21 ngày liên tục uống nước ấm đủ chỉ tiêu",icon: "droplet",group: "streak", condition: { type: "WATER_STREAK", value: 21 } },
  { code: "STREAK_21",         name: "Hình thành phản xạ (21 ngày)",description: "21 ngày liên tục để khắc sâu thói quen vào tiềm thức",icon: "cpu",group: "streak",condition: { type: "STREAK", value: 21 } },
  { code: "STREAK_30",         name: "Bền bỉ 1 tháng",        description: "Giữ chuỗi 30 ngày trọn vẹn",                     icon: "gift",        group: "streak",  condition: { type: "STREAK", value: 30 } },
  { code: "STREAK_60",         name: "Kỷ luật thép (60 ngày)",description: "Duy trì chuỗi 60 ngày liên tục không bỏ cuộc",  icon: "shield",      group: "streak",  condition: { type: "STREAK", value: 60 } },
  { code: "STREAK_100",        name: "Huyền thoại 100 ngày",  description: "Cán mốc 100 ngày kiên định kỷ luật",            icon: "crown",       group: "streak",  condition: { type: "STREAK", value: 100 } },
  { code: "STREAK_365",        name: "Bất khả chiến bại (1 năm)",description: "365 ngày trọn vẹn duy trì thói quen suốt một năm",icon: "sun",    group: "streak",  condition: { type: "STREAK", value: 365 } },

  // ---- Tổng số lần hoàn thành ----
  { code: "TOTAL_10",          name: "10 lần hoàn thành",     description: "Hoàn thành tổng cộng 10 lần",                   icon: "star",        group: "total",   condition: { type: "TOTAL_DONE", value: 10 } },
  { code: "TOTAL_50",          name: "50 lần hoàn thành",     description: "Hoàn thành tổng cộng 50 lần",                   icon: "compass",     group: "total",   condition: { type: "TOTAL_DONE", value: 50 } },
  { code: "TOTAL_100",         name: "Trăm trận trăm thắng",  description: "Hoàn thành tổng cộng 100 lần",                  icon: "target",      group: "total",   condition: { type: "TOTAL_DONE", value: 100 } },
  { code: "TOTAL_200",         name: "Cột mốc 200 lần",       description: "Tích luỹ 200 lần hoàn thành các nhiệm vụ",      icon: "feather",     group: "total",   condition: { type: "TOTAL_DONE", value: 200 } },
  { code: "TOTAL_500",         name: "Chiến thần kỷ luật (500 lần)",description: "Cán mốc 500 lần hoàn thành thói quen",    icon: "box",         group: "total",   condition: { type: "TOTAL_DONE", value: 500 } },
  { code: "TOTAL_1000",        name: "Bậc thầy thói quen (1.000 lần)",description: "Hoàn thành 1.000 lần thói quen",       icon: "award",       group: "total",   condition: { type: "TOTAL_DONE", value: 1000 } },

  // ---- Cột mốc đặc biệt ----
  { code: "PERFECT_DAY",       name: "Ngày trọn vẹn",         description: "Hoàn thành hết thói quen trong 1 ngày",          icon: "sun",         group: "special", condition: { type: "PERFECT_DAY", value: 1 } },
  { code: "PERFECT_WEEK",      name: "Tuần hoàn hảo",         description: "7 ngày liên tiếp đều trọn vẹn 100%",             icon: "shield",      group: "special", condition: { type: "PERFECT_WEEK", value: 7 } },
  { code: "NOON_WARRIOR",      name: "Kỷ luật buổi trưa",     description: "Hoàn thành chuỗi 14 ngày các thói quen buổi trưa",icon: "coffee",    group: "special", condition: { type: "NOON_STREAK", value: 14 } },
  { code: "PERFECT_MONTH",     name: "Tháng hoàng kim",       description: "Hoàn thành xuất sắc 30 ngày hoàn hảo liên tiếp", icon: "award",       group: "special", condition: { type: "PERFECT_DAY", value: 30 } }
]);
db.habit_templates.deleteMany({});
db.habit_templates.insertMany([
  // ---- Sức khỏe ----
  { title: "Uống 500ml nước ấm sau khi thức dậy", categoryCode: "health", tag: "Khởi động chuyển hóa", frequency: "daily",  timeSlot: "morning",   defaultTime: "07:00", level: "gentle",      reason: "Giúp cơ thể bắt đầu ngày mới nhẹ nhàng." },
  { title: "Đi bộ nhanh 15 phút",                 categoryCode: "health", tag: "Tăng năng lượng",     frequency: "daily",  timeSlot: "morning",   defaultTime: "07:30", level: "moderate",    reason: "Vận động nhẹ mỗi sáng giúp tỉnh táo cả ngày." },
  { title: "Giãn cơ 5 phút",                      categoryCode: "health", tag: "Dẻo dai",             frequency: "daily",  timeSlot: "evening",   defaultTime: "21:00", level: "gentle",      reason: "Giảm căng cứng sau một ngày ngồi nhiều." },
  { title: "Tập thể dục 30 phút",                 categoryCode: "health", tag: "Sức bền",             frequency: "weekly", timeSlot: "afternoon", defaultTime: "17:00", level: "challenging", reason: "Duy trì vận động đều đặn 3-4 buổi mỗi tuần." },
  { title: "Uống đủ 2 lít nước",                  categoryCode: "health", tag: "Hydrat hóa",          frequency: "daily",  timeSlot: "afternoon", defaultTime: "15:00", level: "moderate",    reason: "Nước giúp duy trì năng lượng và sự tập trung." },

  // ---- Buổi trưa ----
  { title: "Ăn trưa thanh đạm đúng giờ",          categoryCode: "health", tag: "Dinh dưỡng",         frequency: "daily",  timeSlot: "noon",      defaultTime: "11:45", level: "gentle",      reason: "Ăn đúng giờ giúp bảo vệ dạ dày và duy trì năng lượng." },
  { title: "Uống 1 ly nước ấm sau bữa trưa",      categoryCode: "health", tag: "Tiêu hóa tốt",       frequency: "daily",  timeSlot: "noon",      defaultTime: "12:00", level: "gentle",      reason: "Nước ấm sau ăn giúp hỗ trợ hệ tiêu hóa nhẹ nhàng." },
  { title: "Đi dạo nhẹ 10 phút sau ăn",           categoryCode: "health", tag: "Vận động nhẹ",       frequency: "daily",  timeSlot: "noon",      defaultTime: "12:15", level: "gentle",      reason: "Vận động nhẹ nhàng giúp tiêu hóa tốt hơn trước khi nghỉ trưa." },
  { title: "Nghỉ trưa & Chợp mắt 20 phút",        categoryCode: "sleep",  tag: "Hồi phục năng lượng", frequency: "daily",  timeSlot: "noon",      defaultTime: "12:30", level: "gentle",      reason: "Giấc ngủ ngắn buổi trưa giúp đầu óc tỉnh táo cho nửa ngày còn lại." },

  // ---- Học tập ----
  { title: "Đọc 5 trang sách",                    categoryCode: "study",  tag: "Tư duy tích cực",     frequency: "daily",  timeSlot: "evening",   defaultTime: "20:30", level: "gentle",      reason: "Khối lượng nhỏ dễ duy trì, tạo đà đọc sách." },
  { title: "Học 10 từ vựng mới",                  categoryCode: "study",  tag: "Ngôn ngữ",            frequency: "daily",  timeSlot: "morning",   defaultTime: "08:00", level: "moderate",    reason: "Học ít nhưng đều giúp nhớ lâu hơn." },
  { title: "Học 30 phút một kỹ năng mới",         categoryCode: "study",  tag: "Phát triển bản thân", frequency: "daily",  timeSlot: "evening",   defaultTime: "20:00", level: "challenging", reason: "Thời gian tập trung đủ dài để tiến bộ rõ rệt." },
  { title: "Ghi lại 1 điều học được trong ngày",  categoryCode: "study",  tag: "Ôn tập",              frequency: "daily",  timeSlot: "evening",   defaultTime: "21:30", level: "gentle",      reason: "Viết lại giúp củng cố kiến thức." },

  // ---- Giấc ngủ ----
  { title: "Tắt điện thoại trước khi ngủ 30 phút",categoryCode: "sleep",  tag: "Ngủ sâu",             frequency: "daily",  timeSlot: "evening",   defaultTime: "22:00", level: "moderate",    reason: "Giảm ánh sáng xanh giúp dễ vào giấc hơn." },
  { title: "Đi ngủ trước 23:00",                  categoryCode: "sleep",  tag: "Nhịp sinh học",       frequency: "daily",  timeSlot: "evening",   defaultTime: "22:30", level: "moderate",    reason: "Ngủ đúng giờ giúp cơ thể phục hồi tốt hơn." },
  { title: "Thức dậy đúng giờ mỗi sáng",          categoryCode: "sleep",  tag: "Dậy sớm",             frequency: "daily",  timeSlot: "morning",   defaultTime: "06:30", level: "challenging", reason: "Giờ dậy cố định giúp ổn định nhịp sinh học." },
  { title: "Không dùng caffeine sau 15:00",       categoryCode: "sleep",  tag: "Ngủ ngon",            frequency: "daily",  timeSlot: "afternoon", defaultTime: "15:00", level: "gentle",      reason: "Caffeine buổi chiều có thể làm khó ngủ." },

  // ---- Tinh thần ----
  { title: "Thiền 5 phút trước khi ngủ",          categoryCode: "mind",   tag: "Giấc ngủ sâu",        frequency: "daily",  timeSlot: "evening",   defaultTime: "21:30", level: "gentle",      reason: "Giúp thư giãn tinh thần trước giờ ngủ." },
  { title: "Hít thở sâu 3 phút",                  categoryCode: "mind",   tag: "Bình tĩnh",           frequency: "daily",  timeSlot: "morning",   defaultTime: "09:00", level: "gentle",      reason: "Hít thở chậm giúp giảm căng thẳng." },
  { title: "Viết 3 điều biết ơn",                 categoryCode: "mind",   tag: "Tích cực",            frequency: "daily",  timeSlot: "evening",   defaultTime: "21:15", level: "moderate",    reason: "Hướng sự chú ý vào điều tốt đẹp trong ngày." },
  { title: "Thiền 15 phút",                       categoryCode: "mind",   tag: "Chánh niệm",          frequency: "daily",  timeSlot: "morning",   defaultTime: "06:45", level: "challenging", reason: "Thời lượng dài hơn giúp rèn sự tập trung." }
]);

// ---------- 9. Dữ liệu mẫu User & Thói quen ban đầu (Đầy đủ cả BUỔI SÁNG, BUỔI TRƯA và BUỔI TỐI) ----------
const sampleUserId = ObjectId("6af67daaa89a708b3285ba4a");
const sampleUserStrId = "6af67daaa89a708b3285ba4a";

db.users.updateOne(
  { email: "an.nguyen@example.com" },
  {
    $setOnInsert: {
      _id: sampleUserId,
      email: "an.nguyen@example.com",
      password: "$2a$10$UFgMNkeP3qoxw1/DmCkak.NMEQM8fQkj1ZQQpYkTMPN47zRGTBs2q", // BCrypt của: password123
      fullName: "An Nguyễn",
      role: "ROLE_USER",
      createdAt: new Date(),
      updatedAt: new Date()
    }
  },
  { upsert: true }
);

// Danh sách thói quen mẫu đầy đủ: SÁNG (3), TRƯA (2), TỐI (5)
const baseHabitTemplates = [
  // --- 1. BUỔI SÁNG ---
  {
    title: "Uống 500ml nước ấm sau khi thức dậy",
    description: "Khởi động quá trình trao đổi chất buổi sáng",
    icon: "droplet",
    color: "#22C55E",
    categoryCode: "health",
    frequency: "daily",
    daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
    reminderTime: "07:00",
    reminderEnabled: true,
    timeSlot: "morning",
    goalType: "check",
    targetValue: 1,
    unit: "lần",
    status: "active",
    source: "manual"
  },
  {
    title: "Đi bộ nhanh 15 phút",
    description: "Vận động nhẹ buổi sáng",
    icon: "activity",
    color: "#0EA5E9",
    categoryCode: "health",
    frequency: "daily",
    daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
    reminderTime: "07:30",
    reminderEnabled: true,
    timeSlot: "morning",
    goalType: "duration",
    targetValue: 15,
    unit: "phút",
    status: "active",
    source: "manual"
  },
  {
    title: "Học 10 từ vựng mới",
    description: "Mở rộng vốn từ tiếng Anh",
    icon: "book-open",
    color: "#6366F1",
    categoryCode: "study",
    frequency: "daily",
    daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
    reminderTime: "08:00",
    reminderEnabled: true,
    timeSlot: "morning",
    goalType: "count",
    targetValue: 10,
    unit: "từ",
    status: "active",
    source: "manual"
  },

  // --- 2. BUỔI TRƯA (Nghỉ ngơi, ăn trưa & phục hồi năng lượng) ---
  {
    title: "Ăn trưa thanh đạm đúng giờ",
    description: "Ăn trưa đúng giờ, nhai kỹ và không dùng điện thoại khi ăn",
    icon: "coffee",
    color: "#F59E0B",
    categoryCode: "health",
    frequency: "daily",
    daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
    reminderTime: "11:45",
    reminderEnabled: true,
    timeSlot: "noon",
    goalType: "check",
    targetValue: 1,
    unit: "lần",
    status: "active",
    source: "manual"
  },
  {
    title: "Uống 1 ly nước ấm sau bữa trưa",
    description: "Bổ sung nước sau bữa trưa giúp hỗ trợ tiêu hóa",
    icon: "droplet",
    color: "#22C55E",
    categoryCode: "health",
    frequency: "daily",
    daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
    reminderTime: "12:00",
    reminderEnabled: true,
    timeSlot: "noon",
    goalType: "check",
    targetValue: 1,
    unit: "lần",
    status: "active",
    source: "manual"
  },
  {
    title: "Đi dạo nhẹ 10 phút sau ăn",
    description: "Đi lại thư thả giúp cơ thể sảng khoái và hỗ trợ tiêu hóa",
    icon: "activity",
    color: "#0EA5E9",
    categoryCode: "health",
    frequency: "daily",
    daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
    reminderTime: "12:15",
    reminderEnabled: true,
    timeSlot: "noon",
    goalType: "duration",
    targetValue: 10,
    unit: "phút",
    status: "active",
    source: "manual"
  },
  {
    title: "Nghỉ trưa & Chợp mắt 20 phút",
    description: "Giấc ngủ ngắn giúp hồi phục năng lượng cho buổi chiều",
    icon: "moon",
    color: "#6366F1",
    categoryCode: "sleep",
    frequency: "daily",
    daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
    reminderTime: "12:30",
    reminderEnabled: true,
    timeSlot: "noon",
    goalType: "duration",
    targetValue: 20,
    unit: "phút",
    status: "active",
    source: "manual"
  },

  // --- 3. BUỔI TỐI (Học tập, thư giãn & giấc ngủ ngon) ---
  {
    title: "Học bài & Ôn tập 30 phút",
    description: "Tập trung học và ôn lại kiến thức chuyên môn buổi tối",
    icon: "book",
    color: "#7C5CFC",
    categoryCode: "study",
    frequency: "daily",
    daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
    reminderTime: "20:00",
    reminderEnabled: true,
    timeSlot: "evening",
    goalType: "duration",
    targetValue: 30,
    unit: "phút",
    status: "active",
    source: "manual"
  },
  {
    title: "Đọc 5 trang sách",
    description: "Duy trì thói quen đọc sách mỗi ngày",
    icon: "book-open",
    color: "#7C5CFC",
    categoryCode: "study",
    frequency: "daily",
    daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
    reminderTime: "20:30",
    reminderEnabled: true,
    timeSlot: "evening",
    goalType: "check",
    targetValue: 1,
    unit: "lần",
    status: "active",
    source: "manual"
  },
  {
    title: "Viết nhật ký & 3 điều biết ơn",
    description: "Ghi lại 1 điều học được và 3 điều tích cực trong ngày",
    icon: "edit-3",
    color: "#F59E0B",
    categoryCode: "mind",
    frequency: "daily",
    daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
    reminderTime: "21:15",
    reminderEnabled: true,
    timeSlot: "evening",
    goalType: "check",
    targetValue: 1,
    unit: "lần",
    status: "active",
    source: "manual"
  },
  {
    title: "Thiền buông thư 5 phút",
    description: "Thư giãn tâm trí trước khi ngủ",
    icon: "lotus",
    color: "#F59E0B",
    categoryCode: "mind",
    frequency: "daily",
    daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
    reminderTime: "21:30",
    reminderEnabled: true,
    timeSlot: "evening",
    goalType: "duration",
    targetValue: 5,
    unit: "phút",
    status: "active",
    source: "manual"
  },
  {
    title: "Tắt điện thoại trước khi ngủ 30 phút",
    description: "Giảm ánh sáng xanh giúp ngủ sâu và đúng giờ",
    icon: "moon",
    color: "#6366F1",
    categoryCode: "sleep",
    frequency: "daily",
    daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
    reminderTime: "22:00",
    reminderEnabled: true,
    timeSlot: "evening",
    goalType: "check",
    targetValue: 1,
    unit: "lần",
    status: "active",
    source: "manual"
  }
];

// Nạp thói quen mẫu cho TẤT CẢ các user hiện có trong cơ sở dữ liệu (kể cả An Nguyễn và tài khoản của bạn)
const allUsersInDb = db.users.find({}).toArray();
if (allUsersInDb.length === 0) {
  allUsersInDb.push({ _id: sampleUserId, fullName: "An Nguyễn" });
}

// Dọn dẹp tiêu đề cũ chưa chuẩn nếu có (để giữ đúng chuẩn 12 thói quen)
db.habits.deleteMany({ title: "Uống nước ấm sau khi thức dậy" });

allUsersInDb.forEach(u => {
  const uId = u._id.toString();
  baseHabitTemplates.forEach(t => {
    // Kiểm tra thói quen đã có chưa (theo userId chuỗi hoặc ObjectId)
    const exists = db.habits.findOne({
      $or: [{ userId: uId }, { userId: u._id }],
      title: t.title
    });
    if (!exists) {
      db.habits.insertOne({
        ...t,
        userId: uId,
        createdAt: new Date().toISOString()
      });
      print(`+ Đã thêm [${t.timeSlot}]: "${t.title}" cho user: ${u.fullName || u.email || uId}`);
    }
  });
});
print("Đã đảm bảo đầy đủ thói quen Sáng (3), Trưa (4) và Tối (5) cho tất cả tài khoản trong hệ thống!");

// ---------- 10. Dữ liệu habit_logs 90 ngày gần nhất (3 tháng đầy đủ để test thống kê) ----------
// 1. Xóa bỏ bất kỳ log nào của ngày hôm nay và tương lai (để trang Hôm nay bắt đầu với 0% hoàn thành)
const todayIsoStr = new Date().toISOString().slice(0, 10);
const deletedCount = db.habit_logs.deleteMany({ date: { $gte: todayIsoStr } }).deletedCount;
if (deletedCount > 0) {
  print("Đã dọn sạch " + deletedCount + " log của ngày hôm nay/tương lai (trang Hôm nay sẽ ở trạng thái 0% để người dùng tự tick)!");
}

// 2. Nạp dữ liệu 90 ngày quá khứ (streak 12 ngày kết thúc hôm qua) nếu user chưa có đủ 90 ngày logs
allUsersInDb.forEach(u => {
  const uId = u._id.toString();
  const existingPastLogs = db.habit_logs.countDocuments({
    $or: [{ userId: uId }, { userId: u._id }],
    date: { $lt: todayIsoStr }
  });

  // Nếu chưa có logs hoặc số logs cũ chưa đủ 90 ngày (< 500 logs) -> Làm mới để đảm bảo chuẩn 90 ngày
  if (existingPastLogs < 500) {
    db.habit_logs.deleteMany({ $or: [{ userId: uId }, { userId: u._id }] });

    const userHabits = db.habits.find({
      $or: [{ userId: uId }, { userId: u._id }],
      status: "active"
    }).toArray();

    if (userHabits.length > 0) {
      const logsToInsert = [];
      const today = new Date();

      // 90 ngày gần nhất (3 tháng): daysAgo từ 90 về 1 (ngày hôm nay và tương lai không tạo log)
      for (let daysAgo = 90; daysAgo >= 1; daysAgo--) {
        const d = new Date(today);
        d.setDate(today.getDate() - daysAgo);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;

        userHabits.forEach((habit, hIdx) => {
          let isDone = false;
          const titleLower = (habit.title || '').toLowerCase();
          const isWater = titleLower.includes('nước') || titleLower.includes('nuoc');
          const isNoon = habit.timeSlot === 'noon';
          const isMorning = habit.timeSlot === 'morning';

          if (daysAgo >= 1 && daysAgo <= 12) {
            // 12 ngày gần nhất (daysAgo 1..12): Duy trì chuỗi Streak 12 ngày kết thúc hôm qua!
            if (daysAgo === 3 || daysAgo === 7 || daysAgo === 10) {
              isDone = (hIdx % 6 !== 0);
            } else {
              isDone = true;
            }
          } else if (daysAgo === 13 || daysAgo === 27 || daysAgo === 45 || daysAgo === 63 || daysAgo === 78) {
            // Các ngày nghỉ rải rác
            isDone = isWater || (hIdx === 2);
          } else {
            // Các ngày khác trong 90 ngày:
            if (isWater) {
              isDone = (daysAgo % 15 !== 0); // ~93%
            } else if (isMorning) {
              isDone = (daysAgo % 5 !== 0); // ~80%
            } else if (isNoon) {
              isDone = (daysAgo % 6 !== 0); // ~83%
            } else if (titleLower.includes('tắt điện thoại') || titleLower.includes('học bài')) {
              isDone = (daysAgo % 2 === 0); // ~50%
            } else {
              isDone = (daysAgo % 3 !== 0); // ~67%
            }
          }

          const logDate = new Date(d);
          logDate.setHours(12, 0, 0, 0);

          logsToInsert.push({
            userId: uId,
            habitId: habit._id.toString(),
            date: dateStr,
            status: isDone ? "done" : "skipped",
            currentValue: isDone ? (habit.targetValue || 1) : 0,
            note: isDone ? "Đã hoàn thành mục tiêu" : "Chưa hoàn thành",
            completedAt: isDone ? logDate : null,
            loggedAt: logDate
          });
        });
      }

      if (logsToInsert.length > 0) {
        db.habit_logs.insertMany(logsToInsert);
        const doneCount = logsToInsert.filter(l => l.status === "done").length;
        print("Đã seed " + logsToInsert.length + " habit_logs (90 ngày, " + doneCount + " done) cho user: " + (u.fullName || u.email || uId) + " (Streak 12 ngày!)");
      }
    }
  }
});

print("--- TỔNG KẾT COLLECTIONS ---");
db.getCollectionNames().forEach(c => print(c + ": " + db.getCollection(c).countDocuments()));