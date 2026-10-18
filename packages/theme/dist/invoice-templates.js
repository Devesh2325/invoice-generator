/**
 * invoice-templates.ts — 18 config-driven, print-ready (A4) invoice templates.
 * Zero external dependencies. Works in Node, browsers, React / Next.
 */
/* ---------- tiny helpers ---------- */
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c));
const nl = (s) => esc(s).replace(/\n/g, '<br/>');
const d = (style, html = '', cls = '') => `<div${cls ? ` class="${cls}"` : ''} style="${style}">${html}</div>`;
const lab = (text, style = '') => d('font-size:9px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;opacity:.6;margin-bottom:5px;' +
    style, esc(text));
const fmtDate = (v, loc) => {
    if (!v)
        return '';
    const iso = v instanceof Date || /^\d{4}-\d{2}-\d{2}/.test(String(v));
    try {
        return iso
            ? esc(new Intl.DateTimeFormat(loc, { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(v)))
            : esc(v);
    }
    catch {
        return esc(v);
    }
};
const PLACEHOLDER_QR = '<svg width="84" height="84" viewBox="0 0 90 90" role="img" aria-label="QR code placeholder">' +
    [[0, 0], [64, 0], [0, 64]]
        .map(([x, y]) => `<rect x="${x + 2}" y="${y + 2}" width="20" height="20" fill="none" stroke="currentColor" stroke-width="4"/><rect x="${x + 9}" y="${y + 9}" width="6" height="6" fill="currentColor"/>`)
        .join('') +
    [
        [32, 4], [44, 10], [32, 16], [60, 36], [32, 36], [44, 44], [56, 56],
        [66, 66], [38, 56], [26, 44], [4, 36], [14, 44], [70, 50], [50, 30],
    ]
        .map(([x, y]) => `<rect x="${x}" y="${y}" width="6" height="6" fill="currentColor"/>`)
        .join('') +
    '</svg>';
/* ---------- template presets ---------- */
const gf = (name, weights = '400;700;800', fallback = "'Helvetica Neue',Helvetica,sans-serif") => ({
    font: `'${name}',${fallback}`,
    googleFont: `${name.replace(/ /g, '+')}:wght@${weights}`,
});
const BASE = {
    font: "'Helvetica Neue',Helvetica,sans-serif",
    googleFont: '',
    accent: '#14181f',
    ink: '#14181f',
    paper: '#ffffff',
    line: '#e3e6ea',
    tint: '#f7f8fa',
    header: 'left',
    card: 'round',
    tableHead: 'rule',
    totals: 'bar',
    zebra: false,
    strip: false,
    locale: 'en-US',
    currency: '$',
    decimals: 2,
    roundOff: false,
    sign: 1,
    taxLabel: 'Tax',
    taxRate: 10,
    taxIdLabel: 'Tax ID',
    title: 'Tax Invoice',
    subtitle: '',
    badge: '',
    dueLabel: 'Due date',
    balanceLabel: 'Balance due',
    finalLabel: 'Final payable amount',
    routingLabel: 'SWIFT / BIC',
    vpaLabel: 'Payment reference',
    qrLabel: 'Scan to pay',
    terms: 'Payment due within 30 days of the invoice date.',
    note: '',
    supplyTitle: '',
    supplyFields: [],
    supplyLines: [],
    defaultNotes: [
        'Please quote the document number in your payment reference.',
        'Late payment may incur interest as permitted by local law.',
    ],
};
const T = (id, name, region, o) => ({
    id,
    name,
    region,
    ...BASE,
    ...o,
});
export const INVOICE_TEMPLATES = [
    T('in-gst', 'India GST (IGST)', 'IN', {
        currency: '₹',
        locale: 'en-IN',
        roundOff: true,
        taxLabel: 'IGST',
        taxRate: 18,
        taxIdLabel: 'GSTIN',
        badge: 'Original for recipient',
        routingLabel: 'IFSC',
        vpaLabel: 'UPI ID / VPA',
        qrLabel: 'Scan to pay (UPI)',
        terms: 'Payment due within 15 days.',
        supplyTitle: 'Inter-state supply (IGST applicable)',
        supplyFields: ['Supplier state', 'Place of supply'],
        strip: true,
    }),
    T('uk-vat', 'UK VAT', 'GB', {
        ...gf('Manrope'),
        currency: '£',
        taxLabel: 'VAT',
        taxRate: 20,
        taxIdLabel: 'VAT Reg No.',
        title: 'VAT Invoice',
        routingLabel: 'Sort code',
        header: 'band',
        card: 'box',
        tableHead: 'fill',
        accent: '#1d3557',
        zebra: true,
        supplyTitle: 'Standard-rated supply ({rate})',
        supplyFields: ['Tax point', 'Place of supply'],
    }),
    T('eu-reverse-charge', 'EU VAT (reverse charge)', 'EU', {
        ...gf('Source Serif 4', '400;700;800', 'Georgia,serif'),
        currency: '€',
        taxLabel: 'VAT',
        taxRate: 0,
        taxIdLabel: 'VAT ID',
        title: 'Invoice',
        routingLabel: 'IBAN / BIC',
        header: 'center',
        card: 'plain',
        totals: 'txt',
        accent: '#334155',
        supplyTitle: 'Intra-EU B2B supply — reverse charge',
        supplyLines: ['VAT to be accounted for by the recipient'],
        supplyFields: ['Customer VAT ID verified'],
        note: 'Reverse charge: VAT to be accounted for by the recipient (Art. 196, Directive 2006/112/EC).',
    }),
    T('us-sales-tax', 'US Sales Tax', 'US', {
        ...gf('DM Sans'),
        taxLabel: 'Sales tax',
        taxRate: 8.25,
        taxIdLabel: 'EIN',
        title: 'Invoice',
        routingLabel: 'ABA routing',
        vpaLabel: 'Payment link',
        card: 'fill',
        tableHead: 'tint',
        accent: '#0f766e',
        supplyTitle: 'Taxable sale',
        supplyFields: ['Ship-to state / county', 'Exemption certificate'],
    }),
    T('au-gst', 'Australia GST (ABN)', 'AU', {
        ...gf('Work Sans'),
        currency: 'A$',
        taxLabel: 'GST',
        taxRate: 10,
        taxIdLabel: 'ABN',
        routingLabel: 'BSB',
        vpaLabel: 'PayID',
        header: 'band',
        tableHead: 'fill',
        accent: '#166534',
        zebra: true,
        supplyTitle: 'Taxable supply — GST {rate}',
        supplyFields: ['Supplier ABN', 'Recipient ABN'],
    }),
    T('sg-gst', 'Singapore GST', 'SG', {
        ...gf('Sora'),
        currency: 'S$',
        taxLabel: 'GST',
        taxRate: 9,
        taxIdLabel: 'GST Reg No.',
        routingLabel: 'SWIFT / Bank code',
        vpaLabel: 'PayNow UEN',
        qrLabel: 'Scan to pay (PayNow)',
        header: 'big',
        card: 'box',
        totals: 'out',
        accent: '#be123c',
        supplyTitle: 'Standard-rated supply ({rate} GST)',
        supplyFields: ['UEN', 'Place of supply'],
    }),
    T('ae-vat', 'UAE VAT (bilingual)', 'AE', {
        ...gf('Outfit'),
        currency: 'AED ',
        taxLabel: 'VAT',
        taxRate: 5,
        taxIdLabel: 'TRN',
        subtitle: 'فاتورة ضريبية',
        routingLabel: 'IBAN',
        tableHead: 'fill',
        accent: '#0b3d4a',
        supplyTitle: 'Standard-rated supply ({rate} VAT)',
        supplyFields: ['Supplier TRN', 'Place of supply'],
    }),
    T('ca-hst', 'Canada GST/HST', 'CA', {
        ...gf('Libre Franklin'),
        currency: 'C$',
        taxLabel: 'HST',
        taxRate: 13,
        taxIdLabel: 'GST/HST No.',
        title: 'Invoice',
        routingLabel: 'Transit / Institution',
        vpaLabel: 'Interac e-Transfer',
        card: 'box',
        tableHead: 'tint',
        accent: '#4338ca',
        supplyTitle: 'Taxable supply — HST {rate}',
        supplyFields: ['Place of supply', 'Business No.'],
    }),
    T('za-vat', 'South Africa VAT', 'ZA', {
        ...gf('Public Sans'),
        currency: 'R ',
        taxLabel: 'VAT',
        taxRate: 15,
        taxIdLabel: 'VAT No.',
        routingLabel: 'Branch code',
        card: 'box',
        tableHead: 'fill',
        accent: '#a16207',
        zebra: true,
        supplyTitle: 'Standard-rated supply ({rate} VAT)',
        supplyFields: ['Supplier VAT No.', 'Place of supply'],
    }),
    T('jp-qualified', 'Japan Qualified Invoice', 'JP', {
        ...gf('Noto Sans JP', '400;700;800'),
        currency: '¥',
        decimals: 0,
        locale: 'ja-JP',
        taxLabel: 'Consumption tax',
        taxRate: 10,
        taxIdLabel: 'Reg. No. (T + 13 digits)',
        title: 'Qualified Invoice',
        subtitle: '適格請求書',
        routingLabel: 'Branch / account type',
        card: 'plain',
        totals: 'txt',
        accent: '#c1121f',
        supplyTitle: 'Standard rate {rate}',
        supplyFields: ['Registration No.', 'Place of supply'],
    }),
    T('dark-tech', 'Dark Mode Tech', 'ANY', {
        ...gf('JetBrains Mono', '400;700;800', "'Courier New',monospace"),
        paper: '#0e1116',
        ink: '#e6e9ef',
        tint: '#161a22',
        line: '#2a303b',
        accent: '#c6f432',
        tableHead: 'fill',
        supplyTitle: 'Software & services — standard rate',
        supplyFields: ['Reverse charge', 'Place of supply'],
    }),
    T('proforma', 'Proforma Invoice', 'ANY', {
        ...gf('Archivo'),
        currency: '€',
        taxLabel: 'VAT',
        taxRate: 21,
        taxIdLabel: 'VAT ID',
        title: 'Proforma Invoice',
        badge: 'Not a tax invoice',
        dueLabel: 'Valid until',
        balanceLabel: 'Amount payable in advance',
        header: 'band',
        card: 'fill',
        tableHead: 'tint',
        accent: '#b45309',
        supplyTitle: 'Issued prior to supply',
        supplyLines: ['Dispatch on receipt of payment'],
        supplyFields: ['Delivery terms'],
    }),
    T('credit-note', 'Credit Note', 'ANY', {
        ...gf('Source Sans 3'),
        currency: '£',
        taxLabel: 'VAT',
        taxRate: 20,
        taxIdLabel: 'VAT Reg No.',
        title: 'Credit Note',
        dueLabel: 'Original invoice',
        balanceLabel: 'Credit due',
        finalLabel: 'Total credit',
        sign: -1,
        card: 'box',
        totals: 'out',
        accent: '#7f1d1d',
        supplyTitle: 'Credit against an issued invoice',
        supplyFields: ['Original invoice', 'Reason', 'Applied to'],
    }),
    T('quotation', 'Quotation / Estimate', 'ANY', {
        ...gf('Figtree'),
        title: 'Quotation',
        dueLabel: 'Valid until',
        balanceLabel: 'Quote total',
        finalLabel: 'Total quoted',
        header: 'center',
        tableHead: 'tint',
        accent: '#1e40af',
        terms: 'This quotation is valid for 30 days. Sign and return to accept.',
        supplyTitle: 'Estimate — not a tax invoice',
        supplyLines: ['Sign and return to confirm acceptance'],
        supplyFields: ['Lead time'],
    }),
    T('ch-sidebar', 'Switzerland VAT (sidebar)', 'CH', {
        ...gf('IBM Plex Sans', '400;700'),
        currency: 'CHF ',
        locale: 'de-CH',
        taxLabel: 'VAT',
        taxRate: 8.1,
        taxIdLabel: 'UID / MWST-Nr.',
        title: 'Invoice',
        routingLabel: 'IBAN / BIC',
        vpaLabel: 'QR-bill reference',
        qrLabel: 'Swiss QR-bill',
        header: 'side',
        accent: '#1f2937',
        supplyTitle: 'Standard rate {rate}',
        supplyFields: ['Place of supply'],
    }),
    T('nz-gst', 'New Zealand GST', 'NZ', {
        ...gf('Plus Jakarta Sans'),
        currency: 'NZ$',
        taxLabel: 'GST',
        taxRate: 15,
        taxIdLabel: 'GST No.',
        routingLabel: 'Bank / Branch',
        header: 'band',
        tableHead: 'fill',
        accent: '#c2410c',
        zebra: true,
        supplyTitle: 'Taxable supply — GST {rate}',
        supplyFields: ['Place of supply'],
    }),
    T('mx-iva', 'Mexico IVA (Factura)', 'MX', {
        ...gf('Space Grotesk', '400;700'),
        currency: 'MX$',
        taxLabel: 'IVA',
        taxRate: 16,
        taxIdLabel: 'RFC',
        title: 'Factura',
        subtitle: 'Invoice',
        routingLabel: 'CLABE',
        vpaLabel: 'Referencia',
        header: 'big',
        card: 'box',
        tableHead: 'fill',
        accent: '#a21caf',
        supplyTitle: 'IVA {rate} — tasa general',
        supplyFields: ['Uso de CFDI', 'Método de pago'],
    }),
    T('hk-no-tax', 'Hong Kong (no sales tax)', 'HK', {
        ...gf('Lora', '400;700', 'Georgia,serif'),
        currency: 'HK$',
        taxRate: 0,
        taxIdLabel: 'BR No.',
        title: 'Invoice',
        routingLabel: 'SWIFT / FPS ID',
        vpaLabel: 'FPS ID',
        header: 'center',
        card: 'plain',
        totals: 'txt',
        accent: '#581c87',
        supplyTitle: 'No sales tax / VAT applies',
        supplyFields: ['Place of supply'],
    }),
];
const ALIAS_MAP = {
    cleartax_gst: 'in-gst',
    tally_prime: 'in-gst',
    vyapar_classic: 'in-gst',
    modern: 'in-gst',
    stripe_fintech: 'dark-tech',
    stripe_clean: 'dark-tech',
    classic: 'eu-reverse-charge',
    bold_header: 'uk-vat',
    corporate: 'au-gst',
    professional: 'au-gst',
    creative: 'ca-hst',
    canva_studio: 'ca-hst',
    minimal: 'hk-no-tax',
    compact: 'ch-sidebar',
    retail: 'ch-sidebar',
    elegant: 'eu-reverse-charge',
    zoho_gst: 'in-gst',
    zoho_standard: 'sg-gst',
    freshbooks_classic: 'ca-hst',
    freshbooks_cloud: 'ca-hst',
    quickbooks_enterprise: 'us-sales-tax',
    dribbble_bold: 'ca-hst',
    behance_dark: 'dark-tech',
    apple_clean: 'hk-no-tax',
    notion_minimal: 'hk-no-tax',
    medical_rx: 'uk-vat',
    logistics_waybill: 'au-gst',
    retail_pos: 'ch-sidebar',
    service_business: 'us-sales-tax',
};
export const getInvoiceTemplate = (id) => {
    const targetId = id ? (ALIAS_MAP[id] || id) : 'in-gst';
    const t = INVOICE_TEMPLATES.find((x) => x.id === targetId);
    return t || INVOICE_TEMPLATES[0];
};
export const listTemplates = () => INVOICE_TEMPLATES.map(({ id, name, region }) => ({ id, name, region }));
/* ---------- calculations (single source of truth for every template) ---------- */
export function computeTotals(inv, tpl) {
    const t = typeof tpl === 'string' ? getInvoiceTemplate(tpl) : tpl;
    const dp = inv.decimals ?? t.decimals, p = 10 ** dp;
    const r = (v) => Math.round((v + Number.EPSILON) * p) / p;
    const defRate = inv.taxRate ?? t.taxRate;
    const lines = (inv.items || []).map((it) => {
        const qty = +it.qty || 0, rate = +it.rate || 0, dis = +it.discountPct || 0, tr = +(it.taxRate ?? defRate);
        const gross = r(qty * rate), taxable = r(gross * (1 - dis / 100)), tax = r((taxable * tr) / 100);
        return { ...it, qty, rate, dis, tr, gross, taxable, tax, total: r(taxable + tax) };
    });
    const sum = (k) => r(lines.reduce((a, l) => a + l[k], 0));
    const gross = sum('gross'), taxable = sum('taxable'), tax = sum('tax'), total = r(taxable + tax);
    const final = (inv.roundOff ?? t.roundOff) ? Math.round(total) : total;
    const paid = r(+inv.amountPaid || 0);
    const groups = {};
    lines.forEach((l) => {
        const g = (groups[l.tr] ??= { rate: l.tr, taxable: 0, tax: 0 });
        g.taxable = r(g.taxable + l.taxable);
        g.tax = r(g.tax + l.tax);
    });
    return {
        lines,
        gross,
        discount: r(gross - taxable),
        taxable,
        tax,
        total,
        roundOff: r(final - total),
        final,
        paid,
        balance: r(final - paid),
        groups: Object.values(groups).sort((a, b) => a.rate - b.rate),
    };
}
/* ---------- building blocks ---------- */
const card = (x, html, extra = '') => d({
    round: `border:1px solid ${x.t.line};border-radius:10px;padding:14px;background:${x.t.tint};`,
    box: `border:1px solid ${x.t.ink};padding:12px;`,
    plain: `border-top:2px solid ${x.t.accent};padding:10px 0 0;`,
    fill: `background:${x.t.tint};border-radius:4px;padding:14px;`,
}[x.t.card] + 'box-sizing:border-box;overflow:visible;word-break:break-word;' + extra, html, 'inv-card');
const party = (x, p = {}, size) => {
    const addr = []
        .concat(p.address || [])
        .flatMap((s) => String(s).split('\n'))
        .filter(Boolean)
        .map(esc)
        .join('<br/>');
    const rows = [
        addr,
        p.email && `<b>Email:</b> ${esc(p.email)}`,
        p.phone && `<b>Phone:</b> ${esc(p.phone)}`,
        p.taxId && `<b>${esc(p.taxIdLabel ?? x.t.taxIdLabel)}:</b> ${esc(p.taxId)}`,
        ...(p.extra || []).map(esc),
    ]
        .filter(Boolean)
        .join('<br/>');
    const logo = p.logoUrl
        ? `<img src="${esc(p.logoUrl)}" alt="" style="display:block;max-height:44px;max-width:170px;margin-bottom:8px">`
        : '';
    return d('font-size:11px;line-height:1.6;', logo +
        d(`font-size:${size}px;font-weight:800;margin-bottom:4px;`, esc(p.name)) +
        rows);
};
const heading = (x, align = 'right', size = 30, color) => {
    const { inv, t } = x, badge = inv.badge ?? t.badge, sub = inv.subtitle ?? t.subtitle;
    return d(`text-align:${align};`, (badge
        ? d('display:inline-block;font-size:9px;letter-spacing:.14em;font-weight:700;padding:4px 10px;border-radius:99px;border:1px solid currentColor;margin-bottom:8px;opacity:.8;', esc(badge).toUpperCase())
        : '') +
        d(`font-size:${size}px;font-weight:800;letter-spacing:-.01em;line-height:1.05;color:${color || t.accent};`, esc(inv.title ?? t.title)) +
        (sub
            ? d('font-size:13px;opacity:.75;margin-top:2px;', `<span dir="auto">${esc(sub)}</span>`)
            : ''));
};
const meta = (x, align = 'right') => {
    const { inv, t, loc } = x;
    return d(`text-align:${align};font-size:11px;line-height:1.7;margin-top:6px;`, d('font-size:15px;font-weight:800;', '#' + esc(inv.number)) +
        `Issue date: <b>${fmtDate(inv.issueDate, loc)}</b>` +
        (inv.dueDate
            ? `<br/>${esc(inv.dueLabel ?? t.dueLabel)}: <b>${fmtDate(inv.dueDate, loc)}</b>`
            : ''));
};
const supply = (x) => {
    const { inv, t, C, m } = x, s = inv.supply || {};
    const rates = [...new Set(C.lines.map((l) => Number(l.tr)))];
    const title = (s.title ?? t.supplyTitle).replace('{rate}', rates.length === 1 ? `${rates[0]}%` : 'mixed rates');
    const info = [
        ...(t.supplyFields || [])
            .filter((k) => s.fields?.[k])
            .map((k) => `${esc(k)}: <b>${esc(s.fields[k])}</b>`),
        ...[...(t.supplyLines || []), ...(s.lines || [])].map(esc),
    ];
    return card(x, lab('Tax & supply details') +
        d('font-size:11px;line-height:1.7;', (title ? d('font-weight:700;', esc(title)) : '') +
            info.map((i) => d('', i)).join('')) +
        d(`display:flex;justify-content:space-between;align-items:baseline;border-top:1px solid ${t.line};margin-top:12px;padding-top:12px;`, lab(inv.balanceLabel ?? t.balanceLabel, 'margin:0') +
            d('font-size:22px;font-weight:800;', m(C.balance))), 'display:flex;flex-direction:column;justify-content:space-between;');
};
const table = (x, narrow = false) => {
    const { t, C, m } = x, a = t.accent;
    const ix = narrow ? [0, 1, 3, 4, 6, 7, 8] : [0, 1, 2, 3, 4, 5, 6, 7, 8];
    const grid = (narrow
        ? ['18px', '2.6fr', '.45fr', '1fr', '1fr', '.9fr', '1.1fr']
        : ['20px', '3.3fr', '.9fr', '.45fr', '1fr', '.6fr', '1fr', '.9fr', '1.1fr']).join(' ');
    const head = {
        rule: `border-bottom:2px solid ${t.ink};`,
        fill: `background:${a};color:${t.paper};`,
        tint: `background:${t.tint};color:${a};border-bottom:2px solid ${a};`,
        box: `border:1px solid ${t.ink};`,
    }[t.tableHead] +
        'font-size:9px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;';
    const left = narrow ? 2 : 3;
    const row = (cells, style, cls = '') => d(`display:grid;grid-template-columns:${grid};gap:6px;align-items:center;font-size:10px;padding:8px 6px;${style}`, ix
        .map((k) => cells[k])
        .map((c, j) => d(j >= left ? 'text-align:right;' : '', c))
        .join(''), cls);
    const H = ['#', 'Item description', 'Code', 'Qty', 'Rate', 'Disc', 'Taxable', t.taxLabel, 'Total'].map(esc);
    return d('', row(H, head, '') +
        C.lines
            .map((l, i) => row([
            i + 1,
            nl(l.description),
            esc(l.code ?? '—'),
            +l.qty,
            m(l.rate, false),
            l.dis ? `${+l.dis}%` : '—',
            m(l.taxable),
            `${m(l.tax)}<br/><span style="font-size:8px;opacity:.6">(${+l.tr}%)</span>`,
            `<b>${m(l.total)}</b>`,
        ], `border-bottom:1px solid ${t.line};${t.zebra && i % 2 === 0 ? `background:${t.tint};` : ''}`, 'inv-row'))
            .join(''));
};
const taxSummary = (x) => {
    const { t, C, m } = x;
    const g = 'display:grid;grid-template-columns:repeat(4,1fr);font-size:10px;text-align:right;gap:6px;';
    return card(x, lab('Tax summary breakdown') +
        d(g + `font-weight:700;opacity:.65;font-size:9px;padding-bottom:4px;border-bottom:1px solid ${t.line};`, ['Taxable value', `${t.taxLabel} %`, `${t.taxLabel} amount`, 'Total tax']
            .map((h) => d('', esc(h)))
            .join('')) +
        C.groups
            .map((r) => d(g + 'padding-top:6px;', [m(r.taxable), `${+r.rate}%`, m(r.tax), m(r.tax)].map((v) => d('', v)).join('')))
            .join(''));
};
const totals = (x) => {
    const { inv, t, C, m } = x, a = t.accent;
    const rows = [
        ['Subtotal (gross)', m(C.gross)],
        C.discount > 0 && ['Discount', m(-C.discount)],
        ['Taxable amount', m(C.taxable)],
        [`${t.taxLabel} total`, m(C.tax)],
        C.roundOff !== 0 && ['Round-off', m(C.roundOff)],
        C.paid > 0 && ['Amount paid', m(-C.paid)],
    ].filter(Boolean);
    const bar = {
        bar: `background:${a};color:${t.paper};padding:14px 16px;border-radius:8px;`,
        out: `border:2px solid ${a};color:${a};padding:12px 14px;`,
        txt: `border-top:2px solid ${t.ink};color:${a};padding-top:10px;`,
    }[t.totals] || '';
    return card(x, rows
        .map(([k, v]) => d('display:flex;justify-content:space-between;font-size:11px;padding:4px 0;', d('', esc(k)) + d('', v)))
        .join('') +
        d('display:flex;justify-content:space-between;align-items:center;margin-top:8px;font-weight:800;' +
            bar, d('font-size:11px;', esc(inv.finalLabel ?? t.finalLabel)) +
            d('font-size:18px;', m(C.final))));
};
const bank = (x, narrow = false) => {
    const { inv, t, opts } = x, p = inv.payment;
    if (!p)
        return '';
    const f = (k, v) => v ? d('', d('font-size:9px;opacity:.6;', esc(k)) + d('font-weight:700;', esc(v))) : '';
    // Render real vector QR (if SVG string) or image/dataURL
    const isSvg = typeof p.qrImage === 'string' && p.qrImage.trim().startsWith('<svg');
    const qr = p.qrImage
        ? isSvg
            ? p.qrImage
            : `<img src="${esc(p.qrImage)}" width="84" height="84" alt="Payment QR code" style="display:block">`
        : opts.preview
            ? PLACEHOLDER_QR
            : '';
    const qrBox = qr
        ? d(`width:104px;flex:none;box-sizing:border-box;border:1px solid ${t.line};border-radius:8px;padding:10px 6px;font-size:8px;letter-spacing:.1em;text-transform:uppercase;text-align:center;display:flex;flex-direction:column;align-items:center;gap:6px;`, qr + `<span>${esc(p.qrLabel ?? t.qrLabel)}</span>`)
        : '';
    const vpa = p.vpa
        ? d(`font-size:10px;margin-top:10px;padding-top:8px;border-top:1px solid ${t.line};`, `<b>${esc(p.vpaLabel ?? t.vpaLabel)}:</b> ${esc(p.vpa)}`)
        : '';
    return card(x, lab('Bank account details (transfer)') +
        d('display:flex;gap:14px;' + (narrow ? 'flex-direction:column;' : ''), d('flex:1;', d(`display:grid;grid-template-columns:${narrow ? '1fr' : '1fr 1fr'};gap:8px 12px;font-size:10px;line-height:1.4;word-break:break-word;overflow:visible;`, f('Account holder', p.accountName) +
            f('Bank name', p.bankName) +
            f('Account no.', p.accountNo) +
            f(t.routingLabel, p.routingValue) +
            f('Branch', p.branch)) + vpa) + qrBox));
};
const signature = (x) => {
    const { inv } = x;
    return card(x, d('font-size:9px;letter-spacing:.1em;text-transform:uppercase;text-align:right;opacity:.7;', 'For ' + esc(inv.seller?.name)) +
        (inv.signatureImage
            ? `<img src="${esc(inv.signatureImage)}" alt="" style="display:block;height:36px;margin:0 0 0 auto">`
            : d('height:36px')) +
        d('border-top:1px solid currentColor;margin-left:auto;width:170px;text-align:right;font-size:10px;padding-top:5px;', esc(inv.signatory ?? 'Authorised signatory')));
};
const terms = (x) => {
    const { inv, t } = x, notes = [...(inv.notes ?? t.defaultNotes), t.note].filter(Boolean);
    return d('font-size:10px;line-height:1.6;', d('margin-bottom:6px;', `<b>Payment terms:</b> ${esc(inv.terms ?? t.terms)}`) +
        lab('Terms & conditions / notes') +
        notes.map((n, i) => d('', `${i + 1}. ${esc(n)}`)).join(''));
};
const wrap = (t, inner) => d(`width:794px;min-height:1123px;height:auto;overflow:visible;box-sizing:border-box;position:relative;font-family:${t.font};font-size:11px;background:${t.paper};color:${t.ink};${t.strip ? `border-top:10px solid ${t.accent};` : ''}`, inner, 'inv');
/* ---------- public render functions ---------- */
export function renderInvoice(inv, templateId = 'in-gst', opts = {}) {
    const t = { ...getInvoiceTemplate(templateId), ...(opts.override || {}) };
    const C = computeTotals(inv, t);
    const dp = inv.decimals ?? t.decimals, loc = inv.locale ?? t.locale, cur = inv.currency ?? t.currency;
    const nf = new Intl.NumberFormat(loc, {
        minimumFractionDigits: dp,
        maximumFractionDigits: dp,
    });
    const m = (v, signed = true) => {
        const n = v * (signed ? t.sign : 1);
        return (n < 0 ? '-' : '') + esc(cur) + nf.format(Math.abs(n));
    };
    const x = { inv, t, C, m, loc, opts };
    const S = party(x, inv.seller, 19), a = t.accent, pp = t.paper;
    if (t.header === 'side') {
        const x2 = { ...x, t: { ...t, card: 'plain', accent: pp, line: 'rgba(128,128,128,.5)' } };
        const sidebar = d(`width:250px;flex:none;box-sizing:border-box;background:${a};color:${pp};padding:36px 22px;display:flex;flex-direction:column;gap:22px;`, S +
            d('border-top:2px solid currentColor;padding-top:12px;', lab('Bill to') + party(x, inv.buyer, 14)) +
            bank(x2, true) +
            d('margin-top:auto;', signature(x2)));
        const main = d('flex:1;padding:36px 30px;box-sizing:border-box;display:flex;flex-direction:column;gap:16px;', d('display:flex;justify-content:space-between;align-items:flex-start;', heading(x, 'left', 30) + meta(x)) +
            supply(x) +
            table(x, true) +
            taxSummary(x) +
            totals(x) +
            terms(x));
        return wrap(t, d('display:flex;min-height:1123px;', sidebar + main));
    }
    let top = '', head;
    if (t.header === 'band') {
        top = d(`background:${a};color:${pp};padding:26px 44px;display:flex;justify-content:space-between;align-items:flex-end;`, heading(x, 'left', 38, pp) + meta(x));
        head = S;
    }
    else if (t.header === 'center') {
        head = d('text-align:center;', S + d('height:16px') + heading(x, 'center', 34) + meta(x, 'center'));
    }
    else if (t.header === 'big') {
        head = d('display:flex;justify-content:space-between;align-items:flex-end;', d('', heading(x, 'left', 60) + meta(x, 'left')) + d('text-align:right;', S));
    }
    else {
        head = d('display:flex;justify-content:space-between;align-items:flex-start;', S + d('', heading(x) + meta(x)));
    }
    const body = head +
        d(`height:1px;background:${t.line};margin:20px 0;`) +
        d('display:grid;grid-template-columns:1fr 1fr;gap:14px;', card(x, lab('Bill to (customer)') + party(x, inv.buyer, 14)) + supply(x)) +
        d('height:18px') +
        table(x) +
        d('height:16px') +
        d('display:grid;grid-template-columns:1.15fr 1fr;gap:14px;align-items:start;', d('display:flex;flex-direction:column;gap:14px;', taxSummary(x) + bank(x)) +
            d('display:flex;flex-direction:column;gap:14px;', totals(x) + signature(x))) +
        d('height:16px') +
        terms(x);
    return wrap(t, top + d('padding:32px 44px;', body));
}
/** Complete, print-ready HTML document (A4, fonts, colour-exact printing). */
export function renderInvoiceDocument(inv, templateId = 'in-gst', opts = {}) {
    const t = getInvoiceTemplate(templateId);
    const fontLink = t.googleFont
        ? `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${t.googleFont}&amp;display=swap">`
        : '';
    return (`<!doctype html><html lang="${esc(inv.lang || 'en')}"><head><meta charset="utf-8"><title>${esc(inv.number || 'Invoice')}</title>${fontLink}` +
        '<style>@page{size:A4;margin:0}html,body{margin:0;padding:0;background:#e5e7eb}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}.inv{margin:0 auto;box-shadow:0 4px 20px rgba(0,0,0,0.08);background:#fff;min-height:1123px;height:auto;overflow:visible}.inv-card,.inv-row{break-inside:avoid}@media print{html,body{background:none}.inv{box-shadow:none}}</style>' +
        `</head><body>${renderInvoice(inv, templateId, opts)}</body></html>`);
}
/* ---------- Mapper: CanonicalDocument -> InvoiceData ---------- */
export function mapCanonicalDocumentToTemplateInv(doc) {
    let cur = doc.currency || '₹';
    if (cur === 'INR')
        cur = '₹';
    else if (cur === 'USD')
        cur = '$';
    else if (cur === 'GBP')
        cur = '£';
    else if (cur === 'EUR')
        cur = '€';
    else if (cur === 'AED')
        cur = 'AED ';
    else if (cur === 'SGD')
        cur = 'S$';
    else if (cur === 'CAD')
        cur = 'C$';
    else if (cur === 'AUD')
        cur = 'A$';
    const sAddr = [];
    if (doc.sender.address?.street1)
        sAddr.push(doc.sender.address.street1);
    const sCityState = [
        doc.sender.address?.city,
        doc.sender.address?.state,
        doc.sender.address?.postalCode,
    ]
        .filter(Boolean)
        .join(', ');
    if (sCityState)
        sAddr.push(sCityState);
    if (doc.sender.address?.country)
        sAddr.push(doc.sender.address.country);
    const bAddr = [];
    if (doc.client.billingAddress?.street1)
        bAddr.push(doc.client.billingAddress.street1);
    const bCityState = [
        doc.client.billingAddress?.city,
        doc.client.billingAddress?.state,
        doc.client.billingAddress?.postalCode,
    ]
        .filter(Boolean)
        .join(', ');
    if (bCityState)
        bAddr.push(bCityState);
    if (doc.client.billingAddress?.country)
        bAddr.push(doc.client.billingAddress.country);
    const titles = {
        invoice: 'Tax Invoice',
        estimate: 'Quotation / Estimate',
        pro_forma: 'Proforma Invoice',
        purchase_order: 'Purchase Order',
        receipt: 'Payment Receipt',
        credit_note: 'Credit Note',
        debit_note: 'Debit Note',
    };
    const dueLabels = {
        invoice: 'Due date',
        estimate: 'Valid until',
        pro_forma: 'Valid until',
        purchase_order: 'Delivery date',
        receipt: 'Payment date',
        credit_note: 'Original invoice',
        debit_note: 'Due date',
    };
    const balanceLabels = {
        invoice: 'Balance due',
        estimate: 'Total quoted',
        pro_forma: 'Amount payable in advance',
        purchase_order: 'Total order value',
        receipt: 'Remaining balance',
        credit_note: 'Credit due',
        debit_note: 'Total payable',
    };
    const items = (doc.items || []).map((it) => {
        const qty = Number(it.quantity) || 1;
        const rate = Number(it.unitPrice) || 0;
        let discountPct = 0;
        if (it.discountType === 'percentage') {
            discountPct = Number(it.discountValue) || 0;
        }
        else if (it.discountType === 'fixed' && rate > 0) {
            discountPct = Math.round(((Number(it.discountValue) || 0) / (qty * rate)) * 10000) / 100;
        }
        return {
            description: it.description || 'Item description',
            code: it.hsnCode || it.code || '—',
            qty,
            rate,
            discountPct,
            taxRate: it.taxRate !== undefined ? Number(it.taxRate) : 18,
        };
    });
    const supplierState = doc.sender.address?.state || '';
    const placeOfSupply = doc.client.billingAddress?.state || doc.placeOfSupply || supplierState;
    const anyDoc = doc;
    const payConfig = doc.paymentConfig || anyDoc.paymentDetails;
    let payment = undefined;
    if (payConfig) {
        const bank = (payConfig.bankAccounts && payConfig.bankAccounts[0]) || payConfig;
        const showBank = payConfig.display ? payConfig.display.showBankDetails : true;
        const showUpi = payConfig.display ? payConfig.display.showUpiId : Boolean(payConfig.upiId);
        const showQr = payConfig.display ? payConfig.display.showQrCode : Boolean(payConfig.qrCodeDataUrl);
        payment = {
            accountName: showBank ? (bank?.accountHolderName || doc.sender.name) : undefined,
            bankName: showBank ? bank?.bankName : undefined,
            accountNo: showBank ? (bank?.accountNumber || bank?.accountNo) : undefined,
            routingValue: showBank ? (bank?.ifscOrRoutingCode || bank?.ifscCode || bank?.routingValue) : undefined,
            branch: showBank ? (bank?.branchName || bank?.branch) : undefined,
            vpa: showUpi ? (payConfig.upiId || bank?.upiId) : undefined,
            vpaLabel: 'UPI ID / VPA',
            qrImage: showQr ? (payConfig.qrCodeDataUrl || bank?.qrImage || '') : undefined,
            qrLabel: 'Scan to pay (UPI)',
        };
    }
    return {
        number: doc.documentNumber,
        issueDate: doc.issueDate,
        dueDate: doc.type === 'estimate'
            ? anyDoc.validUntil || doc.dueDate
            : doc.type === 'purchase_order'
                ? anyDoc.deliveryDate || doc.dueDate
                : doc.dueDate,
        title: doc.customTerminology?.[doc.type] || titles[doc.type] || 'Tax Invoice',
        dueLabel: dueLabels[doc.type] || 'Due date',
        balanceLabel: balanceLabels[doc.type] || 'Balance due',
        currency: cur,
        locale: doc.currency === 'INR' ? 'en-IN' : 'en-US',
        seller: {
            name: doc.sender.name || 'Your Business',
            address: sAddr,
            email: doc.sender.email,
            phone: doc.sender.phone,
            taxId: doc.sender.taxId,
            taxIdLabel: doc.sender.taxId && doc.sender.taxId.length === 15 ? 'GSTIN' : 'Tax ID',
            logoUrl: doc.sender.logoUrl,
        },
        buyer: {
            name: doc.client.name || 'Client Name',
            address: bAddr,
            email: doc.client.email,
            phone: doc.client.phone,
            taxId: doc.client.taxId,
            taxIdLabel: doc.client.taxId && doc.client.taxId.length === 15 ? 'GSTIN' : 'Tax ID',
        },
        items,
        supply: {
            fields: {
                'Supplier state': supplierState,
                'Place of supply': placeOfSupply,
            },
        },
        payment,
        notes: doc.notes ? [doc.notes] : undefined,
        terms: doc.paymentTerms || anyDoc.terms || payConfig?.paymentInstructions,
        amountPaid: doc.summary?.amountPaid || 0,
        signatory: doc.signatoryName || anyDoc.signature?.signatoryName || 'Authorized Signatory',
        signatureImage: anyDoc.signatureUrl || anyDoc.signature?.signatureUrl,
        roundOff: Boolean(doc.enableRoundOff ?? (doc.summary?.roundOffAmount !== undefined && doc.summary?.roundOffAmount !== 0)),
    };
}
