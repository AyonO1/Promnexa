import React from 'react';
import type { Category, PromptTemplate } from '../../../lib/types';
import { searchTemplates } from '../../../lib/templates';
import { CATEGORY_INFO, copyToClipboard } from '../../../lib/optimizer';
import { getT, type Language } from '../../../lib/i18n';
import { Search, Copy, BookOpen, X, Wand2 } from 'lucide-react';

interface LibraryScreenProps {
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  onUseTemplate?: (text: string, category: Category) => void;
  language?: Language;
}

export const LibraryScreen: React.FC<LibraryScreenProps> = ({ addToast, onUseTemplate, language = 'en' }) => {
  const t = getT(language);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<Category | undefined>(undefined);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const filteredTemplates = React.useMemo(
    () => searchTemplates(searchQuery, selectedCategory),
    [searchQuery, selectedCategory]
  );

  const categories: (Category | undefined)[] = [undefined, 'education', 'coding', 'learning', 'daily', 'writing', 'research', 'business'];

  const handleCopyTemplate = async (template: PromptTemplate) => {
    try {
      await copyToClipboard(template.template);
      addToast(t.copied, 'success');
    } catch {
      addToast('Failed to copy', 'error');
    }
  };

  const handleToggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="screen-enter">
      <h1 className="section-title">{t.libraryTitle}</h1>
      <p className="section-subtitle">{t.librarySubtitle}</p>

      {/* Search */}
      <div className="search-wrapper" style={{ marginTop: 'var(--space-3)' }}>
        <Search className="search-icon" />
        <input
          className="search-input"
          placeholder={t.searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            className="icon-btn"
            style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)' }}
            onClick={() => setSearchQuery('')}
          >
            <X />
          </button>
        )}
      </div>

      {/* Category filters */}
      <div className="chips-container" style={{ marginTop: 'var(--space-3)', flexWrap: 'wrap' }}>
        {categories.map((cat) => (
          <button
            key={cat || 'all'}
            className={`chip ${selectedCategory === cat ? 'chip--active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat ? `${CATEGORY_INFO[cat].emoji} ${CATEGORY_INFO[cat].label}` : t.allCategories}
          </button>
        ))}
      </div>

      {/* Results count */}
      <div style={{ margin: 'var(--space-3) 0 var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
        {filteredTemplates.length} {t.templatesFound}
      </div>

      {/* Template list */}
      <div style={{ maxHeight: '310px', overflowY: 'auto', paddingRight: '2px' }}>
        {filteredTemplates.length > 0 ? (
          filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="prompt-card"
              onClick={() => handleToggleExpand(template.id)}
            >
              <div className="prompt-card__title">{template.title}</div>
              <div className="prompt-card__desc">{template.description}</div>

              {expandedId === template.id && (
                <div style={{
                  marginTop: 'var(--space-2)',
                  padding: 'var(--space-2)',
                  background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-secondary)',
                  lineHeight: 'var(--leading-relaxed)',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '150px',
                  overflowY: 'auto',
                }}>
                  {template.template}
                </div>
              )}

              <div className="prompt-card__footer">
                <div className="prompt-card__tags">
                  <span className="tag">{CATEGORY_INFO[template.category].emoji} {CATEGORY_INFO[template.category].label}</span>
                  {template.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
                <div className="prompt-card__actions">
                  {onUseTemplate && (
                    <button
                      className="chip"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUseTemplate(template.template, template.category);
                      }}
                      title="Use this template in Optimizer"
                      style={{ padding: '2px 8px', fontSize: 'var(--text-2xs)' }}
                    >
                      <Wand2 style={{ width: '10px', height: '10px' }} /> {t.useTemplate}
                    </button>
                  )}
                  <button
                    className="icon-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyTemplate(template);
                    }}
                    title="Copy template"
                  >
                    <Copy />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-state__icon">
              <BookOpen />
            </div>
            <div className="empty-state__title">{t.noTemplates}</div>
            <div className="empty-state__desc">
              {t.noTemplatesDesc}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
