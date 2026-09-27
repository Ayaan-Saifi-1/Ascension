'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Layers3,
  LoaderCircle,
  ShieldAlert,
  TriangleAlert,
  Upload,
  Plus,
  Download,
  RefreshCw,
  Shield,
  Check,
  CircleX,
  MapPin,
  Network,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { api, API_BASE } from '@/lib/api';
import TrendChart from '@/components/trend-chart';
import DashboardCharts, { type DashboardChartData } from '@/components/dashboard-charts';
import { contextGroups, nearMissFormGroups, accidentFormGroups } from '@/lib/input-fields';
import ComingSoon from '@/components/coming-soon';

type View = 'dashboard' | 'analyze' | 'precursors' | 'review';
const navigation = [
  ['dashboard', 'Overview', BarChart3],
  ['analyze', 'Reports & analysis', FileText],
  ['precursors', 'Precursor library', Layers3],
  ['review', 'HSSE review', ClipboardCheck],
] as const;
const names = {
  dashboard: 'Safety overview',
  analyze: 'Report analysis',
  precursors: 'Precursor library',
  review: 'HSSE review',
};
const human = (s: any) =>
  String(s ?? 'Unknown')
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
function Badge({ value }: { value: string }) {
  return (
    <span className={'badge ' + value?.toLowerCase()}>{human(value)}</span>
  );
}
function Picker({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  label: string;
}) {
  return (
    <Select
      value={value}
      onValueChange={(v) => v !== null && onChange(String(v))}
    >
      <SelectTrigger aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {human(o)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
function Panel({
  title,
  eyebrow,
  children,
  action,
  className = '',
}: {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={'panel ' + className}>
      <div className="panel-head">
        <div>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h2>{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="empty">
      <FileText size={24} />
      <p>{children}</p>
    </div>
  );
}
function Evidence({ analysis }: { analysis: any }) {
  const text = analysis.description;
  const spans = [...analysis.evidence_spans].sort(
    (a: any, b: any) =>
      a.start_offset - b.start_offset || b.end_offset - a.end_offset,
  );
  let end = 0;
  const nodes: React.ReactNode[] = [];
  for (const s of spans) {
    if (s.start_offset < end) continue;
    nodes.push(text.slice(end, s.start_offset));
    nodes.push(
      <mark
        key={s.start_offset}
        className={'evidence-' + s.label.toLowerCase()}
        title={human(s.label)}
      >
        {text.slice(s.start_offset, s.end_offset)}
      </mark>,
    );
    end = s.end_offset;
  }
  nodes.push(text.slice(end));
  return <div className="evidence-text">{nodes}</div>;
}
function SubmittedReport({ data }: { data: any }) {
  const context: Record<string, unknown> = data.context || {};
  const hasValue = (value: unknown) => value !== null && value !== undefined && String(value).trim() !== '' && String(value) !== 'UNKNOWN';
  const shown = (value: unknown) => String(value).replaceAll('|', ', ');
  const sourceForm = String(context.source_form || (Object.keys(context).some((key) => key.startsWith('acc_')) ? 'ACCIDENT' : Object.keys(context).some((key) => key.startsWith('nm_')) ? 'NEAR_MISS' : 'GENERAL'));
  const sourceGroups = sourceForm === 'NEAR_MISS' ? nearMissFormGroups : sourceForm === 'ACCIDENT' ? accidentFormGroups : [];
  const knownKeys = new Set(['source_form', ...sourceGroups.flatMap((group) => group.fields.map((item) => item.key)), ...contextGroups.flatMap((group) => group.fields.map(([key]) => key))]);
  const otherFields = Object.entries(context).filter(([key, value]) => !knownKeys.has(key) && hasValue(value));
  const metadata: [string, unknown][] = [
    ['Report ID', data.report_id],
    ['Report type', data.report_type],
    ['Site / installation', data.site],
    ['Department', data.department],
    ['Event date and time (IST)', data.event_timestamp ? new Date(data.event_timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : ''],
    ['Source system', data.source_system],
    ['Source record ID', data.source_record_id],
    ['Record received', data.ingested_at],
    ['Schema version', data.schema_version],
    ['Source hash', data.source_hash],
  ];
  const details = (fields: [string, unknown][]) => (
    <dl className="facts">
      {fields.filter(([, value]) => hasValue(value)).map(([label, value]) => (
        <div key={label}><dt>{label}</dt><dd>{shown(value)}</dd></div>
      ))}
    </dl>
  );
  return (
    <div className="submitted-report">
      <Panel title="Submitted report" eyebrow="Officer-entered information">
        {data.is_synthetic && <p className="footnote">Fictional demonstration record</p>}
        {details(metadata)}
        <div className="submitted-narrative">
          <strong>{sourceForm === 'NEAR_MISS' ? 'Description of occurrence' : sourceForm === 'ACCIDENT' ? 'Brief description of accident' : 'Description'}</strong>
          <p>{data.description}</p>
        </div>
        {hasValue(data.immediate_action) && (
          <div className="submitted-narrative"><strong>Immediate action recorded</strong><p>{data.immediate_action}</p></div>
        )}
      </Panel>
      {data.images?.length > 0 && (
        <Panel title="Attached pictures" eyebrow="Submitted with this report">
          <div className="submitted-images">
            {data.images.map((image: { id: number; name: string; url: string }) => (
              <a key={image.id} href={image.url} target="_blank" rel="noopener noreferrer">
                <img src={image.url} alt={image.name} loading="lazy" />
                <span>{image.name}</span>
              </a>
            ))}
          </div>
        </Panel>
      )}
      {sourceGroups.map((group) => {
        const fields: [string, unknown][] = group.fields.map((item) => [item.label, context[item.key]]);
        return fields.some(([, value]) => hasValue(value)) ? <Panel key={group.title} title={group.title} eyebrow="Submitted form fields">{details(fields)}</Panel> : null;
      })}
      {contextGroups.map((group) => {
        const fields: [string, unknown][] = group.fields.map(([key, label]) => [label, context[key]]);
        return fields.some(([, value]) => hasValue(value)) ? <Panel key={group.title} title={group.title} eyebrow="Reported supporting information">{details(fields)}</Panel> : null;
      })}
      {otherFields.length > 0 && <Panel title="Other submitted fields" eyebrow="Source record">{details(otherFields.map(([key, value]) => [human(key), value]))}</Panel>}
    </div>
  );
}
function ReportSummary({ data, onNew, onFull }: { data: any; onNew: () => void; onFull: () => void }) {
  const context = data.context || {};
  const classification = data.sif_label === 'SIF_POTENTIAL'
    ? 'Potential SIF'
    : data.sif_label === 'NON_SIF_POTENTIAL'
      ? 'Non-SIF potential'
      : data.sif_label === 'REVIEW_REQUIRED'
        ? 'SIF status undetermined'
        : human(data.sif_label);
  const classTone = data.sif_label === 'SIF_POTENTIAL' ? 'sif' : data.sif_label === 'NON_SIF_POTENTIAL' ? 'non-sif' : 'undetermined';
  const classExplanation = data.sif_label === 'SIF_POTENTIAL'
    ? 'High-risk precursor identified'
    : data.sif_label === 'NON_SIF_POTENTIAL'
      ? 'No high-risk precursor identified'
      : data.sif_label === 'OUT_OF_SCOPE'
        ? 'This record is excluded from SIF trend counts'
        : 'The recorded facts do not support a final SIF classification';
  const eventTime = data.event_timestamp
    ? new Date(data.event_timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
    : 'Not recorded';
  const modelScore = data.decision_source === 'DEMO_LOW_ENERGY_RULE' ? 'Rule screened' : data.sif_probability == null ? 'Unavailable' : Math.round(data.sif_probability * 100) + '%';
  const reporter = context.nm_reported_by || context.reported_by || 'Not recorded';
  const hazards = (data.hazards || []).filter((hazard: string, index: number, all: string[]) => all.findIndex((item) => item.trim().toLowerCase() === hazard.trim().toLowerCase()) === index);
  return (
    <article className="report-summary">
      <div className="report-summary-nav">
        <span>Reports <ChevronRight size={12} /> Analyze Report</span>
        <button type="button" onClick={onNew}><ArrowRight size={14} /> Back to Reports</button>
      </div>
      <header className="report-summary-header">
        <h2>Report Analysis</h2>
        <p>AI-based analysis for SIF potential and Life-Saving Rule mapping</p>
      </header>
      <dl className="report-summary-meta">
        <div><dt>Report ID</dt><dd>{data.report_id}</dd></div>
        <div><dt>Date &amp; Time</dt><dd>{eventTime}</dd></div>
        <div><dt>Site</dt><dd>{data.site || 'Not recorded'}</dd></div>
        <div><dt>Activity</dt><dd>{data.activity || 'Not identified'}</dd></div>
        <div><dt>Reported By</dt><dd>{reporter}</dd></div>
      </dl>

      <section className="report-summary-section">
        <h3>Analysis Result</h3>
        <div className="report-summary-result">
          <div>
            <span className="report-summary-label">SIF Potential</span>
            <strong className={'report-summary-emphasis ' + classTone}>{classification.toUpperCase()}</strong>
            <small>{classExplanation}</small>
          </div>
          <div>
            <span className="report-summary-label">Confidence</span>
            <strong title={data.decision_source === 'DEMO_LOW_ENERGY_RULE' ? 'Complete fictional low-risk sample screened by the demo rule' : data.development_only ? 'Demonstration estimate; not validated on OIL reports' : 'Model estimate'}>{modelScore}</strong>
          </div>
          <div>
            <span className="report-summary-label">Mapped Life-Saving Rule</span>
            <strong>{data.iogp_rules?.length ? data.iogp_rules.join(', ') : 'None mapped'}</strong>
          </div>
          <div>
            <span className="report-summary-label">Overall Risk Level</span>
            <strong className={'report-summary-emphasis ' + String(data.priority || '').toLowerCase()}>{human(data.priority)}</strong>
          </div>
        </div>
      </section>

      <section className="report-summary-section">
        <h3>Precursor Information</h3>
        <dl className="report-summary-facts">
          <div><dt>Activity</dt><dd>{data.activity || 'Not identified'}</dd></div>
          <div><dt>Hazard</dt><dd>{hazards.length ? hazards.join(', ') : 'Not identified'}</dd></div>
          <div><dt>Recurring pattern</dt><dd>{data.pattern_id ? data.pattern_id + ' · ' + (data.similar_report_count || 0) + ' related reports' : 'No recurring pattern linked yet'}</dd></div>
          {data.sites_affected?.length > 0 && <div><dt>Sites affected</dt><dd>{data.sites_affected.join(', ')}</dd></div>}
        </dl>
      </section>

      <section className="report-summary-section">
        <h3>Critical Barriers</h3>
        {data.barriers?.length ? data.barriers.map((barrier: any, index: number) => (
          <div className="report-summary-barrier" key={index}>
            <div><strong>{barrier.name}</strong><span className={'report-summary-state ' + String(barrier.state || '').toLowerCase()}>{human(barrier.state)}</span></div>
            <p>{barrier.threat}</p>
            <small>Presence: <b>{human(barrier.verification_status)}</b> &nbsp; Effectiveness: <b>{human(barrier.validation_status)}</b></small>
            {barrier.evidence && <blockquote>“{barrier.evidence}”{barrier.inferred ? ' · Inferred weakness' : ''}</blockquote>}
          </div>
        )) : <p className="report-summary-empty">No critical barrier identified from the available details.</p>}
      </section>

      <section className="report-summary-section">
        <h3>Information Needed</h3>
        {data.missing_information?.length
          ? <ul className="report-summary-missing">{data.missing_information.map((item: string) => <li key={item}>{human(item)}</li>)}</ul>
          : <p className="report-summary-empty">No additional information flagged.</p>}
      </section>

      <section className="report-summary-section">
        <h3>Related Reports</h3>
        <div className="report-summary-related">
          <Layers3 size={19} />
          <div>
            <strong>{data.pattern_id ? (data.similar_report_count || 0) + ' related reports' : 'No recurring pattern linked'}</strong>
            {data.pattern_id && <small>{data.pattern_id} · {data.sites_affected?.length || 0} sites · Curated precursor family</small>}
          </div>
          <ChevronRight className="report-summary-related-chevron" size={19} />
        </div>
      </section>
      <button className="report-summary-full" type="button" onClick={onFull}>
        <FileText size={17} />
        <span>View Full Report &amp; Detailed Analysis</span>
        <ChevronRight size={19} />
      </button>
    </article>
  );
}

function Result({ data }: { data: any }) {
  return (
    <div className="result-stack">
      <section className={'decision ' + data.priority.toLowerCase()}>
        <div>
          <p className="eyebrow">Assessment · {data.report_id}</p>
          <h2>{data.sif_label === 'SIF_POTENTIAL' ? 'SIF potential' : data.sif_label === 'NON_SIF_POTENTIAL' ? 'Non-SIF potential' : data.sif_label === 'REVIEW_REQUIRED' ? 'SIF status undetermined' : human(data.sif_label)}</h2>
          <div className="inline">
            <Badge value={data.priority} />
          </div>
        </div>
        <ShieldAlert size={36} />
      </section>
      <div className="result-overview">
        <Panel title="Life-Saving Rules" eyebrow="Mapped from this report">
          {data.iogp_rules?.length ? (
            <div className="tags">
              {data.iogp_rules.map((rule: string) => (
                <span key={rule}><Shield size={13} />{rule}</span>
              ))}
            </div>
          ) : <p className="footnote">No Life-Saving Rule mapped from the available details.</p>}
        </Panel>
        <Panel title="Precursor information" eyebrow="Hazard pattern">
          <dl className="facts">
            <div><dt>Activity</dt><dd>{data.activity || 'Not identified'}</dd></div>
            <div><dt>Hazard</dt><dd>{data.hazards?.join(', ') || 'Not identified'}</dd></div>
            <div><dt>Recurring pattern</dt><dd>{data.pattern_id ? data.pattern_id + ' · ' + (data.similar_report_count || 0) + ' related reports' : 'No recurring pattern linked yet'}</dd></div>
          </dl>
          {data.sites_affected?.length > 0 && <p className="footnote">Sites affected: {data.sites_affected.join(', ')}</p>}
        </Panel>
      </div>
      <div className="model-strip">
        <span>
          Text encoder <strong>{human(data.encoder_status)}</strong>
        </span>
        <span>
          SIF classifier <strong>{human(data.classifier_status)}</strong>
        </span>
        <span>
          'SIF model estimate'{' '}
          <strong>
            {data.decision_source === 'DEMO_LOW_ENERGY_RULE' ? 'Rule screened' : data.sif_probability == null
              ? 'Unavailable'
              : (data.sif_probability * 100).toFixed(1) + '%'}
          </strong>
        </span>
      </div>
      {data.triage_route === 'AUTO_OUT_OF_SCOPE' && (
        <div className="notice">
          <Shield size={18} />
          <div>
            <strong>Automatically screened out</strong>
            <p>This text describes a training example or a drill with no reported actual event. It is excluded from SIF trend counts and needs no classification review.</p>
          </div>
        </div>
      )}
      {data.triage_route === 'AUTO_SIF_ALERT' && (
        <div className="notice">
          <ShieldAlert size={18} />
          <div>
            <strong>Automatic SIF alert</strong>
            <p>Flagged immediately without a classification review step. This is a provisional warning for safety follow-up, not a confirmed incident finding.</p>
          </div>
        </div>
      )}
      {data.status === 'ANALYSIS_UNAVAILABLE' && (
        <div className="notice">
          <TriangleAlert size={18} />
          <div>
            <strong>Human review required</strong>
            <p>
              {data.encoder_status === 'READY'
                ? 'No SIF probability is available. Review the evidence and safety rules below; the classifier needs training and validation.'
                : 'Model inference is unavailable. Safety rules remain active and this report is retained for review.'}
            </p>
          </div>
        </div>
      )}
      {data.hard_gate.triggered && (
        <div className="gate">
          <ShieldAlert size={20} />
          <div>
            <strong>Hard safety gate triggered</strong>
            <p>{data.hard_gate.reason.join(' + ')}</p>
            <span>Mandatory HSSE review</span>
          </div>
        </div>
      )}
      <Panel title="Extracted safety facts" eyebrow="Assessment findings">
        <details className="analysis-evidence">
          <summary>Show highlighted source narrative</summary>
        <Evidence analysis={data} />
        <div className="legend">
          <span>
            <i className="exposure-dot" />
            Exposure
          </span>
          <span>
            <i className="hazard-dot" />
            Hazard
          </span>
          <span>
            <i className="activity-dot" />
            Activity / control
          </span>
        </div>
        </details>
        <dl className="facts">
          {[
            ['Activity', data.activity],
            ['Equipment', data.equipment.join(', ')],
            ['Hazard / energy', data.hazards.join(', ')],
            [
              'Exposure',
              data.simulated
                ? 'No actual exposure identified · simulation'
                : data.exposure_status === 'EXPLICITLY_NEGATED'
                  ? 'Report explicitly states no exposure'
                  : data.exposures.join(', '),
            ],
            ['Potential consequence', data.potential_consequences.join(', ')],
          ].map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v || 'Unknown — further information needed'}</dd>
            </div>
          ))}
        </dl>
        <p className="footnote">
          Consequences are inferred safety pathways. Highlighted spans reproduce
          the submitted narrative.
        </p>
      </Panel>
      <Panel title="Critical barriers" eyebrow="Control integrity">
        {data.barriers.length ? (
          data.barriers.map((b: any, i: number) => (
            <div className="barrier" key={i}>
              <div className="between">
                <h3>{b.name}</h3>
                <Badge value={b.state} />
              </div>
              <p>{b.threat}</p>
              <div className="barrier-meta">
                <span>Presence: {human(b.verification_status)}</span>
                <span>Effectiveness: {human(b.validation_status)}</span>
              </div>
              {b.evidence && (
                <blockquote>
                  “{b.evidence}”{' '}
                  {b.inferred && <small>· Inferred weakness</small>}
                </blockquote>
              )}
              {b.contradictory && (
                <p className="error-text">
                  Conflicting evidence — clarification required.
                </p>
              )}
            </div>
          ))
        ) : (
          <Empty>
            No critical barrier identified. HSSE clarification required.
          </Empty>
        )}
      </Panel>
      {data.missing_information.length > 0 && (
        <Panel title="Information needed">
          <div className="tags missing">
            {data.missing_information.map((x: string) => (
              <span key={x}>{human(x)}</span>
            ))}
          </div>
        </Panel>
      )}
      {data.pattern_id && (
        <Link
          className="related-link"
          href={'/precursors?pattern=' + data.pattern_id}
        >
          <Layers3 />
          <div>
            <strong>{data.similar_report_count} related reports</strong>
            <p>
              {data.pattern_id} · {data.sites_affected?.length || 0} sites ·
              Curated precursor family
            </p>
          </div>
          <ArrowUpRight />
        </Link>
      )}
      <p className="footnote">
        Model: {data.model_version} · Catalogue: {data.catalogue_version} ·{' '}
        {new Date(data.analysis_timestamp).toLocaleString()}
      </p>
    </div>
  );
}
function DensityTable({ rows }: { rows: any[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {[
            'Site',
            'SIF / reports',
            'Raw',
            'Adjusted',
            '95% interval',
            'Reliability',
          ].map((x) => (
            <TableHead key={x}>{x}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r: any, i: number) => (
          <TableRow key={r.name}>
            <TableCell>
              <span className="row-number">
                {String(i + 1).padStart(2, '0')}
              </span>
              <strong>{r.name}</strong>
            </TableCell>
            <TableCell>
              {r.sif_count} <span className="muted">/ {r.total_count}</span>
            </TableCell>
            <TableCell>{r.raw_density}%</TableCell>
            <TableCell>
              <strong>{r.adjusted_density}%</strong>
            </TableCell>
            <TableCell className="muted">
              {r.lower_bound}–{r.upper_bound}%
            </TableCell>
            <TableCell>
              <span
                className={'reliability ' + r.reliability_level.toLowerCase()}
              >
                {human(r.reliability_level)} · n={r.sample_size}
              </span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function SidebarNavItems({
  navigation,
  view,
}: {
  navigation: readonly (readonly [string, string, any])[];
  view: string;
}) {
  const { isMobile, setOpenMobile } = useSidebar();
  return (
    <nav aria-label="Main navigation">
      {navigation.map(([key, label, Icon]) => (
        <Link
          aria-current={key === view ? 'page' : undefined}
          href={'/' + key}
          key={key}
          className={'nav-link ' + (key === view ? 'active' : '')}
          onClick={() => {
            if (isMobile) setOpenMobile(false);
          }}
        >
          <Icon size={19} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}

export default function Workspace({ view }: { view: View }) {
  const [health, setHealth] = useState<any>(null),
    [charts, setCharts] = useState<DashboardChartData | null>(null),
    [summary, setSummary] = useState<any>(null),
    [sites, setSites] = useState<any[]>([]),
    [activities, setActivities] = useState<any[]>([]),
    [patterns, setPatterns] = useState<any[]>([]),
    [reviews, setReviews] = useState<any[]>([]);
  const [days, setDays] = useState('60'),
    [dashboardFilters, setDashboardFilters] = useState({site:'ALL',activity:'ALL',report_type:'ALL'}),
    [useDemo, setUseDemo] = useState(true),
    [dashboardChartCount, setDashboardChartCount] = useState<number>(9),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    if (view === 'precursors' || view === 'review') {
      setLoading(false);
      setError('');
      return;
    }
    setLoading(true);
    setError('');
    const params=new URLSearchParams({days});
    if (!useDemo) params.set('demo', 'false');
    Object.entries(dashboardFilters).forEach(([key,value])=>{ if(value!=='ALL') params.set(key,value); });
    const query='?'+params.toString();
    Promise.all([
      api('/health/'),
      api('/dashboard/summary/' + query),
      api('/dashboard/site-density/' + query),
      api('/dashboard/activity-density/' + query),
      api('/patterns/' + query),
      api('/reviews/'),
      view === 'dashboard' ? api('/dashboard/charts/' + query) : Promise.resolve(null),
    ])
      .then(([h, s, sd, ad, p, r, c]) => {
        if (active) {
          setHealth(h);
          setSummary(s);
          setSites(sd);
          setActivities(ad);
          setPatterns(p);
          setReviews(r);
          setCharts(c);
        }
      })
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [days, dashboardFilters, refresh, view, useDemo]);

  return (
    <SidebarProvider
      className="dashboard-mode"
      style={{ '--sidebar-width': '190px' } as React.CSSProperties}
    >
      <Sidebar className="app-sidebar">
        <SidebarHeader className="brand">
          <Link
            href="/dashboard"
            aria-label="Ascension home"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              padding: '4px 6px',
            }}
          >
            <img
              src="/ascension-logo.png"
              alt="Ascension"
              className="brand-symbol"
              style={{
                width: 'auto',
                maxWidth: '135px',
                maxHeight: '75px',
                height: 'auto',
                objectFit: 'contain',
                filter: 'drop-shadow(0 2px 10px rgba(0, 0, 0, 0.5))',
              }}
            />
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <p className="nav-label">Workspace</p>
          <SidebarNavItems navigation={navigation} view={view} />
        </SidebarContent>
        <SidebarFooter className="sidebar-footer">
          <div className="avatar">MR</div>
          <div>
            <strong>Matrika Regmi</strong>
            <span>Logged in</span>
          </div>
        </SidebarFooter>
      </Sidebar>
      <div className="app-content">
        <header className="topbar">
          <div className="inline">
            <SidebarTrigger className="mobile-trigger" />
            <span className="muted topbar-crumb-label">Operations</span>
            <ChevronRight size={13} className="topbar-crumb-sep" />
            <strong className="topbar-page-title">{names[view]}</strong>
          </div>
          <div className="workspace-status">
            <span className="demo-indicator" />
            <span className="workspace-status-text">Demo workspace</span>
          </div>
        </header>
        <main id="main-content">
          {view === 'precursors' || view === 'review' ? (
            <ComingSoon />
          ) : (
            <>
              {((view === 'dashboard' && dashboardChartCount === 9) || view === 'analyze') && (
                <div className="page-heading dashboard-page-heading">
                  <div>
                    <h1>{view === 'dashboard' ? 'Safety overview' : 'Reports & analysis'}</h1>
                    <p>
                      {view === 'dashboard'
                        ? 'AI-assisted analysis of unsafe acts, conditions, near misses and incidents.'
                        : 'Submit a report to see its SIF result, Life-Saving Rules and precursor information.'}
                    </p>
                  </div>
                  {view === 'dashboard' && (
                    <div className="dashboard-filters" aria-label="Dashboard filters">
                      <label style={{display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 600, color: '#073ca4'}}>
                        <input type="checkbox" checked={useDemo} onChange={e => setUseDemo(e.target.checked)} style={{margin: 0, cursor: 'pointer'}} />
                        Include Demo Data
                      </label>
                      <label><span>Period</span><select value={days} onChange={e=>setDays(e.target.value)}><option value="30">Last 30 days</option><option value="60">Last 60 days</option><option value="90">Last 90 days</option><option value="365">Last 12 months</option></select></label>
                      {([['site','All sites'],['activity','All activities'],['report_type','All report types']] as const).map(([key,label])=><label key={key}><span>{label}</span><select value={dashboardFilters[key]} onChange={e=>setDashboardFilters(v=>({...v,[key]:e.target.value}))}><option value="ALL">{label}</option>{(charts?.filter_options?.[key]||[]).map((value:string)=><option value={value} key={value}>{value}</option>)}</select></label>)}
                    </div>
                  )}
                </div>
              )}
              {view === 'dashboard' && dashboardChartCount === 9 && !loading && !error && charts && (
                <div className="oil-kpi-header">
                  {([
                    [FileText, 'Total reports', charts.total_reports, 'In selected filters'],
                    [TriangleAlert, 'SIF-potential', charts.classification.sif, Math.round(charts.classification.sif/Math.max(charts.total_reports,1)*100) + '% of reports'],
                    [Shield, 'Non-SIF', charts.classification.non_sif, Math.round(charts.classification.non_sif/Math.max(charts.total_reports,1)*100) + '% of reports'],
                    [CircleX, 'Unresolved', charts.classification.unresolved, 'Requires HSSE review'],
                    [MapPin, 'Sites', charts.sites.length, 'With reports'],
                    [Network, 'Activity categories', activities.length, charts.report_types.length + ' report types'],
                  ] as any[]).map(([Icon,label,value,sub]:any)=><KpiHeaderCard key={label} label={label} value={value} sub={sub}/>)}

                </div>
              )}
              {error ? (
                <div className="notice error" role="alert">
                  <TriangleAlert />
                  <div>
                    <strong>Unable to load the workspace</strong>
                    <p>
                      {error.includes('fetch')
                        ? 'The local analysis service is not reachable. Start the backend and try again.'
                        : error}
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setRefresh((x) => x + 1)}
                    >
                      <RefreshCw size={16} />
                      Retry
                    </Button>
                  </div>
                </div>
              ) : loading ? (
                <div className="loading-grid" aria-label="Loading workspace">
                  {[0, 1, 2, 3].map((n) => (
                    <Skeleton key={n} className="h-32 rounded-lg" />
                  ))}
                  <Skeleton className="h-80 col-span-full" />
                </div>
              ) : (
                <>
                  {view === 'dashboard' && (
                    <Dashboard
                      summary={summary}
                      sites={sites}
                      activities={activities}
                      patterns={patterns}
                      days={days}
                      setDays={setDays}
                      charts={charts}
                      filters={dashboardFilters}
                      useDemo={useDemo}
                      selectedCount={dashboardChartCount}
                      onSelectedCountChange={setDashboardChartCount}
                    />
                  )}
                  {view === 'analyze' && <Analyze />}
                </>
              )}
            </>
          )}
          <footer className="app-footer">
            <span>Copyright 2026 Team Ascension SIH2026</span>
            <span>All rights reserved.</span>
          </footer>
        </main>
      </div>
    </SidebarProvider>
  );
}
function useCountUp(target: number, duration = 900) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (target === 0) { setVal(0); return; }
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    const id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [target, duration]);
  return val;
}

function KpiHeaderCard({ label, value, sub }: { label: string; value: number; sub: string }) {
  const animated = useCountUp(value);
  return (
    <section className="oil-kpi">
      <div>
        <strong>{animated}</strong>
        <span>{label}</span>
        <small>{sub}</small>
      </div>
    </section>
  );
}

function Dashboard({summary,sites,activities,patterns,days,charts,useDemo,selectedCount,onSelectedCountChange}: any) {
  if (!charts) return null;
  return <div className="oil-dashboard">
    <DashboardCharts
      charts={charts}
      activities={activities}
      patterns={patterns}
      sites={sites}
      days={days}
      useDemo={useDemo}
      selectedCount={selectedCount}
      onSelectedCountChange={onSelectedCountChange}
    />
  </div>;
}

function LegacyDashboard({
  summary,
  sites,
  activities,
  patterns,
  days,
  setDays,
  charts,
}: any) {
  const top = patterns[0];
  return (
    <>
      <div className="section-toolbar">
        <div className="inline">
          <span className="section-label">Reporting period</span>
          <span className="muted">
            {sites.length} sites · {summary.synthetic_count} synthetic reports
          </span>
        </div>
        <Picker
          value={days}
          onChange={setDays}
          options={['7', '30', '60', '90', '365']}
          label="Report window in days"
        />
        <span className="muted">days</span>
      </div>
      <div className="kpi-grid">
        {[
          [
            FileText,
            'Reports analysed',
            summary.reports_analysed,
            'In-scope safety reports',
            'navy',
          ],
          [
            ShieldAlert,
            'SIF-potential reports',
            summary.sif_potential,
            'Evidence-based safety flags',
            'red',
          ],
          [
            Shield,
            'Automatic SIF alerts',
            summary.automatic_alerts,
            'Provisional; no classification review step',
            'navy',
          ],
          [
            Layers3,
            'Critical barrier failures',
            summary.critical_barrier_failures,
            'Failed · bypassed · absent',
            'orange',
          ],
          [
            ClipboardCheck,
            'Pending HSSE review',
            summary.review_required,
            'Includes model-unavailable cases',
            'amber',
          ],
        ].map(([Icon, label, value, sub, color]: any) => (
          <section key={label} className={'kpi ' + color}>
            <div className="between">
              <p>{label}</p>
              <Icon size={19} />
            </div>
            <strong>{value}</strong>
            <span>{sub}</span>
          </section>
        ))}
      </div>
      {charts && <DashboardCharts charts={charts} activities={activities} patterns={patterns} sites={sites} days={days} useDemo={true} />}
      <details className="site-detail-panel">
        <summary>Site density details <span>Rates within reports, sample sizes and uncertainty</span></summary>
        <Panel
          title="Site SIF density"
          eyebrow="Site comparison"
          action={<span className="subtle-chip">Beta-binomial adjusted</span>}
          className="site-panel"
        >
          <DensityTable rows={sites} />
          <div className="panel-note">
            <TriangleAlert size={15} />
            <p>
              Report-based density, not an operational incident rate. Review
              cases remain in the denominator; {summary.unavailable} assessments
              have no model probability. Small samples need caution.
            </p>
          </div>
        </Panel>
      </details>
      <div className="dashboard-bottom">
        {top && (
          <section className="emerging-panel">
            <div className="between">
              <span className="eyebrow">PRECURSOR WATCH</span>
              <Badge value={top.trend} />
            </div>
            <Layers3 size={27} />
            <h2>{top.dominant_hazard}</h2>
            <p>
              {top.dominant_barrier} · {top.sites.length} sites
            </p>
            <div className="emerging-stats">
              <strong>
                {top.report_count}
                <span>related reports</span>
              </strong>
              <strong>
                {top.sif_count}
                <span>SIF-potential</span>
              </strong>
            </div>
            <div
              className="mini-bars"
              aria-label={'Weekly reports: ' + top.weekly_counts.join(', ')}
            >
              {top.weekly_counts.map((n: number, i: number) => (
                <span
                  key={i}
                  style={{
                    height: Math.max(
                      5,
                      (n / Math.max(...top.weekly_counts, 1)) * 50,
                    ),
                  }}
                />
              ))}
            </div>
            <Link href={'/precursors?pattern=' + top.pattern_id}>
              Inspect precursor <ArrowRight size={17} />
            </Link>
          </section>
        )}
        <Panel
          title="Priority attention"
          eyebrow="Review queue"
          action={
            <Link className="text-link" href="/review">
              View queue <ArrowRight size={15} />
            </Link>
          }
        >
          {summary.recent_critical.length ? (
            summary.recent_critical.slice(0, 4).map((r: any) => (
              <Link
                className="priority-row"
                key={r.report_id}
                href={'/analyze?report=' + r.report_id}
              >
                <span className={'priority-line ' + r.priority.toLowerCase()} />
                <div>
                  <div className="inline">
                    <strong>{r.report_id}</strong>
                    <Badge value={r.priority} />
                  </div>
                  <p>{r.description}</p>
                  <small>
                    {r.site} · {r.activity}
                  </small>
                </div>
                <ArrowUpRight size={16} />
              </Link>
            ))
          ) : (
            <Empty>No high-priority reports in this period.</Empty>
          )}
        </Panel>
      </div>
    </>
  );
}
const nearMissPlaces: [string, string][] = [
  ['Well plant', 'Well plant'], ['Derrick floor', 'Derrick floor'], ['H.S.D. tank', 'H.S.D. Tank'], ['Pipe rack', 'Pipe Rack'], ['Monkey board', 'Monkey Board'],
  ['Cementing unit', 'Cementing Unit'], ['Pump house', 'Pump house'], ['Cat walk', 'Cat walk'], ['Welding shop', 'Welding Shop'], ['Engine house', 'Engine House'],
  ['Mud channel', 'Mud Channel'], ['Valve manifold', 'Valve Manifold'], ['Pressure vessel', 'Pressure Vessel'], ['Storage tank area', 'Storage Tank Area'], ['Tanker loading area', 'Tanker Loading / Unloading Area'],
  ['Auto/electrical workshop', 'Auto / Electrical Work Shop'], ['ICE / well logging workshop', 'ICE / Well logging Work Shop'], ['Producing well area', 'Producing well area'], ['Manifold area', 'Manifold area'], ['E.T./H. area', 'E.T./H. area'],
  ['Process / CODP area', 'Process / CODP area'], ['Drenching / formation water disposal pump area', 'Drenching / formation water disposal pump area'], ['Generating shed area', 'Generating shed area'], ['Water / C.O. storage tank area', 'Water / C.O. storage tank area'], ['Material storage area', 'Material storage area'],
  ['Power house', 'Power house'], ['Electrical substation / power distribution line', 'Electrical Substation / Power distribution line'], ['Pump stations', 'Pump Stations'], ['Yards', 'Yards'], ['LPG area', 'LPG'],
];
const nearMissOutcomes: [string, string][] = [
  ['Accident (minor / serious / fatal)', 'Accident (Minor / Serious / Fatal)'],
  ['Fire (major / minor)', 'Fire (Major / Minor)'],
  ['Electrical shock', 'Electrical shock'],
  ['Vehicle accident', 'Vehicle accident'],
  ['Explosion', 'Explosion'],
  ['Property loss or equipment damage', 'Property loss (Equipment / machinery damage)'],
  ['Environmental pollution', 'Environmental pollution'],
];
const nearMissReasons: [string, string][] = [
  ['Struck by moving or falling object', 'Strike against moving objects, raised platform, etc.'],
  ['Struck by tool or flying particle', 'Struck by tong, crowbar, flying particles, falling objects'],
  ['Caught in grinding wheels or vice', 'Caught in between grinding wheels, bench vice'],
  ['Caught in metallic strip or moving chain', 'Caught on metallic strip, moving chain'],
  ['Caught between moving parts', 'Caught between moving parts'],
  ['Slip on ground, stairs, ladder or derrick floor', 'Slip on the ground, stair, ladder, derrick floor, etc.'],
  ['Fall below', 'Fall below'],
  ['Collapse of wall, ladder or overhead structure', 'Collapse of wall, ladder, overhead tank, etc.'],
  ['Overexertion while lifting, pushing or pulling', 'Over exertion due to lifting heavy weight, pushing or pulling objects'],
  ['Fall on same level', 'Fall on same level'],
];
function NearMissPaperForm({ form, field, imageFiles, onImageFilesChange }: { form: any; field: (key: string, value: any) => void; imageFiles: File[]; onImageFilesChange: (files: File[]) => boolean }) {
  const context = form.context || {};
  const setContext = (key: string, value: string) => field('context', { ...context, [key]: value });
  const toggle = (key: string, value: string, checked: boolean) => {
    const selected = String(context[key] || '').split('|').filter(Boolean);
    setContext(key, (checked ? [...selected, value] : selected.filter((item) => item !== value)).join('|'));
  };
  const selected = (key: string, value: string) => String(context[key] || '').split('|').includes(value);
  return (
    <div className="nm-paper" aria-label="Near-miss report form">
      <div className="nm-paper-heading">
        <strong>NEAR MISS REPORT</strong>
        <span>CHECK APPROPRIATE LEVEL</span>
      </div>
      <div className="nm-priority-row">
        {[
          ['RED - Immediate action and report', 'RED', '(Immediate action and report)'],
          ['YELLOW - Use caution and report', 'YELLOW', '(Use caution and report)'],
          ['GREEN - Continue and report', 'GREEN', '(Continue and report)'],
        ].map(([value, label, note], index) => (
          <label className={'nm-priority nm-priority-' + index} key={value}>
            <input type="radio" name="near-miss-priority" checked={context.nm_priority === value} onChange={() => setContext('nm_priority', value)} />
            <span>{label}<small>{note}</small></span>
          </label>
        ))}
      </div>
      <div className="nm-line nm-four">
        <label>Date:<input required type="date" value={form.event_date} onChange={(event) => field('event_date', event.target.value)} /></label>
        <label>Time:<input required type="time" value={form.event_time} onChange={(event) => field('event_time', event.target.value)} /></label>
        <label>Location / Installation:<input required placeholder="Enter location / installation" value={form.site} onChange={(event) => field('site', event.target.value)} /></label>
        <label>Report No:<input required maxLength={80} pattern="[A-Za-z0-9][A-Za-z0-9_-]{0,79}" title="Use letters, numbers, underscores or hyphens" placeholder="Enter report number" value={form.report_id} onChange={(event) => field('report_id', event.target.value)} /></label>
      </div>
      <div className="nm-line nm-manager">
        <label>Name of the installation Manager:<input placeholder="Enter name of the installation manager" value={context.nm_installation_manager || ''} onChange={(event) => setContext('nm_installation_manager', event.target.value)} /></label>
        <label>Signature<input placeholder="Enter signature" aria-label="Installation manager signature" value={context.nm_manager_signature || ''} onChange={(event) => setContext('nm_manager_signature', event.target.value)} /></label>
      </div>
      <div className="nm-line nm-person">
        <label>Reported By (optional)<input placeholder="Enter name" value={context.nm_reported_by || ''} onChange={(event) => setContext('nm_reported_by', event.target.value)} /></label>
        <label>Regn No.<input placeholder="Enter regn no." value={context.nm_reporter_reg_no || ''} onChange={(event) => setContext('nm_reporter_reg_no', event.target.value)} /></label>
        <label>Signature<input placeholder="Enter signature" aria-label="Reporter signature" value={context.nm_reporter_signature || ''} onChange={(event) => setContext('nm_reporter_signature', event.target.value)} /></label>
      </div>
      <div className="nm-line nm-person">
        <label>Incident Seen By (if any)<input placeholder="Enter name" value={context.nm_seen_by || ''} onChange={(event) => setContext('nm_seen_by', event.target.value)} /></label>
        <label>Regn No.<input placeholder="Enter regn no." value={context.nm_witness_reg_no || ''} onChange={(event) => setContext('nm_witness_reg_no', event.target.value)} /></label>
        <label>Signature<input placeholder="Enter signature" aria-label="Witness signature" value={context.nm_witness_signature || ''} onChange={(event) => setContext('nm_witness_signature', event.target.value)} /></label>
      </div>
      <div className="nm-line nm-victim">
        <label>Name of the victim:<input placeholder="Enter name of the victim" value={context.nm_victim_name || ''} onChange={(event) => setContext('nm_victim_name', event.target.value)} /></label>
        <label>Signature:<input placeholder="Enter signature" aria-label="Victim signature" value={context.nm_victim_signature || ''} onChange={(event) => setContext('nm_victim_signature', event.target.value)} /></label>
      </div>
      <label className="nm-section-label" htmlFor="nm-description">Description of the Occurrence:</label>
      <textarea id="nm-description" className="nm-description" placeholder="Enter description of the occurrence..." required minLength={8} maxLength={12000} value={form.description} onChange={(event) => field('description', event.target.value)} />
      <div className="nm-middle">
        <section className="nm-block nm-place-block">
          <div className="nm-section-label">3. Place of Near Miss where it occurred</div>
          <div className="nm-options nm-places">
            {nearMissPlaces.map(([value, label]) => (
              <label key={value}><input type="radio" name="near-miss-place" checked={context.nm_place === value} onChange={() => setContext('nm_place', value)} /><span>{label}</span></label>
            ))}
          </div>
          <label className="nm-other">Others (Please specify):<input placeholder="Enter other place (if any)" value={context.nm_place_other || ''} onChange={(event) => setContext('nm_place_other', event.target.value)} /></label>
        </section>
        <div className="nm-right-column">
          <section className="nm-block">
            <div className="nm-section-label">4. What could have happened</div>
            <div className="nm-options nm-outcomes">
              {nearMissOutcomes.map(([value, label]) => (
                <label key={value}><input type="checkbox" checked={selected('nm_potential_outcomes', value)} onChange={(event) => toggle('nm_potential_outcomes', value, event.target.checked)} /><span>{label}</span></label>
              ))}
            </div>
            <label className="nm-other">Others (describe):<input placeholder="Enter other possible consequence" value={context.nm_potential_other || ''} onChange={(event) => setContext('nm_potential_other', event.target.value)} /></label>
          </section>
          <section className="nm-block">
            <div className="nm-section-label">5. Reason for the Occurrence</div>
            <div className="nm-options nm-reasons">
              {nearMissReasons.map(([value, label]) => (
                <label key={value}><input type="checkbox" checked={selected('nm_reason_categories', value)} onChange={(event) => toggle('nm_reason_categories', value, event.target.checked)} /><span>{label}</span></label>
              ))}
              <label>Others (please specify)</label>
            </div>
            <label className="nm-other">Other reason:<input placeholder="Enter other reason" value={context.nm_reason_other || ''} onChange={(event) => setContext('nm_reason_other', event.target.value)} /></label>
          </section>
        </div>
      </div>
      <div className="nm-footer-grid">
        <div className="nm-pictures">
          <strong>6. Were pictures taken</strong>
          <label><input type="radio" name="near-miss-pictures" checked={context.nm_pictures_taken === 'Yes'} onChange={() => setContext('nm_pictures_taken', 'Yes')} /> YES</label>
          <label><input type="radio" name="near-miss-pictures" checked={context.nm_pictures_taken === 'No'} onChange={() => { setContext('nm_pictures_taken', 'No'); onImageFilesChange([]); }} /> NO</label>
          {context.nm_pictures_taken === 'Yes' && (
            <label className="nm-upload">Upload pictures (optional, up to 5)
              <input type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={(event) => {
                const files = Array.from(event.currentTarget.files || []);
                if (!onImageFilesChange(files)) event.currentTarget.value = '';
              }} />
              {imageFiles.length > 0 && <small>{imageFiles.map((file) => file.name).join(', ')}</small>}
            </label>
          )}        </div>
        <div className="nm-measures">
          <div className="nm-measures-title">7. Corrective measures taken</div>
          <label>Immediate Measure:<textarea rows={3} placeholder="Enter immediate measure..." maxLength={4000} value={form.immediate_action} onChange={(event) => field('immediate_action', event.target.value)} /></label>
          <label>Long-Term Measure:<textarea rows={3} placeholder="Enter long-term measure..." maxLength={4000} value={context.nm_long_term_measure || ''} onChange={(event) => setContext('nm_long_term_measure', event.target.value)} /></label>
        </div>
      </div>
    </div>
  );
}

function AccidentFormA({ form, field }: { form: any; field: (key: string, value: any) => void }) {
  const context = form.context || {};
  const setContext = (key: string, value: string) => field('context', { ...context, [key]: value });
  const input = (key: string, label: string, placeholder: string, type: string = 'text') => (
    <label key={key}>{label}<input type={type} placeholder={placeholder} value={context[key] || ''} onChange={(event) => setContext(key, event.target.value)} /></label>
  );
  const area = (key: string, label: string, placeholder: string) => (
    <label className="acc-area" key={key}>{label}<textarea rows={4} maxLength={4000} placeholder={placeholder} value={context[key] || ''} onChange={(event) => setContext(key, event.target.value)} /></label>
  );
  return (
    <div className="nm-paper acc-paper" aria-label="Accident report Form-A">
      <div className="acc-form-top">FORM-A</div>
      <div className="nm-paper-heading"><strong>REPORT OF ACCIDENT</strong><span>(To be filled up forthwith)</span></div>
      <div className="nm-line acc-two acc-reference">
        <label>Report No. *<input required pattern="[A-Za-z0-9][A-Za-z0-9_-]{0,79}" title="Use letters, numbers, underscores or hyphens" maxLength={80} placeholder="Enter report number" value={form.report_id} onChange={(event) => field('report_id', event.target.value)} /></label>
        <label>Site / Installation *<input required maxLength={120} placeholder="Enter site or installation" value={form.site} onChange={(event) => field('site', event.target.value)} /></label>
      </div>
      <div className="nm-section-label">1. Injured person</div>
      <div className="nm-line acc-two">
        {input('acc_injured_name', '1.a Name of the injured', 'Enter injured person\'s name')}
        {input('acc_injured_code', '1.b Code / registration number of injured', 'Enter employee or registration number')}
      </div>
      <div className="nm-section-label">2. Event date and time</div>
      <div className="nm-line acc-two">
        <label>2.a Event Date *<input required type="date" value={form.event_date} onChange={(event) => field('event_date', event.target.value)} /></label>
        <label>2.b Event Time *<input required type="time" value={form.event_time} onChange={(event) => field('event_time', event.target.value)} /></label>
      </div>
      <div className="nm-section-label">3. Accident place</div>
      <div className="nm-line acc-two">
        {input('acc_work_area', '3.1 Accident place (work area)', 'Enter work area')}
        {input('acc_exact_location', '3.2 Exact location', 'Enter exact location')}
      </div>
      <div className="nm-section-label">4. Mine / installation</div>
      <div className="nm-line acc-one">
        {input('acc_mine', '4. Mine or installation, if applicable', 'Enter mine or installation')}
      </div>
      <div className="nm-section-label">5. Nature and extent of injury</div>
      {area('acc_injury_nature', '5. Injury details', 'Describe the nature and extent of the injury')}
      <label className="nm-section-label" htmlFor="acc-description">6. Brief description of the accident</label>
      <textarea id="acc-description" className="nm-description" required minLength={8} maxLength={12000} placeholder="Describe what happened, the activity, equipment and people involved..." value={form.description} onChange={(event) => field('description', event.target.value)} />
      <div className="nm-section-label">7. Cause of accident</div>
      <p className="acc-cause-hint">Examples: lack of training or supervision, improper coordination, improper use of tools, unsafe working condition, equipment failure, environmental factor, negligence or non-use of safety gear.</p>
      {area('acc_cause', '7. Cause, if established', 'Enter the known cause or state that investigation is pending')}
      <div className="nm-section-label">8–12. Person and work details</div>
      <div className="nm-line acc-two">
        {input('acc_date_of_birth', '8. Date of Birth', '', 'date')}
        {input('acc_work_experience', '9. Work Experience', 'Enter experience')}
        {input('acc_responsible_person', '10. Who or what is responsible for the accident?', 'Enter only if established')}
        {input('acc_witness', '11. Name of the witness of the accident', 'Enter witness name')}
        {input('acc_person_in_charge', '12. Person in direct charge at the time of accident', 'Enter name or role')}
      </div>
      <div className="nm-section-label">13. Prevention</div>
      {area('acc_prevention', '13. How can a similar accident be prevented?', 'Enter preventive measures')}
      <div className="nm-section-label">Signatures and dates</div>
      <div className="nm-line acc-three">
        {input('acc_contractor_name', 'LSTK Contractor name, if applicable', 'Enter contractor name')}
        {input('acc_contractor_signature', 'Contractor signature', 'Enter signature')}
        {input('acc_contractor_date', 'Date', '', 'date')}
        {input('acc_installation_manager', 'Installation Manager name', 'Enter manager name')}
        {input('acc_installation_manager_signature', 'Installation Manager signature', 'Enter signature')}
        {input('acc_installation_manager_date', 'Date', '', 'date')}
        {input('acc_department_head', 'Department Head name', 'Enter department head name')}
        {input('acc_department_head_signature', 'Department Head signature', 'Enter signature')}
        {input('acc_department_head_date', 'Date', '', 'date')}
      </div>
      <div className="nm-section-label">For Medical Department Use</div>
      <div className="nm-line acc-two">
        <label>Classification of injury
          <select value={context.acc_medical_classification || 'UNKNOWN'} onChange={(event) => setContext('acc_medical_classification', event.target.value)}>
            {['UNKNOWN', 'Minor reportable', 'Serious', 'Fatal', 'First aid only', 'Pending medical assessment'].map((option) => <option value={option} key={option}>{option === 'UNKNOWN' ? 'Pending classification' : option}</option>)}
          </select>
        </label>
        {input('acc_attending_doctor', 'Name of Attending Doctor', 'Enter doctor name')}
        {input('acc_attending_doctor_signature', 'Attending Doctor signature', 'Enter signature')}
        {input('acc_medical_date', 'Medical assessment date', '', 'date')}
      </div>
      <div className="nm-section-label">Immediate action taken</div>
      <label className="acc-area">Action recorded after the accident<textarea rows={4} maxLength={4000} placeholder="Enter immediate actions taken..." value={form.immediate_action} onChange={(event) => field('immediate_action', event.target.value)} /></label>
    </div>
  );
}

function SafetyObservationForm({ form, field }: { form: any; field: (key: string, value: any) => void }) {
  const context = form.context || {};
  const setContext = (key: string, value: string) => field('context', { ...context, [key]: value });
  const input = (key: string, title: string, placeholder: string) => (
    <label key={key}>{title}<input value={context[key] || ''} placeholder={placeholder} onChange={(event) => setContext(key, event.target.value)} /></label>
  );
  const isObservation = form.report_type === 'Unsafe Act' || form.report_type === 'Unsafe Condition';
  return (
    <div className="nm-paper ua-paper" aria-label="Unsafe act, unsafe condition or general safety report">
      <div className="ua-form-top">HSSE SAFETY OBSERVATION</div>
      <div className="nm-paper-heading">
        <strong>{isObservation ? 'UNSAFE ACT / UNSAFE CONDITION REPORT' : 'GENERAL SAFETY REPORT'}</strong>
        <span>Record the observation before analysis</span>
      </div>
      <div className="nm-section-label">1. Report details</div>
      <div className="nm-line ua-grid-four">
        <label>Report No. *<input required maxLength={80} pattern="[A-Za-z0-9][A-Za-z0-9_-]{0,79}" title="Use letters, numbers, underscores or hyphens" placeholder="Enter report number" value={form.report_id} onChange={(event) => field('report_id', event.target.value)} /></label>
        <label>Date *<input required type="date" value={form.event_date} onChange={(event) => field('event_date', event.target.value)} /></label>
        <label>Time (IST) *<input required type="time" value={form.event_time} onChange={(event) => field('event_time', event.target.value)} /></label>
        <label>Site / installation *<input required maxLength={120} placeholder="Enter site" value={form.site} onChange={(event) => field('site', event.target.value)} /></label>
      </div>
      <div className="nm-line ua-grid-two">
        <label>Department *<input required maxLength={120} placeholder="Enter department" value={form.department} onChange={(event) => field('department', event.target.value)} /></label>
        {input('reported_by', 'Reported by', 'Enter officer or reporter name, if known')}
      </div>
      <div className="nm-section-label">2. Report type and observation</div>
      <div className="ua-type-choices" role="group" aria-label="Report type">
        {(['Unsafe Act', 'Unsafe Condition', 'Near Miss', 'Incident'] as const).map((type) => (
          <label key={type} className={form.report_type === type ? 'ua-type-selected' : ''}>
            <input type="radio" name="general-report-type" checked={form.report_type === type} onChange={() => field('report_type', type)} />
            <span>{type}</span>
          </label>
        ))}
      </div>
      <p className="ua-guidance">For a near miss or accident on a standard paper form, choose its dedicated form above.</p>
      <label className="nm-section-label" htmlFor="ua-description">What was observed? *</label>
      <textarea id="ua-description" className="nm-description" required minLength={8} maxLength={12000} rows={7} placeholder="Describe the unsafe action or condition, the activity, equipment, people nearby and what could happen." value={form.description} onChange={(event) => field('description', event.target.value)} />
      <div className="nm-section-label">3. Location and possible exposure</div>
      <div className="nm-line ua-grid-two">
        {input('location', 'Exact location', 'Where was it observed?')}
        {input('reported_activity', 'Activity underway', 'What task was being performed?')}
        {input('equipment_refs', 'Equipment involved', 'Equipment or asset, if any')}
        {input('reported_hazard', 'Hazard or unsafe condition', 'What hazard was present?')}
        {input('reported_exposure', 'Who could be exposed?', 'Describe who was in or near the hazard')}
        {input('reported_consequence', 'What could happen?', 'Describe the credible outcome')}
      </div>
      <div className="nm-section-label">4. Controls and action taken</div>
      <div className="nm-line ua-grid-two">
        {input('barrier_name', 'Safety control or barrier', 'Guard, isolation, permit, exclusion zone, etc.')}
        <label>Condition of that control
          <select value={context.barrier_state || 'UNKNOWN'} onChange={(event) => setContext('barrier_state', event.target.value)}>
            {['UNKNOWN', 'EFFECTIVE', 'DEGRADED', 'FAILED', 'BYPASSED', 'ABSENT', 'UNVERIFIED'].map((state) => <option key={state} value={state}>{state === 'UNKNOWN' ? 'Not known' : human(state)}</option>)}
          </select>
        </label>
      </div>
      <label className="ua-wide-label">Evidence about the control<textarea rows={3} maxLength={4000} placeholder="What shows whether the control was present or working?" value={context.barrier_evidence || ''} onChange={(event) => setContext('barrier_evidence', event.target.value)} /></label>
      <label className="ua-wide-label">Immediate action taken<textarea rows={4} maxLength={4000} placeholder="Record the action taken after the observation" value={form.immediate_action} onChange={(event) => field('immediate_action', event.target.value)} /></label>
      <details className="ua-more">
        <summary>Optional operational and source details</summary>
        <div className="nm-line ua-grid-two">
          {input('shift', 'Shift', 'Day, night or other')}
          {input('workforce', 'Workforce', 'Employee, contractor or mixed')}
          {input('supervision', 'Supervision', 'Supervisor present or not known')}
          {input('pre_job_plan', 'Pre-job briefing / JSA', 'Status if known')}
          <label>Source system<input maxLength={120} value={form.source_system} onChange={(event) => field('source_system', event.target.value)} /></label>
          <label>Source record ID<input maxLength={120} placeholder="Defaults to report number" value={form.source_record_id} onChange={(event) => field('source_record_id', event.target.value)} /></label>
        </div>
        {contextGroups.map((group) => {
          const shown = new Set(['location', 'reported_activity', 'equipment_refs', 'reported_hazard', 'reported_exposure', 'reported_consequence', 'barrier_name', 'barrier_state', 'barrier_evidence', 'shift', 'workforce', 'supervision', 'pre_job_plan']);
          const remaining = group.fields.filter(([key]) => !shown.has(key));
          if (!remaining.length) return null;
          return <div className="ua-extra-group" key={group.title}>
            <h4>{group.title}</h4>
            <div className="nm-line ua-grid-two">
              {remaining.map(([key, title, options]) => <label key={key}>{title}
                {options ? <select value={context[key] || 'UNKNOWN'} onChange={(event) => setContext(key, event.target.value)}>
                  {options.map((option) => <option key={option} value={option}>{option === 'UNKNOWN' ? 'Not known' : human(option)}</option>)}
                </select> : <input value={context[key] || ''} onChange={(event) => setContext(key, event.target.value)} />}
              </label>)}
            </div>
          </div>;
        })}
      </details>
    </div>
  );
}
function Analyze() {
  const empty = () => ({
    report_id: '',
    site: '',
    department: 'Not specified',
    report_type: 'Near Miss',
    event_date: new Date(Date.now() - 60000 + 19800000)
      .toISOString()
      .slice(0, 10),
    event_time: new Date(Date.now() - 60000 + 19800000)
      .toISOString()
      .slice(11, 16),
    description: '',
    immediate_action: '',
    source_system: 'MANUAL_ENTRY',
    source_record_id: '',
    is_synthetic: false,
    context: {} as Record<string, string>,
  });
  const [formKind, setFormKind] = useState<'near_miss' | 'accident' | 'general'>('near_miss');
  const [resultView, setResultView] = useState<'output' | 'complete'>('output');
  const [form, setForm] = useState(empty),
    [samples, setSamples] = useState<any[]>([]),
    [result, setResult] = useState<any>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [message, setMessage] = useState('');
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState('');
  async function downloadPdf() {
    if (!result?.report_id || pdfBusy) return;
    setPdfBusy(true);
    setPdfError('');
    try {
      const response = await fetch(API_BASE + '/analyses/' + encodeURIComponent(result.report_id) + '/pdf/', { credentials: 'include' });
      if (!response.ok) throw new Error('The report PDF could not be generated.');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Safety_Report_' + result.report_id + '.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (cause) {
      setPdfError(cause instanceof Error ? cause.message : 'The PDF download failed.');
    } finally { setPdfBusy(false); }
  }
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const sampleMenuRef = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    api('/samples/')
      .then(setSamples)
      .catch((e) => setError(e.message));
    const id = new URLSearchParams(window.location.search).get('report');
    if (id) {
      setBusy(true);
      api('/analyses/' + encodeURIComponent(id) + '/')
        .then(setResult)
        .catch((e) => setError(e.message))
        .finally(() => setBusy(false));
    }
  }, []);
  useEffect(() => {
    const closeSampleMenu = (event: PointerEvent) => {
      const menu = sampleMenuRef.current;
      if (menu?.open && !menu.contains(event.target as Node)) menu.open = false;
    };
    document.addEventListener('pointerdown', closeSampleMenu);
    return () => document.removeEventListener('pointerdown', closeSampleMenu);
  }, []);  const field = (key: string, value: any) =>
    setForm((f) => ({ ...f, [key]: value }));
  function chooseFormKind(next: 'near_miss' | 'accident' | 'general') {
    setFormKind(next);
    if (next !== 'near_miss') setImageFiles([]);
    setForm((current) => ({
      ...current,
      report_type: next === 'near_miss' ? 'Near Miss' : next === 'accident' ? 'Incident' : 'Unsafe Condition',
    }));
    setMessage('');
  }
  function chooseImages(files: File[]): boolean {
    if (files.length > 5) {
      setError('Upload no more than five pictures.');
      return false;
    }
    if (files.some((file) => file.size > 5 * 1024 * 1024 || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type))) {
      setError('Each picture must be PNG, JPEG or WebP and 5 MB or smaller.');
      return false;
    }
    setError('');
    setImageFiles(files);
    return true;
  }  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const context: Record<string, string> = Object.fromEntries(
        Object.entries(form.context).filter(([key]) =>
          (formKind === 'near_miss' || !key.startsWith('nm_')) &&
          (formKind === 'accident' || !key.startsWith('acc_')),
        ),
      );
      context.source_form = formKind.toUpperCase();
      if (formKind === 'near_miss') {
        if (context.nm_place && context.nm_place !== 'UNKNOWN') context.location = context.nm_place;
        if (context.nm_potential_outcomes && !context.reported_consequence) context.reported_consequence = context.nm_potential_outcomes;
      }
      if (formKind === 'accident') {
        if (context.acc_exact_location) context.location = context.acc_exact_location;
        if (context.acc_injury_nature) context.actual_consequence = context.acc_injury_nature;
        if (context.acc_cause && !context.reported_threat) context.reported_threat = context.acc_cause;
      }
      const hasImages = formKind === 'near_miss' && context.nm_pictures_taken === 'Yes' && imageFiles.length > 0;
      let body: BodyInit = JSON.stringify({ ...form, context });
      if (hasImages) {
        const uploadBody = new FormData();
        Object.entries({ ...form, context }).forEach(([key, value]) => {
          uploadBody.append(key, key === 'context' ? JSON.stringify(value) : String(value));
        });
        imageFiles.forEach((file) => uploadBody.append('images', file, file.name));
        body = uploadBody;
      }
      const r = await api('/analyze/', { method: 'POST', body });
      setResult(r);
      setResultView('output');
      window.history.replaceState(
        window.history.state,
        '',
        '/analyze?report=' + encodeURIComponent(r.report_id),
      );
      setMessage('Report submitted. The SIF result, Life-Saving Rules and precursor information are shown below.');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function upload(file: File) {
    setBusy(true);
    setError('');
    setMessage('');
    const body = new FormData();
    body.append('file', file);
    try {
      const r = await api('/reports/import/', { method: 'POST', body });
      setMessage(r.imported + ' reports imported and analysed.');
      if (r.analyses.length) {
        setResult(r.analyses[0]);
        setResultView('output');
        window.history.replaceState(
          window.history.state,
          '',
          '/analyze?report=' + encodeURIComponent(r.analyses[0].report_id),
        );
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }
  function sample(s: any) {
    if (sampleMenuRef.current) sampleMenuRef.current.open = false;
    setFormKind(s.form_kind === 'accident' ? 'accident' : s.report_type === 'Near Miss' ? 'near_miss' : 'general');
    setImageFiles([]);
    const reportId = 'DEMO-' + Date.now().toString(36).toUpperCase();
    const previousDay = new Date(Date.now() - 86_400_000 + 19_800_000)
      .toISOString()
      .slice(0, 10);
    setForm({
      ...empty(),
      report_id: reportId,
      source_record_id: reportId,
      site: s.site,
      department: s.department,
      event_date: previousDay,
      event_time: s.event_time,
      description: s.description,
      immediate_action: s.immediate_action,
      report_type: s.report_type,
      context: { ...s.context },
      is_synthetic: true,
      source_system: 'SYNTHETIC_DEMO',
    });
    setResult(null);
    setMessage('');
    setError('');
  }
  function startNewReport() {
    setResult(null);
    setResultView('output');
    setForm(empty());
    setImageFiles([]);
    setFormKind('near_miss');
    setMessage('');
    setError('');
    window.history.replaceState(window.history.state, '', '/analyze');
  }
  if (result) {
    return (
      <div className="saved-assessment">
        {resultView === 'output' ? (
          <ReportSummary data={result} onNew={startNewReport} onFull={() => setResultView('complete')} />
        ) : (
          <>
            <div className="assessment-toolbar full-report-toolbar">
              <Button type="button" variant="outline" onClick={() => setResultView('output')}>
                <ArrowRight size={15} /> Back to analysis result
              </Button>
              <Button type="button" onClick={downloadPdf} disabled={pdfBusy}>
                <Download size={16} /> {pdfBusy ? 'Preparing PDF...' : 'Download PDF'}
              </Button>
              <Button type="button" variant="outline" onClick={startNewReport}>
                <Plus size={15} /> New report
              </Button>
            </div>
            {pdfError && <p className="error-text" role="alert">{pdfError}</p>}
            <article className="complete-report full-report-document">
              <header className="full-report-title">
                <div className="full-report-brand">
                  <div className="full-report-logo"><img src="/ascension-logo.png" alt="Ascension" /></div>
                  <div className="full-report-heading">
                    <p>Ascension / SIF precursor assessment</p>
                    <h2>Full Report &amp; Detailed Analysis</h2>
                  </div>
                </div>
                <div className="full-report-document-meta"><span>Report ID: <strong>{result.report_id}</strong></span><span>Analysis date: <strong>{result.analysis_timestamp ? new Date(result.analysis_timestamp).toLocaleString('en-IN') : 'Not recorded'}</strong></span></div>
              </header>
              <SubmittedReport data={result} />
              <div className="complete-analysis-heading"><span>Detailed analysis</span></div>
              <Result data={result} />
            </article>
          </>
        )}
      </div>
    );
  }
  return (
    <div className="analysis-grid intake-only">
      <div>
        <Panel
          title="New safety report"
          className="intake-panel"
          action={
            <div className="report-header-actions">
              <input
                ref={fileRef}
                hidden
                type="file"
                accept=".csv,.xlsx"
                aria-label="Import reports"
                onChange={(e) =>
                  e.target.files?.[0] && upload(e.target.files[0])
                }
              />
          <details className="sample-picker" ref={sampleMenuRef}>
            <summary>
              <span className="sample-title"><strong>Try a sample report</strong></span>
              <span className="sample-hint">Fictional cases <ChevronRight size={14} /></span>
            </summary>
            <div className="sample-buttons">
              {samples.filter((s) => s.show_in_picker !== false).map((s) => (
                <Button key={s.name} type="button" variant="outline" disabled={busy} onClick={() => sample(s)}>
                  {s.name}
                </Button>
              ))}
            </div>
          </details>
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => fileRef.current?.click()}
              >
                <Upload size={15} />
                Import file
              </Button>
            </div>
          }
        >
          <div className="report-entry-toolbar"><div className="form-kind-switch" role="group" aria-label="Choose report form">
            <span>1. Choose report form</span>
            <div>
              <Button type="button" variant="outline" aria-pressed={formKind === 'near_miss'} onClick={() => chooseFormKind('near_miss')}>Near-miss report</Button>
              <Button type="button" variant="outline" aria-pressed={formKind === 'accident'} onClick={() => chooseFormKind('accident')}>Accident report (Form-A)</Button>
              <Button type="button" variant="outline" aria-pressed={formKind === 'general'} onClick={() => chooseFormKind('general')}>UA/UC &amp; general</Button>
            </div>
          </div>

          </div>
          <form onSubmit={submit}>
            {formKind === 'near_miss' ? (
              <NearMissPaperForm form={form} field={field} imageFiles={imageFiles} onImageFilesChange={chooseImages} />
            ) : formKind === 'accident' ? (
              <AccidentFormA form={form} field={field} />
            ) : (
              <SafetyObservationForm form={form} field={field} />
            )}
            <div className="submit-row nm-submit-row">
              <Button size="lg" type="submit" disabled={busy}>
                {busy ? (
                  <LoaderCircle className="spin" size={17} />
                ) : (
                  <Activity size={17} />
                )}{' '}
                {busy ? 'Processing…' : 'Submit report'}
                <ArrowRight size={16} />
              </Button>
            </div>
            {error && (
              <div className="notice error" role="alert">
                {error}
              </div>
            )}
            {message && (
              <div className="notice" role="status">
                <Check size={18} />
                {message}
                <Link href="/review" className="text-link">
                  Open queue
                </Link>
              </div>
            )}
          </form>
        </Panel>

      </div>
    </div>
  );
}
function Precursors({ patterns, days }: any) {
  const [selected, setSelected] = useState<string | null>(null),
    [reports, setReports] = useState<any[]>([]),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    setSelected(new URLSearchParams(window.location.search).get('pattern'));
  }, []);
  useEffect(() => {
    if (!selected) return;
    let active = true;
    setBusy(true);
    setError('');
    api('/patterns/' + selected + '/reports/?days=' + days)
      .then((r) => active && setReports(r))
      .catch((e) => active && setError(e.message))
      .finally(() => active && setBusy(false));
    return () => {
      active = false;
    };
  }, [selected, days]);
  const current = patterns.find((p: any) => p.pattern_id === selected);
  return (
    <>
      <div className="section-toolbar">
        <span className="section-label">
          {patterns.length} PRECURSOR FAMILIES
        </span>
        <p className="muted">
          Curated hazard–barrier families · EWMA α = 0.3 · 8-week history
        </p>
      </div>
      <div className="pattern-list-heading">
        <span>Hazard / critical barrier</span>
        <span>8-week activity</span>
        <span>Reports / SIF / sites</span>
        <span>Trend</span>
      </div>
      <div className="pattern-grid">
        {patterns.map((p: any) => (
          <button
            aria-haspopup="dialog"
            onClick={() => setSelected(p.pattern_id)}
            key={p.pattern_id}
            className={
              'pattern-card ' + (selected === p.pattern_id ? 'selected' : '')
            }
          >
            <div className="pattern-identity">
              <span className="eyebrow">{p.pattern_id}</span>
              <h2>{p.dominant_hazard}</h2>
              <p>{p.dominant_barrier}</p>
              <Badge value={p.dominant_barrier_state} />
            </div>
            <div
              className="mini-bars"
              aria-label={'Weekly reports: ' + p.weekly_counts.join(', ')}
            >
              {p.weekly_counts.map((n: number, i: number) => (
                <span
                  key={i}
                  title={
                    'Week ' + (i + 1) + ': ' + n + ' reports; EWMA ' + p.ewma[i]
                  }
                  style={{
                    height: Math.max(
                      4,
                      (n / Math.max(...p.weekly_counts, 1)) * 36,
                    ),
                  }}
                />
              ))}
            </div>
            <div className="pattern-counts">
              <strong>
                {p.report_count}
                <span>reports</span>
              </strong>
              <strong>
                {p.sif_count}
                <span>SIF</span>
              </strong>
              <strong>
                {p.sites.length}
                <span>sites</span>
              </strong>
            </div>
            <div className="pattern-trend">
              <Badge value={p.trend} />
              <ArrowUpRight size={17} />
            </div>
          </button>
        ))}
      </div>
      {current && (
        <Sheet
          open={Boolean(current)}
          onOpenChange={(open) => !open && setSelected(null)}
        >
          <SheetContent className="evidence-drawer" showCloseButton={false}>
            <SheetTitle className="sr-only">{current.title}</SheetTitle>
            <SheetDescription className="sr-only">
              Precursor evidence, trend and related reports.
            </SheetDescription>
            <Panel
              title={current.title}
              action={
                <Button
                  variant="ghost"
                  aria-label="Close precursor evidence"
                  onClick={() => setSelected(null)}
                >
                  Close
                </Button>
              }
              eyebrow={current.pattern_id + ' · Supporting evidence'}
            >
              <div className="pattern-detail">
                <p>
                  <strong>Sites:</strong> {current.sites.join(', ')}
                </p>
                <p>
                  <strong>Activity:</strong> {current.activities.join(', ')} ·{' '}
                  <strong>Severity:</strong> {human(current.severity)}
                </p>
                <div className="tags">
                  {current.iogp_rules.map((r: string) => (
                    <span key={r}>{r}</span>
                  ))}
                </div>
                <TrendChart
                  counts={current.weekly_counts}
                  ewma={current.ewma}
                />
                <p className="footnote">
                  {current.period}. Weekly counts:{' '}
                  {current.weekly_counts.join(' / ')}. EWMA:{' '}
                  {current.ewma.join(' / ')}.
                </p>
              </div>
              {busy ? (
                <p className="padded">Loading source reports…</p>
              ) : error ? (
                <p role="alert" className="notice error">
                  {error}
                </p>
              ) : (
                reports.map((r) => (
                  <Link
                    className="priority-row"
                    key={r.report_id}
                    href={'/analyze?report=' + r.report_id}
                  >
                    <FileText size={18} />
                    <div>
                      <div className="inline">
                        <strong>{r.report_id}</strong>
                        <Badge value={r.priority} />
                      </div>
                      <p>{r.description}</p>
                      <small>{r.site}</small>
                    </div>
                    <ArrowUpRight size={16} />
                  </Link>
                ))
              )}
            </Panel>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
function Reviews({ reviews, onSaved }: any) {
  const [status, setStatus] = useState('OPEN'),
    [dateOrder, setDateOrder] = useState('ALL'),
    [selected, setSelected] = useState<any>(null),
    [decision, setDecision] = useState('CONFIRM'),
    [reviewer, setReviewer] = useState(''),
    [reason, setReason] = useState(''),
    [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  const visible = reviews
    .filter((r: any) => status === 'ALL' || r.status === status)
    .sort((a: any, b: any) => {
      if (dateOrder === 'ALL') return 0;
      const aTime = new Date(a.created_at || 0).getTime();
      const bTime = new Date(b.created_at || 0).getTime();
      return dateOrder === 'LATEST' ? bTime - aTime : aTime - bTime;
    });
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('/reviews/' + selected.id + '/decision/', {
        method: 'POST',
        body: JSON.stringify({
          decision,
          reviewer,
          override_reason: reason,
          version: selected.version,
        }),
      });
      setMessage(
        'Decision recorded for ' +
          selected.report_id +
          '. The original AI assessment is preserved.',
      );
      setSelected(null);
      onSaved();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="section-toolbar">
        <div className="inline">
          <span className="section-label">{visible.length} CASES</span>
          <p className="muted">
            Hard gates first · oldest cases within each priority
          </p>
        </div>
        <Picker
          label="Review status"
          value={status}
          onChange={setStatus}
          options={[
            'OPEN',
            'ESCALATED',
            'AWAITING_INFORMATION',
            'REVIEWED',
            'ALL',
          ]}
        />
        <Picker
          label="Date order"
          value={dateOrder}
          onChange={setDateOrder}
          options={['LATEST', 'OLDEST', 'ALL']}
        />
      </div>
      {message && (
        <div className="notice" role="status">
          {message}
        </div>
      )}
      <div className="review-layout">
        <Panel title="Review cases">
          <Table>
            <TableHeader>
              <TableRow>
                {[
                  'Priority',
                  'Report / site',
                  'Safety finding',
                  'Status',
                  '',
                ].map((x, i) => (
                  <TableHead key={i}>{x}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((r: any) => (
                <TableRow
                  key={r.id}
                  data-state={selected?.id === r.id ? 'selected' : undefined}
                >
                  <TableCell>
                    <Badge value={r.priority} />
                  </TableCell>
                  <TableCell>
                    <strong>{r.report_id}</strong>
                    <small className="block">{r.site}</small>
                  </TableCell>
                  <TableCell className="case-finding">
                    <p>{r.description}</p>
                    <span>
                      {r.barrier_states.map(human).join(' · ') ||
                        'Barrier unknown'}
                    </span>
                    <small className="block">
                      {human(r.sif_label).replace(/^Sif/, 'SIF')} ·{' '}
                      {new Date(r.created_at).toLocaleDateString()}
                    </small>
                  </TableCell>
                  <TableCell>
                    <Badge value={r.status} />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelected(r);
                        setError('');
                        setReason('');
                        setDecision('CONFIRM');
                      }}
                    >
                      Review
                      <ArrowRight size={14} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!visible.length && <Empty>No cases with this status.</Empty>}
        </Panel>
        {selected && (
          <Sheet
            open={Boolean(selected)}
            onOpenChange={(open) => !open && setSelected(null)}
          >
            <SheetContent className="review-drawer" showCloseButton={false}>
              <SheetTitle className="sr-only">
                Review {selected.report_id}
              </SheetTitle>
              <SheetDescription className="sr-only">
                Inspect the safety finding and record an HSSE decision.
              </SheetDescription>
              <Panel
                title={selected.report_id}
                eyebrow="Record HSSE decision"
                action={
                  <Button
                    variant="ghost"
                    aria-label="Close review"
                    onClick={() => setSelected(null)}
                  >
                    Close
                  </Button>
                }
              >
                <div className="review-form">
                  <Badge value={selected.priority} />
                  <p>{selected.description}</p>
                  <Link
                    className="text-link"
                    href={'/analyze?report=' + selected.report_id}
                  >
                    Inspect full evidence <ArrowUpRight size={15} />
                  </Link>
                  <ul className="reason-list">
                    {selected.review_reason.map((r: string) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                  <form onSubmit={save}>
                    <label className="full-label">
                      Reviewer <span>*</span>
                      <Input
                        required
                        maxLength={120}
                        value={reviewer}
                        onChange={(e) => setReviewer(e.target.value)}
                      />
                    </label>
                    <p className="footnote">
                      Local demo identity is self-reported and marked unverified
                      in the audit.
                    </p>
                    <label className="full-label">
                      Decision
                      <Picker
                        label="HSSE decision"
                        value={decision}
                        onChange={setDecision}
                        options={[
                          'CONFIRM',
                          'DISAGREE',
                          'REQUEST_MORE_INFORMATION',
                          'ESCALATE',
                        ]}
                      />
                    </label>
                    <label className="full-label">
                      Reason / review notes{' '}
                      {decision === 'DISAGREE' && <span>*</span>}
                      <Textarea
                        required={decision === 'DISAGREE'}
                        value={reason}
                        maxLength={4000}
                        onChange={(e) => setReason(e.target.value)}
                        rows={4}
                      />
                    </label>
                    <Button size="lg" type="submit" disabled={busy}>
                      {busy ? (
                        <LoaderCircle className="spin" size={16} />
                      ) : (
                        <ClipboardCheck size={16} />
                      )}
                      Save decision
                    </Button>
                    {error && (
                      <p className="notice error" role="alert">
                        {error}
                      </p>
                    )}
                  </form>
                  {selected.decisions.length > 0 && (
                    <div className="history">
                      <h3>Decision history</h3>
                      {selected.decisions.map((d: any, i: number) => (
                        <div key={i}>
                          <strong>{human(d.decision)}</strong>
                          <p>
                            {d.reviewer} ·{' '}
                            {new Date(d.timestamp).toLocaleString()}
                          </p>
                          <p>{d.override_reason}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Panel>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </>
  );
}
