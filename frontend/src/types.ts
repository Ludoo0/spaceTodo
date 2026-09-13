export interface User {
  id: string;
  email: string | null;
  name: string | null;
}

export interface Space {
  id: string;
  name: string;
  color: string;
  icon: string;
  position: number;
}

export interface Todo {
  id: string;
  title: string;
  done: boolean;
  priority: boolean;
  position: number;
  spaceId: string;
  space?: Pick<Space, "id" | "name" | "color" | "icon">;
}

export interface Note {
  id: string;
  content: string;
  color: string;
  x: number;
  y: number;
  rotation: number;
  spaceId: string;
}
