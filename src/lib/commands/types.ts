import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ReactNode } from "react";

export const CommandGroups = {
  Navigation: "Navigation",
  Create: "Create",
  Reports: "Reports",
  Settings: "Settings",
} as const;

export type CommandGroup = typeof CommandGroups[keyof typeof CommandGroups];

export interface CommandContext {
  router: AppRouterInstance;
  close: () => void;
}

export interface CommandAction {
  id: string;
  title: string;
  subtitle?: string;
  group: CommandGroup;
  keywords?: string[];
  icon?: ReactNode;
  priority?: number;
  hidden?: boolean;
  perform(ctx: CommandContext): void | Promise<void>;
}

export interface CommandProvider {
  id: string;
  getCommands(): CommandAction[] | Promise<CommandAction[]>;
}
