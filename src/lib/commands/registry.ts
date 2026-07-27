import { CommandAction, CommandProvider } from "./types";

class Registry {
  private providers: Map<string, CommandProvider> = new Map();

  register(provider: CommandProvider) {
    this.providers.set(provider.id, provider);
  }

  unregister(providerId: string) {
    this.providers.delete(providerId);
  }

  async getCommands(): Promise<CommandAction[]> {
    const allCommands: CommandAction[] = [];
    
    for (const provider of this.providers.values()) {
      const commands = await provider.getCommands();
      allCommands.push(...commands);
    }
    
    // Sort by priority (highest first)
    return allCommands.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  }
}

export const CommandRegistry = new Registry();
