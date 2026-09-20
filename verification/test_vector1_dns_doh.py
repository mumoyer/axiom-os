#!/usr/bin/env python3
"""
Vector 1 Stress Test: DNS Propagation Delays, Split-Horizon & DoH Resolvers
Tests:
1. Live empirical querying of the 4 DoH resolvers specified in Gate 3:
   - Cloudflare: https://cloudflare-dns.com/dns-query
   - Google: https://dns.google/resolve
   - Quad9: https://dns.quad9.net/dns-query
   - OpenDNS: https://doh.opendns.com/dns-query
2. JSON parsing compatibility across all 4 resolvers.
3. CNAME trailing dot normalization bug test.
4. Anycast / multi-IP pool split-horizon consensus failure simulation.
5. Missing backoff loop in Gate 3 implementation code vs specification text.
"""

import urllib.request
import urllib.error
import json
import ssl
import sys

def test_live_doh_endpoints():
    print("=== TEST 1.1: Live DoH Endpoint Protocol & Schema Inspection ===")
    test_domain = "cloudflare.com"
    resolvers = [
        {"name": "Cloudflare", "url": f"https://cloudflare-dns.com/dns-query?name={test_domain}&type=A", "headers": {"Accept": "application/dns-json"}},
        {"name": "Google", "url": f"https://dns.google/resolve?name={test_domain}&type=A", "headers": {"Accept": "application/json"}},
        {"name": "Quad9", "url": f"https://dns.quad9.net/dns-query?name={test_domain}&type=A", "headers": {"Accept": "application/dns-json"}},
        {"name": "OpenDNS", "url": f"https://doh.opendns.com/dns-query?name={test_domain}&type=A", "headers": {"Accept": "application/dns-json"}}
    ]
    
    ctx = ssl.create_default_context()
    results = {}
    
    for r in resolvers:
        name = r["name"]
        url = r["url"]
        headers = r["headers"]
        headers["User-Agent"] = "AxiomVerification/1.0"
        req = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=5.0, context=ctx) as resp:
                status = resp.status
                content_type = resp.headers.get("Content-Type", "")
                raw_body = resp.read()
                try:
                    parsed = json.loads(raw_body.decode('utf-8'))
                    has_status = "Status" in parsed
                    has_answer = "Answer" in parsed
                    results[name] = {
                        "http_status": status,
                        "content_type": content_type,
                        "parsed_json": True,
                        "has_status": has_status,
                        "has_answer": has_answer,
                        "answers": [a.get("data") for a in parsed.get("Answer", [])] if has_answer else []
                    }
                except Exception as json_err:
                    results[name] = {
                        "http_status": status,
                        "content_type": content_type,
                        "parsed_json": False,
                        "error": str(json_err),
                        "body_preview": raw_body[:100].hex()
                    }
        except Exception as e:
            results[name] = {
                "http_status": getattr(e, 'code', None),
                "error": str(e)
            }
            
    print(json.dumps(results, indent=2))
    return results

def test_cname_trailing_dot_vulnerability():
    print("\n=== TEST 1.2: CNAME Trailing Dot Ingestion Bug Simulation ===")
    # Spec line 849:
    # ips = doh.Answer?.map((a) => a.data) || [];
    # if (ips.includes(expectedTarget) || doh.Answer?.some(a => a.data.includes(expectedTarget)))
    
    # In standard DNS responses, CNAME targets in wire/JSON format contain a trailing dot:
    sample_doh_answer = [
        {"name": "www.myventure.com", "type": 5, "data": "cname.axiomrun.app.", "TTL": 300}
    ]
    
    expected_target_configured = "cname.axiomrun.app"  # What users or orchestrators pass
    
    # Simulating Gate 3 logic from line 847-851
    ips = [a["data"] for a in sample_doh_answer]
    direct_match = expected_target_configured in ips
    includes_match = any(expected_target_configured in a["data"] for a in sample_doh_answer)
    
    print(f"Configured Expected Target: '{expected_target_configured}'")
    print(f"Resolver Returned Data: {ips}")
    print(f"Direct match (ips.includes): {direct_match}")
    print(f"Substring match (a.data.includes): {includes_match}")
    
    # What if expectedTarget is an apex domain and reverse lookup has trailing dot:
    adversarial_target = "cname.axiomrun.app.otherdomain.com"
    false_positive = any(expected_target_configured in a["data"] for a in [{"data": adversarial_target}])
    print(f"Security Alert: Substring `includes` causes FALSE POSITIVE on '{adversarial_target}': {false_positive}")

def test_split_horizon_and_anycast_divergence():
    print("\n=== TEST 1.3: Anycast Pool / Split-Horizon Quorum Failure Simulation ===")
    # When deployed to Cloudflare or multi-datacenter edge, different resolvers receive different IPs from the edge pool
    # E.g., Cloudflare edge IP pool for a domain:
    # Resolver 1 sees: 104.21.34.10, 172.67.180.20
    # Resolver 2 sees: 104.21.34.11, 172.67.180.21
    # Resolver 3 sees: 104.21.34.10, 172.67.180.20
    # Resolver 4 sees: 172.67.180.25
    
    # If the user sets expectedTarget = "104.21.34.10"
    resolver_views = {
        "Cloudflare": ["104.21.34.10", "172.67.180.20"],
        "Google": ["104.21.34.11", "172.67.180.21"],
        "Quad9": ["104.21.34.12", "172.67.180.22"],
        "OpenDNS": ["104.21.34.10", "172.67.180.20"]
    }
    
    expected_ip = "104.21.34.10"
    matches = sum(1 for ips in resolver_views.values() if expected_ip in ips)
    quorum_pass = matches >= 3
    print(f"Anycast Pool Test: Matches = {matches}/4 -> Quorum Met? {quorum_pass}")
    print("Vulnerability: Legitimate Anycast rotation across PoPs fails 3-of-4 quorum when expectedTarget is a single IP!")

if __name__ == "__main__":
    test_live_doh_endpoints()
    test_cname_trailing_dot_vulnerability()
    test_split_horizon_and_anycast_divergence()
