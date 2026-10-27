import React from "react";
import type { Category, ClientProfile, WorkflowKind } from "../../../lib/types";
import { getClients, saveClient, deleteClient } from "../../../lib/storage";
import { buildWorkflow } from "../../../lib/workflows";
import { generateId } from "../../../lib/optimizer";
interface Props {
  language: "en" | "bn";
  addToast: (message: string, type?: "success" | "error" | "info") => void;
  onUsePrompt: (text: string, category?: Category) => void;
}
const blank = (): ClientProfile => ({
  id: generateId(),
  name: "",
  audience: "",
  offer: "",
  tone: "",
  constraints: "",
});
export function WorkflowsScreen({ language, addToast, onUsePrompt }: Props) {
  const bn = language === "bn";
  const [clients, setClients] = React.useState<ClientProfile[]>([]);
  const [selected, setSelected] = React.useState("");
  const [editing, setEditing] = React.useState(false);
  const [profile, setProfile] = React.useState(blank);
  const [kind, setKind] = React.useState<WorkflowKind>("proposal");
  const [brief, setBrief] = React.useState("");
  const [audience, setAudience] = React.useState("");
  const [goal, setGoal] = React.useState("");
  const [constraints, setConstraints] = React.useState("");
  const [outputLanguage, setOutputLanguage] = React.useState<"en" | "bn">(
    language,
  );
  React.useEffect(() => {
    getClients()
      .then(setClients)
      .catch(() => addToast("Could not load client profiles", "error"));
  }, []);
  const client = clients.find((c) => c.id === selected) || null;
  const field = (
    label: string,
    value: string,
    set: (v: string) => void,
    max = 4000,
  ) => (
    <label className="input-group" style={{ display: "block" }}>
      {label}
      {max === 20000 || /constraints|সীমাবদ্ধতা/i.test(label) ? (
        <textarea
          className="textarea"
          style={{ minHeight: 64 }}
          rows={2}
          maxLength={max}
          value={value}
          onChange={(e) => set(e.target.value)}
        />
      ) : (
        <input
          className="input"
          maxLength={max}
          value={value}
          onChange={(e) => set(e.target.value)}
        />
      )}
    </label>
  );
  async function persist() {
    try {
      await saveClient(profile);
      setClients(await getClients());
      setSelected(profile.id);
      setEditing(false);
      addToast(bn ? "ক্লায়েন্ট সংরক্ষিত" : "Client saved", "success");
    } catch (e) {
      addToast((e as Error).message, "error");
    }
  }
  async function remove() {
    if (
      !client ||
      !confirm(bn ? "এই ক্লায়েন্ট মুছবেন?" : "Delete this client profile?")
    )
      return;
    try {
      await deleteClient(client.id);
      setClients(await getClients());
      setSelected("");
    } catch (e) {
      addToast((e as Error).message, "error");
    }
  }
  return (
    <div className="screen-enter">
      <h1 className="section-title">
        {bn ? "ক্লায়েন্টের কাজ" : "Client workflows"}
      </h1>
      <p className="section-subtitle">
        {bn
          ? "একই তথ্য বারবার লিখবেন না। ক্লায়েন্টের তথ্য দিয়ে কাজের ব্রিফ তৈরি করুন।"
          : "Reuse client context to create a clear brief for real work."}
      </p>
      <label className="input-group">
        {bn ? "ক্লায়েন্ট" : "Client"}
        <select
          className="select"
          value={selected}
          onChange={(e) => {
            setSelected(e.target.value);
            const c = clients.find((x) => x.id === e.target.value);
            if (c) setAudience(c.audience);
          }}
        >
          <option value="">
            {bn ? "ক্লায়েন্ট ছাড়া" : "No saved client"}
          </option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <div className="chips-container">
        <button
          className="chip"
          onClick={() => {
            setProfile(blank());
            setEditing(true);
          }}
        >
          {bn ? "নতুন ক্লায়েন্ট" : "New client"}
        </button>
        {client && (
          <>
            <button
              className="chip"
              onClick={() => {
                setProfile({ ...client });
                setEditing(true);
              }}
            >
              {bn ? "সম্পাদনা" : "Edit client"}
            </button>
            <button className="chip" onClick={remove}>
              {bn ? "মুছুন" : "Delete client"}
            </button>
          </>
        )}
      </div>
      {editing && (
        <section className="result-card" style={{ padding: 12 }}>
          {(["name", "audience", "offer", "tone", "constraints"] as const).map(
            (key, i) => (
              <React.Fragment key={key}>
                {field(
                  (bn
                    ? ["নাম", "পাঠক", "পণ্য বা সেবা", "লেখার ধরন", "সীমাবদ্ধতা"]
                    : [
                        "Name",
                        "Audience",
                        "Product or service",
                        "Tone",
                        "Constraints",
                      ])[i]!,
                  profile[key],
                  (v) => setProfile((p) => ({ ...p, [key]: v })),
                  key === "name" ? 120 : 4000,
                )}
              </React.Fragment>
            ),
          )}
          <button
            className="chip"
            disabled={!profile.name.trim()}
            onClick={persist}
          >
            {bn ? "সংরক্ষণ" : "Save client"}
          </button>
          <button className="chip" onClick={() => setEditing(false)}>
            {bn ? "বাতিল" : "Cancel"}
          </button>
        </section>
      )}
      <label className="input-group">
        {bn ? "কাজের ধরন" : "Task"}
        <select
          className="select"
          value={kind}
          onChange={(e) => setKind(e.target.value as WorkflowKind)}
        >
          <option value="proposal">
            {bn ? "প্রস্তাব" : "Client proposal"}
          </option>
          <option value="advertising">
            {bn ? "বিজ্ঞাপন" : "Advertising brief"}
          </option>
          <option value="reply">
            {bn ? "ক্লায়েন্টের উত্তর" : "Client reply"}
          </option>
        </select>
      </label>
      {field(bn ? "মূল বিবরণ" : "Original brief", brief, setBrief, 20000)}
      {field(bn ? "পাঠক" : "Audience", audience, setAudience)}
      {field(bn ? "প্রত্যাশিত ফল" : "Goal", goal, setGoal)}
      {field(
        bn
          ? "সময়সীমা, বাজেট বা অন্য সীমাবদ্ধতা (ঐচ্ছিক)"
          : "Deadline, budget or other constraints (optional)",
        constraints,
        setConstraints,
      )}
      <label className="input-group">
        {bn ? "উত্তরের ভাষা" : "Output language"}
        <select
          className="select"
          value={outputLanguage}
          onChange={(e) => setOutputLanguage(e.target.value as "en" | "bn")}
        >
          <option value="en">English</option>
          <option value="bn">বাংলা</option>
        </select>
      </label>
      <button
        className="btn-primary"
        disabled={!brief.trim() || !audience.trim() || !goal.trim()}
        onClick={() => {
          try {
            onUsePrompt(
              buildWorkflow(kind, brief, client, outputLanguage, {
                audience,
                goal,
                constraints,
              }),
              "business",
            );
          } catch (e) {
            addToast((e as Error).message, "error");
          }
        }}
      >
        {bn ? "ব্রিফ তৈরি করুন" : "Create reusable brief"}
      </button>
      <p className="section-subtitle">
        {bn
          ? "ক্লায়েন্টের তথ্য এই ব্রাউজারেই থাকে। AI ব্যবহার করলে তৈরি ব্রিফ নির্বাচিত সেবায় পাঠানো হয়।"
          : "Profiles stay in this browser. Choosing AI in the optimizer sends the assembled brief to your selected provider."}
      </p>
    </div>
  );
}
