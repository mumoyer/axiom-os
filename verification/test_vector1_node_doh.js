// verification/test_vector1_node_doh.js
// Directly reproduces lines 819-855 of axiom_os_stage_gate_verification_spec.md

async function testGate3DnsCode() {
  const domain = "google.com";
  const expectedTarget = "142.250.190.46"; // example IP or whatever

  const resolvers = [
    { name: "Cloudflare", url: `https://cloudflare-dns.com/dns-query?name=${domain}&type=A` },
    { name: "Google", url: `https://dns.google/resolve?name=${domain}&type=A` },
    { name: "Quad9", url: `https://dns.quad9.net/dns-query?name=${domain}&type=A` },
    { name: "OpenDNS", url: `https://doh.opendns.com/dns-query?name=${domain}&type=A` },
  ];

  console.log("Executing exact runGate3 DoH fetching logic in Node.js...");
  const results = await Promise.allSettled(
    resolvers.map(async (r) => {
      const resp = await fetch(r.url, {
        headers: { Accept: "application/dns-json" },
        signal: AbortSignal.timeout(5000),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status} ${resp.statusText}`);
      const data = await resp.json();
      return { resolver: r.name, data };
    })
  );

  let matchCount = 0;
  const resolverTelemetry = {};

  for (let i = 0; i < resolvers.length; i++) {
    const res = results[i];
    const rName = resolvers[i].name;
    if (res.status === "fulfilled") {
      const doh = res.value.data;
      const ips = doh.Answer?.map((a) => a.data) || [];
      resolverTelemetry[rName] = ips.join(", ") || "NO_RECORDS";
      if (ips.includes(expectedTarget) || doh.Answer?.some(a => a.data.includes(expectedTarget))) {
        matchCount++;
      }
    } else {
      resolverTelemetry[rName] = `ERROR: ${res.reason.message}`;
    }
  }

  console.log("Results summary:");
  console.log(JSON.stringify(resolverTelemetry, null, 2));
  console.log(`Total Matches: ${matchCount}/4`);
  console.log(`Quorum Met (>= 3): ${matchCount >= 3}`);
}

testGate3DnsCode().catch(console.error);
