/**
 * TransformerConfig — COPIED from the host
 * `features/settings/components/TransformerConfig.tsx` (P2b-2 `byo-p2-llm-2`),
 * rewired to the plugin bridge:
 *   - `@/components/ui/{badge,button,input,switch}` → `../host/ui`
 *   - `@shared/llm-config` TYPES stay (bundled via the `@shared` alias)
 *
 * A PURE controlled component — NO IPC, NO port, NO token. `availableTransformers`
 * is the bundled `BUILTIN_TRANSFORMERS` constant; `selectedTransformers` is the
 * provider body's `transformer.use`; `onChange` updates `formData` and persistence
 * rides the EXISTING `updateProvider` (the masked `host.services.llmConfig` port).
 *
 * @module byo-providers/renderer/llm/TransformerConfig
 */
import { ChevronDown,
  ChevronRight,
  Info,
  Plus,
  Settings2,
  X} from 'lucide-react';
import { useState } from 'react';

import type { TransformerEntry,TransformerInfo } from '@byo/domain/llm';

import { Badge, Button, Input, Switch } from '../host/ui';

interface TransformerConfigProps {
  /** Available transformers from the system */
  availableTransformers: TransformerInfo[];
  /** Currently selected/active transformers */
  selectedTransformers: TransformerEntry[];
  /** Callback when transformers change */
  onChange: (transformers: TransformerEntry[]) => void;
  /** Whether the component is in read-only mode */
  readOnly?: boolean;
}

interface TransformerItemProps {
  entry: TransformerEntry;
  info?: TransformerInfo;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onRemove: () => void;
  onUpdateOptions: (options: Record<string, unknown>) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  readOnly?: boolean;
}

// Parse a transformer entry to get name and options
const parseEntry = (entry: TransformerEntry): { name: string; options?: Record<string, unknown> } => {
  if (typeof entry === 'string') {
    return { name: entry };
  }
  return { name: entry[0], options: entry[1] };
};

// Create a transformer entry from name and options
const createEntry = (name: string, options?: Record<string, unknown>): TransformerEntry => {
  if (options && Object.keys(options).length > 0) {
    return [name, options];
  }
  return name;
};

function TransformerItem({
  entry,
  info,
  index: _index,
  isExpanded,
  onToggleExpand,
  onRemove,
  onUpdateOptions,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  readOnly
}: TransformerItemProps) {
  const { name, options } = parseEntry(entry);
  const hasOptions = info?.hasOptions || (options && Object.keys(options).length > 0);
  const schema = info?.optionSchema;

  const handleOptionChange = (key: string, value: unknown) => {
    const newOptions = { ...options, [key]: value };
    onUpdateOptions(newOptions);
  };

  return (
    <div className="border rounded-lg bg-card">
      <div className="flex items-center gap-2 p-2">
        {!readOnly && (
          <div className="flex flex-col">
            <button
              className="p-0.5 hover:bg-muted rounded disabled:opacity-30"
              onClick={onMoveUp}
              disabled={isFirst}
              title="Move up"
            >
              <ChevronDown className="h-3 w-3 rotate-180" />
            </button>
            <button
              className="p-0.5 hover:bg-muted rounded disabled:opacity-30"
              onClick={onMoveDown}
              disabled={isLast}
              title="Move down"
            >
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{name}</span>
            {options && Object.keys(options).length > 0 ? <Badge variant="outline" className="text-xs">
                {Object.keys(options).length} option(s)
              </Badge> : null}
          </div>
          {info?.description ? <p className="text-xs text-muted-foreground truncate">{info.description}</p> : null}
        </div>

        {hasOptions ? <button
            className="p-1 hover:bg-muted rounded"
            onClick={onToggleExpand}
            title={isExpanded ? 'Collapse options' : 'Expand options'}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button> : null}

        {!readOnly && (
          <button
            className="p-1 hover:bg-muted rounded text-red-500"
            onClick={onRemove}
            title="Remove transformer"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Expanded options */}
      {isExpanded && hasOptions ? <div className="border-t p-3 space-y-3 bg-muted/30">
          {schema ? (
            // Render based on schema
            Object.entries(schema).map(([key, schemaItem]) => (
              <div key={key} className="space-y-1">
                <label className="text-xs font-medium flex items-center gap-1">
                  {key}
                  {schemaItem.description ? <span className="text-muted-foreground" title={schemaItem.description}>
                      <Info className="h-3 w-3" />
                    </span> : null}
                </label>
                {schemaItem.type === 'boolean' ? (
                  <Switch
                    checked={Boolean(options?.[key] ?? schemaItem.default)}
                    onCheckedChange={(checked) => handleOptionChange(key, checked)}
                    disabled={readOnly}
                  />
                ) : schemaItem.type === 'number' ? (
                  <Input
                    type="number"
                    className="h-8"
                    value={String(options?.[key] ?? schemaItem.default ?? '')}
                    onChange={(e) => handleOptionChange(key, Number(e.target.value) || undefined)}
                    disabled={readOnly}
                    placeholder={String(schemaItem.default ?? '')}
                  />
                ) : (
                  <Input
                    type="text"
                    className="h-8"
                    value={String(options?.[key] ?? schemaItem.default ?? '')}
                    onChange={(e) => handleOptionChange(key, e.target.value || undefined)}
                    disabled={readOnly}
                    placeholder={String(schemaItem.default ?? '')}
                  />
                )}
              </div>
            ))
          ) : options ? (
            // Render existing options without schema
            <div className="space-y-2">
              {Object.entries(options).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-xs font-medium min-w-[80px]">{key}:</span>
                  <Input
                    type="text"
                    className="h-7 text-xs flex-1"
                    value={String(value ?? '')}
                    onChange={(e) => handleOptionChange(key, e.target.value || undefined)}
                    disabled={readOnly}
                  />
                  {!readOnly && (
                    <button
                      className="p-1 hover:bg-muted rounded text-red-500"
                      onClick={() => {
                        const newOptions = { ...options };
                        delete newOptions[key];
                        onUpdateOptions(newOptions);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              This transformer supports options but none are currently configured.
            </p>
          )}
        </div> : null}
    </div>
  );
}

export function TransformerConfig({
  availableTransformers,
  selectedTransformers,
  onChange,
  readOnly = false
}: TransformerConfigProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Get names of currently selected transformers
  const selectedNames = selectedTransformers.map(e => parseEntry(e).name);

  // Filter available transformers that haven't been added yet
  const availableToAdd = availableTransformers.filter(t => !selectedNames.includes(t.name));
  const filteredAvailable = searchTerm
    ? availableToAdd.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : availableToAdd;

  const handleAdd = (transformer: TransformerInfo) => {
    const newEntry = createEntry(transformer.name);
    onChange([...selectedTransformers, newEntry]);
    setShowAddMenu(false);
    setSearchTerm('');
  };

  const handleRemove = (index: number) => {
    const newList = [...selectedTransformers];
    newList.splice(index, 1);
    onChange(newList);
    if (expandedIndex === index) {
      setExpandedIndex(null);
    }
  };

  const handleUpdateOptions = (index: number, options: Record<string, unknown>) => {
    const { name } = parseEntry(selectedTransformers[index]);
    const newList = [...selectedTransformers];
    newList[index] = createEntry(name, options);
    onChange(newList);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newList = [...selectedTransformers];
    [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
    onChange(newList);
    if (expandedIndex === index) {
      setExpandedIndex(index - 1);
    } else if (expandedIndex === index - 1) {
      setExpandedIndex(index);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index === selectedTransformers.length - 1) return;
    const newList = [...selectedTransformers];
    [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
    onChange(newList);
    if (expandedIndex === index) {
      setExpandedIndex(index + 1);
    } else if (expandedIndex === index + 1) {
      setExpandedIndex(index);
    }
  };

  const getTransformerInfo = (name: string) => {
    return availableTransformers.find(t => t.name === name);
  };

  return (
    <div className="space-y-3">
      {/* Selected transformers list */}
      {selectedTransformers.length > 0 ? (
        <div className="space-y-2">
          {selectedTransformers.map((entry, index) => {
            const { name } = parseEntry(entry);
            const info = getTransformerInfo(name);
            return (
              <TransformerItem
                key={`${name}-${index}`}
                entry={entry}
                info={info}
                index={index}
                isExpanded={expandedIndex === index}
                onToggleExpand={() => setExpandedIndex(expandedIndex === index ? null : index)}
                onRemove={() => handleRemove(index)}
                onUpdateOptions={(options) => handleUpdateOptions(index, options)}
                onMoveUp={() => handleMoveUp(index)}
                onMoveDown={() => handleMoveDown(index)}
                isFirst={index === 0}
                isLast={index === selectedTransformers.length - 1}
                readOnly={readOnly}
              />
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic p-2 text-center border border-dashed rounded">
          No transformers configured
        </p>
      )}

      {/* Add transformer button/menu */}
      {!readOnly && (
        <div className="relative">
          {showAddMenu ? (
            <div className="border rounded-lg p-2 space-y-2 bg-popover shadow-md">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search transformers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-8"
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAddMenu(false);
                    setSearchTerm('');
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {filteredAvailable.length > 0 ? (
                  filteredAvailable.map(t => (
                    <button
                      key={t.name}
                      className="w-full flex items-start gap-2 p-2 rounded hover:bg-muted text-left"
                      onClick={() => handleAdd(t)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{t.name}</div>
                        {t.description ? <p className="text-xs text-muted-foreground line-clamp-2">
                            {t.description}
                          </p> : null}
                      </div>
                      {t.hasOptions ? <Badge variant="outline" className="text-xs shrink-0">
                          <Settings2 className="h-3 w-3 mr-1" />
                          Options
                        </Badge> : null}
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {searchTerm ? 'No matching transformers' : 'All transformers already added'}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowAddMenu(true)}
              disabled={availableToAdd.length === 0}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Transformer
            </Button>
          )}
        </div>
      )}

      {/* Help text */}
      <p className="text-xs text-muted-foreground">
        Transformers modify API requests/responses in sequence. Order matters - transformers are applied top to bottom.
      </p>
    </div>
  );
}

export default TransformerConfig;
