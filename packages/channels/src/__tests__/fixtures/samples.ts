// Sample openui-lang programs covering every component and interaction path.
export const samples: Record<string, string> = {
  counter: `
$count = 0
title = Header("Counter Demo")
label = Section("Count is *" + $count + "*")
inc = Button("+1", Action([@Set($count, $count + 1)]))
dec = Button("-1", Action([@Set($count, $count - 1)]))
reset = Button("Reset", Action([@Reset($count)]))
acts = Actions([inc, dec, reset])
note = Context("updated just now")
d = Divider()
root = Root([title, label, acts, d, note])
`.trim(),

  controls: `
$priority = "high"
$tags = ["a"]
$assignee = ""
$due = "2026-08-01"
$at = "09:30"
$when = 1754000000
$menu = ""
sel = Select("priority", $priority, [Option("low", "Low"), Option("high", "High")])
rad = Radio("assignee", $assignee, [Option("me", "Me"), Option("you", "You")])
chk = Checkboxes("tags", $tags, [Option("a", "Alpha"), Option("b", "Beta")])
ms = MultiSelect("tags2", $tags, [Option("a", "Alpha"), Option("b", "Beta")])
ov = Overflow("menu", $menu, [Option("x", "Do X"), Option("y", "Do Y")])
dp = DatePicker("due", $due)
tp = TimePicker("at", $at)
dtp = DateTimePicker("when", $when)
row = Actions([sel, rad, chk, ms, ov, dp, tp, dtp])
accBtn = Button("Go", Action([@Set($priority, "low")]))
sec = Section("Pick things", accBtn)
f = Fields([Field("Status", "Open"), Field("Owner", "Rabi")])
img = Image("https://example.com/x.png", "an image")
plain = Button("No-op")
row2 = Actions([plain])
root = Root([sec, row, f, img, row2])
`.trim(),

  content: `
c1 = Chart("bar", ["Todo", "Doing", "Done"], [5, 3, 8], "Issues by state", "Issues", "Status", "Count")
c2 = Chart("pie", ["A", "B"], [1, 2])
md = Markdown("# Hello\\n- one\\n- two")
tbl = Table(["Title", "Priority"], [["Fix login", "High"], ["Write docs", "Low"]])
rt = RichText([Para("Intro para"), List(["first", "second"], true), List(["x", "y"]), Quote("quoted"), Code("let a = 1")])
root = Root([c1, c2, md, tbl, rt])
`.trim(),

  form: `
$title = ""
$desc = ""
$points = 3
$team = "t1"
$due = ""
$saved = "no"
frm = Form("New issue", "Create", [TextInput("Title", $title), TextArea("Description", $desc), NumberInput("Points", $points), Select("team", $team, [Option("t1", "Core"), Option("t2", "Web")]), DatePicker("due", $due)], Action([@Set($saved, "yes")]))
status = Section("Saved: " + $saved)
root = Root([frm, status])
`.trim(),

  edge: `
$x = ""
empty = Select("empty", $x, [])
good = Button("Fine", Action([@Set($x, "1")]))
row = Actions([empty, good])
root = Root([row])
`.trim(),

  waCounter: `
$count = 0
title = Header("Counter")
card = Card("Count is *" + $count + "*", [Button("+1", Action([@Set($count, $count + 1)])), Button("-1", Action([@Set($count, $count - 1)])), Button("Reset", Action([@Reset($count)]))])
note = Text("Tap a button to update.")
root = Root([title, card, note])
`.trim(),

  waContent: `
$priority = "high"
h = Header("Sprint status")
f = Fields([Field("Open", "12"), Field("Done", "8")])
d = Divider()
t = Table(["Task", "State"], [["Login fix", "Done"], ["Docs", "Todo"]])
c = Chart("bar", ["Todo", "Doing", "Done"], [5, 3, 8], "Issues by state")
img = Image("https://example.com/x.png", "team photo")
sel = Select("priority", $priority, "Filter by priority", [Option("high", "High"), Option("low", "Low"), Option("all", "All")])
md = Markdown("Some **bold** claim")
root = Root([h, f, d, t, c, img, sel, md])
`.trim(),

  waBooking: `
$place = ""
$time = ""
places = Select("Restaurants", $place, "5 places have a table for 4 around 8 PM tonight.", [Option("vt", "Vela Trattoria", "4.7 stars · 0.3 mi · 7:45, 8:15, 8:45"), Option("nr", "Nonna Rosa", "4.6 stars · 0.5 mi · 8:00, 9:00")], "Italian in North Beach", "Live availability")
busy = Chart("bar", ["6p", "7p", "8p", "9p"], [28, 55, 86, 72], "How busy tonight", "Busy %", "", "", "Busiest around 8, quieter after 9.")
times = Card("Pick a time for 4 tonight:", [Button("7:45 PM", Action([@Set($time, "19:45")])), Button("8:15 PM", Action([@Set($time, "20:15")]))], "Held for 15 minutes", "https://example.com/vela-trattoria.jpg")
photo = Card("Vela Trattoria, Grant Ave", [], "", "https://example.com/vela-trattoria-room.jpg")
pin = Location(37.8002, -122.4074, "Vela Trattoria", "Grant Ave, North Beach")
root = Root([places, busy, times, photo, pin])
`.trim(),

  tgCounter: `
$count = 0
title = Header("Counter")
label = Text("Count is *" + $count + "*")
inc = Button("+1", Action([@Set($count, $count + 1)]))
dec = Button("-1", Action([@Set($count, $count - 1)]))
reset = Button("Reset", Action([@Reset($count)]))
row = Actions([inc, dec, reset])
root = Root([title, label, row])
`.trim(),

  tgContent: `
$priority = "high"
h = Header("Sprint status", 2)
f = Fields([Field("Open", "12"), Field("Done", "8")])
d = Divider()
t = Table(["Task", "State"], [["Login fix", "Done"], ["Docs", "Todo"]])
c = Chart("bar", ["Todo", "Doing", "Done"], [5, 3, 8], "Issues by state")
q = Quote("Ship early, ship often")
cd = Code("npm start", "bash")
l = List(["first", "second"], true)
ck = Checklist(["Deploy", "Test"], [true, false])
det = Details("Release notes", "Long changelog text here")
img = Image("https://example.com/x.png", "team")
md = Markdown("Some **bold** and [a link](https://example.com)")
sel = Select("priority", $priority, "Filter by priority", [Option("high", "High"), Option("low", "Low"), Option("all", "All"), Option("none", "None")])
link = LinkButton("Docs", "https://example.com/docs")
copy = CopyButton("Copy cmd", "npm start")
row = Actions([link, copy])
root = Root([h, f, d, t, c, q, cd, l, ck, det, img, md, sel, row])
`.trim(),

  teamsCounter: `
$count = 0
title = Header("Counter")
label = Text("Count is **" + $count + "**")
inc = Button("+1", Action([@Set($count, $count + 1)]))
dec = Button("-1", Action([@Set($count, $count - 1)]))
reset = Button("Reset", Action([@Reset($count)]))
row = Actions([inc, dec, reset])
root = Root([title, label, row])
`.trim(),

  teamsContent: `
$title = ""
$points = 3
$due = ""
$at = "09:30"
$urgent = "false"
$team = "core"
$saved = "no"
h = Header("Sprint status", "extraLarge")
f = Fields([Field("Open", "12"), Field("Done", "8")])
d = Divider()
t = Table(["Task", "State"], [["Login fix", "Done"], ["Docs", "Todo"]])
c = Chart("bar", ["Todo", "Doing", "Done"], [5, 3, 8], "Issues by state")
q = Quote("Ship early, ship often")
cd = Code("npm start")
l = List(["first", "second"], true)
img = Image("https://example.com/x.png", "team")
md = Markdown("Some **bold** and [a link](https://example.com)")
colA = Column([Text("Left side")])
colB = Column([Text("Right side")])
cols = Columns([colA, colB])
ti = TextInput("Title", $title)
ni = NumberInput("Points", $points)
di = DateInput("Due", $due)
tm = TimeInput("At", $at)
tg = Toggle("Urgent", $urgent)
sel = Select("team", $team, "Team", [Option("core", "Core"), Option("web", "Web")])
save = Button("Save", Action([@Set($saved, "yes")]), "positive")
docs = LinkButton("Docs", "https://example.com/docs")
row = Actions([save, docs])
status = Text("Saved: " + $saved)
root = Root([h, f, d, t, c, q, cd, l, img, md, cols, ti, ni, di, tm, tg, sel, row, status])
`.trim(),

  blockkit: `
$owner = "U111"
$assignees = ["U111", "U222"]
$chans = ["C0AAAAAAA", "C0BBBBBBB"]
$chan = ""
$conv = ""
$note = "hello"
$email = "a@b.co"
$site = ""
$tags = ["a"]
$at = "09:30"
$when = 1754000000
save = Button("Save", Action([@Set($note, "")]), "primary")
del = Button("Delete", Action([@Reset($note)]), "danger", "This clears the note.")
docs = LinkButton("Docs", "https://example.com/docs")
us = UserSelect("owner", $owner)
mus = MultiUserSelect("assignees", $assignees)
cs = ChannelSelect("channel", $chan)
mcs = MultiChannelSelect("channels", $chans)
convs = ConversationSelect("conversation", $conv)
mconvs = MultiConversationSelect("conversations", $chans)
row = Actions([save, del, docs, us, mus, cs, mcs, convs, mconvs])
tb = TextBox("Add a note", $note)
vid = Video("https://www.youtube.com/embed/abc", "Demo video", "https://example.com/thumb.png", "A short demo")
ctx = Context("logged just now", [Image("https://example.com/icon.png", "icon")])
sec = Section("Text with an image accessory", Image("https://example.com/avatar.png", "avatar"))
frm = Form("Details", "Save", [EmailInput("Email", $email), URLInput("Site", $site), MultiSelect("tags", $tags, [Option("a", "Alpha"), Option("b", "Beta")]), TimePicker("at", $at), DateTimePicker("when", $when)])
root = Root([sec, ctx, row, tb, vid, frm])
`.trim(),
};
