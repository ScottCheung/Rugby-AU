'use client';

import { useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import {
  componentDefinitions,
  getDefinition,
  type FieldDefinition,
} from '@/lib/definitions';
import type {
  CardItem,
  ComponentInstance,
  ComponentType,
  PageDocument,
  Site,
} from '@/lib/model';

const newId = () => crypto.randomUUID();
const slugPath = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export function Manager({
  initialSites,
  initialPages,
}: {
  initialSites: Site[];
  initialPages: PageDocument[];
}) {
  const [sites] = useState(initialSites);
  const [pages, setPages] = useState(initialPages);
  const [siteId, setSiteId] = useState(initialSites[0]?.id ?? '');
  const [activeId, setActiveId] = useState(initialPages[0]?.id ?? '');
  const [draft, setDraft] = useState<PageDocument | null>(
    initialPages[0] ?? null,
  );
  const [newTitle, setNewTitle] = useState('');
  const [newPath, setNewPath] = useState('about');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const currentSite = sites.find(
    (site) => site.id === (draft?.siteId ?? siteId),
  );

  const visiblePages = useMemo(
    () => pages.filter((page) => page.siteId === siteId),
    [pages, siteId],
  );
  const openPage = (page: PageDocument) => {
    setDraft(structuredClone(page));
    setActiveId(page.id);
    setSiteId(page.siteId);
    setNotice('');
  };

  async function createPage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice('');
    const response = await fetch('/api/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteId, title: newTitle, path: newPath }),
    });
    const result = await response.json();
    if (!response.ok) {
      setNotice(result.error || 'Could not create page.');
      return;
    }
    setPages((items) =>
      [...items, result].sort((a, b) => a.path.localeCompare(b.path)),
    );
    setNewTitle('');
    setNewPath('');
    openPage(result);
    setNotice('Page created. Add components, then save your changes.');
  }

  async function savePage() {
    if (!draft) return;
    setSaving(true);
    setNotice('');
    const response = await fetch(`/api/pages/${draft.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    });
    const result = await response.json();
    setSaving(false);
    if (!response.ok) {
      setNotice(result.error || 'Could not save page.');
      return;
    }
    setDraft(result);
    setPages((items) =>
      items.map((page) => (page.id === result.id ? result : page)),
    );
    setNotice('Changes saved.');
  }

  function addComponent(type: ComponentType, parentId?: string) {
    if (!draft) return;
    const definition = getDefinition(type);
    const instance: ComponentInstance = {
      id: newId(),
      type,
      props: structuredClone(definition.defaults),
      ...(type === 'section' ? { children: [] } : {}),
    };
    setDraft({
      ...draft,
      components: parentId
        ? insertIntoSection(draft.components, parentId, instance)
        : [...draft.components, instance],
    });
  }

  function updateProps(id: string, name: string, value: unknown) {
    if (!draft) return;
    setDraft({
      ...draft,
      components: mapComponents(draft.components, id, (item) => ({
        ...item,
        props: { ...item.props, [name]: value },
      })),
    });
  }

  function removeComponent(id: string) {
    if (!draft) return;
    setDraft({ ...draft, components: removeFromTree(draft.components, id) });
  }

  return (
    <div className="manager-workspace">
      <aside className="manager-rail">
        <div className="brand-lockup">
          <span className="brand-mark">RA</span>
          <span>
            <strong>Rugby AU</strong>
            <small>Digital studio</small>
          </span>
        </div>
        <div className="rail-section-label">WORKSPACE</div>
        <button className="rail-link active">
          <span className="rail-icon">▦</span>Page manager
          <span className="rail-chevron">›</span>
        </button>
        <div className="rail-section-label site-label">
          SITES <span>{sites.length}</span>
        </div>
        <div className="site-switcher">
          {sites.map((site) => (
            <button
              key={site.id}
              onClick={() => {
                setSiteId(site.id);
                const first = pages.find((page) => page.siteId === site.id);
                if (first) openPage(first);
                else {
                  setDraft(null);
                  setActiveId('');
                }
              }}
              className={
                site.id === siteId ? 'site-option selected' : 'site-option'
              }
            >
              <i style={{ backgroundColor: site.theme.brand }} />
              {site.name}
              <span>
                {pages.filter((page) => page.siteId === site.id).length}
              </span>
            </button>
          ))}
        </div>
        <div className="rail-bottom">
          <span className="avatar">SZ</span>
          <span>
            <strong>Scott Zhang</strong>
            <small>Editor</small>
          </span>
          <span className="dots">···</span>
        </div>
      </aside>

      <section className="manager-main">
        <header className="manager-topbar">
          <div>
            <span className="topbar-kicker">WEBSITES</span>
            <span className="crumb-divider">/</span>
            <span>{currentSite?.name ?? 'Select a site'}</span>
            <span className="crumb-divider">/</span>
            <strong>Page manager</strong>
          </div>
          <Link
            href={
              draft && currentSite
                ? `/s/${currentSite.slug}${draft.path === '/' ? '' : draft.path}`
                : '#'
            }
            target="_blank"
            className="preview-button"
          >
            View site <span>↗</span>
          </Link>
        </header>
        <div className="manager-content">
          <div className="page-intro">
            <div>
              <p className="eyebrow">
                CONTENT WORKSPACE <span className="eyebrow-line" />
              </p>
              <h1>Page manager</h1>
              <p className="intro-copy">
                Build and manage your website pages from shared content blocks.
              </p>
            </div>
            <div className="intro-mark">
              RU<span>G</span>BY
              <br />
              <i>AUSTRALIA</i>
            </div>
          </div>
          <div className="editor-grid">
            <aside className="pages-panel">
              <div className="panel-title">
                <div>
                  <span className="panel-overline">SITE PAGES</span>
                  <h2>
                    Pages{' '}
                    <span className="page-count">{visiblePages.length}</span>
                  </h2>
                </div>
                <span className="panel-menu">···</span>
              </div>
              <div className="pages-list">
                {visiblePages.map((page) => (
                  <button
                    key={page.id}
                    onClick={() => openPage(page)}
                    className={
                      page.id === activeId ? 'page-row selected' : 'page-row'
                    }
                  >
                    <span className="page-row-icon">
                      {page.path === '/' ? '⌂' : '▤'}
                    </span>
                    <span className="page-row-text">
                      <strong>{page.title}</strong>
                      <small>{page.path}</small>
                    </span>
                    <span className="page-row-status" />
                  </button>
                ))}
              </div>
              <form className="new-page-form" onSubmit={createPage}>
                <div className="form-divider">
                  <span>ADD A PAGE</span>
                </div>
                <label>
                  Page title
                  <input
                    value={newTitle}
                    onChange={(event) => {
                      setNewTitle(event.target.value);
                      if (newPath === 'about' || newPath === slugPath(newTitle))
                        setNewPath(slugPath(event.target.value));
                    }}
                    placeholder="e.g. About us"
                    required
                  />
                </label>
                <label>
                  URL path
                  <div className="path-input">
                    <span>/</span>
                    <input
                      value={newPath}
                      onChange={(event) =>
                        setNewPath(slugPath(event.target.value))
                      }
                      placeholder="about"
                      required
                    />
                  </div>
                </label>
                <button className="add-page-button" type="submit">
                  <span>＋</span> Create page
                </button>
              </form>
            </aside>

            <section className="canvas-panel">
              {draft ? (
                <>
                  <div className="canvas-heading">
                    <div>
                      <span className="panel-overline">PAGE CANVAS</span>
                      <input
                        className="canvas-page-title"
                        aria-label="Page title"
                        value={draft.title}
                        onChange={(event) =>
                          setDraft({ ...draft, title: event.target.value })
                        }
                      />
                      <p>
                        /
                        {draft.path === '/'
                          ? ''
                          : draft.path.replace(/^\//, '')}
                      </p>
                    </div>
                    <button
                      onClick={savePage}
                      className="save-button"
                      disabled={saving}
                    >
                      {saving ? 'Saving…' : 'Save changes'} <span>↗</span>
                    </button>
                  </div>
                  <div className="canvas-meta">
                    <span className="published-pill">
                      <i /> Published
                    </span>
                    <span>
                      Updated{' '}
                      {new Date(draft.updatedAt).toLocaleDateString('en-AU', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="canvas-meta-spacer" />
                    <span
                      className="meta-site-dot"
                      style={{ background: currentSite?.theme.brand }}
                    />
                    {currentSite?.name}
                  </div>
                  <div className="components-toolbar">
                    <div>
                      <strong>Page components</strong>
                      <span>{countComponents(draft.components)} blocks</span>
                    </div>
                    <div className="add-control">
                      <span>Add block</span>
                      {componentDefinitions.map((definition) => (
                        <button
                          key={definition.type}
                          onClick={() => addComponent(definition.type)}
                          title={definition.description}
                        >
                          <span>＋</span>
                          {definition.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="components-list">
                    {draft.components.length ? (
                      draft.components.map((component, index) => (
                        <ComponentEditor
                          key={component.id}
                          component={component}
                          index={index}
                          onChange={updateProps}
                          onRemove={removeComponent}
                          onAdd={addComponent}
                        />
                      ))
                    ) : (
                      <div className="empty-canvas">
                        <div>▧</div>
                        <strong>Your canvas is ready</strong>
                        <p>
                          Add a Section or Card Grid to start building this
                          page.
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="canvas-footer">
                    <span>
                      <i /> Autosave is off
                    </span>
                    <button onClick={savePage} disabled={saving}>
                      {saving ? 'Saving…' : 'Save changes'} <span>↗</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="empty-canvas empty-page">
                  <div>▤</div>
                  <strong>Select a page or create a new one</strong>
                  <p>Choose a page from the left to edit its content.</p>
                </div>
              )}
              {notice && (
                <div
                  className={
                    notice.includes('Could not')
                      ? 'toast-message error'
                      : 'toast-message'
                  }
                >
                  {notice}
                </div>
              )}
            </section>
          </div>
          <div className="manager-footnote">
            <span>RUGBY AUSTRALIA</span>
            <span>CONTENT TOOLS · 2026</span>
          </div>
        </div>
      </section>
    </div>
  );
}

function ComponentEditor({
  component,
  index,
  onChange,
  onRemove,
  onAdd,
}: {
  component: ComponentInstance;
  index: number;
  onChange: (id: string, name: string, value: unknown) => void;
  onRemove: (id: string) => void;
  onAdd: (type: ComponentType, parentId?: string) => void;
}) {
  const definition = getDefinition(component.type);
  return (
    <article
      className={`component-editor ${component.type === 'section' ? 'is-section' : ''}`}
    >
      <div className="component-editor-head">
        <span className="drag-handle">⠿</span>
        <span className="component-number">
          {String(index + 1).padStart(2, '0')}
        </span>
        <span className={`component-icon ${component.type}`}>
          {component.type === 'section' ? '▧' : '▦'}
        </span>
        <div className="component-title">
          <strong>{definition.label}</strong>
          <small>{definition.description}</small>
        </div>
        <span className="component-type-tag">
          {component.type === 'section' ? 'CONTAINER' : 'CONTENT'}
        </span>
        <button
          className="remove-component"
          title="Remove component"
          onClick={() => onRemove(component.id)}
        >
          ×
        </button>
      </div>
      <div className="component-fields">
        {definition.fields.map((field) => (
          <FieldEditor
            key={field.name}
            field={field}
            value={component.props[field.name]}
            onChange={(value) => onChange(component.id, field.name, value)}
          />
        ))}
      </div>
      {definition.allowsChildren && (
        <div className="nested-content">
          <div className="nested-heading">
            <span>CHILD COMPONENTS</span>
            <span>{component.children?.length ?? 0}</span>
          </div>
          {component.children?.map((child, childIndex) => (
            <ComponentEditor
              key={child.id}
              component={child}
              index={childIndex}
              onChange={onChange}
              onRemove={onRemove}
              onAdd={onAdd}
            />
          ))}
          <div className="nested-actions">
            <button onClick={() => onAdd('card-grid', component.id)}>
              ＋ Add Card Grid
            </button>
            <button onClick={() => onAdd('section', component.id)}>
              ＋ Add nested Section
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

function FieldEditor({
  field,
  value,
  onChange,
}: {
  field: FieldDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  if (field.type === 'select')
    return (
      <label className="editor-field">
        <span>{field.label}</span>
        <select
          value={String(value ?? '')}
          onChange={(event) => onChange(event.target.value)}
        >
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    );
  if (field.type === 'cards')
    return (
      <CardsEditor
        value={Array.isArray(value) ? (value as CardItem[]) : []}
        onChange={onChange}
        description={field.description}
      />
    );
  if (field.type === 'textarea')
    return (
      <label className="editor-field">
        <span>{field.label}</span>
        <textarea
          value={String(value ?? '')}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
    );
  return (
    <label className="editor-field">
      <span>{field.label}</span>
      <input
        value={String(value ?? '')}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function CardsEditor({
  value,
  onChange,
  description,
}: {
  value: CardItem[];
  onChange: (value: unknown) => void;
  description?: string;
}) {
  const update = (index: number, mutate: (item: CardItem) => CardItem) =>
    onChange(value.map((item, i) => (i === index ? mutate(item) : item)));
  return (
    <div className="cards-editor">
      <div className="cards-editor-heading">
        <span>
          Cards <b>{value.length}</b>
        </span>
        <button
          onClick={() =>
            onChange([
              ...value,
              {
                image: { url: '', alt: '' },
                heading: '',
                link: { label: 'Learn more', href: '' },
              },
            ])
          }
        >
          ＋ Add card
        </button>
      </div>
      {description && <p className="field-help">{description}</p>}
      {!value.length && (
        <p className="no-cards">No cards yet. Add one to get started.</p>
      )}
      {value.map((card, index) => (
        <div className="card-fields" key={index}>
          <div className="card-fields-heading">
            <span>Card {String(index + 1).padStart(2, '0')}</span>
            <button
              onClick={() => onChange(value.filter((_, i) => i !== index))}
            >
              Remove
            </button>
          </div>
          <label>
            Image URL
            <input
              value={card.image?.url ?? ''}
              onChange={(event) =>
                update(index, (item) => ({
                  ...item,
                  image: { ...item.image, url: event.target.value },
                }))
              }
              placeholder="https://…"
            />
          </label>
          <label>
            Image description
            <input
              value={card.image?.alt ?? ''}
              onChange={(event) =>
                update(index, (item) => ({
                  ...item,
                  image: { ...item.image, alt: event.target.value },
                }))
              }
              placeholder="Describe the image"
            />
          </label>
          <label>
            Card heading
            <input
              value={card.heading ?? ''}
              onChange={(event) =>
                update(index, (item) => ({
                  ...item,
                  heading: event.target.value,
                }))
              }
              placeholder="e.g. Our squad"
            />
          </label>
          <div className="card-link-grid">
            <label>
              Link label <small>Optional</small>
              <input
                value={card.link?.label ?? ''}
                onChange={(event) =>
                  update(index, (item) => ({
                    ...item,
                    link: {
                      label: event.target.value,
                      href: item.link?.href ?? '',
                    },
                  }))
                }
                placeholder="View more"
              />
            </label>
            <label>
              Link URL <small>Optional</small>
              <input
                value={card.link?.href ?? ''}
                onChange={(event) =>
                  update(index, (item) => ({
                    ...item,
                    link: {
                      label: item.link?.label ?? '',
                      href: event.target.value,
                    },
                  }))
                }
                placeholder="/squad"
              />
            </label>
          </div>
        </div>
      ))}
    </div>
  );
}

function mapComponents(
  items: ComponentInstance[],
  id: string,
  update: (item: ComponentInstance) => ComponentInstance,
): ComponentInstance[] {
  return items.map((item) =>
    item.id === id
      ? update(item)
      : {
          ...item,
          ...(item.children
            ? { children: mapComponents(item.children, id, update) }
            : {}),
        },
  );
}
function insertIntoSection(
  items: ComponentInstance[],
  parentId: string,
  child: ComponentInstance,
): ComponentInstance[] {
  return items.map((item) =>
    item.id === parentId
      ? { ...item, children: [...(item.children ?? []), child] }
      : {
          ...item,
          ...(item.children
            ? { children: insertIntoSection(item.children, parentId, child) }
            : {}),
        },
  );
}
function removeFromTree(
  items: ComponentInstance[],
  id: string,
): ComponentInstance[] {
  return items
    .filter((item) => item.id !== id)
    .map((item) => ({
      ...item,
      ...(item.children ? { children: removeFromTree(item.children, id) } : {}),
    }));
}
function countComponents(items: ComponentInstance[]): number {
  return items.reduce(
    (count, item) => count + 1 + countComponents(item.children ?? []),
    0,
  );
}
