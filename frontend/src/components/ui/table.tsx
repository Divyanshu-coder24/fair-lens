import * as React from "react";
import { cn } from "@/lib/utils";

const Table = ({ className, ...p }: React.ComponentProps<"table">) =>
  <div data-slot="table-container" className="relative w-full overflow-x-auto"><table data-slot="table" className={cn("w-full caption-bottom text-sm", className)} {...p} /></div>;
const TableHeader = ({ className, ...p }: React.ComponentProps<"thead">) => <thead className={cn("[&_tr]:border-b", className)} {...p} />;
const TableBody = ({ className, ...p }: React.ComponentProps<"tbody">) => <tbody className={cn("[&_tr:last-child]:border-0", className)} {...p} />;
const TableRow = ({ className, ...p }: React.ComponentProps<"tr">) => <tr className={cn("hover:bg-muted/50 border-b transition-colors", className)} {...p} />;
const TableHead = ({ className, ...p }: React.ComponentProps<"th">) => <th className={cn("text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap", className)} {...p} />;
const TableCell = ({ className, ...p }: React.ComponentProps<"td">) => <td className={cn("p-2 align-middle whitespace-nowrap", className)} {...p} />;
export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
