import { z } from 'zod';
export declare const ThemeTokensSchema: z.ZodObject<{
    primaryColor: z.ZodDefault<z.ZodString>;
    secondaryColor: z.ZodDefault<z.ZodString>;
    backgroundColor: z.ZodDefault<z.ZodString>;
    textColor: z.ZodDefault<z.ZodString>;
    subtextColor: z.ZodDefault<z.ZodString>;
    borderColor: z.ZodDefault<z.ZodString>;
    fontFamily: z.ZodDefault<z.ZodEnum<["sans", "serif", "mono"]>>;
    headerLayout: z.ZodDefault<z.ZodEnum<["split", "centered", "stacked", "banner", "grid", "sidebar"]>>;
    borderRadius: z.ZodDefault<z.ZodEnum<["none", "sm", "md", "lg"]>>;
}, "strip", z.ZodTypeAny, {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    subtextColor: string;
    borderColor: string;
    fontFamily: "sans" | "serif" | "mono";
    headerLayout: "split" | "centered" | "stacked" | "banner" | "grid" | "sidebar";
    borderRadius: "none" | "sm" | "md" | "lg";
}, {
    primaryColor?: string | undefined;
    secondaryColor?: string | undefined;
    backgroundColor?: string | undefined;
    textColor?: string | undefined;
    subtextColor?: string | undefined;
    borderColor?: string | undefined;
    fontFamily?: "sans" | "serif" | "mono" | undefined;
    headerLayout?: "split" | "centered" | "stacked" | "banner" | "grid" | "sidebar" | undefined;
    borderRadius?: "none" | "sm" | "md" | "lg" | undefined;
}>;
export type ThemeTokens = z.infer<typeof ThemeTokensSchema>;
export type TemplateCategory = 'gst_india' | 'modern' | 'corporate' | 'creative' | 'minimal';
export type StructuralLayout = 'classic' | 'modern' | 'minimal' | 'bold_header' | 'corporate' | 'creative' | 'compact' | 'elegant';
export interface DocumentTemplateMeta {
    id: string;
    name: string;
    competitorStyle: string;
    description: string;
    category: TemplateCategory;
    categoryLabel: string;
    layoutStyle: StructuralLayout;
    isPro?: boolean;
    defaultTokens: ThemeTokens;
}
export declare const TEMPLATE_CATEGORIES: {
    id: TemplateCategory;
    label: string;
}[];
export declare const TEMPLATES: Record<string, DocumentTemplateMeta>;
export declare function getTemplate(id: string): DocumentTemplateMeta;
export declare function getTemplatesByCategory(): {
    category: TemplateCategory;
    label: string;
    templates: DocumentTemplateMeta[];
}[];
