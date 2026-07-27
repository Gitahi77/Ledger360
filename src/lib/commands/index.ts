export * from "./types";
export * from "./registry";
export * from "./sources/navigation";
export * from "./sources/actions";

// Initialize registry with default providers
import { CommandRegistry } from "./registry";
import { navigationProvider } from "./sources/navigation";
import { actionsProvider } from "./sources/actions";

CommandRegistry.register(navigationProvider);
CommandRegistry.register(actionsProvider);
