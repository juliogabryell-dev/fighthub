'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Icon from '@/components/Icon';
import Avatar from '@/components/Avatar';

export default function EventsManager() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Fighter linking state
  const [eventFighters, setEventFighters] = useState([]);
  const [fighterSearch, setFighterSearch] = useState('');
  const [fighterResults, setFighterResults] = useState([]);
  const [searchingFighters, setSearchingFighters] = useState(false);
  const fighterSearchTimeout = useRef(null);

  // Form state
  const [form, setForm] = useState({
    title: '',
    description_short: '',
    description_full: '',
    event_date: '',
    venue_name: '',
    venue_address: '',
    venue_city: '',
    payment_link: '',
    external_link: '',
    is_published: true,
  });

  // Image state for the event being edited
  const [eventImages, setEventImages] = useState([]);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/fulladmin/events');
      const data = await res.json();
      if (res.ok) setEvents(data.events || []);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  async function fetchEventFighters(eventId) {
    try {
      const res = await fetch(`/api/fulladmin/events/fighters?event_id=${eventId}`);
      const data = await res.json();
      if (res.ok) setEventFighters(data.event_fighters || []);
    } catch { /* ignore */ }
  }

  function handleFighterSearch(query) {
    setFighterSearch(query);
    if (fighterSearchTimeout.current) clearTimeout(fighterSearchTimeout.current);
    if (!query || query.length < 2) {
      setFighterResults([]);
      return;
    }
    setSearchingFighters(true);
    fighterSearchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/fulladmin/events/fighters?search=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (res.ok) setFighterResults(data.fighters || []);
      } catch { /* ignore */ }
      setSearchingFighters(false);
    }, 300);
  }

  async function handleAddFighter(fighterId) {
    if (!editingEvent) return;
    try {
      const res = await fetch('/api/fulladmin/events/fighters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: editingEvent.id, fighter_id: fighterId }),
      });
      const data = await res.json();
      if (res.ok && data.event_fighter) {
        setEventFighters((prev) => [...prev, data.event_fighter]);
        setFighterSearch('');
        setFighterResults([]);
      } else {
        alert(data.error || 'Erro ao vincular lutador');
      }
    } catch {
      alert('Erro ao vincular lutador.');
    }
  }

  async function handleRemoveFighter(efId) {
    try {
      const res = await fetch('/api/fulladmin/events/fighters', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: efId }),
      });
      if (res.ok) {
        setEventFighters((prev) => prev.filter((ef) => ef.id !== efId));
      }
    } catch {
      alert('Erro ao remover lutador.');
    }
  }

  function resetForm() {
    setForm({
      title: '',
      description_short: '',
      description_full: '',
      event_date: '',
      venue_name: '',
      venue_address: '',
      venue_city: '',
      payment_link: '',
      external_link: '',
      is_published: true,
    });
    setEventImages([]);
    setEventFighters([]);
    setFighterSearch('');
    setFighterResults([]);
    setEditingEvent(null);
    setShowForm(false);
  }

  function handleEdit(event) {
    setForm({
      title: event.title,
      description_short: event.description_short,
      description_full: event.description_full || '',
      event_date: event.event_date ? event.event_date.slice(0, 16) : '',
      venue_name: event.venue_name || '',
      venue_address: event.venue_address || '',
      venue_city: event.venue_city || '',
      payment_link: event.payment_link || '',
      external_link: event.external_link || '',
      is_published: event.is_published,
    });
    setEventImages(event.event_images || []);
    setEditingEvent(event);
    setShowForm(true);
    fetchEventFighters(event.id);
  }

  async function handleSave() {
    if (!form.title || !form.description_short || !form.event_date) {
      alert('Preencha título, descrição curta e data.');
      return;
    }

    setSaving(true);
    try {
      const method = editingEvent ? 'PUT' : 'POST';
      const body = editingEvent ? { ...form, id: editingEvent.id } : form;

      const res = await fetch('/api/fulladmin/events', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (res.ok) {
        // If creating, we need to return the new event for image uploads
        if (!editingEvent && data.event) {
          setEditingEvent(data.event);
          setShowForm(true);
          await fetchEvents();
          alert('Evento criado! Agora você pode adicionar imagens.');
        } else {
          resetForm();
          await fetchEvents();
        }
      } else {
        alert('Erro: ' + (data.error || 'Erro desconhecido'));
      }
    } catch {
      alert('Erro ao salvar evento.');
    }
    setSaving(false);
  }

  async function handleDelete(event) {
    if (!confirm(`Excluir o evento "${event.title}"? Esta ação não pode ser desfeita.`)) return;
    try {
      const res = await fetch('/api/fulladmin/events', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: event.id }),
      });
      if (res.ok) await fetchEvents();
      else alert('Erro ao excluir evento.');
    } catch {
      alert('Erro ao excluir evento.');
    }
  }

  async function handleImageUpload(e) {
    const files = Array.from(e.target.files);
    if (!editingEvent) {
      alert('Salve o evento primeiro antes de adicionar imagens.');
      return;
    }
    if (eventImages.length + files.length > 10) {
      alert('Máximo de 10 imagens por evento.');
      return;
    }

    setUploadingImages(true);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('event_id', editingEvent.id);
      formData.append('display_order', String(eventImages.length + i));

      try {
        const res = await fetch('/api/fulladmin/events/images', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (res.ok && data.image) {
          setEventImages((prev) => [...prev, data.image]);
        } else {
          alert(`Erro ao enviar "${file.name}": ${data.error || 'Erro desconhecido'}`);
        }
      } catch {
        alert(`Erro ao enviar "${file.name}".`);
      }
    }
    setUploadingImages(false);
    await fetchEvents();
    // Reset file input
    e.target.value = '';
  }

  async function handleDeleteImage(image) {
    try {
      const res = await fetch('/api/fulladmin/events/images', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: image.id, image_url: image.image_url }),
      });
      if (res.ok) {
        setEventImages((prev) => prev.filter((img) => img.id !== image.id));
        await fetchEvents();
      }
    } catch {
      alert('Erro ao excluir imagem.');
    }
  }

  async function handleMoveImage(index, direction) {
    const newImages = [...eventImages];
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= newImages.length) return;

    [newImages[index], newImages[swapIndex]] = [newImages[swapIndex], newImages[index]];

    // Update display_order
    const updated = newImages.map((img, i) => ({ ...img, display_order: i }));
    setEventImages(updated);

    try {
      await fetch('/api/fulladmin/events/images', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: updated.map((img) => ({ id: img.id, display_order: img.display_order })),
        }),
      });
      await fetchEvents();
    } catch { /* ignore */ }
  }

  function formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function isEventFuture(dateString) {
    return new Date(dateString) > new Date();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <svg className="animate-spin h-8 w-8 text-[#C41E3A]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Create button */}
      <div className="flex items-center justify-between">
        <h2 className="font-bebas text-xl tracking-wider text-white">
          {showForm ? (editingEvent ? 'EDITAR EVENTO' : 'NOVO EVENTO') : 'EVENTOS DE LUTA'}
        </h2>
        {!showForm ? (
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#C41E3A] to-[#a01830] text-white font-barlow-condensed text-xs uppercase tracking-wider hover:from-[#d42a46] hover:to-[#b82040] transition-all"
          >
            <Icon name="plus" size={14} />
            Novo Evento
          </button>
        ) : (
          <button
            onClick={resetForm}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all font-barlow-condensed text-xs uppercase tracking-wider"
          >
            <Icon name="chevronLeft" size={14} />
            Voltar
          </button>
        )}
      </div>

      {/* Event Form */}
      {showForm && (
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl border border-white/10 shadow-2xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="uppercase text-xs tracking-wider text-white/50 font-barlow-condensed font-semibold mb-1.5 block">
                Título *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ex: Fight Night Championship"
                className="w-full bg-white/5 border border-white/10 rounded-lg text-white font-barlow text-sm px-3.5 py-2.5 focus:border-[#C41E3A]/50 outline-none transition-colors placeholder:text-white/25"
              />
            </div>

            {/* Event Date */}
            <div>
              <label className="uppercase text-xs tracking-wider text-white/50 font-barlow-condensed font-semibold mb-1.5 block">
                Data do Evento *
              </label>
              <input
                type="datetime-local"
                value={form.event_date}
                onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg text-white font-barlow text-sm px-3.5 py-2.5 focus:border-[#C41E3A]/50 outline-none transition-colors"
              />
            </div>

            {/* Published */}
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_published}
                  onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#C41E3A] focus:ring-[#C41E3A]"
                />
                <span className="font-barlow text-white/60 text-sm">Publicado (visível ao público)</span>
              </label>
            </div>

            {/* Short Description */}
            <div className="md:col-span-2">
              <label className="uppercase text-xs tracking-wider text-white/50 font-barlow-condensed font-semibold mb-1.5 block">
                Descrição Curta * <span className="normal-case text-white/30">(exibida nos cards da home)</span>
              </label>
              <input
                type="text"
                value={form.description_short}
                onChange={(e) => setForm({ ...form, description_short: e.target.value })}
                placeholder="Ex: O maior evento de MMA do sul do Brasil"
                maxLength={200}
                className="w-full bg-white/5 border border-white/10 rounded-lg text-white font-barlow text-sm px-3.5 py-2.5 focus:border-[#C41E3A]/50 outline-none transition-colors placeholder:text-white/25"
              />
            </div>

            {/* Full Description */}
            <div className="md:col-span-2">
              <label className="uppercase text-xs tracking-wider text-white/50 font-barlow-condensed font-semibold mb-1.5 block">
                Descrição Detalhada
              </label>
              <textarea
                value={form.description_full}
                onChange={(e) => setForm({ ...form, description_full: e.target.value })}
                placeholder="Descrição completa do evento, regras, card de lutas, etc."
                rows={5}
                className="w-full bg-white/5 border border-white/10 rounded-lg text-white font-barlow text-sm px-3.5 py-2.5 focus:border-[#C41E3A]/50 outline-none transition-colors resize-y placeholder:text-white/25"
              />
            </div>

            {/* Venue Name */}
            <div>
              <label className="uppercase text-xs tracking-wider text-white/50 font-barlow-condensed font-semibold mb-1.5 block">
                Local
              </label>
              <input
                type="text"
                value={form.venue_name}
                onChange={(e) => setForm({ ...form, venue_name: e.target.value })}
                placeholder="Ex: Ginásio Esportivo Municipal"
                className="w-full bg-white/5 border border-white/10 rounded-lg text-white font-barlow text-sm px-3.5 py-2.5 focus:border-[#C41E3A]/50 outline-none transition-colors placeholder:text-white/25"
              />
            </div>

            {/* Venue City */}
            <div>
              <label className="uppercase text-xs tracking-wider text-white/50 font-barlow-condensed font-semibold mb-1.5 block">
                Cidade
              </label>
              <input
                type="text"
                value={form.venue_city}
                onChange={(e) => setForm({ ...form, venue_city: e.target.value })}
                placeholder="Ex: São Paulo - SP"
                className="w-full bg-white/5 border border-white/10 rounded-lg text-white font-barlow text-sm px-3.5 py-2.5 focus:border-[#C41E3A]/50 outline-none transition-colors placeholder:text-white/25"
              />
            </div>

            {/* Venue Address */}
            <div className="md:col-span-2">
              <label className="uppercase text-xs tracking-wider text-white/50 font-barlow-condensed font-semibold mb-1.5 block">
                Endereço
              </label>
              <input
                type="text"
                value={form.venue_address}
                onChange={(e) => setForm({ ...form, venue_address: e.target.value })}
                placeholder="Ex: Rua das Flores, 123 - Centro"
                className="w-full bg-white/5 border border-white/10 rounded-lg text-white font-barlow text-sm px-3.5 py-2.5 focus:border-[#C41E3A]/50 outline-none transition-colors placeholder:text-white/25"
              />
            </div>

            {/* Payment Link */}
            <div>
              <label className="uppercase text-xs tracking-wider text-white/50 font-barlow-condensed font-semibold mb-1.5 block">
                Link de Pagamento
              </label>
              <input
                type="url"
                value={form.payment_link}
                onChange={(e) => setForm({ ...form, payment_link: e.target.value })}
                placeholder="https://pagamento.exemplo.com"
                className="w-full bg-white/5 border border-white/10 rounded-lg text-white font-barlow text-sm px-3.5 py-2.5 focus:border-[#C41E3A]/50 outline-none transition-colors placeholder:text-white/25"
              />
            </div>

            {/* External Link */}
            <div>
              <label className="uppercase text-xs tracking-wider text-white/50 font-barlow-condensed font-semibold mb-1.5 block">
                Link Externo
              </label>
              <input
                type="url"
                value={form.external_link}
                onChange={(e) => setForm({ ...form, external_link: e.target.value })}
                placeholder="https://site-do-evento.com"
                className="w-full bg-white/5 border border-white/10 rounded-lg text-white font-barlow text-sm px-3.5 py-2.5 focus:border-[#C41E3A]/50 outline-none transition-colors placeholder:text-white/25"
              />
            </div>
          </div>

          {/* Images Section */}
          {editingEvent && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="flex items-center justify-between mb-4">
                <label className="uppercase text-xs tracking-wider text-white/50 font-barlow-condensed font-semibold">
                  Imagens ({eventImages.length}/10)
                  <span className="normal-case text-white/30 ml-2">A primeira imagem será a principal</span>
                </label>
                {eventImages.length < 10 && (
                  <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all font-barlow-condensed text-xs uppercase tracking-wider cursor-pointer">
                    <Icon name="camera" size={14} />
                    {uploadingImages ? 'Enviando...' : 'Adicionar'}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      disabled={uploadingImages}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {eventImages.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {eventImages.map((img, index) => (
                    <div key={img.id} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden border border-white/10 bg-white/5">
                        <img
                          src={img.image_url}
                          alt={`Imagem ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {/* Order badge */}
                      <div className={`absolute top-1 left-1 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        index === 0
                          ? 'bg-[#D4AF37] text-black'
                          : 'bg-black/60 text-white/80'
                      }`}>
                        {index + 1}
                      </div>
                      {/* Controls overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                        {index > 0 && (
                          <button
                            onClick={() => handleMoveImage(index, -1)}
                            className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white transition-colors"
                            title="Mover para esquerda"
                          >
                            <Icon name="chevronLeft" size={12} />
                          </button>
                        )}
                        {index < eventImages.length - 1 && (
                          <button
                            onClick={() => handleMoveImage(index, 1)}
                            className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white transition-colors"
                            title="Mover para direita"
                          >
                            <Icon name="chevronRight" size={12} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteImage(img)}
                          className="w-7 h-7 rounded-full bg-red-500/40 hover:bg-red-500/70 flex items-center justify-center text-white transition-colors"
                          title="Excluir imagem"
                        >
                          <Icon name="x" size={12} />
                        </button>
                      </div>
                      {index === 0 && (
                        <span className="absolute bottom-1 left-1 right-1 bg-[#D4AF37]/90 text-black text-[9px] font-barlow-condensed uppercase tracking-wider text-center rounded px-1 py-0.5 font-bold">
                          Principal
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-white/10 rounded-lg p-8 text-center">
                  <Icon name="camera" size={32} className="text-white/20 mx-auto mb-2" />
                  <p className="font-barlow text-white/30 text-sm">Nenhuma imagem adicionada</p>
                </div>
              )}
            </div>
          )}

          {/* Fighters Section */}
          {editingEvent && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="flex items-center justify-between mb-4">
                <label className="uppercase text-xs tracking-wider text-white/50 font-barlow-condensed font-semibold">
                  Lutadores Vinculados ({eventFighters.length})
                </label>
              </div>

              {/* Search */}
              <div className="relative mb-3">
                <Icon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  value={fighterSearch}
                  onChange={(e) => handleFighterSearch(e.target.value)}
                  placeholder="Buscar lutador pelo nome..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg text-white font-barlow text-sm pl-9 pr-4 py-2.5 focus:border-[#C41E3A]/50 outline-none transition-colors placeholder:text-white/25"
                />
                {searchingFighters && (
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin h-4 w-4 text-white/30" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
              </div>

              {/* Search Results */}
              {fighterResults.length > 0 && (
                <div className="bg-[#0f0f1a] border border-white/10 rounded-lg mb-3 max-h-48 overflow-y-auto divide-y divide-white/5">
                  {fighterResults
                    .filter((f) => !eventFighters.some((ef) => ef.fighter?.id === f.id))
                    .map((f) => (
                      <button
                        key={f.id}
                        onClick={() => handleAddFighter(f.id)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors text-left"
                      >
                        <Avatar name={f.full_name} url={f.avatar_url} size={32} />
                        <div className="min-w-0 flex-1">
                          <p className="font-barlow-condensed text-sm text-white truncate">{f.full_name}</p>
                          {f.handle && <p className="font-barlow text-xs text-white/30">@{f.handle}</p>}
                        </div>
                        <Icon name="plus" size={14} className="text-[#C41E3A] flex-shrink-0" />
                      </button>
                    ))}
                </div>
              )}

              {/* Linked Fighters */}
              {eventFighters.length > 0 ? (
                <div className="space-y-2">
                  {eventFighters.map((ef) => (
                    <div key={ef.id} className="flex items-center gap-3 px-3 py-2.5 bg-white/[0.02] rounded-lg border border-white/5">
                      <Avatar name={ef.fighter?.full_name} url={ef.fighter?.avatar_url} size={32} />
                      <div className="min-w-0 flex-1">
                        <p className="font-barlow-condensed text-sm text-white truncate">{ef.fighter?.full_name}</p>
                        <p className="font-barlow text-xs text-white/30">
                          {[ef.fighter?.handle && `@${ef.fighter.handle}`, ef.fighter?.city].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveFighter(ef.id)}
                        className="w-7 h-7 rounded-full bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-400 transition-colors flex-shrink-0"
                        title="Remover lutador"
                      >
                        <Icon name="x" size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="font-barlow text-white/25 text-sm text-center py-4">Nenhum lutador vinculado</p>
              )}
            </div>
          )}

          {/* Save / Cancel */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={resetForm}
              className="flex-1 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all font-barlow-condensed text-sm uppercase tracking-wider"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-[#C41E3A] to-[#a01830] text-white font-barlow-condensed text-sm uppercase tracking-wider hover:from-[#d42a46] hover:to-[#b82040] transition-all disabled:opacity-50"
            >
              {saving ? 'Salvando...' : editingEvent ? 'Atualizar Evento' : 'Criar Evento'}
            </button>
          </div>
        </div>
      )}

      {/* Events List */}
      {!showForm && (
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
          {events.length > 0 ? (
            <div className="divide-y divide-white/5">
              {events.map((event) => {
                const mainImage = event.event_images?.[0];
                const isFuture = isEventFuture(event.event_date);
                return (
                  <div key={event.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-white/[0.02] transition-colors">
                    {/* Thumbnail */}
                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-white/10 bg-white/5 flex-shrink-0">
                      {mainImage ? (
                        <img src={mainImage.image_url} alt={event.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Icon name="calendar" size={24} className="text-white/20" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-barlow-condensed text-white font-semibold truncate">{event.title}</h3>
                        {!event.is_published && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-barlow-condensed uppercase tracking-wider border bg-yellow-500/10 border-yellow-500/30 text-yellow-400">
                            Rascunho
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-barlow-condensed uppercase tracking-wider border ${
                          isFuture
                            ? 'bg-green-500/10 border-green-500/30 text-green-400'
                            : 'bg-white/5 border-white/10 text-white/40'
                        }`}>
                          {isFuture ? 'Futuro' : 'Passado'}
                        </span>
                      </div>
                      <p className="font-barlow text-white/40 text-xs mt-1 truncate">{event.description_short}</p>
                      <div className="flex items-center gap-3 mt-1 text-white/30 text-xs font-barlow">
                        <span className="flex items-center gap-1">
                          <Icon name="calendar" size={12} />
                          {formatDate(event.event_date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon name="camera" size={12} />
                          {event.event_images?.length || 0} imagens
                        </span>
                        {event.payment_link && (
                          <span className="flex items-center gap-1 text-green-400/60">
                            <Icon name="link" size={12} />
                            Pagamento
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 sm:ml-4">
                      <button
                        onClick={() => handleEdit(event)}
                        className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all font-barlow-condensed text-xs uppercase tracking-wider"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(event)}
                        className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all font-barlow-condensed text-xs uppercase tracking-wider"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Icon name="calendar" size={40} className="text-white/15 mx-auto mb-3" />
              <p className="font-barlow text-white/40 text-sm">Nenhum evento cadastrado.</p>
              <p className="font-barlow text-white/25 text-xs mt-1">Clique em &quot;Novo Evento&quot; para criar o primeiro.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
