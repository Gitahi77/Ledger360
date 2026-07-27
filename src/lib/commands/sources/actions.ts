import React from "react";
import { CommandGroups, CommandProvider } from "../types";
import { Plus, ArrowRightLeft, Target, PiggyBank, Landmark } from "lucide-react";

export const actionsProvider: CommandProvider = {
  id: "provider.actions",
  getCommands: () => [
    {
      id: "transaction.new",
      title: "Add Transaction",
      group: CommandGroups.Create,
      keywords: ["create", "new", "expense", "income", "payment", "add"],
      icon: React.createElement(Plus, { className: "w-4 h-4" }),
      perform: (ctx) => {
        // Temporary migration approach: navigate with query param if we don't have a global modal yet
        ctx.router.push("/transactions?new=transaction");
        ctx.close();
      },
    },
    {
      id: "transfer.new",
      title: "Add Transfer",
      group: CommandGroups.Create,
      keywords: ["create", "new", "move money", "transfer", "add"],
      icon: React.createElement(ArrowRightLeft, { className: "w-4 h-4" }),
      perform: (ctx) => {
        ctx.router.push("/transactions?new=transfer");
        ctx.close();
      },
    },
    {
      id: "budget.new",
      title: "Add Budget",
      group: CommandGroups.Create,
      keywords: ["create", "new", "budget", "limit", "add"],
      icon: React.createElement(PiggyBank, { className: "w-4 h-4" }),
      perform: (ctx) => {
        ctx.router.push("/budgets?new=true");
        ctx.close();
      },
    },
    {
      id: "goal.new",
      title: "Add Goal",
      group: CommandGroups.Create,
      keywords: ["create", "new", "saving", "target", "goal", "add"],
      icon: React.createElement(Target, { className: "w-4 h-4" }),
      perform: (ctx) => {
        ctx.router.push("/goals?new=true");
        ctx.close();
      },
    },
    {
      id: "loan.new",
      title: "Add Loan",
      group: CommandGroups.Create,
      keywords: ["create", "new", "debt", "borrow", "lend", "loan", "add"],
      icon: React.createElement(Landmark, { className: "w-4 h-4" }),
      perform: (ctx) => {
        ctx.router.push("/loans?new=true");
        ctx.close();
      },
    },
  ],
};
