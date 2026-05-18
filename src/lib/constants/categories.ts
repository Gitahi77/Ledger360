// src/lib/constants/categories.ts
// Lean typed array of default categories — seeded for every new user.
// Keep this as a flat array. Do not expand into enums or metadata systems.

export type CategorySeed = {
  name: string;
  type: 'income' | 'expense' | 'savings';
  icon: string;
};

export const DEFAULT_CATEGORIES: CategorySeed[] = [
  // ── Income ──────────────────────────────────────
  { name: 'Salary',           type: 'income',  icon: 'salary'        },
  { name: 'Freelance',        type: 'income',  icon: 'freelance'     },
  { name: 'Business Income',  type: 'income',  icon: 'business'      },
  { name: 'Investments',      type: 'income',  icon: 'investment'    },
  { name: 'Rental Income',    type: 'income',  icon: 'rent'          },
  { name: 'Side Hustle',      type: 'income',  icon: 'side-hustle'   },
  { name: 'Gift / Bonus',     type: 'income',  icon: 'gift'          },

  // ── Expense ─────────────────────────────────────
  { name: 'Rent',             type: 'expense', icon: 'rent'          },
  { name: 'Food & Grocery',   type: 'expense', icon: 'groceries'     },
  { name: 'Transport',        type: 'expense', icon: 'transport'     },
  { name: 'Electricity',      type: 'expense', icon: 'electricity'   },
  { name: 'Water',            type: 'expense', icon: 'water'         },
  { name: 'Internet',         type: 'expense', icon: 'internet'      },
  { name: 'Phone / Airtime',  type: 'expense', icon: 'phone'         },
  { name: 'Eating Out',       type: 'expense', icon: 'cafe'          },
  { name: 'Entertainment',    type: 'expense', icon: 'entertainment' },
  { name: 'Health / Medical', type: 'expense', icon: 'health'        },
  { name: 'Gym',              type: 'expense', icon: 'gym'           },
  { name: 'Clothing',         type: 'expense', icon: 'clothing'      },
  { name: 'School Fees',      type: 'expense', icon: 'education'     },
  { name: 'Insurance',        type: 'expense', icon: 'insurance'     },
  { name: 'Loan Payment',     type: 'expense', icon: 'loan'          },
  { name: 'Subscriptions',    type: 'expense', icon: 'netflix'       },
  { name: 'Miscellaneous',    type: 'expense', icon: 'other'         },

  // ── Savings ─────────────────────────────────────
  { name: 'Savings Transfer', type: 'savings', icon: 'savings'       },
  { name: 'Emergency Fund',   type: 'savings', icon: 'emergency'     },
];
