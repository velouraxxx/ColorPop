export type Kind = "Character" | "Persona" | "Lorebook" | "Chat" | "Notes";
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  name: string;
  saved?: boolean;
  createdAt: string;
}
export interface StoryMemory { id: string; title: string; detail: string; kind: "event" | "fact" | "relationship"; storyTime: string; createdAt: string; sourceMessageId?: string; }
export interface ChatPlugin { id: string; name: string; instructions: string; enabled: boolean; }
export interface Data {
  memories?: StoryMemory[];
  plugins?: ChatPlugin[];
  name: string;
  description?: string;
  age?: string;
  ethnicity?: string;
  height?: string;
  bodyType?: string;
  eyeColor?: string;
  hairColor?: string;
  hairStyle?: string;
  scarsMarks?: string;
  tattoos?: string;
  spouse?: string;
  loveInterest?: string;
  likes?: string;
  dislikes?: string;
  currentAddress?: string;
  currentVehicle?: string;
  learnPreferences?: boolean;
  preferenceSources?: {
    kind: "like" | "dislike";
    value: string;
    messageId: string;
    quote: string;
  }[];
  personality?: string;
  appearance?: string;
  greeting?: string;
  scenario?: string;
  voice?: string;
  avatar?: string;
  characterIds?: string[];
  messages?: Message[];
  personaId?: string;
  lorebookIds?: string[];
  pinned?: boolean;
  archived?: boolean;
}
export interface Item {
  id: string;
  user_id?: string;
  kind: Kind;
  data: Data;
  updated_at: string;
}
export const newItem = (kind: Kind, data: Data): Item => ({
  id: crypto.randomUUID(),
  kind,
  data,
  updated_at: new Date().toISOString(),
});
