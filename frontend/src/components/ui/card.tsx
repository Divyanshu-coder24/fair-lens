import * as React from "react";
import { cn } from "@/lib/utils";

const Card = ({ className, ...p }: React.ComponentProps<"div">) =>
  <div data-slot="card" className={cn("bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm", className)} {...p} />;
const CardHeader = ({ className, ...p }: React.ComponentProps<"div">) =>
  <div data-slot="card-header" className={cn("grid auto-rows-min items-start gap-1.5 px-6", className)} {...p} />;
const CardTitle = ({ className, ...p }: React.ComponentProps<"div">) =>
  <div data-slot="card-title" className={cn("leading-none font-semibold", className)} {...p} />;
const CardDescription = ({ className, ...p }: React.ComponentProps<"div">) =>
  <div data-slot="card-description" className={cn("text-muted-foreground text-sm", className)} {...p} />;
const CardContent = ({ className, ...p }: React.ComponentProps<"div">) =>
  <div data-slot="card-content" className={cn("px-6", className)} {...p} />;
const CardFooter = ({ className, ...p }: React.ComponentProps<"div">) =>
  <div data-slot="card-footer" className={cn("flex items-center px-6", className)} {...p} />;

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
