import React from "react";
import { CommandGroups, CommandProvider } from "../types";
import { LayoutDashboard, Wallet, PiggyBank, Receipt, Settings, BarChart3 } from "lucide-react";

export const navigationProvider: CommandProvider = {
  id: "provider.navigation",
  getCommands: () => [
    {
      id: "navigation.dashboard",
      title: "Dashboard",
      group: CommandGroups.Navigation,
      keywords: ["home", "start", "main", "overview"],
      icon: React.createElement(LayoutDashboard, { className: "w-4 h-4" }),
      perform: (ctx) => {
        ctx.router.push("/");
        ctx.close();
      },
    },
    {
      id: "navigation.transactions",
      title: "Transactions",
      group: CommandGroups.Navigation,
      keywords: ["history", "payments", "income", "expenses", "list"],
      icon: React.createElement(Receipt, { className: "w-4 h-4" }),
      perform: (ctx) => {
        ctx.router.push("/transactions");
        ctx.close();
      },
    },
    {
      id: "navigation.accounts",
      title: "Accounts",
      group: CommandGroups.Navigation,
      keywords: ["balances", "banks", "wallets", "net worth"],
      icon: React.createElement(Wallet, { className: "w-4 h-4" }),
      perform: (ctx) => {
        ctx.router.push("/accounts");
        ctx.close();
      },
    },
    {
      id: "navigation.budgets",
      title: "Budgets",
      group: CommandGroups.Navigation,
      keywords: ["planning", "limits", "spending"],
      icon: React.createElement(PiggyBank, { className: "w-4 h-4" }),
      perform: (ctx) => {
        ctx.router.push("/budgets");
        ctx.close();
      },
    },
    {
      id: "navigation.reports",
      title: "Reports",
      group: CommandGroups.Navigation,
      keywords: ["charts", "analytics", "trends", "insights"],
      icon: React.createElement(BarChart3, { className: "w-4 h-4" }),
      perform: (ctx) => {
        ctx.router.push("/reports");
        ctx.close();
      },
    },
    {
      id: "navigation.settings",
      title: "Settings",
      group: CommandGroups.Navigation,
      keywords: ["preferences", "configuration", "profile", "options"],
      icon: React.createElement(Settings, { className: "w-4 h-4" }),
      perform: (ctx) => {
        ctx.router.push("/settings");
        ctx.close();
      },
    }
  ],
};
