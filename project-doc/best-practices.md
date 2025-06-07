# 🤖 Implementation Guidelines & Best Practices for GeoScope

This document outlines development rules, constraints, and patterns for an LLM agent implementing this fullstack project.

## 🧰 Tech Stack Summary

| Layer        | Stack                                           |
|--------------|-------------------------------------------------|
| Frontend     | React + TypeScript + Vite + TailwindCSS v4.0    |
| UI Library   | shadcn/ui (Radix-based components)              |
| Backend      | Node.js + Express + tRPC                        |
| Database     | PostgreSQL via Railway                          |
| Auth         | Supabase Auth                                   |
| Realtime     | Socket.IO                                       |
| Testing      | Vitest + Testing Library + Playwright (optional)|
| Environment  | Local dev on Windows (PowerShell compatible)    |


 ✅ Always assume **PowerShell** as CLI (no `&&`, use `;` or multiple lines)
- ✅ Always **type all code strictly** in TypeScript
- ✅ Use `.env.local` for real secrets but **never write them into code** (the file will be stored outside of the project) Ask Senior developer to add\remove\update data there
- ✅ Match file/folder structure with current project layout exactly

