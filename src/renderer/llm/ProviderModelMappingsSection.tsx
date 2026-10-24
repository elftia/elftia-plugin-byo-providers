import { ArrowRight, ChevronDown, ChevronRight, Shuffle } from "lucide-react";
import React, { useEffect, useId, useState } from "react";

import type { HostProviderModelMappings } from "@elftia/plugin-types";

import { Badge, Button } from "../host/ui";
import { useTranslation } from "../host/vendored/useTranslation";
import { llmConfigClient } from "../llmConfigClient";

type MappingState =
  | { providerId: string; status: "loading" | "error" }
  | { providerId: string; status: "ready"; value: HostProviderModelMappings };

export function ProviderModelMappingsSection({
  providerId,
}: {
  providerId: string;
}) {
  const t = useTranslation();
  const panelId = useId();
  const [expanded, setExpanded] = useState(false);
  const [state, setState] = useState<MappingState>({
    providerId,
    status: "loading",
  });

  useEffect(() => {
    if (!expanded) return;
    let current = true;
    setState({ providerId, status: "loading" });
    void Promise.resolve()
      .then(() => llmConfigClient.getProviderModelMappings(providerId))
      .then((value) => {
        if (!current) return;
        if (value.providerId !== providerId)
          throw new Error("Provider mapping scope mismatch");
        setState({ providerId, status: "ready", value });
      })
      .catch(() => {
        if (current) setState({ providerId, status: "error" });
      });
    return () => {
      current = false;
    };
  }, [expanded, providerId]);

  // Scope during render as well as in the effect: never paint the previous
  // provider's rows in the commit before the new selection's effect runs.
  const visible = state.providerId === providerId ? state : null;
  const value = visible?.status === "ready" ? visible.value : null;
  const preview = value?.supported ? value : null;
  const status = visible?.status ?? "loading";

  return (
    <section
      className="rounded-lg border border-border"
      data-testid="provider-model-mappings"
      data-provider-id={providerId}
    >
      <Button
        type="button"
        variant="ghost"
        className="h-auto w-full justify-between p-3 text-left"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => setExpanded((previous) => !previous)}
        data-testid="provider-model-mappings-toggle"
      >
        <span className="flex items-center gap-2">
          <Shuffle
            className="h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
          <span>{t("providerMappings.title")}</span>
          {preview ? (
            <Badge variant="secondary">{preview.mappings.length}</Badge>
          ) : null}
        </span>
        {expanded ? (
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        ) : (
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        )}
      </Button>
      {expanded ? (
        <div
          id={panelId}
          className="space-y-3 border-t border-border p-3"
          data-testid="provider-model-mappings-content"
          data-state={value && !value.supported ? "unavailable" : status}
        >
          <p className="text-xs text-muted-foreground">
            {t("providerMappings.description")}
          </p>
          {status === "loading" ? (
            <p role="status" className="text-sm">
              {t("providerMappings.loading")}
            </p>
          ) : null}
          {status === "error" ? (
            <p role="alert" className="text-sm text-destructive">
              {t("providerMappings.error")}
            </p>
          ) : null}
          {value && !value.supported ? (
            <p
              className="text-sm"
              data-testid="provider-model-mappings-unavailable"
            >
              {t(
                value.reason === "provider-not-found"
                  ? "providerMappings.providerMissing"
                  : "providerMappings.unavailable",
              )}
            </p>
          ) : null}
          {preview ? (
            <>
              <Badge
                variant="outline"
                data-testid="provider-model-mappings-mode"
              >
                {t(
                  preview.force
                    ? "providerMappings.strict"
                    : "providerMappings.automatic",
                )}
              </Badge>
              {preview.mappings.length === 0 ? (
                <p
                  className="text-sm"
                  data-testid="provider-model-mappings-empty"
                >
                  {t("providerMappings.empty")}
                </p>
              ) : (
                <div
                  className="divide-y divide-border rounded-md border border-border"
                  data-testid="provider-model-mappings-preview"
                >
                  {preview.mappings.map((row, index) => (
                    <div
                      key={`${row.source}-${index}`}
                      className="flex flex-wrap items-center gap-2 px-3 py-2 text-xs"
                      data-testid="provider-model-mapping-row"
                    >
                      <span className="break-all font-mono">{row.source}</span>
                      <ArrowRight
                        className="h-3 w-3 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <span className="break-all font-mono">{row.target}</span>
                      {row.effort ? (
                        <Badge
                          variant="secondary"
                          className="font-mono"
                          title={t("providerMappings.effort", {
                            level: row.effort,
                          })}
                        >
                          {t("providerMappings.effort", { level: row.effort })}
                        </Badge>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
              {preview.mappings.length > 0 ? (
                <p className="text-xs text-muted-foreground">
                  {t(
                    preview.force
                      ? "providerMappings.strictHint"
                      : "providerMappings.automaticHint",
                  )}
                </p>
              ) : null}
              <p className="text-xs text-muted-foreground">
                {t("providerMappings.editHint")}
              </p>
            </>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
