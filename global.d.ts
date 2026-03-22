interface CanvasRenderingContext2D {
  roundRect(x: number, y: number, w: number, h: number, radii?: number | number[]): void;
}

declare module 'react-draggable' {
  import * as React from 'react';
  interface DraggableProps {
    handle?: string;
    bounds?: string | { left?: number; top?: number; right?: number; bottom?: number };
    children: React.ReactNode;
    [key: string]: any;
  }
  const Draggable: React.FC<DraggableProps>;
  export default Draggable;
}

declare module '@monaco-editor/react' {
  import * as React from 'react';
  interface EditorProps {
    height?: string | number;
    defaultLanguage?: string;
    language?: string;
    theme?: string;
    value?: string;
    defaultValue?: string;
    onChange?: (value: string | undefined) => void;
    options?: any;
    [key: string]: any;
  }
  const Editor: React.FC<EditorProps>;
  export default Editor;
}

declare module 'monaco-editor' {
  const monaco: any;
  export default monaco;
}

declare module '@react-three/fiber' {
  export const Canvas: any;
  export const useFrame: any;
  export const useThree: any;
  export const extend: any;
}

declare module '@react-three/drei' {
  export const OrbitControls: any;
  export const Box: any;
  export const Sphere: any;
  export const Cylinder: any;
  export const Text: any;
  export const Grid: any;
  export const Environment: any;
}

declare module 'three' {
  export class Vector3 {
    constructor(x?: number, y?: number, z?: number);
    x: number;
    y: number;
    z: number;
  }
  export class Color {
    constructor(color?: string | number);
  }
  export class Mesh {}
  export class BoxGeometry {}
  export class MeshStandardMaterial {}
}

declare module 'framer-motion' {
  export const motion: any;
  export const AnimatePresence: any;
  export const useAnimation: any;
}

declare module 'cheerio' {
  export function load(html: string): any;
}

declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    GOOGLE_GEMINI_KEY: string;
    OPENROUTER_API_KEY: string;
    RESEND_API_KEY: string;
    NEXT_PUBLIC_APP_URL: string;
    NEXT_PUBLIC_SUPER_ADMIN: string;
    NEXT_PUBLIC_MODERATOR_1: string;
    NEXT_PUBLIC_MODERATOR_2: string;
    NEXT_PUBLIC_PREMIUM_WHATSAPP: string;
    NEXT_PUBLIC_PREMIUM_PRICE: string;
    HUGGINGFACE_TOKEN: string;
  }
}

interface Window {
  __NEXT_DATA__: any;
}

type AnyComponent = React.FC<any>;
type AnyProps = Record<string, any>;
