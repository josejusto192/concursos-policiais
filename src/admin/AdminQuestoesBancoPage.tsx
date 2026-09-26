import { Funnel, MagnifyingGlass, Sparkle, X } from '@phosphor-icons/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { QuestaoRow } from '../lib/database.types';
import {
  searchQuestoes,
  fetchFiltrosQuestoes,
  fetchNomesUsuarios,
  reviewWithAI,
  type QuestaoSearchFilters,
  type FiltrosQuestoes,
} from '../lib/adminQueries';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { ErrorState, LoadingCards } from '../components/Feedback';
import AdminLayout from './AdminLayout';

const EMPTY: FiltrosQuestoes = { bancas: [], disciplinas: [], cargos: [], niveis: [], orgaos: [] };
const FILTER_KEYS = ['disciplina', 'banca', 'cargo', 'nivel_escolaridade', 'orgao', 'assunto'] as const;
const STATUS = [
  { value: 'todas', label: 'Todas as questões' },
  { value: 'nao_revisadas', label: 'Aguardando revisão' },
  { value: 'revisadas', label: 'Revisadas' },
] as const;
interface BatchState {
  running: boolean;
  done: number;
  total: number;
  falhas: string[];
}

export default function AdminQuestoesBancoPage() {
  const [params, setParams] = useSearchParams();
  const texto = params.get('q') || '';
  const textoDeb = useDebouncedValue(texto);
  const assuntoDeb = useDebouncedValue(params.get('assunto') || '');
  const status = STATUS.find((s) => s.value === params.get('status'))?.value || 'todas';
  const pageValue = Number(params.get('page'));
  const page = Number.isSafeInteger(pageValue) ? Math.max(0, pageValue) : 0;
  const [showFilters, setShowFilters] = useState(false);
  const [opcoes, setOpcoes] = useState<FiltrosQuestoes>(EMPTY);
  const [results, setResults] = useState<QuestaoRow[]>([]);
  const [nomes, setNomes] = useState<Map<string, string>>(new Map());
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [optionsError, setOptionsError] = useState(false);
  const [tick, setTick] = useState(0);
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set());
  const [batch, setBatch] = useState<BatchState | null>(null);
  const cancelRef = useRef(false);
  const filtersKey = FILTER_KEYS.filter((k) => k !== 'assunto')
    .map((k) => params.get(k) || '')
    .join('\u0000');
  const filters = useMemo<QuestaoSearchFilters>(() => {
    const values = filtersKey.split('\u0000');
    return {
      disciplina: values[0] || undefined,
      banca: values[1] || undefined,
      cargo: values[2] || undefined,
      nivel_escolaridade: values[3] || undefined,
      orgao: values[4] || undefined,
      apenas: status,
      texto: textoDeb.trim() || undefined,
      assunto: assuntoDeb.trim() || undefined,
    };
  }, [filtersKey, status, textoDeb, assuntoDeb]);
  const activeFilters = FILTER_KEYS.filter((k) => params.get(k)).length;

  useEffect(() => {
    let alive = true;
    fetchFiltrosQuestoes()
      .then((v) => {
        if (alive) setOpcoes(v);
      })
      .catch(() => {
        if (alive) setOptionsError(true);
      });
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    setSelecionadas(new Set());
    searchQuestoes(filters, page)
      .then(async (result) => {
        if (!alive) return;
        setResults(result.rows);
        setTotal(result.total);
        const ids = result.rows.map((q) => q.revisado_por).filter((id): id is string => !!id);
        try {
          const names = await fetchNomesUsuarios(ids);
          if (alive) setNomes(names);
        } catch {
          if (alive) setNomes(new Map());
        }
      })
      .catch(() => {
        if (alive) setError('Não foi possível buscar as questões. Seus filtros foram mantidos.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [filters, page, tick]);
  useEffect(
    () => () => {
      cancelRef.current = true;
    },
    [],
  );
  function change(key: string, value: string) {
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (value) next.set(key, value);
        else next.delete(key);
        if (key !== 'page') next.delete('page');
        return next;
      },
      { replace: key === 'q' || key === 'assunto' },
    );
  }
  function toggle(id: string) {
    setSelecionadas((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function selectPage() {
    const ids = results.filter((q) => !q.revisado).map((q) => q.id);
    setSelecionadas((previous) => (ids.every((id) => previous.has(id)) ? new Set() : new Set(ids)));
  }
  async function reviewBatch() {
    if (!selecionadas.size || batch?.running) return;
    const ids = [...selecionadas];
    cancelRef.current = false;
    setBatch({ running: true, done: 0, total: ids.length, falhas: [] });
    const failures: string[] = [];
    for (let i = 0; i < ids.length; i++) {
      if (cancelRef.current) break;
      try {
        await reviewWithAI(ids[i]);
      } catch {
        failures.push('Não foi possível revisar uma das questões.');
      }
      setBatch({ running: true, done: i + 1, total: ids.length, falhas: [...failures] });
    }
    setBatch((previous) => (previous ? { ...previous, running: false } : null));
    setSelecionadas(new Set());
    setTick((t) => t + 1);
  }
  const filterOptions = [
    { key: 'disciplina', label: 'Disciplina', values: opcoes.disciplinas },
    { key: 'banca', label: 'Banca', values: opcoes.bancas },
    { key: 'cargo', label: 'Cargo', values: opcoes.cargos },
    { key: 'nivel_escolaridade', label: 'Escolaridade', values: opcoes.niveis },
    { key: 'orgao', label: 'Órgão', values: opcoes.orgaos },
  ];
  return (
    <AdminLayout>
      <span className="eyebrow">CURADORIA DE CONTEÚDO</span>
      <h1>Banco de questões</h1>
      <p className="mt-2 text-sm text-text2">Encontre, revise e prepare o próximo conteúdo dos seus alunos.</p>
      <section className="admin-search-panel" aria-label="Buscar e filtrar questões">
        <div className="filter-tabs" aria-label="Status da revisão">
          {STATUS.map((s) => (
            <button
              key={s.value}
              className={status === s.value ? 'active' : ''}
              aria-pressed={status === s.value}
              disabled={batch?.running}
              onClick={() => change('status', s.value)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="admin-search-line">
          <label className="search-field">
            <MagnifyingGlass size={20} />
            <input
              aria-label="Buscar no enunciado"
              placeholder="Buscar no enunciado…"
              value={texto}
              disabled={batch?.running}
              onChange={(e) => change('q', e.target.value)}
            />
          </label>
          <button
            className="button button-secondary"
            aria-expanded={showFilters}
            aria-controls="question-filters"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Funnel size={17} />
            Filtros{activeFilters > 0 && <span className="nav-count">{activeFilters}</span>}
          </button>
        </div>
        {showFilters && (
          <div id="question-filters" className="filter-grid">
            {filterOptions.map((f) => (
              <label key={f.key}>
                {f.label}
                <select value={params.get(f.key) || ''} disabled={batch?.running} onChange={(e) => change(f.key, e.target.value)}>
                  <option value="">Todas as opções</option>
                  {f.values.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
            ))}
            <label>
              Assunto
              <input
                placeholder="Buscar assunto…"
                value={params.get('assunto') || ''}
                disabled={batch?.running}
                onChange={(e) => change('assunto', e.target.value)}
              />
            </label>
          </div>
        )}
        {(activeFilters > 0 || texto || status !== 'todas') && (
          <button className="button button-text mt-3" disabled={batch?.running} onClick={() => setParams({})}>
            <X size={14} />
            Limpar filtros
          </button>
        )}
        {showFilters && optionsError && (
          <p role="status" className="text-xs text-error mt-3">
            As opções de filtro não carregaram. A busca por texto continua disponível.
          </p>
        )}
      </section>
      <div className="list-toolbar">
        <span className="text-xs text-text2" role="status">
          {loading ? 'Buscando questões…' : `${total.toLocaleString('pt-BR')} questões encontradas`}
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={selectPage}
            disabled={loading || !!batch?.running || !results.some((q) => !q.revisado)}
            className="button button-secondary"
          >
            Selecionar pendentes
          </button>
          {selecionadas.size > 0 && !batch?.running && (
            <button onClick={reviewBatch} className="button button-primary">
              <Sparkle size={17} />
              Revisar com IA ({selecionadas.size})
            </button>
          )}
        </div>
      </div>
      {batch && (
        <div className="panel mb-4" role="status">
          {batch.running ? (
            <>
              <p>
                Revisando {batch.done} de {batch.total} questões…
              </p>
              <button
                className="button button-text"
                onClick={() => {
                  cancelRef.current = true;
                }}
              >
                Parar após esta questão
              </button>
            </>
          ) : (
            <p>
              {batch.done < batch.total ? 'Revisão interrompida' : 'Revisão concluída'}: {batch.done - batch.falhas.length} de{' '}
              {batch.total} revisadas.
              {batch.falhas.length > 0 && ` ${batch.falhas.length} falharam. Tente novamente nas questões pendentes.`}
            </p>
          )}
        </div>
      )}
      {error ? (
        <ErrorState message={error} retry={() => setTick((t) => t + 1)} />
      ) : loading ? (
        <LoadingCards />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          {results.map((q) => (
            <div key={q.id} className="question-list-row flex items-start gap-3 border-t border-gray-100 first:border-t-0">
              <input
                type="checkbox"
                className="h-5 w-5 flex-none"
                aria-label={`Selecionar questão: ${q.enunciado?.slice(0, 70)}`}
                disabled={q.revisado || batch?.running}
                checked={selecionadas.has(q.id)}
                onChange={() => toggle(q.id)}
              />
              <div className="min-w-0 flex-1">
                <div className="line-clamp-2 text-sm font-semibold text-ink">{q.enunciado}</div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-text2">
                  <span>{[q.banca, q.ano, q.disciplina].filter(Boolean).join(' · ')}</span>
                  <span className={`pill ${q.revisado ? 'green' : 'amber'}`}>
                    {q.revisado ? 'Revisada' : 'Aguardando revisão'}
                  </span>
                  {q.revisado_por && nomes.get(q.revisado_por) && <span>por {nomes.get(q.revisado_por)}</span>}
                </div>
              </div>
              <Link to={`/admin/questoes/${q.id}`} className="text-xs font-extrabold text-blue">
                Revisar →
              </Link>
            </div>
          ))}
          {!results.length && (
            <div className="empty-state">
              <MagnifyingGlass size={32} />
              <h3>Nenhuma questão por aqui</h3>
              <p>Tente uma busca mais ampla ou remova alguns filtros.</p>
              <button className="button button-text" onClick={() => setParams({})}>
                Limpar filtros
              </button>
            </div>
          )}
        </div>
      )}
      <div className="pagination">
        <span>
          Página {page + 1} de {Math.max(1, Math.ceil(total / 20))}
        </span>
        <div className="flex gap-2">
          <button disabled={loading || page === 0 || batch?.running} onClick={() => change('page', String(page - 1))}>
            ← Anterior
          </button>
          <button
            disabled={loading || (page + 1) * 20 >= total || batch?.running}
            onClick={() => change('page', String(page + 1))}
          >
            Próxima →
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
