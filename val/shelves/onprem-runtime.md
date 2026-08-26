# On-Prem Runtime (data can't leave premises)
Pull when: a client says data stays in-building — HIPAA, CJIS, legal, defense, or plain policy. Surface it proactively the moment you hear it.
- One internet-facing node; Tailscale mesh, default-deny ACLs (Headscale if 3rd-party coord rejected)
- Warm open-weight MoE on small local box; OpenAI-compatible gateway routes by data class
- Redaction split: local model strips identifiers → hosted frontier reasons on scrubbed text
- Append-only audit log at gateway (data class, model, egress y/n, redaction hash) — retainer sold as compliance report
- Fail closed: sensitive requests queue/hard-fail, never silent failover to hosted
- Redaction recall measured on client's own gold set; number in contract, never "100%"
- Commercial: hardware at cost, client-owned; fixed install; monthly retainer. Front door: paid Data Egress Audit.
Never: promise 100% redaction. Never silent-failover to hosted. Never quote the build before the Data Egress Audit is paid and done.
Confirmed: 2026-08 — architecture agreed, not yet installed at a client.
Done when: the gateway refuses a sensitive request rather than routing it out, and the audit log hands to a compliance officer unedited.
