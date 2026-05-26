<script setup lang="ts">
const colorMode = useColorMode();
const theme = computed(() => (colorMode.value === 'inkwell-night' ? 'inkwell-night' : 'inkwell-day'));
const isNight = computed(() => theme.value === 'inkwell-night');

function toggleTheme() {
  colorMode.preference = isNight.value ? 'inkwell-day' : 'inkwell-night';
}

useHead({
  title: 'ARCP · Agent Runtime Control Protocol',
  meta: [
    {
      name: 'description',
      content:
        'A transport-agnostic wire protocol for submitting, observing, and controlling long-running AI agent jobs — sessions, time-bounded leases, budget enforcement, provisioned credentials, and resumable event streams.',
    },
  ],
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    {
      rel: 'preload',
      as: 'style',
      href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;500;600&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400;1,6..72,500&display=swap',
    },
  ],
});

const nav = [
  { href: '#why', label: 'Why' },
  { href: '#principles', label: 'Principles' },
  { href: '#lifecycle', label: 'Lifecycle' },
  { href: '#envelope', label: 'Envelope' },
  { href: '#messages', label: 'Messages' },
  { href: '#sdks', label: 'SDKs' },
];

const heroBill = [
  { label: 'Spec Version', value: '1.1', mono: true },
  { label: 'Wire Format', value: 'JSON', mono: false },
  { label: 'Mandatory Transports', value: '02', mono: true },
  { label: 'Reference SDKs', value: '11', mono: true },
  { label: 'License', value: 'Apache · CC BY', mono: false, accent: true },
];

const principles = [
  {
    title: 'Transport agnostic.',
    body: 'WebSocket is mandatory for network deployments and <code>stdio</code> for in-process children. HTTP/2, QUIC, and message-queue transports are optional bindings with identical wire semantics.',
  },
  {
    title: 'Streaming native.',
    body: 'Large results stream as ordered <code>result_chunk</code> events terminated by <code>job.result</code>. Progress, logs, metrics, and tool I/O share one event envelope and one sequencing contract.',
  },
  {
    title: 'Authenticated by default.',
    body: 'Every session opens with <code>session.hello</code> carrying a bearer token. The runtime returns <code>UNAUTHENTICATED</code> before any job traffic is permitted.',
  },
  {
    title: 'Durable and resumable.',
    body: 'A rotating <code>resume_token</code> plus <code>last_event_seq</code> replays buffered events after a transport drop. Jobs keep running server-side; <code>RESUME_WINDOW_EXPIRED</code> is the only honest failure.',
  },
  {
    title: 'Capability-explicit.',
    body: 'Hello and welcome each advertise a <code>features</code> list. The effective set is their intersection. Either peer using a feature outside that intersection is a protocol violation.',
  },
  {
    title: 'Lease-bounded authority.',
    body: 'Every authority-bearing operation is gated by a namespaced lease — <code>fs.read</code>, <code>net.fetch</code>, <code>tool.call</code>, <code>cost.budget</code>, <code>model.use</code>. Delegation must be a strict subset.',
  },
  {
    title: 'One error taxonomy.',
    body: 'Fifteen canonical codes including <code>LEASE_EXPIRED</code>, <code>BUDGET_EXHAUSTED</code>, and <code>RESUME_WINDOW_EXPIRED</code>. Each carries a <code>retryable</code> boolean. Dashboards port across runtimes unchanged.',
  },
  {
    title: 'Boring on the wire.',
    body: 'A single JSON envelope: <code>arcp</code>, <code>id</code>, <code>type</code>, <code>session_id</code>, <code>trace_id</code>, <code>job_id</code>, <code>event_seq</code>, <code>payload</code>. W3C Trace Context. Unknown top-level fields MUST be ignored.',
  },
];

const lifecycle = [
  { num: '01', kind: 'Open', name: 'hello', desc: 'Client opens transport and sends <code>session.hello</code> with bearer auth and a <code>features</code> capability list.' },
  { num: '02', kind: 'Open', name: 'welcome', desc: 'Runtime returns <code>session.welcome</code> with <code>session_id</code>, <code>resume_token</code>, <code>heartbeat_interval_sec</code>, and the agent inventory.' },
  { num: '03', kind: 'Working', name: 'active', desc: '<code>job.submit</code>, <code>job.event</code>, and <code>session.ack</code> flow under one gap-free <code>event_seq</code>.', key: true },
  { num: '04', kind: 'Working', name: 'heartbeat', desc: 'Idle peers exchange <code>session.ping</code> / <code>session.pong</code>; two missed intervals surface <code>HEARTBEAT_LOST</code>.' },
  { num: '05', kind: 'Recovery', name: 'resume', desc: '<code>session.resume</code> replays buffered events from <code>last_event_seq</code> using the rotated <code>resume_token</code>.' },
  { num: '06', kind: 'Terminal', name: 'close', desc: '<code>session.close</code> is acknowledged with <code>session.closed</code>. In-flight jobs keep running and remain resumable.' },
];

const envelopeNotes = [
  {
    num: '01',
    field: 'arcp · type',
    body: 'The spec version the sender targets and the message type that determines payload schema. Unknown top-level envelope fields <em>MUST</em> be ignored — forward compatibility is a wire-level guarantee.',
  },
  {
    num: '02',
    field: 'id',
    body: 'A request-scoped identifier used for correlation across request/response pairs (e.g. <code>session.list_jobs</code> ↔ <code>session.jobs</code>) and for <code>idempotency_key</code> reuse detection at the job layer.',
  },
  {
    num: '03',
    field: 'session_id · job_id',
    body: 'Scope. <code>session_id</code> is the unit of authority and resume. <code>job_id</code> attaches events to a specific job; subscribers from other sessions observe the same <code>job_id</code> stream.',
  },
  {
    num: '04',
    field: 'trace_id',
    body: 'W3C Trace Context propagates verbatim. Runtimes <em>MUST</em> forward it to tool servers and sub-agents so spans land in OpenTelemetry, Datadog, or Honeycomb without translation.',
  },
  {
    num: '05',
    field: 'event_seq · payload',
    body: 'Session-scoped, strictly monotonic, gap-free across reconnects within the buffer window. An unexpected gap <em>SHOULD</em> trigger resume. <code>payload</code> shape is keyed by <code>type</code>.',
  },
];

const messages = [
  {
    name: 'Sessions',
    items: [
      'session.hello',
      'session.welcome',
      'session.resume',
      'session.ping',
      'session.pong',
      'session.ack',
      'session.list_jobs',
      'session.jobs',
      'session.close',
      'session.closed',
    ],
  },
  {
    name: 'Jobs',
    items: [
      'job.submit',
      'job.accepted',
      'job.cancel',
      'job.cancelled',
      'job.subscribe',
      'job.subscribed',
      'job.unsubscribe',
      'job.event',
      'job.result',
      'job.error',
    ],
  },
  {
    name: 'Event kinds',
    items: [
      'log',
      'thought',
      'tool_call',
      'tool_result',
      'status',
      'metric',
      'artifact_ref',
      'delegate',
      'progress',
      'result_chunk',
    ],
  },
];

type SdkIcon = readonly [prefix: 'fab' | 'fal', name: string];
const sdks: { lang: string; pkg: string; cmd: string; icon: SdkIcon }[] = [
  { lang: 'TypeScript', pkg: '@arcp/sdk', cmd: 'npm install @arcp/sdk', icon: ['fab', 'js'] },
  { lang: 'Python', pkg: 'arcp', cmd: 'pip install arcp', icon: ['fab', 'python'] },
  { lang: 'Go', pkg: 'arcp-io/go-sdk', cmd: 'go get github.com/arcp-io/go-sdk', icon: ['fal', 'code'] },
  { lang: 'Rust', pkg: 'arcp', cmd: 'cargo add arcp', icon: ['fab', 'rust'] },
  { lang: 'Java', pkg: 'io.arcp:arcp-sdk', cmd: "implementation 'io.arcp:arcp-sdk'", icon: ['fab', 'java'] },
  { lang: 'Kotlin', pkg: 'arcp-sdk-kotlin', cmd: "implementation 'io.arcp:arcp-sdk-kotlin'", icon: ['fal', 'code'] },
  { lang: 'Swift', pkg: 'Arcp', cmd: '.package(url: ".../Arcp.git")', icon: ['fab', 'swift'] },
  { lang: 'Ruby', pkg: 'arcp', cmd: 'gem install arcp', icon: ['fal', 'code'] },
  { lang: 'PHP', pkg: 'arcp/sdk', cmd: 'composer require arcp/sdk', icon: ['fab', 'php'] },
  { lang: 'C#', pkg: 'Arcp.Sdk', cmd: 'dotnet add package Arcp.Sdk', icon: ['fal', 'code'] },
  { lang: 'F#', pkg: 'Arcp.Sdk.FSharp', cmd: 'dotnet add package Arcp.Sdk.FSharp', icon: ['fal', 'code'] },
];

const footerColumns = [
  {
    title: 'Specification',
    links: [
      { label: 'draft-arcp-1.1', href: '#' },
      { label: 'Changelog', href: '#' },
      { label: 'Proposals', href: '#' },
      { label: 'Glossary', href: '#' },
    ],
  },
  {
    title: 'Implementations',
    links: [
      { label: 'All 11 SDKs', href: '#sdks' },
      { label: 'Conformance suite', href: '#' },
      { label: 'Bridges & adapters', href: '#' },
      { label: 'Examples', href: '#' },
    ],
  },
  {
    title: 'Community',
    links: [
      { label: 'GitHub', href: '#' },
      { label: 'Discussions', href: '#' },
      { label: 'Working group', href: '#' },
      { label: 'Code of Conduct', href: '#' },
    ],
  },
];
</script>

<template>
  <InkApp :class="['arpc-shell', theme]">
    <InkHeader class="ink-header arpc-header">
      <div class="ink-header__inner arpc-header__inner">
        <label class="arpc-header__search" aria-label="Search">
          <FontAwesomeIcon
            class="arpc-header__search-icon"
            :icon="['fal', 'magnifying-glass']"
            aria-hidden="true"
          />
          <input
            type="search"
            class="arpc-header__search-input"
            placeholder="Search the spec…"
            spellcheck="false"
          />
        </label>

        <div class="arpc-header__right">
          <button
            type="button"
            class="arpc-header__theme"
            :aria-label="`Switch to ${isNight ? 'day' : 'night'} theme`"
            :data-current="isNight ? 'night' : 'day'"
            @click="toggleTheme"
          >
            <FontAwesomeIcon
              class="arpc-header__theme-glyph"
              :icon="['fal', isNight ? 'moon' : 'sun']"
              aria-hidden="true"
            />
          </button>
          <a class="arpc-header__github" href="#" aria-label="GitHub">
            <FontAwesomeIcon :icon="['fab', 'github']" aria-hidden="true" />
          </a>
        </div>
      </div>
    </InkHeader>

    <InkMain class="arpc-main">
      <!-- HERO -->
      <InkPageHero class="ink-page-hero arpc-hero">
        <div class="ink-page-hero__inner">
          <InkEyebrow class="ink-eyebrow">Agent Runtime Control Protocol · v1.1 · Internet-Draft</InkEyebrow>
          <h1 class="ink-page-hero__title">A wire protocol for <em>how</em> agents execute.</h1>
          <p class="ink-page-hero__description">
            <b>ARCP</b> is a transport-agnostic wire protocol for submitting, observing, and controlling
            long-running AI agent jobs — explicit liveness, event acknowledgement, cross-session
            subscription, time-bounded leases, budget enforcement, and resumable event streams.
          </p>
          <div class="ink-page-hero__actions">
            <a class="ink-btn" href="#envelope">Read the spec</a>
            <a class="ink-btn-secondary" href="#sdks">Reference SDKs</a>
          </div>

          <div class="arpc-bill">
            <div v-for="cell in heroBill" :key="cell.label" class="arpc-bill__cell">
              <div class="arpc-bill__label ink-meta ink-meta--soft">{{ cell.label }}</div>
              <div
                class="arpc-bill__value"
                :class="{ 'arpc-bill__value--mono': cell.mono, 'arpc-bill__value--accent': cell.accent }"
              >{{ cell.value }}</div>
            </div>
          </div>
        </div>
      </InkPageHero>

      <!-- § I · WHY -->
      <InkPageSection id="why" class="ink-page-section">
        <div class="ink-page-section__header">
          <InkEyebrow class="ink-eyebrow">§ I · Why a runtime protocol</InkEyebrow>
          <h2 class="ink-page-section__title">
            The <em>capability</em> layer is solved. The <em>execution</em> layer is not.
          </h2>
          <p class="ink-page-section__description">
            MCP exposes the tools an agent can call. ARCP wraps the agent function itself — the
            session, the lease, the event stream, and what survives a transport drop.
          </p>
        </div>

        <div class="ink-page-grid ink-page-grid--2 arpc-why">
          <InkPageCard class="ink-page-card">
            <div class="ink-page-card__header">
              <div class="ink-page-card__eyebrow">The gap</div>
              <h3 class="ink-page-card__title">Every runtime reinvents the same primitives.</h3>
            </div>
            <div class="ink-page-card__body">
              <p>
                Agent stacks today re-implement streaming, cancellation, heartbeats, durable jobs,
                human approval, audit, and multi-agent handoff in mutually incompatible ways. A tool
                host written for one runtime cannot be observed, federated with, or substituted for
                one written for another.
              </p>
              <p>
                Operationally critical concerns — <code>auth</code>, <code>retention</code>,
                <code>leases</code>, <code>replay</code> — get left to ad-hoc per-vendor conventions.
                The result is fragility everywhere it matters most.
              </p>
            </div>
          </InkPageCard>

          <InkPageCard class="ink-page-card">
            <div class="ink-page-card__header">
              <div class="ink-page-card__eyebrow">The fix</div>
              <h3 class="ink-page-card__title">A spec for execution, not just exposure.</h3>
            </div>
            <div class="ink-page-card__body">
              <p>
                ARCP is deliberately a <em>runtime</em> protocol, not a capability discovery
                protocol. It defines the envelopes, lifecycles, and contracts that bind clients,
                runtimes, tool hosts, observers, and humans into a coherent execution surface.
              </p>
              <p>
                MCP describes what exists. ARCP describes how it runs — including the semantics of
                cancellation, heartbeats, leases, replay, and human input that capability-only
                protocols leave as exercises for the implementer.
              </p>
            </div>
          </InkPageCard>
        </div>
      </InkPageSection>

      <!-- § II · PRINCIPLES -->
      <InkPageSection id="principles" class="ink-page-section">
        <div class="ink-page-section__header">
          <InkEyebrow class="ink-eyebrow">§ II · Design principles · Eight commitments</InkEyebrow>
          <h2 class="ink-page-section__title">Eight commitments inform every wire-format decision.</h2>
          <p class="ink-page-section__description">
            Where they conflict with cleverness, cleverness loses.
          </p>
        </div>

        <div class="ink-page-grid ink-page-grid--4 arpc-principles">
          <InkPageFeature
            v-for="(p, i) in principles"
            :key="p.title"
            class="ink-page-feature arpc-principle"
          >
            <div class="ink-page-feature__icon arpc-principle__num">
              {{ ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii'][i] }}.
            </div>
            <h3 class="ink-page-feature__title">{{ p.title }}</h3>
            <p class="ink-page-feature__description" v-html="p.body" />
          </InkPageFeature>
        </div>
      </InkPageSection>

      <!-- § III · LIFECYCLE -->
      <InkPageSection id="lifecycle" class="ink-page-section">
        <div class="ink-page-section__header">
          <InkEyebrow class="ink-eyebrow">§ III · Session lifecycle</InkEyebrow>
          <h2 class="ink-page-section__title">Six phases. One <em>resumable</em> stream.</h2>
          <p class="ink-page-section__description">
            Every ARCP session begins with <code>hello</code>/<code>welcome</code> and carries a
            session-scoped <code>event_seq</code>. Heartbeats keep it live; resume replays it after a
            drop; close drains it.
          </p>
        </div>

        <div class="arpc-flow">
          <div class="arpc-flow__rail">
            <div
              v-for="step in lifecycle"
              :key="step.num"
              class="arpc-flow__step"
              :class="{ 'arpc-flow__step--key': step.key }"
            >
              <div class="arpc-flow__node">{{ step.num }}</div>
              <div class="arpc-flow__kind ink-meta ink-meta--soft">{{ step.kind }}</div>
              <div class="arpc-flow__name">{{ step.name }}</div>
              <p class="arpc-flow__desc" v-html="step.desc" />
            </div>
          </div>
        </div>
      </InkPageSection>

      <!-- § IV · ENVELOPE -->
      <InkPageSection id="envelope" class="ink-page-section">
        <div class="ink-page-section__header">
          <InkEyebrow class="ink-eyebrow">§ IV · The envelope</InkEyebrow>
          <h2 class="ink-page-section__title">Every message wears the <em>same</em> outer shape.</h2>
          <p class="ink-page-section__description">
            Eight stable fields carry every interaction. Unknown top-level fields MUST be ignored —
            forward compatibility is a wire-level guarantee, not a versioning convention.
          </p>
        </div>

        <div class="arpc-envelope">
          <div class="arpc-code">
            <div class="arpc-code__head">
              <span class="ink-meta ink-meta--soft">arcp · message envelope · v1.1</span>
            </div>
<pre class="arpc-code__pre"><span class="p">{</span>
  <span class="k">"arcp"</span><span class="p">:</span>        <span class="s">"1.1"</span><span class="p">,</span>
  <span class="k">"id"</span><span class="p">:</span>          <span class="s">"01JABC..."</span><span class="p">,</span>
  <span class="k">"type"</span><span class="p">:</span>        <span class="s">"job.event"</span><span class="p">,</span>
  <span class="k">"session_id"</span><span class="p">:</span>  <span class="s">"sess_01J..."</span><span class="p">,</span>
  <span class="k">"trace_id"</span><span class="p">:</span>    <span class="s">"4bf92f3577b34da6a3ce929d0e0e4736"</span><span class="p">,</span>
  <span class="k">"job_id"</span><span class="p">:</span>      <span class="s">"job_01JABC..."</span><span class="p">,</span>
  <span class="k">"event_seq"</span><span class="p">:</span>   <span class="n">1827</span><span class="p">,</span>
  <span class="k">"payload"</span><span class="p">:</span> <span class="p">{</span>
    <span class="k">"kind"</span><span class="p">:</span> <span class="s">"progress"</span><span class="p">,</span>
    <span class="k">"ts"</span><span class="p">:</span>   <span class="s">"2026-05-13T19:42:13Z"</span><span class="p">,</span>
    <span class="k">"body"</span><span class="p">:</span> <span class="p">{</span>
      <span class="k">"current"</span><span class="p">:</span> <span class="n">47</span><span class="p">,</span>
      <span class="k">"total"</span><span class="p">:</span>   <span class="n">120</span><span class="p">,</span>
      <span class="k">"units"</span><span class="p">:</span>   <span class="s">"files"</span><span class="p">,</span>
      <span class="k">"message"</span><span class="p">:</span> <span class="s">"Refactoring src/auth/middleware.ts"</span>
    <span class="p">}</span>
  <span class="p">}</span>
<span class="p">}</span></pre>
          </div>

          <ul class="arpc-notes">
            <li v-for="n in envelopeNotes" :key="n.num" class="arpc-note">
              <div class="arpc-note__head">
                <InkBadge class="ink-badge ink-badge--accent">{{ n.num }}</InkBadge>
                <span class="arpc-note__field">{{ n.field }}</span>
              </div>
              <p class="arpc-note__body" v-html="n.body" />
            </li>
          </ul>
        </div>
      </InkPageSection>

      <!-- § V · MESSAGES -->
      <InkPageSection id="messages" class="ink-page-section">
        <div class="ink-page-section__header">
          <InkEyebrow class="ink-eyebrow">§ V · Message types · Three groups</InkEyebrow>
          <h2 class="ink-page-section__title">A small <em>vocabulary</em> for runtime control.</h2>
          <p class="ink-page-section__description">
            Thirty surface forms: ten session messages, ten job messages, ten event kinds carried
            inside <code>job.event</code>. New behaviors arrive as new feature flags — not new core types.
          </p>
        </div>

        <div class="ink-page-grid ink-page-grid--3 arpc-msgs">
          <InkPageCard v-for="cat in messages" :key="cat.name" class="ink-page-card arpc-msg">
            <div class="ink-page-card__header arpc-msg__head">
              <h3 class="ink-page-card__title arpc-msg__name">{{ cat.name }}</h3>
              <span class="arpc-msg__count">{{ String(cat.items.length).padStart(2, '0') }}</span>
            </div>
            <ul class="arpc-msg__list">
              <li v-for="m in cat.items" :key="m">
                <InkChip class="ink-chip arpc-msg__chip">{{ m }}</InkChip>
              </li>
            </ul>
          </InkPageCard>
        </div>
      </InkPageSection>

      <!-- § VI · SDKs -->
      <InkPageSection id="sdks" class="ink-page-section">
        <div class="ink-page-section__header">
          <InkEyebrow class="ink-eyebrow">§ VI · Reference implementations</InkEyebrow>
          <h2 class="ink-page-section__title">Eleven SDKs. One <em>conformance suite</em>.</h2>
          <p class="ink-page-section__description">
            Each SDK tracks <code>draft-arcp-1.1</code>. Discrepancies between the spec and any reference
            impl are bugs against the spec repository.
          </p>
        </div>

        <div class="ink-page-grid ink-page-grid--4 arpc-sdks">
          <InkPageCard v-for="s in sdks" :key="s.lang" class="ink-page-card arpc-sdk">
            <div class="ink-page-card__header arpc-sdk__head">
              <h3 class="ink-page-card__title arpc-sdk__lang">
                <FontAwesomeIcon class="arpc-sdk__icon" :icon="s.icon" aria-hidden="true" />
                <span>{{ s.lang }}</span>
              </h3>
              <span class="arpc-sdk__pkg">{{ s.pkg }}</span>
            </div>
            <label class="arpc-sdk__inst" :aria-label="`Install ${s.lang} SDK`">
              <span class="arpc-sdk__inst-prompt" aria-hidden="true">$</span>
              <input
                class="arpc-sdk__inst-cmd"
                type="text"
                :value="s.cmd"
                readonly
                spellcheck="false"
                @focus="($event.target as HTMLInputElement).select()"
              />
            </label>
            <div class="arpc-sdk__foot">
              <span class="ink-meta ink-meta--soft">v1.1 · draft</span>
              <InkBadge class="ink-badge ink-badge--accent ink-badge--dot">tracking</InkBadge>
            </div>
          </InkPageCard>

          <InkPageCard class="ink-page-card arpc-sdk arpc-sdk--placeholder">
            <p>
              Your language next.<br />
              <a class="ink-btn-secondary" href="#" style="font-size:14px; padding:6px 18px;">Bootstrap from the spec</a>
            </p>
          </InkPageCard>
        </div>
      </InkPageSection>

      <!-- CTA -->
      <InkPageCta class="ink-page-cta arpc-cta">
        <InkEyebrow class="ink-eyebrow">§ VII · Get started</InkEyebrow>
        <h2 class="ink-page-cta__title">Build agents that <em>execute</em> the same way everywhere.</h2>
        <p class="ink-page-cta__message">
          The spec is short, the conformance suite is exhaustive, and the reference
          implementations are Apache-2.0.
        </p>
        <div class="ink-page-cta__actions">
          <a class="ink-btn" href="#">Read draft-arcp-1.1</a>
          <a class="ink-btn-secondary arpc-cta-link" href="#">
            <FontAwesomeIcon :icon="['fab', 'github']" aria-hidden="true" />
            <span>View on GitHub</span>
          </a>
        </div>
        <div class="arpc-cta__meta ink-meta ink-meta--soft">
          spec · CC BY 4.0 &nbsp;·&nbsp; impl · Apache-2.0
        </div>
      </InkPageCta>
    </InkMain>

    <!-- FOOTER -->
    <InkFooter class="arpc-footer">
      <div class="ink-footer-columns arpc-footer-cols">
        <div class="ink-footer-columns__inner">
          <div class="ink-footer-columns__column arpc-footer-brand">
            <InkWordmark class="ink-wordmark">ARCP</InkWordmark>
            <p class="arpc-footer-brand__tag">
              A transport-agnostic wire protocol for submitting, observing, and controlling
              long-running AI agent jobs — sessions, leases, budgets, provisioned credentials,
              and resumable event streams.
            </p>
          </div>
          <div v-for="col in footerColumns" :key="col.title" class="ink-footer-columns__column">
            <h4 class="ink-footer-columns__heading">{{ col.title }}</h4>
            <ul>
              <li v-for="l in col.links" :key="l.label">
                <a :href="l.href">{{ l.label }}</a>
              </li>
            </ul>
          </div>
        </div>
        <div class="ink-footer-columns__bottom arpc-colophon">
          <span><em>ARCP v1.1 · Internet-Draft</em> · expires 2026·11·13</span>
          <span>spec · CC BY 4.0 · impl · Apache-2.0</span>
          <span>set in Newsreader &amp; JetBrains Mono</span>
        </div>
      </div>
    </InkFooter>
  </InkApp>
</template>

<style>
/* ── shell ───────────────────────────────────────────────────────────── */
html, body {
  background: var(--bg);
}
.arpc-shell {
  min-height: 100vh;
}

/* ── header (sticky, blurred) ────────────────────────────────────────── */
.arpc-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: color-mix(in srgb, var(--bg) 88%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
.arpc-header__inner {
  max-width: var(--iw-w-wide);
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr minmax(0, 480px) 1fr;
  align-items: center;
  gap: var(--iw-space-4);
  padding: 14px var(--iw-space-6);
}
.arpc-header__search {
  grid-column: 2;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border: 1px solid var(--rule);
  border-radius: var(--iw-radius);
  background: color-mix(in srgb, var(--ink) 3%, transparent);
  transition: border-color var(--iw-dur) var(--iw-ease);
  min-width: 0;
}
.arpc-header__search:focus-within { border-color: var(--accent); }
.arpc-header__search-icon {
  color: var(--ink-soft);
  font-size: 12px;
  flex: 0 0 auto;
}
.arpc-header__search-input {
  flex: 1;
  min-width: 0;
  width: 100%;
  background: transparent;
  border: 0;
  outline: 0;
  padding: 0;
  margin: 0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--ink);
}
.arpc-header__search-input::placeholder {
  color: var(--muted);
  letter-spacing: 0.04em;
}
.arpc-header__search-input::-webkit-search-cancel-button {
  -webkit-appearance: none;
  appearance: none;
}
.arpc-header__brand {
  display: flex;
  align-items: center;
  gap: 18px;
  min-width: 0;
}
.arpc-header__pip {
  white-space: nowrap;
  letter-spacing: 0.22em;
  font-size: 10px;
}
.arpc-header__nav {
  display: flex;
  gap: 4px;
  margin-left: var(--iw-space-4);
}
.arpc-header__right {
  grid-column: 3;
  justify-self: end;
  display: flex;
  align-items: center;
  gap: var(--iw-space-3);
}
.arpc-header__ver {
  font-size: 10px;
  letter-spacing: 0.18em;
  white-space: nowrap;
}
.arpc-header__theme {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--ink-soft);
  cursor: pointer;
  transition: color var(--iw-dur) var(--iw-ease);
}
.arpc-header__theme:hover { color: var(--accent); }
.arpc-header__theme-glyph.svg-inline--fa { font-size: 22px; }
.arpc-header__github {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--ink-soft);
  text-decoration: none;
  transition: color var(--iw-dur) var(--iw-ease);
}
.arpc-header__github .svg-inline--fa { font-size: 22px; }
.arpc-header__github:hover { color: var(--accent); }
@media (max-width: 1080px) {
  .arpc-header__nav,
  .arpc-header__pip { display: none; }
}
@media (max-width: 720px) {
  .arpc-header__inner { padding: 12px var(--iw-space-4); }
  .arpc-header__ver { display: none; }
}
/* ── main / sections ─────────────────────────────────────────────────── */
.arpc-main {
  max-width: var(--iw-w-wide);
  margin: 0 auto;
  padding: var(--iw-space-9) var(--iw-space-6) var(--iw-space-8);
}
@media (max-width: 880px) { .arpc-main { padding: var(--iw-space-8) var(--iw-space-5) var(--iw-space-7); } }
@media (max-width: 520px) { .arpc-main { padding: var(--iw-space-7) var(--iw-space-4); } }

.arpc-hero { border-bottom: 1px solid var(--rule); margin-bottom: var(--iw-space-9); padding-bottom: var(--iw-space-8); }
.ink-page-hero__title em { color: var(--accent); font-style: italic; }
.ink-page-section__title em,
.ink-page-cta__title em { color: var(--accent); font-style: italic; }

/* bill of facts */
.arpc-bill {
  margin: var(--iw-space-7) auto 0;
  max-width: 920px;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  border-top: 1px solid var(--rule);
  border-bottom: 1px solid var(--rule);
}
.arpc-bill__cell {
  padding: var(--iw-space-4) var(--iw-space-3);
  text-align: center;
  border-right: 1px dotted var(--rule);
}
.arpc-bill__cell:last-child { border-right: none; }
.arpc-bill__label {
  font-size: 9px;
  letter-spacing: 0.22em;
  margin-bottom: 8px;
}
.arpc-bill__value {
  font-family: 'Newsreader', serif;
  font-style: italic;
  font-size: clamp(20px, 2.4vw, 26px);
  color: var(--ink);
  line-height: 1;
}
.arpc-bill__value--mono {
  font-family: 'JetBrains Mono', monospace;
  font-style: normal;
  font-size: clamp(18px, 2vw, 20px);
  font-feature-settings: 'tnum';
  font-variant-numeric: tabular-nums;
}
.arpc-bill__value--accent { color: var(--accent); }
@media (max-width: 720px) {
  .arpc-bill { grid-template-columns: repeat(2, 1fr); }
  .arpc-bill__cell:nth-child(2n) { border-right: none; }
  .arpc-bill__cell:nth-child(n+3) { border-top: 1px dotted var(--rule); }
  .arpc-bill__cell:last-child { grid-column: 1 / -1; }
}

/* WHY · cards stack at 860 */
.arpc-why { align-items: stretch; }
.arpc-why .ink-page-card__body p + p { margin-top: 12px; }
.arpc-why .ink-page-card__body code,
.arpc-principle code,
.arpc-flow__desc code,
.arpc-note__body code {
  font-family: 'JetBrains Mono', monospace;
  font-style: normal;
  font-size: 12px;
  color: var(--accent);
  background: color-mix(in srgb, var(--ink) 4%, transparent);
  padding: 1px 6px;
  border-radius: var(--iw-radius-sm);
}

/* PRINCIPLES — overrides feature defaults for an 8-cell, 4×2 grid */
.arpc-principles { gap: 0; border-top: 1px solid var(--rule); border-left: 1px solid var(--rule); }
.arpc-principle {
  padding: var(--iw-space-5);
  border-right: 1px solid var(--rule);
  border-bottom: 1px solid var(--rule);
  gap: 10px;
}
.arpc-principle__num {
  width: auto !important;
  height: auto !important;
  justify-content: flex-start !important;
  color: var(--accent);
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}
@media (max-width: 1100px) { .arpc-principles { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 600px)  { .arpc-principles { grid-template-columns: 1fr; } }

/* LIFECYCLE flow */
.arpc-flow {
  border: 1px solid var(--rule);
  border-radius: var(--iw-radius-md);
  background: var(--bg-deep);
  padding: var(--iw-space-7) var(--iw-space-6);
  position: relative;
  overflow: hidden;
}
.arpc-flow__rail {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: var(--iw-space-3) 0;
  position: relative;
}
.arpc-flow__rail::before {
  content: '';
  position: absolute;
  top: 22px;
  left: 8%;
  right: 8%;
  height: 1px;
  background: repeating-linear-gradient(to right, var(--rule) 0 6px, transparent 6px 12px);
}
.arpc-flow__step {
  text-align: center;
  padding: 0 var(--iw-space-2);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.arpc-flow__node {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid var(--rule);
  background: var(--bg-deep);
  display: grid;
  place-items: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--accent);
  letter-spacing: 0.08em;
  position: relative;
  z-index: 1;
}
.arpc-flow__step--key .arpc-flow__node {
  border-color: var(--accent);
  box-shadow: 0 0 18px -4px color-mix(in srgb, var(--accent) 40%, transparent);
}
.arpc-flow__kind { font-size: 9px; letter-spacing: 0.22em; }
.arpc-flow__name {
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  color: var(--ink);
  letter-spacing: 0.04em;
}
.arpc-flow__desc {
  font-family: 'Newsreader', serif;
  font-style: italic;
  font-size: 14px;
  color: var(--ink-soft);
  line-height: 1.4;
  max-width: 200px;
  margin: 0;
}
@media (max-width: 980px) {
  .arpc-flow__rail { grid-template-columns: repeat(3, 1fr); gap: var(--iw-space-5) var(--iw-space-3); }
  .arpc-flow__rail::before { display: none; }
}
@media (max-width: 600px) { .arpc-flow__rail { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 380px) { .arpc-flow__rail { grid-template-columns: 1fr; } }

/* ENVELOPE */
.arpc-envelope {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: var(--iw-space-5);
  align-items: stretch;
}
.arpc-code {
  background: var(--bg-deep);
  border: 1px solid var(--rule);
  border-radius: var(--iw-radius-md);
  padding: var(--iw-space-5);
  overflow-x: auto;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  line-height: 1.65;
  color: var(--ink-soft);
}
.arpc-code__head {
  border-bottom: 1px dotted var(--rule);
  padding-bottom: var(--iw-space-3);
  margin-bottom: var(--iw-space-4);
}
.arpc-code__pre { margin: 0; white-space: pre; }
.arpc-code .k { color: var(--accent); }
.arpc-code .s { color: color-mix(in srgb, var(--accent) 55%, var(--ink) 45%); }
.arpc-code .n { color: color-mix(in srgb, var(--accent) 70%, var(--ink) 30%); }
.arpc-code .c { color: var(--muted); font-style: italic; }
.arpc-code .p { color: var(--muted); }

.arpc-notes { list-style: none; display: flex; flex-direction: column; gap: var(--iw-space-4); padding: 0; margin: 0; }
.arpc-note {
  border-left: 1px solid var(--rule);
  padding: 6px 0 6px var(--iw-space-4);
  transition: border-color var(--iw-dur) var(--iw-ease);
}
.arpc-note:hover { border-left-color: var(--accent); }
.arpc-note__head {
  display: flex;
  align-items: center;
  gap: var(--iw-space-3);
  margin-bottom: 8px;
  flex-wrap: wrap;
}
.arpc-note__field {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--ink);
  letter-spacing: 0.04em;
}
.arpc-note__body {
  font-family: 'Newsreader', serif;
  font-style: italic;
  font-size: 22px;
  color: var(--ink-soft);
  line-height: 1.5;
  margin: 0;
}
.arpc-note__body em { color: var(--ink); }
@media (max-width: 980px) { .arpc-envelope { grid-template-columns: 1fr; } }

/* MESSAGES */
.arpc-msgs { gap: var(--iw-space-3); }
.arpc-msg__head {
  display: flex !important;
  justify-content: space-between;
  align-items: baseline;
  gap: var(--iw-space-2);
  border-bottom: 1px dotted var(--rule);
  padding-bottom: var(--iw-space-3);
  margin-bottom: var(--iw-space-3) !important;
}
.arpc-msg__name { font-size: 22px !important; }
.arpc-msg__count {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.16em;
  color: var(--accent);
  font-feature-settings: 'tnum';
  font-variant-numeric: tabular-nums;
}
.arpc-msg__list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 6px;
  list-style: none;
  padding: 0;
  margin: 0;
}
.arpc-msg__chip {
  padding: 2px 8px !important;
  font-size: 11px !important;
  letter-spacing: 0.02em !important;
  text-transform: none !important;
}

/* SDKS */
.arpc-sdks {
  gap: var(--iw-space-3);
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)) !important;
}
.arpc-sdk {
  display: flex;
  flex-direction: column;
  gap: var(--iw-space-3);
  min-width: 0;
}
.arpc-sdk__head {
  display: flex !important;
  justify-content: space-between;
  align-items: baseline;
  gap: var(--iw-space-2);
  margin-bottom: 0 !important;
  min-width: 0;
}
.arpc-sdk__lang {
  font-size: 22px !important;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.arpc-sdk__icon {
  font-size: 18px;
  color: var(--accent);
  flex: 0 0 auto;
}
.arpc-sdk__pkg {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: var(--accent);
  letter-spacing: 0.04em;
  text-align: right;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.arpc-sdk__inst {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--ink-soft);
  background: color-mix(in srgb, var(--ink) 3%, transparent);
  padding: 8px 10px;
  border-radius: var(--iw-radius-sm);
  border: 1px dotted var(--rule);
  min-width: 0;
  cursor: text;
  transition: border-color var(--iw-dur) var(--iw-ease);
}
.arpc-sdk__inst:hover,
.arpc-sdk__inst:focus-within { border-color: var(--accent); }
.arpc-sdk__inst-prompt { color: var(--muted); flex: 0 0 auto; user-select: none; }
.arpc-sdk__inst-cmd {
  flex: 1 1 0;
  min-width: 0;
  width: 100%;
  background: transparent;
  border: 0;
  outline: 0;
  padding: 0;
  margin: 0;
  font: inherit;
  color: var(--ink);
  text-overflow: ellipsis;
}
.arpc-sdk__inst-cmd::selection { background: color-mix(in srgb, var(--accent) 30%, transparent); }
.arpc-sdk__foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.arpc-sdk--placeholder {
  border-style: dashed !important;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 140px;
}
.arpc-sdk--placeholder p {
  font-family: 'Newsreader', serif;
  font-style: italic;
  color: var(--ink-soft);
  font-size: 17px;
  line-height: 1.7;
  margin: 0;
}

/* CTA */
.arpc-cta { margin: var(--iw-space-9) 0 0; }
.arpc-cta__meta {
  margin-top: var(--iw-space-6);
  font-size: 10px;
  letter-spacing: 0.22em;
}
.arpc-cta-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  line-height: 1;
}
.arpc-cta-link > span { display: inline-flex; align-items: center; }
.arpc-cta-link .svg-inline--fa {
  font-size: 0.85em;
  vertical-align: 0;
}

/* FOOTER */
.arpc-footer {
  text-align: left !important;
  text-transform: none !important;
  letter-spacing: 0 !important;
  font-family: inherit !important;
  padding: 0 !important;
  color: var(--ink-soft);
}
.arpc-footer-cols { padding: var(--iw-space-6) var(--iw-space-6) 0; max-width: var(--iw-w-wide); margin: 0 auto; }
.ink-footer-columns__inner {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: var(--iw-space-5);
  padding-bottom: var(--iw-space-6);
}
.ink-footer-columns__column ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
.ink-footer-columns__column a {
  font-family: 'Newsreader', serif;
  font-style: italic;
  font-size: 15px;
  color: var(--ink-soft);
  text-decoration: none;
}
.ink-footer-columns__heading {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--muted);
  margin: 0 0 var(--iw-space-3);
}
.arpc-footer-brand__tag {
  font-family: 'Newsreader', serif;
  font-style: italic;
  font-size: 14px;
  color: var(--ink-soft);
  max-width: 360px;
  margin: var(--iw-space-3) 0 0;
  line-height: 1.45;
}
.arpc-colophon {
  border-top: 1px dotted var(--rule);
  padding: var(--iw-space-5) 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--iw-space-3);
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--muted);
}
.arpc-colophon em {
  font-family: 'Newsreader', serif;
  font-style: italic;
  text-transform: none;
  letter-spacing: 0.02em;
  font-size: 13px;
  color: var(--ink-soft);
}
@media (max-width: 860px) {
  .ink-footer-columns__inner { grid-template-columns: 1fr 1fr; }
  .arpc-footer-brand { grid-column: 1 / -1; }
}
@media (max-width: 480px) {
  .ink-footer-columns__inner { grid-template-columns: 1fr; }
  .arpc-footer-cols { padding: var(--iw-space-5) var(--iw-space-4) 0; }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }
}
</style>
