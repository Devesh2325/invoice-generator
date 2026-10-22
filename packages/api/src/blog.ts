import { BlogPost } from '@invoice/core';

export const SEEDED_BLOG_POSTS: BlogPost[] = [
  {
    id: 'post_gst_guide_2026',
    slug: 'gst-invoicing-rules-india-guide',
    title: 'The Complete Guide to GST Invoicing for Indian Businesses in 2026',
    excerpt:
      'Master CGST, SGST, IGST rules, HSN/SAC classification, intra vs. inter-state supply, and mandatory invoice compliance.',
    category: 'GST & Taxes',
    tags: ['GST', 'India', 'Taxes', 'Compliance', 'Invoicing'],
    author: {
      name: 'Aditya Sharma',
      role: 'Head of Tax & Financial Policy',
    },
    publishedAt: '2026-03-15',
    updatedAt: '2026-04-01',
    readingTimeMinutes: 6,
    isPublished: true,
    featured: true,
    seo: {
      metaTitle: 'GST Invoicing Guide 2026 — Clear Rules for Indian Businesses',
      metaDescription:
        'Learn how to properly calculate CGST, SGST, IGST, place of supply rules, and mandatory invoice particulars under India GST.',
      keywords: ['gst invoice format', 'cgst sgst igst difference', 'place of supply gst'],
    },
    content: `
# The Complete Guide to GST Invoicing for Indian Businesses in 2026

Under the Indian Goods and Services Tax (GST) framework, a tax invoice is more than just a payment demand — it is a legal document required for claiming **Input Tax Credit (ITC)**.

Whether you operate a freelance consultancy, creative studio, software agency, or retail distributor, issuing compliant GST invoices ensures you and your clients stay fully compliant with the GST Council regulations.

---

## 1. Intra-State vs. Inter-State Supply: How Tax is Split

The most common area of confusion is whether to charge **CGST + SGST** or **IGST**. The rule is determined by comparing two factors:

1. **Location of Supplier:** The state where your business is registered (e.g. 27 - Maharashtra).
2. **Place of Supply:** Typically the state where the recipient is located or where goods are delivered.

### When to Charge CGST + SGST (Intra-State)
When Supplier State == Recipient State:
- The total GST rate is divided equally between the Central Government (CGST) and the State Government (SGST).
- *Example:* On an 18% GST item priced at ₹10,000 in Mumbai billed to Pune:
  - CGST (9%): ₹900
  - SGST (9%): ₹900
  - Total Invoice: ₹11,800

### When to Charge IGST (Inter-State)
When Supplier State != Recipient State:
- The full tax rate is collected as Integrated GST (IGST) by the Central Government.
- *Example:* On an 18% GST item billed from Maharashtra (27) to Karnataka (29):
  - IGST (18%): ₹1,800
  - Total Invoice: ₹11,800

---

## 2. Mandatory Fields on a Tax Invoice

Under Section 31 of the CGST Act, your invoice must clearly feature:

- **Consecutive Serial Number:** Containing only alphabets, numerals, and special characters (hyphen \`-\` or slash \`/\`), unique for each financial year.
- **Date of Issue**
- **Supplier Details:** Name, Address, and 15-digit GSTIN.
- **Recipient Details:** Name, Address, and GSTIN (if registered) or PAN/State code.
- **Place of Supply:** Along with the state name and 2-digit state code.
- **HSN / SAC Code:** 4-digit code for goods, 6-digit SAC for services.
- **Description, Quantity, Unit Price, and Taxable Value.**
- **Tax Breakdown:** Separate columns for Taxable Value, CGST, SGST, and IGST.
- **Total Amount and Round-Off Adjustment.**
- **Digital or Physical Signature** of authorized representative.

---

## 3. How BillCraft Automates GST Compliance

With BillCraft, you never have to manually calculate intra-state or inter-state taxes. 

When you select your state and your client's state from the verified Indian States dropdown:
1. The system **automatically detects intra-state vs inter-state supply**.
2. It populates separate CGST & SGST or IGST columns on the invoice table.
3. It prints the official 2-digit state code (e.g. \`27 - Maharashtra\`) on the PDF.
4. Generates a verified scannable **UPI QR code** for instantaneous zero-fee payment settlement.
`,
  },
  {
    id: 'post_upi_qr_payments',
    slug: 'setup-verified-upi-qr-instant-payments',
    title: 'How to Collect Instant Customer Payments Using Verified UPI QR Codes',
    excerpt:
      'Eliminate payment delays and gateway fees by adding real ISO/IEC 18004 compliant UPI QR codes directly onto your invoices.',
    category: 'Fintech & Payments',
    tags: ['UPI', 'Payments', 'QR Code', 'NPCI', 'Fintech'],
    author: {
      name: 'Priya Nambiar',
      role: 'Fintech Systems Architect',
    },
    publishedAt: '2026-03-22',
    updatedAt: '2026-04-05',
    readingTimeMinutes: 5,
    isPublished: true,
    featured: false,
    seo: {
      metaTitle: 'Verified UPI QR Codes on Invoices — Instant Zero-Fee Payments',
      metaDescription:
        'Learn how UPI deep links and dynamic QR codes allow clients to scan with PhonePe, Google Pay, or Paytm and pay instantly.',
      keywords: ['upi qr code invoice', 'upi deep link payments', 'scan and pay invoice'],
    },
    content: `
# How to Collect Instant Customer Payments Using Verified UPI QR Codes

In 2026, over 80% of digital transactions across Indian businesses occur through the Unified Payments Interface (UPI). Yet many businesses still print static bank account numbers that force clients to manually add beneficiaries, wait for cooling periods, and manually key in transaction amounts.

Adding a **dynamic, verified UPI QR code** to your invoices allows clients to scan and approve payments in under 5 seconds.

---

## 1. How UPI Deep Linking Works

Under the National Payments Corporation of India (NPCI) specification, a standardized URI format is used:

\`\`\`
upi://pay?pa=merchant@bank&pn=MerchantName&am=15000.00&cu=INR&tn=INV-2026-00101
\`\`\`

When a smartphone camera or payment app (Google Pay, PhonePe, Paytm, CRED, BHIM) scans this payload:
- **pa (Payee Address):** The exact VPA receiving funds.
- **pn (Payee Name):** The legal registered business name displayed for verification.
- **am (Amount):** Pre-fills the exact remaining balance due so customers cannot underpay or overpay.
- **cu (Currency):** Defaults to \`INR\`.
- **tn (Transaction Note):** Pre-fills the Invoice Number in the transaction remarks for effortless reconciliation.

---

## 2. Why Real ISO/IEC 18004 Encoding Matters

Many naive invoice tools simply draw decorative squares or generate low-resolution raster images that fail to scan under dim lighting or when printed on monochrome laser printers.

BillCraft embeds a full **ISO/IEC 18004 QR encoder** with **Reed-Solomon Error Correction**:
- High-contrast SVG vector rendering that remains razor-sharp at any zoom or print scale.
- 15% error correction margin: scannable even if the printed invoice has light fold marks or creases.
- Strict format validation preventing broken or fraudulent VPAs from ever generating an invalid code.

---

## 3. Best Practices for Faster Invoice Settlement

1. **Keep the QR Code prominently displayed** in the invoice footer or right next to the total balance due.
2. **Include bank details alongside:** Some enterprise accounts prefer NEFT/RTGS; providing both gives clients full flexibility.
3. **Set payment terms clearly:** Net 7 or Net 15 days, with automatic reminders for overdue payments.
`,
  },
  {
    id: 'post_invoices_vs_estimates_pos',
    slug: 'invoices-vs-estimates-vs-purchase-orders-guide',
    title: 'Estimates vs. Invoices vs. Purchase Orders: The Complete Business Guide',
    excerpt:
      'Understand the legal and operational differences between quotes, estimates, purchase orders, and final tax invoices.',
    category: 'Billing Guides',
    tags: ['Invoices', 'Estimates', 'Purchase Orders', 'Accounting', 'Workflow'],
    author: {
      name: 'Marcus Vance',
      role: 'Operations & Procurement Specialist',
    },
    publishedAt: '2026-03-29',
    updatedAt: '2026-04-08',
    readingTimeMinutes: 7,
    isPublished: true,
    featured: false,
    seo: {
      metaTitle: 'Estimates vs Invoices vs Purchase Orders Explained',
      metaDescription:
        'A comprehensive guide on when to issue a quote, purchase order, pro forma, or final tax invoice in your sales cycle.',
      keywords: ['estimate vs invoice', 'purchase order workflow', 'pro forma vs tax invoice'],
    },
    content: `
# Estimates vs. Invoices vs. Purchase Orders: The Complete Business Guide

Every transaction follows a lifecycle: from pitching the project to confirming the scope, delivering the work, and collecting payment. Using the right document at each stage prevents scope disputes, ensures legal protection, and streamlines bookkeeping.

---

## 1. Estimate / Quote (EST-)
- **Issued By:** Seller / Service Provider.
- **Purpose:** Proposed pricing and scope sent to the prospective client before work begins.
- **Legal Weight:** An offer, not a debt demand.
- **Key Fields:** "Valid Until" date, estimated line items, terms of scope.
- **Workflow in BillCraft:** With 1 click, you can convert an approved Estimate directly into a Tax Invoice without re-entering line items.

---

## 2. Purchase Order (PO-)
- **Issued By:** Buyer / Client.
- **Purpose:** Formal commercial authorization confirming the order and binding the buyer to purchase the listed goods or services.
- **Legal Weight:** Binding contract upon acceptance by the vendor.
- **Key Fields:** Vendor Name, Shipping Address ("Ship To"), Delivery Date, PO Number.

---

## 3. Pro Forma Invoice
- **Issued By:** Seller.
- **Purpose:** A preliminary bill sent prior to shipping or delivery, commonly used for advance payments or customs clearance.
- **Legal Weight:** Informational; does not register as formal accounts receivable.

---

## 4. Tax Invoice (INV-)
- **Issued By:** Seller.
- **Purpose:** Official, legally binding demand for payment once goods or services are delivered.
- **Legal Weight:** Creates an immediate account receivable; mandatory for tax deduction and input tax credit.
- **Key Fields:** Tax Breakdown, Payment Instructions, Due Date, Balance Due, Authorized Signatory.

---

## Document Type Comparison Summary

| Document | Issuer | Recipient | Binding? | Creates Tax Obligation? |
|---|---|---|---|---|
| **Estimate / Quote** | Seller | Buyer | No (until approved) | No |
| **Purchase Order** | Buyer | Seller | Yes (upon acceptance) | No |
| **Pro Forma** | Seller | Buyer | No | No |
| **Tax Invoice** | Seller | Buyer | Yes | Yes (GST / Sales Tax) |
`,
  },
];

export class BlogApi {
  private static getStorageKey(): string {
    return 'billcraft_blog_posts';
  }

  static getPosts(): BlogPost[] {
    if (typeof window === 'undefined') return SEEDED_BLOG_POSTS;
    try {
      const stored = localStorage.getItem(this.getStorageKey());
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to read blog posts from storage:', e);
    }
    // Initialize storage with seeds
    try {
      localStorage.setItem(this.getStorageKey(), JSON.stringify(SEEDED_BLOG_POSTS));
    } catch {}
    return SEEDED_BLOG_POSTS;
  }

  static getPublishedPosts(): BlogPost[] {
    return this.getPosts().filter((p) => p.isPublished);
  }

  static getPostBySlug(slug: string): BlogPost | undefined {
    return this.getPosts().find((p) => p.slug === slug);
  }

  static savePost(post: BlogPost): BlogPost {
    const posts = this.getPosts();
    const existingIndex = posts.findIndex((p) => p.id === post.id);
    let updated: BlogPost[];
    if (existingIndex >= 0) {
      updated = [...posts];
      updated[existingIndex] = { ...post, updatedAt: new Date().toISOString() };
    } else {
      updated = [
        {
          ...post,
          id: post.id || `post_${Date.now()}`,
          publishedAt: post.publishedAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        ...posts,
      ];
    }

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.getStorageKey(), JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('invoxa-blog-updated', { detail: { action: 'save', post } }));
      } catch (e) {
        console.error('Failed to save blog post to storage:', e);
      }
    }
    return post;
  }

  static deletePost(id: string): boolean {
    const posts = this.getPosts();
    const filtered = posts.filter((p) => p.id !== id);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.getStorageKey(), JSON.stringify(filtered));
        window.dispatchEvent(new CustomEvent('invoxa-blog-updated', { detail: { action: 'delete', id } }));
        return true;
      } catch (e) {
        console.error('Failed to delete blog post:', e);
      }
    }
    return false;
  }
}
