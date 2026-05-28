---
seo:
  title: ARCP — Agent Runtime Control Protocol
  description: A transport-agnostic wire protocol for submitting, observing, and controlling long-running AI agent jobs.
header:
  name: ARCP
  tags:
    - Internet-Draft
    - Standards Track
    - v1.1
hero:
  eyebrow: Agent Runtime Control Protocol
  headline: The durable envelope around long-running agent work.
  lede: ARCP is a transport-agnostic wire protocol for **submitting, observing, and controlling long-running AI agent jobs** — and nothing more.
sections:
  - id: what
    number: '01'
    kicker: What it is
    kind: prose
    body: |
      ARCP defines the execution envelope around AI agent work: **sessions, jobs,
      resumable event streams, capability-bounded leases, and delegation**. It
      specifies how a job is submitted, how its events flow back, who is allowed to
      do what, and how the whole thing survives a dropped connection.

      It is deliberately narrow. ARCP wraps the agent function — it does not implement
      the agent, expose its tools, or export its telemetry. Tool exposure is the concern
      of [MCP](https://modelcontextprotocol.io/). Telemetry export is the concern of
      [OpenTelemetry](https://opentelemetry.io/). ARCP composes with them rather than
      absorbing them.

      A job submitted over ARCP keeps running when the client disconnects, can be
      resumed or watched live from another machine, and cannot exceed the `lease` it
      was granted — a bound on what it may read, write, call, spend, and for how long.
    diagram:
      outer:
        label: ARCP · durable envelope
        tags:
          - session
          - job
          - event stream
          - lease
      inner:
        label: agent function
        tags:
          - LLM SDK · reasoning
          - MCP · tools
      aside: OpenTelemetry · telemetry export
  - id: why
    number: '02'
    kicker: Why it exists
    kind: grid
    body: |
      Long-running agent jobs break the assumptions of a request/response API. They
      outlive the connection that started them, act with real spending and filesystem
      authority, and frequently need to be watched by more than one observer at once.
      ARCP exists to make that envelope **explicit and enforceable at the wire level**,
      so any client and any runtime can interoperate.

      The protocol organizes every message under four concerns. Everything it
      specifies is in service of one of them.
    items:
      - title: Identity
        description: Who is acting. Authenticated sessions and a per-job submitting principal.
      - title: Durability
        description: Work survives disconnects. Sequenced events, resume after a drop, subscribe from elsewhere.
      - title: Authority
        description: What an agent may do, bounded by capability, budget, and an expiring lease.
      - title: Observability
        description: Structured progress, logs, metrics, and streamed results — plus W3C trace context.
  - id: how
    number: '03'
    kicker: How it works
    kind: list
    body: |
      An interaction is a session that carries one or more jobs. The wire format is a
      single JSON envelope; the transport is WebSocket for the network and stdio for
      in-process children.
    items:
      - index: '01'
        description: Open a transport and exchange `session.hello` → `session.welcome`. The client declares identity and supported features; the runtime returns a session, a resume token, and an agent inventory with versions.
      - index: '02'
        description: Send `job.submit` carrying a `lease_request` — what the agent may read, write, call, spend, and until when. The runtime replies `job.accepted` with the effective lease.
      - index: '03'
        description: 'Consume the `job.event` stream: logs, thoughts, tool calls, structured `progress`, cost `metric`s, and chunked `result_chunk`s for large outputs.'
      - index: '04'
        description: Reconnect with `session.resume` after a network drop, or `job.subscribe` from another session to watch a job live — without the authority to cancel it.
      - index: '05'
        description: The job terminates with `job.result` or `job.error`. Leases that expire or budgets that run out fail closed.
    code:
      title: job.submit
      lang: json
      caption: A job bounded in space, money, model, and time. The runtime enforces it on every operation.
      source: |
        {
          "type": "job.submit",
          "payload": {
            "agent": "code-refactor@2.0.0",
            "lease_request": {
              "fs.read":     ["/workspace/app/**"],
              "fs.write":    ["/workspace/app/src/**"],
              "cost.budget": ["USD:5.00"],
              "model.use":   ["tier-fast/*"]
            },
            "lease_constraints": { "expires_at": "2026-05-13T23:42:00Z" }
          }
        }
  - id: scope
    number: '04'
    kicker: Scope
    kind: columns
    body: |
      The clearest way to understand a protocol is to know where it stops. ARCP draws
      a hard line and stays behind it.
    columns:
      - heading: Specifies
        tone: positive
        items:
          - label: The wire format for client–runtime communication
          - label: The lifecycle of sessions, jobs, and event streams
          - label: The authority model — leases with time and budget bounds
          - label: Delegation, subscription, and job introspection
          - label: Lease-bound provisioned credentials
          - label: Trace context propagation
      - heading: Does not specify
        tone: neutral
        items:
          - label: How agents are implemented
          - label: How tools are exposed
            note: → MCP
          - label: Telemetry export formats
            note: → OTel
          - label: Scheduling, priority, or pause/resume of running jobs
          - label: How agent state persists across restarts
          - label: Auth beyond bearer tokens
cta:
  label: Read the specification
  to: /spec/draft-arcp-1.1
footer:
  line1: Agent Runtime Control Protocol — v1.1 (draft)
  line2: Standards Track · Expires November 13, 2026
  contact:
    label: Nick Ficano
    href: mailto:nficano@gmail.com
---
