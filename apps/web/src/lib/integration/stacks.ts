/**
 * Code samples for the Integration Docs. Every stack uses the same two steps: show the editor with
 * embed.js in the browser, then receive the finished invoice on your own server.
 */
export interface StackSample {
  id: string;
  name: string;
  file: string;
  code: (origin: string) => string;
}

export const FRONTEND_STACKS: StackSample[] = [
  {
    id: 'html',
    name: 'HTML',
    file: 'index.html',
    code: (origin) => `<div id="invoice"></div>

<script src="${origin}/embed.js"></script>
<script>
  Invoxa.mount('#invoice', {
    key: 'YOUR_EMBED_KEY',
    document: {
      currency: 'USD',
      template: 'modern',
      sender: { name: 'Your Company' },
      client: { name: 'Globex' },
      items: [{ description: 'Website design', quantity: 1, unitPrice: 1500 }],
    },
    onSave: function (invoice) {
      fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoice),
      });
    },
  });
</script>`,
  },
  {
    id: 'react',
    name: 'React',
    file: 'InvoiceEditor.jsx',
    code: (origin) => `import { useEffect, useRef } from 'react';

const SCRIPT_URL = '${origin}/embed.js';

function loadEmbed() {
  return new Promise((resolve, reject) => {
    if (window.Invoxa) return resolve(window.Invoxa);
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.onload = () => resolve(window.Invoxa);
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

export function InvoiceEditor({ document: prefill, onSave }) {
  const container = useRef(null);

  useEffect(() => {
    let instance;
    let cancelled = false;
    loadEmbed().then((Invoxa) => {
      if (!cancelled) instance = Invoxa.mount(container.current, { key: 'YOUR_EMBED_KEY', document: prefill, onSave });
    });
    return () => {
      cancelled = true;
      instance?.destroy();
    };
  }, []);

  return <div ref={container} />;
}`,
  },
  {
    id: 'nextjs',
    name: 'Next.js',
    file: 'app/invoice/page.tsx',
    code: (origin) => `'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';

export default function InvoicePage() {
  const container = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const sdk = (window as any).Invoxa;
    if (!loaded || !sdk || !container.current) return;
    const instance = sdk.mount(container.current, {
      key: 'YOUR_EMBED_KEY',
      document: { currency: 'USD', client: { name: 'Globex' } },
      onSave: (invoice: unknown) =>
        fetch('/api/invoices', { method: 'POST', body: JSON.stringify(invoice) }),
    });
    return () => instance.destroy();
  }, [loaded]);

  return (
    <>
      <Script src="${origin}/embed.js" onReady={() => setLoaded(true)} />
      <div ref={container} />
    </>
  );
}`,
  },
  {
    id: 'vue',
    name: 'Vue',
    file: 'InvoiceEditor.vue',
    code: (origin) => `<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';

const emit = defineEmits(['save']);
const container = ref(null);
let instance;

onMounted(() => {
  const script = document.createElement('script');
  script.src = '${origin}/embed.js';
  script.onload = () => {
    instance = window.Invoxa.mount(container.value, {
      key: 'YOUR_EMBED_KEY',
      document: { currency: 'USD', client: { name: 'Globex' } },
      onSave: (invoice) => emit('save', invoice),
    });
  };
  document.body.appendChild(script);
});

onBeforeUnmount(() => instance?.destroy());
</script>

<template>
  <div ref="container" />
</template>`,
  },
  {
    id: 'angular',
    name: 'Angular',
    file: 'invoice-editor.component.ts',
    code: (origin) => `import { AfterViewInit, Component, ElementRef, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';

@Component({
  selector: 'app-invoice-editor',
  standalone: true,
  template: '<div #container></div>',
})
export class InvoiceEditorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('container') container!: ElementRef<HTMLDivElement>;
  @Output() save = new EventEmitter<unknown>();
  private instance?: { destroy(): void };

  ngAfterViewInit() {
    const script = document.createElement('script');
    script.src = '${origin}/embed.js';
    script.onload = () => {
      this.instance = (window as any).Invoxa.mount(this.container.nativeElement, {
        key: 'YOUR_EMBED_KEY',
        document: { currency: 'USD', client: { name: 'Globex' } },
        onSave: (invoice: unknown) => this.save.emit(invoice),
      });
    };
    document.body.appendChild(script);
  }

  ngOnDestroy() {
    this.instance?.destroy();
  }
}`,
  },
  {
    id: 'wordpress',
    name: 'WordPress',
    file: 'functions.php',
    code: (origin) => `<?php
// Then add [invoice_editor] to any page or post.
add_shortcode('invoice_editor', function () {
    wp_enqueue_script('invoice-embed', '${origin}/embed.js', [], null, true);
    wp_add_inline_script('invoice-embed', "
        Invoxa.mount('#invoice-editor', {
            key: 'YOUR_EMBED_KEY',
            onSave: function (invoice) {
                fetch('" . esc_url_raw(rest_url('my-site/v1/invoices')) . "', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(invoice),
                });
            },
        });
    ");
    return '<div id="invoice-editor"></div>';
});`,
  },
];

export const BACKEND_STACKS: StackSample[] = [
  {
    id: 'node',
    name: 'Node.js',
    file: 'server.js',
    code: () => `import express from 'express';

const app = express();
app.use(express.json({ limit: '1mb' }));

app.post('/api/invoices', async (req, res) => {
  const invoice = req.body;
  // Check the customer is signed in and the values are ones you expect, then save it.
  await db.invoices.insert({
    number: invoice.documentNumber,
    currency: invoice.currency,
    total: invoice.summary.grandTotal,
    data: invoice,
  });
  res.status(201).json({ ok: true });
});

app.listen(3000);`,
  },
  {
    id: 'python',
    name: 'Python',
    file: 'app.py',
    code: () => `from flask import Flask, jsonify, request

app = Flask(__name__)

@app.post("/api/invoices")
def save_invoice():
    invoice = request.get_json()
    # Check the customer is signed in and the values are ones you expect, then save it.
    db.invoices.insert(
        number=invoice["documentNumber"],
        currency=invoice["currency"],
        total=invoice["summary"]["grandTotal"],
        data=invoice,
    )
    return jsonify(ok=True), 201`,
  },
  {
    id: 'php',
    name: 'PHP / Laravel',
    file: 'routes/api.php',
    code: () => `<?php

use App\\Models\\Invoice;
use Illuminate\\Http\\Request;
use Illuminate\\Support\\Facades\\Route;

Route::middleware('auth:sanctum')->post('/invoices', function (Request $request) {
    $invoice = $request->all();

    // Check the values are ones you expect, then save it.
    Invoice::create([
        'number' => $invoice['documentNumber'],
        'currency' => $invoice['currency'],
        'total' => $invoice['summary']['grandTotal'],
        'data' => $invoice,
    ]);

    return response()->json(['ok' => true], 201);
});`,
  },
  {
    id: 'java',
    name: 'Java / Spring',
    file: 'InvoiceController.java',
    code: () => `import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {
    private final InvoiceRepository invoices;

    public InvoiceController(InvoiceRepository invoices) {
        this.invoices = invoices;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public void save(@RequestBody JsonNode invoice) {
        // Check the customer is signed in and the values are ones you expect, then save it.
        invoices.save(new InvoiceRecord(
            invoice.get("documentNumber").asText(),
            invoice.get("currency").asText(),
            invoice.at("/summary/grandTotal").decimalValue(),
            invoice.toString()
        ));
    }
}`,
  },
  {
    id: 'dotnet',
    name: 'C# / .NET',
    file: 'Program.cs',
    code: () => `using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.MapPost("/api/invoices", async (JsonElement invoice, InvoiceStore store) =>
{
    // Check the customer is signed in and the values are ones you expect, then save it.
    await store.SaveAsync(
        invoice.GetProperty("documentNumber").GetString(),
        invoice.GetProperty("currency").GetString(),
        invoice.GetProperty("summary").GetProperty("grandTotal").GetDecimal(),
        invoice.GetRawText());
    return Results.Created();
});

app.Run();`,
  },
];

export const STACK_NAMES = [...FRONTEND_STACKS, ...BACKEND_STACKS].map((stack) => stack.name);
