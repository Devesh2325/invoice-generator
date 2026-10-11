import { z } from 'zod';
export declare const AddressSchema: z.ZodObject<{
    street1: z.ZodString;
    street2: z.ZodOptional<z.ZodString>;
    city: z.ZodString;
    state: z.ZodOptional<z.ZodString>;
    postalCode: z.ZodString;
    country: z.ZodString;
}, "strip", z.ZodTypeAny, {
    street1: string;
    city: string;
    postalCode: string;
    country: string;
    street2?: string | undefined;
    state?: string | undefined;
}, {
    street1: string;
    city: string;
    postalCode: string;
    country: string;
    street2?: string | undefined;
    state?: string | undefined;
}>;
export declare const PartySchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    type: z.ZodDefault<z.ZodEnum<["customer", "vendor"]>>;
    name: z.ZodString;
    email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    phone: z.ZodOptional<z.ZodString>;
    taxId: z.ZodOptional<z.ZodString>;
    billingAddress: z.ZodOptional<z.ZodObject<{
        street1: z.ZodString;
        street2: z.ZodOptional<z.ZodString>;
        city: z.ZodString;
        state: z.ZodOptional<z.ZodString>;
        postalCode: z.ZodString;
        country: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        street1: string;
        city: string;
        postalCode: string;
        country: string;
        street2?: string | undefined;
        state?: string | undefined;
    }, {
        street1: string;
        city: string;
        postalCode: string;
        country: string;
        street2?: string | undefined;
        state?: string | undefined;
    }>>;
    shippingAddress: z.ZodOptional<z.ZodObject<{
        street1: z.ZodString;
        street2: z.ZodOptional<z.ZodString>;
        city: z.ZodString;
        state: z.ZodOptional<z.ZodString>;
        postalCode: z.ZodString;
        country: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        street1: string;
        city: string;
        postalCode: string;
        country: string;
        street2?: string | undefined;
        state?: string | undefined;
    }, {
        street1: string;
        city: string;
        postalCode: string;
        country: string;
        street2?: string | undefined;
        state?: string | undefined;
    }>>;
    notes: z.ZodOptional<z.ZodString>;
    isArchived: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    type: "customer" | "vendor";
    name: string;
    isArchived: boolean;
    id?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    taxId?: string | undefined;
    billingAddress?: {
        street1: string;
        city: string;
        postalCode: string;
        country: string;
        street2?: string | undefined;
        state?: string | undefined;
    } | undefined;
    shippingAddress?: {
        street1: string;
        city: string;
        postalCode: string;
        country: string;
        street2?: string | undefined;
        state?: string | undefined;
    } | undefined;
    notes?: string | undefined;
}, {
    name: string;
    type?: "customer" | "vendor" | undefined;
    id?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    taxId?: string | undefined;
    billingAddress?: {
        street1: string;
        city: string;
        postalCode: string;
        country: string;
        street2?: string | undefined;
        state?: string | undefined;
    } | undefined;
    shippingAddress?: {
        street1: string;
        city: string;
        postalCode: string;
        country: string;
        street2?: string | undefined;
        state?: string | undefined;
    } | undefined;
    notes?: string | undefined;
    isArchived?: boolean | undefined;
}>;
export declare const DocumentLineItemSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    productId: z.ZodOptional<z.ZodString>;
    description: z.ZodString;
    quantity: z.ZodNumber;
    unitPrice: z.ZodNumber;
    discountType: z.ZodOptional<z.ZodEnum<["percentage", "fixed"]>>;
    discountValue: z.ZodOptional<z.ZodNumber>;
    taxRate: z.ZodOptional<z.ZodNumber>;
    taxInclusive: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    description: string;
    quantity: number;
    unitPrice: number;
    taxInclusive: boolean;
    id?: string | undefined;
    productId?: string | undefined;
    discountType?: "percentage" | "fixed" | undefined;
    discountValue?: number | undefined;
    taxRate?: number | undefined;
}, {
    description: string;
    quantity: number;
    unitPrice: number;
    id?: string | undefined;
    productId?: string | undefined;
    discountType?: "percentage" | "fixed" | undefined;
    discountValue?: number | undefined;
    taxRate?: number | undefined;
    taxInclusive?: boolean | undefined;
}>;
export declare const DocumentTypeEnum: z.ZodEnum<["invoice", "estimate", "purchase_order", "receipt", "credit_note", "debit_note", "pro_forma"]>;
export declare const DocumentStatusEnum: z.ZodEnum<["draft", "finalized", "sent", "partially_paid", "paid", "overdue", "cancelled", "archived"]>;
export declare const PaymentMethodEnum: z.ZodEnum<["cash", "bank_transfer", "cheque", "card", "other"]>;
export declare const PaymentSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    documentId: z.ZodString;
    amount: z.ZodNumber;
    paymentDate: z.ZodString;
    paymentMethod: z.ZodEnum<["cash", "bank_transfer", "cheque", "card", "other"]>;
    reference: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    documentId: string;
    amount: number;
    paymentDate: string;
    paymentMethod: "cash" | "bank_transfer" | "cheque" | "card" | "other";
    id?: string | undefined;
    notes?: string | undefined;
    reference?: string | undefined;
}, {
    documentId: string;
    amount: number;
    paymentDate: string;
    paymentMethod: "cash" | "bank_transfer" | "cheque" | "card" | "other";
    id?: string | undefined;
    notes?: string | undefined;
    reference?: string | undefined;
}>;
export declare const DocumentFormSchema: z.ZodObject<{
    type: z.ZodDefault<z.ZodEnum<["invoice", "estimate", "purchase_order", "receipt", "credit_note", "debit_note", "pro_forma"]>>;
    documentNumber: z.ZodString;
    referenceNumber: z.ZodOptional<z.ZodString>;
    issueDate: z.ZodString;
    dueDate: z.ZodOptional<z.ZodString>;
    currency: z.ZodDefault<z.ZodString>;
    sender: z.ZodObject<{
        name: z.ZodString;
        email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        phone: z.ZodOptional<z.ZodString>;
        taxId: z.ZodOptional<z.ZodString>;
        logoUrl: z.ZodOptional<z.ZodString>;
        address: z.ZodOptional<z.ZodObject<{
            street1: z.ZodString;
            street2: z.ZodOptional<z.ZodString>;
            city: z.ZodString;
            state: z.ZodOptional<z.ZodString>;
            postalCode: z.ZodString;
            country: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            street1: string;
            city: string;
            postalCode: string;
            country: string;
            street2?: string | undefined;
            state?: string | undefined;
        }, {
            street1: string;
            city: string;
            postalCode: string;
            country: string;
            street2?: string | undefined;
            state?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        email?: string | undefined;
        phone?: string | undefined;
        taxId?: string | undefined;
        logoUrl?: string | undefined;
        address?: {
            street1: string;
            city: string;
            postalCode: string;
            country: string;
            street2?: string | undefined;
            state?: string | undefined;
        } | undefined;
    }, {
        name: string;
        email?: string | undefined;
        phone?: string | undefined;
        taxId?: string | undefined;
        logoUrl?: string | undefined;
        address?: {
            street1: string;
            city: string;
            postalCode: string;
            country: string;
            street2?: string | undefined;
            state?: string | undefined;
        } | undefined;
    }>;
    client: z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        type: z.ZodDefault<z.ZodEnum<["customer", "vendor"]>>;
        name: z.ZodString;
        email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
        phone: z.ZodOptional<z.ZodString>;
        taxId: z.ZodOptional<z.ZodString>;
        billingAddress: z.ZodOptional<z.ZodObject<{
            street1: z.ZodString;
            street2: z.ZodOptional<z.ZodString>;
            city: z.ZodString;
            state: z.ZodOptional<z.ZodString>;
            postalCode: z.ZodString;
            country: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            street1: string;
            city: string;
            postalCode: string;
            country: string;
            street2?: string | undefined;
            state?: string | undefined;
        }, {
            street1: string;
            city: string;
            postalCode: string;
            country: string;
            street2?: string | undefined;
            state?: string | undefined;
        }>>;
        shippingAddress: z.ZodOptional<z.ZodObject<{
            street1: z.ZodString;
            street2: z.ZodOptional<z.ZodString>;
            city: z.ZodString;
            state: z.ZodOptional<z.ZodString>;
            postalCode: z.ZodString;
            country: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            street1: string;
            city: string;
            postalCode: string;
            country: string;
            street2?: string | undefined;
            state?: string | undefined;
        }, {
            street1: string;
            city: string;
            postalCode: string;
            country: string;
            street2?: string | undefined;
            state?: string | undefined;
        }>>;
        notes: z.ZodOptional<z.ZodString>;
        isArchived: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    }, "strip", z.ZodTypeAny, {
        type: "customer" | "vendor";
        name: string;
        isArchived: boolean;
        id?: string | undefined;
        email?: string | undefined;
        phone?: string | undefined;
        taxId?: string | undefined;
        billingAddress?: {
            street1: string;
            city: string;
            postalCode: string;
            country: string;
            street2?: string | undefined;
            state?: string | undefined;
        } | undefined;
        shippingAddress?: {
            street1: string;
            city: string;
            postalCode: string;
            country: string;
            street2?: string | undefined;
            state?: string | undefined;
        } | undefined;
        notes?: string | undefined;
    }, {
        name: string;
        type?: "customer" | "vendor" | undefined;
        id?: string | undefined;
        email?: string | undefined;
        phone?: string | undefined;
        taxId?: string | undefined;
        billingAddress?: {
            street1: string;
            city: string;
            postalCode: string;
            country: string;
            street2?: string | undefined;
            state?: string | undefined;
        } | undefined;
        shippingAddress?: {
            street1: string;
            city: string;
            postalCode: string;
            country: string;
            street2?: string | undefined;
            state?: string | undefined;
        } | undefined;
        notes?: string | undefined;
        isArchived?: boolean | undefined;
    }>;
    items: z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        productId: z.ZodOptional<z.ZodString>;
        description: z.ZodString;
        quantity: z.ZodNumber;
        unitPrice: z.ZodNumber;
        discountType: z.ZodOptional<z.ZodEnum<["percentage", "fixed"]>>;
        discountValue: z.ZodOptional<z.ZodNumber>;
        taxRate: z.ZodOptional<z.ZodNumber>;
        taxInclusive: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        quantity: number;
        unitPrice: number;
        taxInclusive: boolean;
        id?: string | undefined;
        productId?: string | undefined;
        discountType?: "percentage" | "fixed" | undefined;
        discountValue?: number | undefined;
        taxRate?: number | undefined;
    }, {
        description: string;
        quantity: number;
        unitPrice: number;
        id?: string | undefined;
        productId?: string | undefined;
        discountType?: "percentage" | "fixed" | undefined;
        discountValue?: number | undefined;
        taxRate?: number | undefined;
        taxInclusive?: boolean | undefined;
    }>, "many">;
    documentDiscountType: z.ZodOptional<z.ZodEnum<["percentage", "fixed"]>>;
    documentDiscountValue: z.ZodOptional<z.ZodNumber>;
    shippingFee: z.ZodOptional<z.ZodNumber>;
    extraCharges: z.ZodOptional<z.ZodNumber>;
    templateId: z.ZodDefault<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    paymentTerms: z.ZodOptional<z.ZodString>;
    paymentInstructions: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "invoice" | "estimate" | "purchase_order" | "receipt" | "credit_note" | "debit_note" | "pro_forma";
    documentNumber: string;
    issueDate: string;
    currency: string;
    sender: {
        name: string;
        email?: string | undefined;
        phone?: string | undefined;
        taxId?: string | undefined;
        logoUrl?: string | undefined;
        address?: {
            street1: string;
            city: string;
            postalCode: string;
            country: string;
            street2?: string | undefined;
            state?: string | undefined;
        } | undefined;
    };
    client: {
        type: "customer" | "vendor";
        name: string;
        isArchived: boolean;
        id?: string | undefined;
        email?: string | undefined;
        phone?: string | undefined;
        taxId?: string | undefined;
        billingAddress?: {
            street1: string;
            city: string;
            postalCode: string;
            country: string;
            street2?: string | undefined;
            state?: string | undefined;
        } | undefined;
        shippingAddress?: {
            street1: string;
            city: string;
            postalCode: string;
            country: string;
            street2?: string | undefined;
            state?: string | undefined;
        } | undefined;
        notes?: string | undefined;
    };
    items: {
        description: string;
        quantity: number;
        unitPrice: number;
        taxInclusive: boolean;
        id?: string | undefined;
        productId?: string | undefined;
        discountType?: "percentage" | "fixed" | undefined;
        discountValue?: number | undefined;
        taxRate?: number | undefined;
    }[];
    templateId: string;
    notes?: string | undefined;
    referenceNumber?: string | undefined;
    dueDate?: string | undefined;
    documentDiscountType?: "percentage" | "fixed" | undefined;
    documentDiscountValue?: number | undefined;
    shippingFee?: number | undefined;
    extraCharges?: number | undefined;
    paymentTerms?: string | undefined;
    paymentInstructions?: string | undefined;
}, {
    documentNumber: string;
    issueDate: string;
    sender: {
        name: string;
        email?: string | undefined;
        phone?: string | undefined;
        taxId?: string | undefined;
        logoUrl?: string | undefined;
        address?: {
            street1: string;
            city: string;
            postalCode: string;
            country: string;
            street2?: string | undefined;
            state?: string | undefined;
        } | undefined;
    };
    client: {
        name: string;
        type?: "customer" | "vendor" | undefined;
        id?: string | undefined;
        email?: string | undefined;
        phone?: string | undefined;
        taxId?: string | undefined;
        billingAddress?: {
            street1: string;
            city: string;
            postalCode: string;
            country: string;
            street2?: string | undefined;
            state?: string | undefined;
        } | undefined;
        shippingAddress?: {
            street1: string;
            city: string;
            postalCode: string;
            country: string;
            street2?: string | undefined;
            state?: string | undefined;
        } | undefined;
        notes?: string | undefined;
        isArchived?: boolean | undefined;
    };
    items: {
        description: string;
        quantity: number;
        unitPrice: number;
        id?: string | undefined;
        productId?: string | undefined;
        discountType?: "percentage" | "fixed" | undefined;
        discountValue?: number | undefined;
        taxRate?: number | undefined;
        taxInclusive?: boolean | undefined;
    }[];
    type?: "invoice" | "estimate" | "purchase_order" | "receipt" | "credit_note" | "debit_note" | "pro_forma" | undefined;
    notes?: string | undefined;
    referenceNumber?: string | undefined;
    dueDate?: string | undefined;
    currency?: string | undefined;
    documentDiscountType?: "percentage" | "fixed" | undefined;
    documentDiscountValue?: number | undefined;
    shippingFee?: number | undefined;
    extraCharges?: number | undefined;
    templateId?: string | undefined;
    paymentTerms?: string | undefined;
    paymentInstructions?: string | undefined;
}>;
export type DocumentFormData = z.infer<typeof DocumentFormSchema>;
