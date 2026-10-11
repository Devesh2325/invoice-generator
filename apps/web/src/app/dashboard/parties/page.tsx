'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { TenantLayout } from '@/components/layout/tenant-layout';
import { useTenant } from '@/lib/auth/tenant-context';
import { TenantApi } from '@invoice/api';
import { Party, INDIAN_STATES } from '@invoice/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Plus,
  Search,
  Mail,
  Phone,
  MapPin,
  Download,
  Building,
  CheckCircle2,
} from 'lucide-react';

export default function TenantPartiesPage() {
  const { activeTenant } = useTenant();
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'customer' | 'vendor'>('customer');
  const [modalOpen, setModalOpen] = useState(false);

  // New party form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [taxId, setTaxId] = useState('');
  const [gstState, setGstState] = useState('27 - Maharashtra');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('India');
  const [notes, setNotes] = useState('');

  const loadParties = async () => {
    if (!activeTenant) return;
    setLoading(true);
    try {
      const list = await TenantApi.getParties(activeTenant.id);
      setParties(list);
    } catch (err) {
      console.error('Failed to load parties:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParties();
  }, [activeTenant]);

  const filteredParties = useMemo(() => {
    return parties.filter((p) => {
      const matchType = p.type === activeTab;
      const matchSearch =
        search === '' ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.email && p.email.toLowerCase().includes(search.toLowerCase()));
      return matchType && matchSearch;
    });
  }, [parties, activeTab, search]);

  const handleCreateParty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant || !name) return;

    const newParty: Party = {
      id: `party_${Date.now()}`,
      type: activeTab,
      name,
      email,
      phone,
      taxId,
      billingAddress: {
        street1: street,
        city,
        state: gstState,
        postalCode: '400001',
        country,
      },
      notes,
      isArchived: false,
    };

    await TenantApi.saveParty(activeTenant.id, newParty);
    setModalOpen(false);
    setName('');
    setEmail('');
    setPhone('');
    setTaxId('');
    setStreet('');
    setCity('');
    setNotes('');
    await loadParties();
  };

  const handleExportCsv = () => {
    const rows = [
      ['Name', 'Type', 'Email', 'Phone', 'Tax ID', 'Street', 'City', 'Country'],
      ...filteredParties.map((p) => [
        p.name,
        p.type,
        p.email || '',
        p.phone || '',
        p.taxId || '',
        p.billingAddress?.street1 || '',
        p.billingAddress?.city || '',
        p.billingAddress?.country || '',
      ]),
    ];
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      rows.map((e) => e.map((x) => `"${x}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${activeTab}s-export-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <TenantLayout>
      <div className="p-6 lg:p-10 space-y-6 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Customer & Vendor Directory
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Store client billing profiles, tax credentials, and contact details.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              className="text-xs flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5" /> Export CSV
            </Button>
            <Button
              size="sm"
              onClick={() => setModalOpen(true)}
              className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-sm flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" /> Add {activeTab === 'customer' ? 'Customer' : 'Vendor'}
            </Button>
          </div>
        </div>

        {/* Tab switcher & Search */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setActiveTab('customer')}
              className={`px-4 py-1.5 text-xs font-bold transition-colors ${
                activeTab === 'customer'
                  ? 'bg-primary text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              Customers ({parties.filter((p) => p.type === 'customer').length})
            </button>
            <button
              onClick={() => setActiveTab('vendor')}
              className={`px-4 py-1.5 text-xs font-bold transition-colors ${
                activeTab === 'vendor'
                  ? 'bg-primary text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              Vendors ({parties.filter((p) => p.type === 'vendor').length})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder={`Search ${activeTab}s...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
        </div>

        {/* Parties Grid */}
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading directory...</div>
        ) : filteredParties.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <Users className="h-10 w-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">
              No {activeTab}s added yet
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Add contact and tax details to populate invoices automatically.
            </p>
            <Button
              size="sm"
              onClick={() => setModalOpen(true)}
              className="bg-primary hover:bg-primary-hover text-white text-xs mt-2"
            >
              Add First {activeTab === 'customer' ? 'Customer' : 'Vendor'}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredParties.map((p) => (
              <Card key={p.id} className="border-slate-200 bg-white hover:shadow-sm transition-shadow">
                <CardContent className="p-5 space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-base text-slate-900">{p.name}</h3>
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {p.type}
                    </Badge>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    {p.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{p.email}</span>
                      </div>
                    )}
                    {p.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{p.phone}</span>
                      </div>
                    )}
                    {p.taxId && (
                      <div className="flex items-center gap-2">
                        <Building className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>GSTIN: {p.taxId}</span>
                      </div>
                    )}
                    {p.billingAddress?.street1 && (
                      <div className="flex items-start gap-2 pt-1 border-t border-slate-100">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span>
                          {[
                            p.billingAddress.street1,
                            p.billingAddress.city,
                            p.billingAddress.state,
                          ]
                            .filter(Boolean)
                            .join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal: Add Party */}
        {modalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md bg-white border-slate-200 shadow-2xl">
              <form onSubmit={handleCreateParty}>
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-center border-b pb-3">
                    <h3 className="font-bold text-base text-slate-900">
                      Add New {activeTab === 'customer' ? 'Customer' : 'Vendor'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="text-slate-400 hover:text-slate-600 font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Company or Contact Name *
                      </label>
                      <Input
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Reliance Retail Ventures Ltd"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Email Address
                      </label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="accounts@company.in"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Phone Number
                      </label>
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          GSTIN Number
                        </label>
                        <Input
                          value={taxId}
                          onChange={(e) => setTaxId(e.target.value.toUpperCase())}
                          placeholder="27AAACR5055K1Z7"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          GST State
                        </label>
                        <select
                          value={gstState}
                          onChange={(e) => setGstState(e.target.value)}
                          className="w-full h-10 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-medium"
                        >
                          {INDIAN_STATES.map((st) => (
                            <option key={st.code} value={st.label}>
                              {st.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Street Address
                        </label>
                        <Input
                          value={street}
                          onChange={(e) => setStreet(e.target.value)}
                          placeholder="Plot 42, MIDC"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          City
                        </label>
                        <Input
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="Mumbai"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      className="bg-primary hover:bg-primary-hover text-white font-semibold"
                    >
                      Save {activeTab === 'customer' ? 'Customer' : 'Vendor'}
                    </Button>
                  </div>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </TenantLayout>
  );
}
