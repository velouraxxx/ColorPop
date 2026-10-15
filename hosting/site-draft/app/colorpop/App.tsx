import { learnPreferences } from "./preferences";
import {
  useState,
  useEffect,
  useRef,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  Link,
  NavLink,
  Routes,
  Route,
  useNavigate,
  useParams,
  useLocation,
} from "react-router-dom";
import {
  Sparkles,
  MessageCircle,
  Users,
  BookOpen,
  UserRound,
  Search,
  Settings,
  ArrowRight,
  Plus,
  Send,
  Heart,
  Home,
  Download,
  Cloud,
  Monitor,
  ChevronLeft,
  WandSparkles,
} from "lucide-react";
import {
  connect,
  db,
  readLocal,
  writeLocal,
  readCloud,
  saveCloud,
} from "./store";
import {
  newItem,
  type Item,
  type Kind,
  type Data,
  type Message,
} from "./types";
import type { Session } from "@supabase/supabase-js";
type Shared = {
  items: Item[];
  save: (x: Item) => Promise<Item>;
  notify: (s: string) => void;
};
const kinds: { [k: string]: Kind } = {
  characters: "Character",
  personas: "Persona",
  lorebooks: "Lorebook",
};
const icons = [Users, BookOpen, UserRound, MessageCircle];
function Gem({ index = 0 }: { index?: number }) {
  const Icon = icons[index % 4];
  return (
    <span className={`gem-icon gem-${index % 4}`}>
      <Icon size={28} />
      <i>✦</i>
    </span>
  );
}
function Heading({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">YOUR WORLD, IN COLOR</span>
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {children}
    </div>
  );
}
function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="empty">
      <Sparkles />
      <p>{children}</p>
    </div>
  );
}
export default function App() {
  const [items, setItems] = useState<Item[]>([]),
    [session, setSession] = useState<Session | null>(null),
    [ready, setReady] = useState(false),
    [notice, notify] = useState(""),
    [aiReady, setAIReady] = useState(false),
    [sync, setSync] = useState("Loading…");
  const who = useRef<string | null>(null),
    loaded = useRef(false),
    latest = useRef<Item[]>([]);
  const nav = useNavigate();
  const loc = useLocation();
  useEffect(() => {
    let live = true;
    let unsub: () => void = () => {};
    connect()
      .then(async (config) => {
        if (!live) return;
        setAIReady(config.aiReady);
        if (db) {
          const {
            data: { subscription },
          } = db.auth.onAuthStateChange((_event, s) => {
            if (live) setSession(s);
          });
          unsub = () => subscription.unsubscribe();
          const { data } = await db.auth.getSession();
          if (live) setSession(data.session);
        }
        if (live) setReady(true);
      })
      .catch((e) => {
        if (live) {
          notify(e.message);
          setReady(true);
        }
      });
    return () => {
      live = false;
      unsub();
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    let live = true;
    who.current = session?.user.id || null;
    loaded.current = false;
    setItems([]);
    setSync("Loading…");
    (session ? readCloud() : Promise.resolve(readLocal()))
      .then((rows) => {
        if (live) {
          latest.current = rows;
          setItems(rows);
          loaded.current = true;
          setSync(session ? "Saved to cloud" : "Saved on this device");
        }
      })
      .catch((e) => {
        if (live) {
          notify(e.message);
          setSync("Cloud unavailable — reload to retry");
        }
      });
    return () => {
      live = false;
    };
  }, [ready, session?.user.id]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [loc.pathname]);
  async function save(x: Item) {
    if (!loaded.current)
      throw new Error(
        "Your data is still loading. Please reload if cloud access failed.",
      );
    setSync("Saving…");
    const owner = who.current;
    try {
      const old = latest.current.find((i) => i.id === x.id);
      const next = session
        ? await saveCloud(x, old)
        : { ...x, updated_at: new Date().toISOString() };
      if (owner !== who.current)
        throw new Error("Account changed during save. Reload your data.");
      const updated = [next, ...latest.current.filter((i) => i.id !== x.id)];
      if (!session) writeLocal(updated);
      latest.current = updated;
      setItems(updated);
      setSync(session ? "Saved to cloud" : "Saved on this device");
      if (next.kind === "Chat") {
        const known = new Set((old?.data.messages || []).map((m) => m.id));
        const added = (next.data.messages || []).filter(
          (m) => !known.has(m.id),
        );
        for (const character of latest.current.filter(
          (i) =>
            i.kind === "Character" && next.data.characterIds?.includes(i.id),
        )) {
          const learned = learnPreferences(character.data, added);
          if (learned === character.data) continue;
          try {
            await save({ ...character, data: learned });
          } catch {
            notify(
              "Chat saved, but a character preference could not save. Please update it in the character editor.",
            );
          }
        }
      }
      return next;
    } catch (e) {
      setSync("Not saved — retry");
      throw e;
    }
  }
  const shared = { items, save, notify };
  return (
    <>
      <div className="ambient" />
      <div
        className={`app ${/^\/chats\/(?!new$)[^/]+$/.test(loc.pathname) ? "chat-page" : ""}`}
      >
        <header className="header">
          <Link to="/" className="logo" aria-label="ColorPop home">
            Color<span>Pop</span>
            <i>✦</i>
          </Link>
          <div className="header-actions">
            <Link className="round" to="/search" aria-label="Search">
              <Search size={21} />
            </Link>
            <Link
              className="round"
              to="/settings"
              aria-label="Account settings"
            >
              <UserRound size={22} />
            </Link>
          </div>
        </header>
        <nav className="nav">
          {[
            ["/", "Home"],
            ["/chats", "Chats"],
            ["/characters", "Characters"],
            ["/lorebooks", "Lorebooks"],
            ["/personas", "Personas"],
            ["/settings", "Settings"],
          ].map(([url, name]) => (
            <NavLink key={url} to={url} end>
              {name}
            </NavLink>
          ))}
        </nav>
        <div className="save-status" role="status">
          {session ? <Cloud size={14} /> : <Monitor size={14} />} {sync}
          {!session && <Link to="/settings">Sign in for cloud saving →</Link>}
        </div>
        {notice && (
          <div className="notice" role="alert">
            {notice}
            <button aria-label="Dismiss notice" onClick={() => notify("")}>
              ×
            </button>
          </div>
        )}
        <Routes>
          <Route path="/" element={<Dashboard {...shared} />} />
          <Route path="/chats" element={<ChatList {...shared} />} />
          <Route path="/chats/new" element={<NewChat {...shared} />} />
          <Route
            path="/chats/:id"
            element={
              <Chat
                key={loc.pathname}
                {...shared}
                session={session}
                aiReady={aiReady}
              />
            }
          />
          {Object.entries(kinds).map(([path, kind]) => (
            <Route
              key={path}
              path={`/${path}/*`}
              element={
                <Collection
                  key={loc.pathname}
                  {...shared}
                  kind={kind}
                  path={path}
                />
              }
            />
          ))}
          <Route
            path="/settings"
            element={
              <Account {...shared} session={session} aiReady={aiReady} />
            }
          />
          <Route path="/notes" element={<Notes {...shared} />} />
          <Route path="/saved" element={<Saved {...shared} />} />
          <Route path="/search" element={<SearchPage items={items} />} />
          <Route
            path="*"
            element={
              <Empty>
                This space is still being built. <Link to="/">Back home</Link>
              </Empty>
            }
          />
        </Routes>
        <footer>COLORPOP ✦ YOUR STORIES, YOUR SPACE</footer>
        <nav className="bottom-nav">
          <Link to="/">
            <Home />
            Home
          </Link>
          <Link to="/chats">
            <MessageCircle />
            Chats
          </Link>
          <button onClick={() => nav("/characters/new")}>
            <Plus />
            Create
          </button>
          <Link to="/saved">
            <Heart />
            Saved
          </Link>
          <Link to="/settings">
            <Settings />
            Profile
          </Link>
        </nav>
      </div>
    </>
  );
}
function Dashboard({ items }: Shared) {
  const recent = items.filter((i) => i.kind === "Chat" && !i.data.archived);
  const quick = [
    ["Create Character", "/characters/new"],
    ["Create Lorebook", "/lorebooks/new"],
    ["Create Persona", "/personas/new"],
    ["My Chats", "/chats"],
    ["Characters", "/characters"],
    ["Story Notes", "/notes"],
    ["Saved Messages", "/saved"],
    ["Settings", "/settings"],
    ["Search", "/search"],
  ];
  return (
    <main>
      <div className="top-grid">
        <section className="hero panel">
          <img
            className="hero-photo"
            src="/assets/lucious-emmy-hero.png"
            alt="Lucious and Emmy, ColorPop story artwork"
          />
          <div className="hero-overlay">
            <span className="eyebrow">YOUR WORLD. YOUR RULES.</span>
            <h1>
              Every story
              <br />
              <em>starts here.</em>
            </h1>
            <Link className="pill primary" to="/chats/new">
              Start Chatting <ArrowRight size={18} />
            </Link>
          </div>
        </section>
        <section className="quick panel">
          <h2>
            Quick Links <Sparkles size={18} />
          </h2>
          <div className="link-grid">
            {quick.map(([name, to], n) => (
              <Link className="link-tile" key={name} to={to}>
                <Gem index={n} />
                <span>{name}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
      <section className="actions">
        {[
          ["Create Character", "BRING THEM TO LIFE", "pink", "/characters/new"],
          ["Create Lorebook", "BUILD DEEPER WORLDS", "peach", "/lorebooks/new"],
          ["Create Persona", "YOURSELF IN STORIES", "purple", "/personas/new"],
          ["My Chats", "CONTINUE YOUR STORIES", "blue", "/chats"],
        ].map(([name, sub, color, url], n) => (
          <Link className={`feature ${color}`} key={name} to={url}>
            <Gem index={n} />
            <strong>{name}</strong>
            <small>{sub}</small>
            <ArrowRight size={19} />
          </Link>
        ))}
      </section>
      <section className="categories panel">
        {[
          ["Characters", "/characters"],
          ["Personas", "/personas"],
          ["Lorebooks", "/lorebooks"],
          ["Recent", "/chats"],
          ["Saved", "/saved"],
          ["Notes", "/notes"],
        ].map(([name, url], n) => (
          <Link className="category" key={name} to={url}>
            <Gem index={n} />
            {name}
          </Link>
        ))}
      </section>
      <div className="bottom-grid">
        <section className="recent panel">
          <div className="section-head">
            <h2>Recent Chats</h2>
            <Link to="/chats">View all →</Link>
          </div>
          {recent.length ? (
            <div className="chat-grid">
              {recent.slice(0, 4).map((c) => (
                <Link className="chat-card" key={c.id} to={`/chats/${c.id}`}>
                  <div className="chat-art">
                    <MessageCircle size={40} />
                  </div>
                  <div className="chat-label">
                    <strong>{c.data.name}</strong>
                    <small>{c.data.messages?.length || 0} messages</small>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <Empty>
              Your next favorite story starts here.
              <br />
              <Link to="/chats/new">Create your first chat →</Link>
            </Empty>
          )}
        </section>
        <section className="continue panel">
          <h2>Continue</h2>
          <div className="continue-list">
            {[
              [
                "Continue Last Chat",
                recent[0] ? `/chats/${recent[0].id}` : "/chats/new",
                "pink",
              ],
              ["Create a Character", "/characters/new", "blue"],
              ["Story Notes", "/notes", "purple"],
              ["Saved Messages", "/saved", "teal"],
            ].map(([name, to, color]) => (
              <Link className={`action-strip ${color}`} to={to} key={name}>
                <Sparkles size={18} />
                <span>{name}</span>→
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
function Collection(p: Shared & { kind: Kind; path: string }) {
  const location = useLocation();
  const suffix = location.pathname.split("/")[2];
  const item = p.items.find((x) => x.id === suffix && x.kind === p.kind);
  if (suffix === "new" || item) return <Editor {...p} item={item} />;
  return (
    <>
      <Heading
        title={`My ${p.kind}s`}
        sub="The people and details that make your world yours."
      >
        <Link className="pill primary" to={`/${p.path}/new`}>
          <Plus size={18} /> Create {p.kind}
        </Link>
      </Heading>
      <div className="collection">
        {p.items
          .filter((i) => i.kind === p.kind)
          .map((i) => (
            <Link
              className="panel creation-card"
              key={i.id}
              to={`/${p.path}/${i.id}`}
            >
              <div className="portrait">
                {i.data.avatar ? (
                  <img src={i.data.avatar} alt="" />
                ) : (
                  <Users size={40} />
                )}
              </div>
              <h2>{i.data.name}</h2>
              <p>{i.data.description || "Your story is waiting."}</p>
              <span>Edit details →</span>
            </Link>
          ))}
      </div>
      {!p.items.some((i) => i.kind === p.kind) && (
        <Empty>
          No {p.kind.toLowerCase()}s yet. Create one to get started.
        </Empty>
      )}
    </>
  );
}
function Editor({
  kind,
  path,
  item,
  save,
  notify,
}: Shared & { kind: Kind; path: string; item?: Item }) {
  const [data, setData] = useState<Data>(
      item?.data || { name: "", description: "" },
    ),
    [busy, setBusy] = useState(false);
  const nav = useNavigate();
  const field = (
    name: keyof Data,
    label: string,
    placeholder: string,
    multiline = true,
  ) => (
    <label>
      {label}
      {multiline ? (
        <textarea
          maxLength={12000}
          value={String(data[name] || "")}
          placeholder={placeholder}
          onChange={(e) => setData({ ...data, [name]: e.target.value })}
        />
      ) : (
        <input
          required={name === "name"}
          maxLength={100}
          value={String(data[name] || "")}
          placeholder={placeholder}
          onChange={(e) => setData({ ...data, [name]: e.target.value })}
        />
      )}
    </label>
  );
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!data.name.trim()) return;
    setBusy(true);
    try {
      await save(item ? { ...item, data } : newItem(kind, data));
      nav("/" + path);
      notify(`${data.name} saved.`);
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Link className="back" to={`/${path}`}>
        <ChevronLeft size={16} />
        My {kind}s
      </Link>
      <Heading
        title={`${item ? "Edit" : "Create"} ${kind}`}
        sub="A little detail. A whole lot of personality."
      />
      <form className="editor-layout" onSubmit={submit}>
        <aside className="panel character-preview">
          <div className="portrait large">
            {data.avatar ? (
              <img src={data.avatar} alt="Character preview" />
            ) : (
              <Users size={62} />
            )}
          </div>
          <h2>{data.name || "Your new " + kind.toLowerCase()}</h2>
          <p>{data.description || "Give your imagination a name."}</p>
          <label className="upload">
            Upload portrait
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                if (
                  !["image/png", "image/jpeg", "image/webp"].includes(f.type) ||
                  f.size > 350000
                ) {
                  notify("Choose a JPG, PNG or WebP under 350 KB.");
                  return;
                }
                const r = new FileReader();
                r.onload = () =>
                  setData((d) => ({ ...d, avatar: String(r.result) }));
                r.readAsDataURL(f);
              }}
            />
          </label>
          {data.avatar && (
            <button
              type="button"
              className="ghost"
              onClick={() => setData({ ...data, avatar: undefined })}
            >
              Remove portrait
            </button>
          )}
          <small>JPG, PNG, WebP · up to 350 KB</small>
        </aside>
        <section className="panel form-panel">
          {field("name", "Name", "What should we call them?", false)}
          {field(
            "description",
            kind === "Lorebook" ? "World details & memories" : "About",
            "The details that matter…",
          )}
          {kind === "Character" && (
            <>
              <h2>Identity & appearance</h2>
              <div className="field-grid">
                {field("age", "Age", "Age in years", false)}
                {field("ethnicity", "Ethnicity", "Their background", false)}
                {field("height", "Height", "e.g. 6 ft 2 in / 188 cm", false)}
                {field("bodyType", "Body type", "Build and physique", false)}
                {field("eyeColor", "Eye color", "Eye color", false)}
                {field("hairColor", "Hair color", "Hair color", false)}
                {field(
                  "hairStyle",
                  "Hair style",
                  "Cut, length, texture or styling",
                  false,
                )}
                {field(
                  "scarsMarks",
                  "Scars, marks",
                  "Scars, birthmarks and distinguishing marks",
                )}
                {field("tattoos", "Tattoos", "Designs, placement and meaning")}
              </div>
              <h2>Personality & relationships</h2>
              <div className="field-grid">
                {field(
                  "personality",
                  "Personality",
                  "Traits, motivations, habits…",
                )}
                {field(
                  "appearance",
                  "Appearance & wardrobe",
                  "Hair, tattoos, clothing, jewelry…",
                )}
              </div>
              <div className="field-grid">
                {field("spouse", "Spouse", "Name or none", false)}
                {field("loveInterest", "Love interest", "Name or none", false)}
              </div>
              <h2>Likes & dislikes</h2>
              <p className="hint">
                Fills in from explicit statements in chat, such as “I love
                coffee” in this character’s dialogue or “Lucious likes coffee.”
                You can edit or remove entries. Unclear or contradictory
                preferences are left for you to decide.
              </p>
              <label className="check">
                <input
                  type="checkbox"
                  checked={data.learnPreferences !== false}
                  onChange={(e) =>
                    setData({ ...data, learnPreferences: e.target.checked })
                  }
                />
                Learn likes & dislikes from chat
              </label>
              <div className="field-grid">
                {field(
                  "likes",
                  "Likes",
                  "Discovered through chat · one per line",
                )}
                {field(
                  "dislikes",
                  "Dislikes",
                  "Discovered through chat · one per line",
                )}
              </div>
              {!!data.preferenceSources?.length && (
                <details className="preference-evidence">
                  <summary>See where preferences came from</summary>
                  {data.preferenceSources
                    .filter((source) =>
                      String(
                        source.kind === "like"
                          ? data.likes || ""
                          : data.dislikes || "",
                      )
                        .split("\n")
                        .includes(source.value),
                    )
                    .map((source, i) => (
                      <blockquote key={i}>
                        <strong>
                          {source.kind}: {source.value}
                        </strong>
                        <p>{source.quote}</p>
                      </blockquote>
                    ))}
                </details>
              )}
              <h2>Current life</h2>
              {field(
                "currentAddress",
                "Current address",
                "Home, city, neighborhood or fictional address",
              )}
              {field(
                "currentVehicle",
                "Current vehicle",
                "Make, model, year, color and details",
              )}
              <h2>Roleplay setup</h2>
              {field(
                "voice",
                "Speaking style",
                "Tone, mannerisms, example dialogue…",
              )}
              {field(
                "scenario",
                "Starting scenario",
                "Where does the story begin?",
              )}
              {field(
                "greeting",
                "First message",
                "Their opening line or scene…",
              )}
            </>
          )}
          {kind === "Persona" &&
            field(
              "appearance",
              "Appearance & role",
              "How you appear in the story…",
            )}
          <div className="form-actions">
            <Link className="pill secondary" to={`/${path}`}>
              Cancel
            </Link>
            <button className="pill primary" disabled={busy}>
              {busy ? "Saving…" : `Save ${kind}`}
            </button>
          </div>
        </section>
      </form>
    </>
  );
}
function ChatList({ items, save, notify }: Shared) {
  const [archived, setArchived] = useState(false);
  return (
    <>
      <Heading
        title="My Chats"
        sub="Pick up exactly where your imagination left off."
      >
        <Link className="pill primary" to="/chats/new">
          <Plus size={18} />
          New Chat
        </Link>
      </Heading>
      <button className="chip" onClick={() => setArchived(!archived)}>
        {archived ? "Show active" : "Show archived"}
      </button>
      <div className="chat-list">
        {items
          .filter((i) => i.kind === "Chat" && !!i.data.archived === archived)
          .sort((a, b) => Number(!!b.data.pinned) - Number(!!a.data.pinned))
          .map((c) => (
            <div className="panel chat-row" key={c.id}>
              <Gem index={3} />
              <Link to={`/chats/${c.id}`}>
                <h2>
                  {c.data.pinned ? "♥ " : ""}
                  {c.data.name}
                </h2>
                <p>
                  {c.data.messages?.at(-1)?.content.slice(0, 100) ||
                    "Your story starts here."}
                </p>
              </Link>
              <button
                className="chip"
                onClick={() =>
                  save({
                    ...c,
                    data: { ...c.data, pinned: !c.data.pinned },
                  }).catch((e) => notify(e.message))
                }
              >
                {c.data.pinned ? "Unpin" : "Pin"}
              </button>
              <button
                className="chip"
                onClick={() =>
                  save({
                    ...c,
                    data: { ...c.data, archived: !archived },
                  }).catch((e) => notify(e.message))
                }
              >
                {archived ? "Restore" : "Archive"}
              </button>
            </div>
          ))}
      </div>
      {!items.some(
        (i) => i.kind === "Chat" && !!i.data.archived === archived,
      ) && (
        <Empty>
          {archived
            ? "No archived chats."
            : "Choose your characters and start a new story."}
        </Empty>
      )}
    </>
  );
}
function NewChat({ items, save, notify }: Shared) {
  const [name, setName] = useState(""),
    [ids, setIds] = useState<string[]>([]),
    [persona, setPersona] = useState(""),
    [lore, setLore] = useState<string[]>([]),
    [scene, setScene] = useState(""),
    [busy, setBusy] = useState(false);
  const nav = useNavigate();
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const first = items.find((i) => i.id === ids[0]);
      const messages: Message[] = first?.data.greeting
        ? [
            {
              id: crypto.randomUUID(),
              role: "assistant",
              content: first.data.greeting,
              name: first.data.name,
              createdAt: new Date().toISOString(),
            },
          ]
        : [];
      const c = await save(
        newItem("Chat", {
          name: name.trim() || "New Story",
          characterIds: ids,
          personaId: persona,
          lorebookIds: lore,
          scenario: scene,
          messages,
        }),
      );
      nav("/chats/" + c.id);
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Heading
        title="Start a story"
        sub="One character or a whole room. You choose."
      />
      <form className="panel form-panel narrow" onSubmit={submit}>
        <label>
          Chat name
          <input
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="A night at the penthouse"
          />
        </label>
        <fieldset>
          <legend>Who's in the room?</legend>
          <div className="speaker-bar">
            {items
              .filter((i) => i.kind === "Character")
              .map((c) => (
                <button
                  type="button"
                  className={`speaker ${ids.includes(c.id) ? "selected" : ""}`}
                  aria-pressed={ids.includes(c.id)}
                  key={c.id}
                  onClick={() =>
                    setIds(
                      ids.includes(c.id)
                        ? ids.filter((id) => id !== c.id)
                        : [...ids, c.id],
                    )
                  }
                >
                  <Gem />
                  {c.data.name}
                </button>
              ))}
          </div>
          <Link to="/characters/new">+ Create a character</Link>
          <p>No characters selected? Start with the narrator.</p>
        </fieldset>
        <label>
          Your persona
          <select value={persona} onChange={(e) => setPersona(e.target.value)}>
            <option value="">Myself</option>
            {items
              .filter((i) => i.kind === "Persona")
              .map((i) => (
                <option key={i.id} value={i.id}>
                  {i.data.name}
                </option>
              ))}
          </select>
        </label>
        <fieldset>
          <legend>World memory</legend>
          {items
            .filter((i) => i.kind === "Lorebook")
            .map((i) => (
              <label className="check" key={i.id}>
                <input
                  type="checkbox"
                  checked={lore.includes(i.id)}
                  onChange={(e) =>
                    setLore(
                      e.target.checked
                        ? [...lore, i.id]
                        : lore.filter((id) => id !== i.id),
                    )
                  }
                />
                {i.data.name}
              </label>
            ))}
          <Link to="/lorebooks/new">+ Create a lorebook</Link>
        </fieldset>
        <label>
          Starting scene
          <textarea
            maxLength={12000}
            value={scene}
            onChange={(e) => setScene(e.target.value)}
            placeholder="Set the place, time, and mood…"
          />
        </label>
        <button className="pill primary" disabled={busy}>
          {busy ? "Creating…" : "Enter the chat"}
          <ArrowRight size={18} />
        </button>
      </form>
    </>
  );
}
function Chat({
  items,
  save,
  notify,
  session,
  aiReady,
}: Shared & { session: Session | null; aiReady: boolean }) {
  const { id } = useParams();
  const c = items.find((i) => i.id === id && i.kind === "Chat");
  const [draft, setDraft] = useState(""),
    [speaker, setSpeaker] = useState("auto"),
    [busy, setBusy] = useState(false),
    [pending, setPending] = useState<Message | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const characters = items.filter((i) => c?.data.characterIds?.includes(i.id));
  const messages = c?.data.messages || [];
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages.length]);
  if (!c)
    return (
      <Empty>
        Loading chat… <Link to="/chats">Back to chats</Link>
      </Empty>
    );
  const selected =
    speaker === "auto"
      ? characters[
          messages.filter((m) => m.role === "assistant").length %
            characters.length
        ]?.id || "narrator"
      : speaker;
  async function persistReply(m: Message, chat: Item) {
    try {
      await save({
        ...chat,
        data: { ...chat.data, messages: [...(chat.data.messages || []), m] },
      });
      setPending(null);
    } catch (e) {
      setPending(m);
      throw e;
    }
  }
  async function reply(action = "reply", chat = c!) {
    setBusy(true);
    try {
      if (!session)
        throw new Error(
          "Your message is saved on this device. Sign in and import your device stories to use AI.",
        );
      if (!aiReady)
        throw new Error(
          "Your message is saved. Add the AI API key to the server environment to enable replies.",
        );
      const {
        data: { session: current },
      } = await db!.auth.getSession();
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${current?.access_token}`,
        },
        body: JSON.stringify({
          chatId: chat.id,
          speaker: action === "reply" ? selected : "narrator",
          action,
        }),
      });
      const result = await r.json();
      if (!r.ok) throw new Error(result.error);
      await persistReply(
        {
          id: crypto.randomUUID(),
          role: "assistant",
          name: result.name,
          content: result.content,
          createdAt: new Date().toISOString(),
        },
        chat,
      );
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function send(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim() || busy) return;
    setBusy(true);
    try {
      const name =
        items.find((i) => i.id === c!.data.personaId)?.data.name || "You";
      const next = await save({
        ...c!,
        data: {
          ...c!.data,
          messages: [
            ...messages,
            {
              id: crypto.randomUUID(),
              role: "user",
              name,
              content: draft.trim(),
              createdAt: new Date().toISOString(),
            },
          ],
        },
      });
      setDraft("");
      if (session && aiReady) await reply("reply", next);
      else
        notify(
          "Message saved. AI replies become available after sign-in and AI setup.",
        );
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Link className="back" to="/chats">
        <ChevronLeft size={16} />
        All chats
      </Link>
      <section className="chat-shell panel">
        <header className="chat-header">
          <Gem index={3} />
          <div>
            <h1>{c.data.name}</h1>
            <p>
              {characters.map((x) => x.data.name).join(" · ") ||
                "Narrator room"}{" "}
              <span>
                ✦ {aiReady && session ? "AI ready" : "Writing mode"}
              </span>
            </p>
          </div>
        </header>
        {c.data.scenario && (
          <details className="scene">
            <summary>Scene & world memory</summary>
            <p>{c.data.scenario}</p>
            <p>
              {items
                .filter((i) => c.data.lorebookIds?.includes(i.id))
                .map((i) => i.data.name)
                .join(" · ")}
            </p>
          </details>
        )}
        <div className="messages" aria-live="polite">
          {!messages.length && (
            <Empty>
              Set the scene. Say the first word.
              <br />
              This story belongs to you.
            </Empty>
          )}
          {messages.map((m) => (
            <article key={m.id} className={`message ${m.role}`}>
              <div className="message-meta">
                <strong>{m.name}</strong>
                <button
                  className="save-heart"
                  aria-label={`${m.saved ? "Unsave" : "Save"} message`}
                  disabled={busy}
                  onClick={() =>
                    save({
                      ...c,
                      data: {
                        ...c.data,
                        messages: messages.map((x) =>
                          x.id === m.id ? { ...x, saved: !x.saved } : x,
                        ),
                      },
                    }).catch((e) => notify(e.message))
                  }
                >
                  <Heart size={15} fill={m.saved ? "currentColor" : "none"} />
                </button>
              </div>
              <p>{m.content}</p>
            </article>
          ))}
          {busy && <p className="thinking">✦ Working on your story…</p>}
          {pending && (
            <article className="message assistant">
              <strong>Reply awaiting save</strong>
              <p>{pending.content}</p>
              <button
                className="chip"
                onClick={() =>
                  persistReply(pending, c).catch((e) => notify(e.message))
                }
              >
                Retry saving reply
              </button>
            </article>
          )}
          <div ref={end} />
        </div>
        <div className="composer">
          <span className="eyebrow">WHO SPEAKS NEXT?</span>
          <div className="speaker-bar">
            {[
              { id: "auto", name: "Auto room" },
              { id: "narrator", name: "Narrator" },
              ...characters.map((x) => ({ id: x.id, name: x.data.name })),
            ].map((x, n) => (
              <button
                key={x.id}
                disabled={busy}
                className={`speaker ${speaker === x.id ? "selected" : ""}`}
                aria-pressed={speaker === x.id}
                onClick={() => setSpeaker(x.id)}
              >
                <span className="mini-gem">
                  {n === 0 ? <Sparkles size={18} /> : x.name[0]}
                </span>
                {x.name}
              </button>
            ))}
          </div>
          <p className="hint">
            Auto room rotates one character reply per message. You control the
            pace.
          </p>
          <div className="tools">
            {[
              ["continue", "Continue"],
              ["chaos", "Add chaos"],
              ["scene", "Describe scene"],
              ["plan", "Plan next"],
            ].map(([action, label]) => (
              <button
                className="chip"
                key={action}
                disabled={busy || !!pending}
                onClick={() => reply(action)}
              >
                <WandSparkles size={14} />
                {label}
              </button>
            ))}
          </div>
          <form className="message-form" onSubmit={send}>
            <textarea
              aria-label="Your message"
              maxLength={12000}
              placeholder="Write your next moment…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={busy}
            />
            <button
              className="send"
              aria-label="Send message"
              disabled={busy || !draft.trim() || !!pending}
            >
              <Send size={22} />
            </button>
          </form>
          <button
            className="ghost"
            disabled={busy || !!pending}
            onClick={() => reply()}
          >
            Generate / retry reply
          </button>
        </div>
      </section>
    </>
  );
}
function Account({
  items,
  save,
  notify,
  session,
  aiReady,
}: Shared & { session: Session | null; aiReady: boolean }) {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false),
    [signup, setSignup] = useState(false);
  async function auth(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (!db) throw new Error("Supabase connection is unavailable.");
      const { error } = signup
        ? await db.auth.signUp({ email, password })
        : await db.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setPassword("");
      notify(
        signup
          ? "Check your email to confirm your account, then sign in."
          : "Signed in. Your cloud stories are loaded.",
      );
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function download() {
    const a = document.createElement("a"),
      url = URL.createObjectURL(
        new Blob([JSON.stringify({ version: 2, items }, null, 2)], {
          type: "application/json",
        }),
      );
    a.href = url;
    a.download = "ColorPop_Backup.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function importGuest() {
    setBusy(true);
    try {
      let count = 0;
      for (const x of readLocal()) {
        if (items.some((i) => i.id === x.id)) continue;
        await saveCloud(x);
        count++;
      }
      notify(`${count} device items copied. Reload to load them.`);
      window.location.reload();
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Heading
        title="Your space"
        sub="Keep your stories close, wherever you go."
      />
      <div className="settings-grid">
        <section className="panel form-panel">
          <h2>{session ? "Cloud account" : "Sign in to ColorPop"}</h2>
          {session ? (
            <>
              <p>{session.user.email}</p>
              <p>
                Characters, chats, lorebooks, personas, and notes save privately
                to your Supabase account.
              </p>
              <button
                className="pill secondary"
                disabled={busy}
                onClick={importGuest}
              >
                Import stories from this device
              </button>
              <button
                className="ghost"
                onClick={() =>
                  db!.auth.signOut().then(({ error }) => {
                    if (error) notify(error.message);
                  })
                }
              >
                Sign out
              </button>
            </>
          ) : (
            <form onSubmit={auth}>
              <p>Use your existing Supabase email account, or create one.</p>
              <label>
                Email
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  autoComplete={signup ? "new-password" : "current-password"}
                  minLength={8}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              <button className="pill primary" disabled={busy}>
                {busy ? "Please wait…" : signup ? "Create account" : "Sign in"}
              </button>
              <button
                className="ghost"
                type="button"
                onClick={() => setSignup(!signup)}
              >
                {signup
                  ? "Already have an account? Sign in"
                  : "New here? Create an account"}
              </button>
            </form>
          )}
        </section>
        <section className="panel form-panel">
          <h2>Story connections</h2>
          <div className="connection">
            <Cloud />
            Supabase <strong>{db ? "Connected" : "Not configured"}</strong>
          </div>
          <div className="connection">
            <Sparkles />
            AI <strong>{aiReady ? "Ready" : "Needs API key"}</strong>
          </div>
          <p>
            {aiReady
              ? "Sign in to receive character and narrator replies."
              : "Set an OpenRouter or OpenAI API key in the hosting secret settings."}
          </p>
          <p className="hint">
            The API key stays on the server. Your ChatGPT subscription does not
            supply it.
          </p>
          <button className="pill secondary" onClick={download}>
            <Download size={18} />
            Download story backup
          </button>
        </section>
      </div>
    </>
  );
}
function Notes({ items, save, notify }: Shared) {
  const item = items.find((i) => i.kind === "Notes");
  const [text, setText] = useState(item?.data.description || "");
  useEffect(() => {
    setText(item?.data.description || "");
  }, [item?.id]);
  return (
    <>
      <Heading title="Story notes" sub="Keep the little details that matter." />
      <section className="panel form-panel">
        <label>
          Notes
          <textarea
            className="notes-input"
            maxLength={50000}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </label>
        <button
          className="pill primary"
          onClick={() =>
            save(
              item
                ? { ...item, data: { ...item.data, description: text } }
                : newItem("Notes", { name: "Story notes", description: text }),
            )
              .then(() => notify("Notes saved."))
              .catch((e) => notify(e.message))
          }
        >
          Save notes
        </button>
      </section>
    </>
  );
}
function Saved({ items }: Shared) {
  const chats = items.filter(
    (i) => i.kind === "Chat" && i.data.messages?.some((m) => m.saved),
  );
  return (
    <>
      <Heading
        title="Saved moments"
        sub="The lines you want to keep forever."
      />
      {chats.map((c) => (
        <section className="panel form-panel" key={c.id}>
          <Link to={`/chats/${c.id}`}>
            <h2>{c.data.name} →</h2>
          </Link>
          {c.data.messages
            ?.filter((m) => m.saved)
            .map((m) => (
              <blockquote key={m.id}>
                <strong>{m.name}</strong>
                <p>{m.content}</p>
              </blockquote>
            ))}
        </section>
      ))}
      {!chats.length && (
        <Empty>Tap the heart on a chat message to save it here.</Empty>
      )}
    </>
  );
}
function SearchPage({ items }: { items: Item[] }) {
  const [q, setQ] = useState("");
  return (
    <>
      <Heading title="Find your story" />
      <input
        autoFocus
        aria-label="Search stories"
        placeholder="Search names and descriptions…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="result-list">
        {items
          .filter((i) =>
            (i.data.name + " " + (i.data.description || ""))
              .toLowerCase()
              .includes(q.toLowerCase()),
          )
          .map((i) => (
            <Link
              className="panel search-result"
              to={
                i.kind === "Chat"
                  ? "/chats/" + i.id
                  : i.kind === "Notes"
                    ? "/notes"
                    : `/${Object.keys(kinds).find((k) => kinds[k] === i.kind)}/${i.id}`
              }
              key={i.id}
            >
              {i.data.name} <small>{i.kind}</small>
            </Link>
          ))}
      </div>
    </>
  );
}
