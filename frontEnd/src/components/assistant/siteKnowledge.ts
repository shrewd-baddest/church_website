export type JumuiyaFact = {
  id: string;
  name: string;
  fullName: string;
  description: string;
  day: string;
  time: string;
  venue: string;
};

export type SaintFact = {
  name: string;
  feastDay: string;
  feastName: string;
  patronage: string;
};

export type SiteFacts = {
  jumuiya: JumuiyaFact[];
  saints: SaintFact[];
};

const ROUTE_MAP: { label: string; href: string }[] = [
  { label: "Home", href: "/" },
  { label: "Officials directory", href: "/officials" },
  { label: "Official profile", href: "/officials/:id" },
  { label: "Leadership history", href: "/officials/history" },
  { label: "Photo gallery (members)", href: "/gallery" },
  { label: "My bookings (members)", href: "/my-bookings" },
  { label: "Projects & shop home", href: "/projects" },
  { label: "Sacramentals", href: "/sacramentals" },
  { label: "T-shirts", href: "/t-shirts" },
  { label: "Chairs (hire)", href: "/chairs" },
  { label: "Instruments (hire)", href: "/instruments" },
  { label: "Other projects", href: "/other-projects" },
  { label: "Activities & booking", href: "/activities" },
  { label: "Product details", href: "/product/:id" },
  { label: "Notifications (members)", href: "/Notification" },
  { label: "Devotions home", href: "/devotions" },
  { label: "All prayers", href: "/devotions/all-prayers" },
  { label: "Prayer book / readings", href: "/devotions/readings" },
  { label: "Prayer detail", href: "/devotions/prayer" },
  { label: "Liturgy guide", href: "/devotions/liturgy" },
  { label: "Sacra Liturgia", href: "/devotions/sacra-liturgia-page" },
  { label: "Prayers of the Mass", href: "/devotions/prayers-of-the-mass" },
  { label: "Liturgical seasons & saints", href: "/devotions/liturgical-seasons" },
  { label: "Holy Rosary", href: "/devotions/rosary" },
  { label: "Daily faith challenge", href: "/devotions/challenge" },
  { label: "Jumuiya comparison", href: "/devotions/comparison" },
  { label: "My progress", href: "/devotions/progress" },
  { label: "Daily Missal / liturgy of the day", href: "/devotions/daily-liturgy" },
  { label: "Prayer module (novenas & litanies)", href: "/devotions/prayer-module" },
  { label: "Prayer book", href: "/devotions/prayer-book" },
  { label: "Holy Bible", href: "/devotions/bible" },
  { label: "Jumuiya groups", href: "/jumuiya" },
  { label: "Jumuiya detail", href: "/jumuiya/:id" },
  { label: "Community hub (choir, dancers, charismatic, St. Francis)", href: "/community" },
  { label: "Community detail", href: "/community/:moduleId" },
  { label: "Privacy policy", href: "/privacy" },
  { label: "Terms of service", href: "/terms" },
  { label: "Order confirmation", href: "/order-confirmation" },
  { label: "Hire status", href: "/hire-status" },
  { label: "Login / register", href: "/login" },
  { label: "Password reset", href: "/reset" },
  { label: "First login setup", href: "/login/first-login-setup" },
  { label: "Verify email", href: "/verify-email" },
];

const DEVOTIONS_FACTS = `
DEVOTIONS CONTENT:
- Prayer Book and All Prayers include: daily prayers (Morning Offering, Act of Contrition, The Angelus, Guardian Angel, Grace Before Meals, Hail Holy Queen, Prayer Before Sleep, Glory Be, Fatima Prayer), healing prayers (Physical Healing, Emotional Healing, Anima Christi, St. Raphael for Healing, Mental Peace), litanies (Loreto, Sacred Heart, Divine Mercy, Saint Joseph, Holy Spirit, Humility, Precious Blood, Litany of the Saints), and prayers to saints (St. Joseph for Workers, St. Anthony for Lost Things, St. Jude for Desperate Cases, St. Therese, St. Benedict for Protection).
- The Prayer Module holds 59 novenas (9 days each, 531 prayers in total) plus more litanies.
- The Holy Rosary tracker supports multiple sets of mysteries (Marian, Divine Mercy, Seven Sorrows, Reparation, Archangel Michael) and tracks your progress.
- The Holy Bible reader lets you read any book by chapter, search, bookmark verses and change font size.
- The Daily Missal gives the liturgy of the day and the Liturgy guide explains the Order of the Mass and liturgical seasons.
- The Daily Challenge posts faith questions each day; members and jumuiya earn progress, with a per-jumuiya comparison dashboard.`;

const OFFICIALS_STRUCTURE = `
OFFICIALS & LEADERSHIP STRUCTURE:
- Executive: Chairperson, Vice Chairperson, Organizing Secretary, Treasurer, Secretary, Assistant Secretary
- Jumuiya Coordinators: Jumuiya Coordinator, Assistant Jumuiya Coordinator
- Bible Coordinators: Bible Study Coordinator, Assistant Bible Study Coordinator
- Rosary: Rosary Coordinator, Assistant Rosary Coordinator
- Pamphlet Managers: Pamphlet Manager, Assistant Pamphlet Manager
- Project Managers: Project Manager, Assistant Project Manager
- Liturgist: Liturgist, Assistant Liturgist
- Choir Officials: Choir Chairperson, Choir Vice Chairperson
- Instrument Managers: Instrument Manager, Assistant Instrument Manager
- Liturgical Dancers: Dance Chairperson, Dance Vice Chairperson
- Catechist: Catechist
- The current people holding these roles are listed live in the Officials directory at /officials (do not guess names).`;

const SHOP_FACTS = `
PROJECTS & SHOP:
- Sacramentals shop categories: Rosaries, Bibles & Books, Chains & Medals, Crucifixes, Statues, Candles & More. Members order online through a cart and pay via M-PESA.
- T-shirts: CSA t-shirts can be ordered online with size selection.
- Chairs: available for hire through the shop.
- Instruments for hire (price per hire in KSh): piano 2000, speakers and microphones 2500, speakers 2500, organ 3000.
- Products have seller WhatsApp contact numbers shown on the site (seller numbers: sacramentals/chairs/tshirts 254112051739, instruments 254112051740).`;

const COMMUNITY_FACTS = `
COMMUNITY GROUPS (each with its own detail page under /community):
- CSA Choir: worship, fellowship and musical excellence. Practice on Tuesday 18:00-20:00 and Saturday 13:00-16:00 at the Church Hall; also offers music classes (e.g. Sight Reading).
- Liturgical Dancers, Charismatic, and St. Francis groups (each has a Chairperson etc.).
- Leadership roles per group: Choir (Secretary, Vice Secretary, Treasurer, Project Manager, Male/Female Representative, Choir Master, Choir Mistress), Dancers (Dance Chairperson, Dance Vice Chairperson), Charismatic (Chairperson, Vice Chairperson, Secretary, Treasurer), St. Francis (Chairperson, Vice Chairperson).`;

const ADMIN_KNOWLEDGE = `
ADMIN AREA (user is currently on /admin):
- The admin panel is restricted to authorized CSA leaders (chairpersons, secretaries, coordinators and similar office bearers).
- It provides management screens for officials, devotions, projects, jumuiya members, announcements, bookings, donations, gallery, suggestions, developers and settings.`;

let cache: { knowledge: string; facts: SiteFacts } | null = null;

export const loadSiteData = async (): Promise<{ knowledge: string; facts: SiteFacts }> => {
  if (cache) return cache;

  const [jumuiyaMod, saintsMod] = await Promise.all([
    import("../../pages/Jumuiya/data/jumuiyaData"),
    import("../../pages/Devotions/data/saintsData"),
  ]);

  const jumuiya: JumuiyaFact[] = jumuiyaMod.jumuiyaList.map((j) => ({
    id: j.id,
    name: j.name,
    fullName: j.fullName ?? j.name,
    description: j.description ?? "",
    day: j.meetingSchedule?.day ?? "",
    time: j.meetingSchedule?.time ?? "",
    venue: j.meetingSchedule?.venue ?? "",
  }));

  const saints: SaintFact[] = (saintsMod.default ?? []).map((s) => ({
    name: s.name,
    feastDay: s.feastDay,
    feastName: s.feastName,
    patronage: s.patronage,
  }));

  const facts: SiteFacts = { jumuiya, saints };

  const lines: string[] = [];
  lines.push(
    "LIVE SITE FACTS FOR THE CSA KIRINYAGA CATHOLIC STUDENTS ASSOCIATION WEBSITE. Use these facts for accurate answers; they reflect the real content of the site.",
    "",
    "PAGES & PATHS:",
  );
  for (const r of ROUTE_MAP) lines.push(`- ${r.label}: ${r.href}`);
  lines.push("", "JUMUIYA (small Christian communities, each with a detail page at /jumuiya/<id>):");
  for (const j of jumuiya) {
    lines.push(`- ${j.fullName} (id: ${j.id})${j.description ? ` - ${j.description}` : ""}`);
    if (j.day) lines.push(`  Meetings: ${j.day}${j.time ? `, ${j.time}` : ""}${j.venue ? ` at ${j.venue}` : ""}`);
  }
  lines.push("", "SAINTS CALENDAR (name - feast - patronage):");
  for (const s of saints) {
    lines.push(
      `- ${s.name} - ${s.feastName} (${s.feastDay})${s.patronage ? ` - patronage: ${s.patronage}` : ""}`,
    );
  }
  lines.push("", DEVOTIONS_FACTS.trim(), "", OFFICIALS_STRUCTURE.trim(), "", SHOP_FACTS.trim(), "", COMMUNITY_FACTS.trim());

  const knowledge = lines.join("\n");
  cache = { knowledge, facts };
  return cache;
};

export const buildKnowledgeForPath = (base: string, path: string): string =>
  path.startsWith("/admin") ? `${base}\n${ADMIN_KNOWLEDGE}` : base;
