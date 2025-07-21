export interface Message {
  id: number;
  role: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Chat {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  messages: Message[];
}