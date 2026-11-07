use smart_habit_tracker
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
  { code: "FIRST_HABIT",   name: "Bước đầu tiên",     description: "Tạo thói quen đầu tiên",            icon: "seedling", group: "start",  condition: { type: "FIRST_HABIT", value: 1 } },
  { code: "FIRST_CHECKIN", name: "Khởi động",         description: "Check-in lần đầu tiên",             icon: "check",    group: "start",  condition: { type: "TOTAL_DONE", value: 1 } },
  { code: "STREAK_3",      name: "Đà tăng tốc",       description: "Giữ chuỗi 3 ngày liên tiếp",        icon: "flame",    group: "streak", condition: { type: "STREAK", value: 3 } },
  { code: "STREAK_7",      name: "Kiên trì 7 ngày",   description: "Giữ chuỗi 7 ngày liên tiếp",        icon: "flame",    group: "streak", condition: { type: "STREAK", value: 7 } },
  { code: "STREAK_30",     name: "Bền bỉ 30 ngày",    description: "Giữ chuỗi 30 ngày liên tiếp",       icon: "flame",    group: "streak", condition: { type: "STREAK", value: 30 } },
  { code: "STREAK_100",    name: "Huyền thoại 100",   description: "Giữ chuỗi 100 ngày liên tiếp",      icon: "crown",    group: "streak", condition: { type: "STREAK", value: 100 } },
  { code: "TOTAL_10",      name: "10 lần hoàn thành", description: "Hoàn thành tổng cộng 10 lần",       icon: "star",     group: "total",  condition: { type: "TOTAL_DONE", value: 10 } },
  { code: "TOTAL_50",      name: "50 lần hoàn thành", description: "Hoàn thành tổng cộng 50 lần",       icon: "star",     group: "total",  condition: { type: "TOTAL_DONE", value: 50 } },
  { code: "TOTAL_100",     name: "100 lần hoàn thành",description: "Hoàn thành tổng cộng 100 lần",      icon: "medal",    group: "total",  condition: { type: "TOTAL_DONE", value: 100 } },
  { code: "PERFECT_DAY",   name: "Ngày trọn vẹn",     description: "Hoàn thành hết thói quen trong 1 ngày", icon: "sun",  group: "special",condition: { type: "PERFECT_DAY", value: 1 } },
  { code: "PERFECT_WEEK",  name: "Tuần hoàn hảo",     description: "7 ngày liên tiếp đều trọn vẹn",     icon: "trophy",   group: "special",condition: { type: "PERFECT_WEEK", value: 7 } }
]);
db.habit_templates.deleteMany({});
db.habit_templates.insertMany([
  // ---- Sức khỏe ----
  { title: "Uống 500ml nước ấm sau khi thức dậy", categoryCode: "health", tag: "Khởi động chuyển hóa", frequency: "daily",  timeSlot: "morning",   defaultTime: "07:00", level: "gentle",      reason: "Giúp cơ thể bắt đầu ngày mới nhẹ nhàng." },
  { title: "Đi bộ nhanh 15 phút",                 categoryCode: "health", tag: "Tăng năng lượng",     frequency: "daily",  timeSlot: "morning",   defaultTime: "07:30", level: "moderate",    reason: "Vận động nhẹ mỗi sáng giúp tỉnh táo cả ngày." },
  { title: "Giãn cơ 5 phút",                      categoryCode: "health", tag: "Dẻo dai",             frequency: "daily",  timeSlot: "evening",   defaultTime: "21:00", level: "gentle",      reason: "Giảm căng cứng sau một ngày ngồi nhiều." },
  { title: "Tập thể dục 30 phút",                 categoryCode: "health", tag: "Sức bền",             frequency: "weekly", timeSlot: "afternoon", defaultTime: "17:00", level: "challenging", reason: "Duy trì vận động đều đặn 3-4 buổi mỗi tuần." },
  { title: "Uống đủ 2 lít nước",                  categoryCode: "health", tag: "Hydrat hóa",          frequency: "daily",  timeSlot: "afternoon", defaultTime: "15:00", level: "moderate",    reason: "Nước giúp duy trì năng lượng và sự tập trung." },

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
show collections
db.categories.countDocuments()
db.achievements.countDocuments()
db.habit_templates.countDocuments()
db.habit_logs.getIndexes()