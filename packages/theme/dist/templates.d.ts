import { z } from 'zod';
export declare const ThemeTokensSchema: z.ZodObject<{
    primaryColor: z.ZodDefault<z.ZodString>;
    secondaryColor: z.ZodDefault<z.ZodString>;
    backgroundColor: z.ZodDefault<z.ZodString>;
    textColor: z.ZodDefault<z.ZodString>;
    subtextColor: z.ZodDefault<z.ZodString>;
    borderColor: z.ZodDefault<z.ZodString>;
    fontFamily: z.ZodDefault<z.ZodEnum<["sans", "serif", "mono"]>>;
    headerLayout: z.ZodDefault<z.ZodEnum<["split", "centered", "stacked"]>>;
    borderRadius: z.ZodDefault<z.ZodEnum<["none", "sm", "md", "lg"]>>;
}, "strip", z.ZodTypeAny, {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    subtextColor: string;
    borderColor: string;
    fontFamily: "sans" | "serif" | "mono";
    headerLayout: "split" | "centered" | "stacked";
    borderRadius: "none" | "sm" | "md" | "lg";
}, {
    primaryColor?: string | undefined;
    secondaryColor?: string | undefined;
    backgroundColor?: string | undefined;
    textColor?: string | undefined;
    subtextColor?: string | undefined;
    borderColor?: string | undefined;
    fontFamily?: "sans" | "serif" | "mono" | undefined;
    headerLayout?: "split" | "centered" | "stacked" | undefined;
    borderRadius?: "none" | "sm" | "md" | "lg" | undefined;
}>;
export type ThemeTokens = z.infer<typeof ThemeTokensSchema>;
export interface DocumentTemplateMeta {
    id: string;
    name: string;
    description: string;
    category: 'minimal' | 'modern' | 'corporate' | 'creative';
    defaultTokens: ThemeTokens;
}
export declare const TEMPLATES: Record<string, DocumentTemplateMeta>;
export declare function getTemplate(id: string): DocumentTemplateMeta;
