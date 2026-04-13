// Supabase Edge Function
// Executa sincronização em lote de processos com cursor incremental.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

type Processo = {
  id: string;
  numero_cnj: string;
  tribunal: string | null;
  orgao_julgador: string | null;
  advogado_oab: string | null;
  ultima_sincronizacao_em: string | null;
};

type MovimentacaoExterna = {
  external_reference?: string;
  titulo: string;
  resumo: string;
  data_evento: string;
  classificacao?: "informativo" | "atenção" | "possível prazo";
};

const supabase = createClient(
  Deno.env.get("PROJECT_URL")!,
  Deno.env.get("SERVICE_ROLE_KEY")!,
  {
    auth: { persistSession: false },
  },
);

const BATCH_SIZE = Number(Deno.env.get("PROCESS_SYNC_BATCH_SIZE") || "50");

function classifyUpdate(input: MovimentacaoExterna) {
  const text = `${input.titulo} ${input.resumo}`.toLowerCase();

  if (
    ["prazo", "intima", "manifest", "contest", "recurso", "embargo"].some((term) =>
      text.includes(term),
    )
  ) {
    return "possível prazo";
  }

  if (
    ["sentença", "decisão", "despacho", "acórdão", "certidão", "edital"].some((term) =>
      text.includes(term),
    )
  ) {
    return "atenção";
  }

  return "informativo";
}

async function getProcessUpdates(processo: Processo): Promise<MovimentacaoExterna[]> {
  // Mock inicial. Substitua pela consulta real ao Datajud/DJEN/provedor externo.
  // Retorne apenas eventos novos ou um recorte relevante para deduplicação posterior.
  console.log(`Consultando atualizações para ${processo.numero_cnj}`);
  return [];
}

async function sendEmailNotification(input: {
  processoId: string;
  numeroCnj: string;
  movimentacao: MovimentacaoExterna;
}) {
  console.log("E-mail mockado para movimentação relevante", input);
}

async function getCursor() {
  const { data, error } = await supabase
    .from("sincronizacao_cursor")
    .select("ultimo_offset")
    .eq("job_name", "process-sync")
    .maybeSingle();

  if (error) throw error;
  return data?.ultimo_offset || 0;
}

async function saveCursor(offset: number) {
  const { error } = await supabase.from("sincronizacao_cursor").upsert(
    {
      job_name: "process-sync",
      ultimo_offset: offset,
      atualizado_em: new Date().toISOString(),
    },
    { onConflict: "job_name" },
  );

  if (error) throw error;
}

async function fetchProcessBatch(offset: number) {
  const { data, error } = await supabase
    .from("processos")
    .select("id, numero_cnj, tribunal, orgao_julgador, advogado_oab, ultima_sincronizacao_em")
    .eq("status_monitoramento", "ativo")
    .order("id", { ascending: true })
    .range(offset, offset + BATCH_SIZE - 1);

  if (error) throw error;
  return (data || []) as Processo[];
}

async function persistMovimentacao(processo: Processo, movimentacao: MovimentacaoExterna) {
  const classificacao = movimentacao.classificacao || classifyUpdate(movimentacao);

  const { error } = await supabase.from("movimentacoes").upsert(
    {
      processo_id: processo.id,
      external_reference:
        movimentacao.external_reference ||
        `${processo.id}:${movimentacao.titulo}:${movimentacao.data_evento}`,
      titulo: movimentacao.titulo,
      resumo: movimentacao.resumo,
      data_evento: movimentacao.data_evento,
      classificacao,
      lido: false,
    },
    { onConflict: "external_reference" },
  );

  if (error) throw error;

  const { error: processError } = await supabase
    .from("processos")
    .update({
      ultima_sincronizacao_em: new Date().toISOString(),
      ultimo_evento_em: movimentacao.data_evento,
    })
    .eq("id", processo.id);

  if (processError) throw processError;

  if (classificacao !== "informativo") {
    await sendEmailNotification({
      processoId: processo.id,
      numeroCnj: processo.numero_cnj,
      movimentacao: { ...movimentacao, classificacao },
    });
  }
}

Deno.serve(async () => {
  const startedAt = new Date().toISOString();
  const logs: Array<Record<string, unknown>> = [];

  try {
    let offset = await getCursor();
    let processos = await fetchProcessBatch(offset);

    if (processos.length === 0) {
      offset = 0;
      processos = await fetchProcessBatch(offset);
    }

    if (processos.length === 0) {
      return Response.json({
        ok: true,
        message: "Nenhum processo ativo encontrado para sincronização.",
        startedAt,
      });
    }

    let updated = 0;
    let failed = 0;

    for (const processo of processos) {
      try {
        const updates = await getProcessUpdates(processo);

        for (const update of updates) {
          await persistMovimentacao(processo, update);
        }

        if (updates.length > 0) {
          updated += 1;
        } else {
          const { error } = await supabase
            .from("processos")
            .update({ ultima_sincronizacao_em: new Date().toISOString() })
            .eq("id", processo.id);

          if (error) throw error;
        }

        logs.push({
          processo_id: processo.id,
          numero_cnj: processo.numero_cnj,
          status: "ok",
          atualizacoes: updates.length,
        });
      } catch (error) {
        failed += 1;
        logs.push({
          processo_id: processo.id,
          numero_cnj: processo.numero_cnj,
          status: "erro",
          mensagem: error instanceof Error ? error.message : "Falha ao sincronizar processo.",
        });
      }
    }

    const nextOffset = offset + processos.length;
    await saveCursor(nextOffset);

    const { error: logError } = await supabase.from("sincronizacao_logs").insert({
      job_name: "process-sync",
      lote_offset: offset,
      lote_tamanho: processos.length,
      processos_atualizados: updated,
      processos_com_erro: failed,
      payload: { startedAt, logs },
    });

    if (logError) {
      console.error("Falha ao salvar log da execução", logError);
    }

    return Response.json({
      ok: true,
      startedAt,
      processed: processos.length,
      updated,
      failed,
      nextOffset,
    });
  } catch (error) {
    console.error("Falha geral na sincronização automática", error);

    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Falha geral na sincronização automática.",
        startedAt,
      },
      { status: 500 },
    );
  }
});
